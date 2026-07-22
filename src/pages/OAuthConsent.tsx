import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

const SUPABASE_URL = "https://avtzjxknxnajzutcoayl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dHpqeGtueG5hanp1dGNvYXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDcwOTEsImV4cCI6MjA3MjMyMzA5MX0.-B2tDxwc494ObOOUCMG0cIzLtQOLMT48u04IJKeOwsw";

async function callAuthorization(
  method: "GET" | "POST",
  accessToken: string,
  authorizationId: string,
  body?: Record<string, unknown>,
) {
  const base = `${SUPABASE_URL}/auth/v1/oauth/authorizations/${encodeURIComponent(authorizationId)}`;
  const url = method === "POST" ? `${base}/consent` : base;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: method === "POST" && body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    console.error(`[OAuthConsent] ${method} ${url} failed`, res.status, data);
    const msg = data?.error_description || data?.msg || data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}



export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!authorizationId) {
          setError("Missing authorization_id");
          return;
        }
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          const next = window.location.pathname + window.location.search;
          window.location.href = "/login?next=" + encodeURIComponent(next);
          return;
        }
        const data = await callAuthorization("GET", sess.session.access_token, authorizationId);

        if (!active) return;
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        console.error("[OAuthConsent] load error", e);
        if (active) setError(e?.message || "Failed to load authorization request");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Not signed in");
      const data = await callAuthorization(
        "POST",
        sess.session.access_token,
        authorizationId,
        { action: approve ? "approve" : "deny" },
      );

      // Prefer the server-provided redirect (already includes code + state).
      let target: string | undefined =
        data?.redirect_url ?? data?.redirect_to ?? data?.redirect_uri ?? data?.location;

      // Fallback: reconstruct from the original request's redirect_uri + returned code/state.
      if (!target) {
        const redirectUri =
          details?.redirect_uri ??
          details?.request?.redirect_uri ??
          details?.authorization_request?.redirect_uri;
        const code = data?.code ?? data?.authorization_code;
        const state = data?.state ?? details?.state ?? details?.request?.state;
        if (redirectUri && code) {
          const sep = redirectUri.includes("?") ? "&" : "?";
          target = `${redirectUri}${sep}code=${encodeURIComponent(code)}${
            state ? `&state=${encodeURIComponent(state)}` : ""
          }`;
        }
      }

      if (!target) {
        console.error("[OAuthConsent] no redirect target in response", data);
        throw new Error("No redirect returned by the authorization server.");
      }
      window.location.href = target;
    } catch (e: any) {
      console.error("[OAuthConsent] decide error", e);
      setError(e?.message || "Failed to submit decision");
      setBusy(false);
    }
  }

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Could not load this authorization request</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>{error}</p>
            <p className="text-xs">Check the browser console for details.</p>
          </CardContent>
        </Card>
      </main>
    );

  if (!details)
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </main>
    );

  const clientName = details.client?.name ?? details.client?.client_name ?? "an app";
  const scopes: string[] = details.scopes ?? details.scope?.split?.(" ") ?? [];

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Connect {clientName} to Servio</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {clientName} will be able to use Servio tools as you. It will only see and act on your own data.
          </p>
          {scopes.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              {scopes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
              Deny
            </Button>
            <Button disabled={busy} onClick={() => decide(true)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
