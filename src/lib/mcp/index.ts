import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listInvoices from "./tools/list-invoices";
import listReceipts from "./tools/list-receipts";
import listCustomers from "./tools/list-customers";
import financialSummary from "./tools/financial-summary";

// Build issuer from the Supabase project ref. Vite inlines VITE_SUPABASE_PROJECT_ID
// at build time so this stays import-safe (no runtime env read at module load).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "servio-mcp",
  title: "Servio",
  version: "0.1.0",
  instructions:
    "Servio tools for the signed-in user's accounting data: list invoices, receipts and customers, and get a financial summary. All tools operate on the caller's own data (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listInvoices, listReceipts, listCustomers, financialSummary],
});
