import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Return a summary of income, expenses, net profit and VAT for the signed-in user over a given period (default: current month).",
  inputSchema: {
    period: z
      .enum(["month", "quarter", "year"])
      .optional()
      .describe("Time window (default: month)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ period }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const now = new Date();
    let start: Date;
    if (period === "year") start = new Date(now.getFullYear(), 0, 1);
    else if (period === "quarter") start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else start = new Date(now.getFullYear(), now.getMonth(), 1);

    const supabase = supabaseForUser(ctx);
    const [tx, inv] = await Promise.all([
      supabase.from("transactions").select("amount, type, date").gte("date", start.toISOString().slice(0, 10)),
      supabase.from("invoices").select("amount, vat_amount, status, invoice_date").gte("invoice_date", start.toISOString().slice(0, 10)),
    ]);

    if (tx.error) return { content: [{ type: "text", text: tx.error.message }], isError: true };
    if (inv.error) return { content: [{ type: "text", text: inv.error.message }], isError: true };

    const income = (tx.data ?? []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
    const expenses = (tx.data ?? []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
    const vat = (inv.data ?? []).reduce((s: number, i: any) => s + Number(i.vat_amount ?? 0), 0);
    const invoicesTotal = (inv.data ?? []).reduce((s: number, i: any) => s + Number(i.amount ?? 0), 0);
    const overdue = (inv.data ?? []).filter((i: any) => i.status === "overdue").length;

    const summary = {
      period: period ?? "month",
      since: start.toISOString().slice(0, 10),
      income: Number(income.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      net_profit: Number((income - expenses).toFixed(2)),
      vat_reserved: Number(vat.toFixed(2)),
      invoices_total: Number(invoicesTotal.toFixed(2)),
      overdue_invoices: overdue,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
