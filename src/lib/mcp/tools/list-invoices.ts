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
  name: "list_invoices",
  title: "List invoices",
  description:
    "List invoices for the signed-in Servio user. Supports filtering by status (paid, pending, overdue) and limiting results.",
  inputSchema: {
    status: z
      .enum(["paid", "pending", "overdue"])
      .optional()
      .describe("Optional invoice status filter."),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("invoices")
      .select("id, invoice_number, supplier, amount, vat_amount, status, invoice_date, due_date")
      .order("invoice_date", { ascending: false })
      .limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { invoices: data ?? [] },
    };
  },
});
