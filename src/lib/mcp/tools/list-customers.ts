import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, (process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY)!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_customers",
  title: "List customers",
  description: "List customers (klanten) for the signed-in Servio user. Supports free-text search on name/email.",
  inputSchema: {
    search: z.string().optional().describe("Optional search term for name or email."),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("customers")
      .select("id, name, email, phone, company, vat_number, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { customers: data ?? [] },
    };
  },
});
