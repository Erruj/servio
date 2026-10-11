// Gedeelde financiële berekeningen: Financieel Overzicht, BTW-widget en BTW-export gebruiken precies deze logica.

export interface InvoiceRow { amount?: number | string | null; vat_amount?: number | string | null; invoice_date?: string | null; category?: string | null; customer_id?: string | null; supplier?: string | null; supplier_id?: string | null; }
export interface ReceiptRow { amount?: number | string | null; receipt_date?: string | null; category?: string | null; }
export interface TransactionRow { amount?: number | string | null; type?: string | null; date?: string | null; category?: string | null; }

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** Een factuur is alleen een verkoopfactuur als hij aan een klant gekoppeld is en geen leverancier heeft. Alle andere facturen zijn inkoop. */
export const isSalesInvoice = (i: InvoiceRow) => !!i.customer_id && !i.supplier_id;

/** Btw op een bonnetje is niet opgeslagen: geschat op 21% van het bruto bedrag. */
export const receiptVat = (r: ReceiptRow) => (num(r.amount) * 0.21) / 1.21;

export function computeTotals(invoices: InvoiceRow[], receipts: ReceiptRow[], transactions: TransactionRow[]) {
  const sales = invoices.filter(isSalesInvoice);
  const purchases = invoices.filter((i) => !isSalesInvoice(i));
  const income = sales.reduce((s, i) => s + num(i.amount), 0)
    + transactions.filter((t) => t.type === 'income').reduce((s, t) => s + num(t.amount), 0);
  const expenses = purchases.reduce((s, i) => s + num(i.amount), 0)
    + receipts.reduce((s, r) => s + num(r.amount), 0)
    + transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + num(t.amount), 0);
  const profit = income - expenses;
  const profitMargin = income > 0 ? (profit / income) * 100 : null;
  return { income, expenses, profit, profitMargin };
}

export function computeVat(invoices: InvoiceRow[], receipts: ReceiptRow[]) {
  const outputVat = invoices.filter(isSalesInvoice).reduce((s, i) => s + num(i.vat_amount), 0);
  const inputVat = invoices.filter((i) => !isSalesInvoice(i)).reduce((s, i) => s + num(i.vat_amount), 0)
    + receipts.reduce((s, r) => s + receiptVat(r), 0);
  const salesAmount = invoices.filter(isSalesInvoice).reduce((s, i) => s + num(i.amount), 0);
  return { outputVat, inputVat, balance: outputVat - inputVat, salesExVat: salesAmount - outputVat };
}

export const CATEGORY_LABELS_NL: Record<string, string> = {
  marketing: 'Marketing', software: 'Software', hardware: 'Hardware', office: 'Kantoor', travel: 'Reizen',
  food: 'Eten & drinken', utilities: 'Nutsvoorzieningen & telecom', salary: 'Salarissen', tax: 'Belastingen',
  insurance: 'Verzekeringen', other: 'Overig',
};
export const categoryLabel = (c?: string | null) => CATEGORY_LABELS_NL[c || 'other'] ?? c ?? 'Overig';

export function expenseCategories(invoices: InvoiceRow[], receipts: ReceiptRow[], transactions: TransactionRow[]) {
  const map: Record<string, { amount: number; vatAmount: number }> = {};
  const add = (cat: string | null | undefined, amount: number, vat: number) => {
    const k = cat || 'other';
    map[k] ??= { amount: 0, vatAmount: 0 };
    map[k].amount += amount; map[k].vatAmount += vat;
  };
  invoices.filter((i) => !isSalesInvoice(i)).forEach((i) => add(i.category, num(i.amount), num(i.vat_amount)));
  receipts.forEach((r) => add(r.category, num(r.amount), receiptVat(r)));
  transactions.filter((t) => t.type === 'expense').forEach((t) => add(t.category, num(t.amount), 0));
  const total = Object.values(map).reduce((s, c) => s + c.amount, 0);
  return Object.entries(map)
    .map(([category, d]) => ({ category, label: categoryLabel(category), amount: d.amount, vatAmount: d.vatAmount, percentage: total > 0 ? (d.amount / total) * 100 : 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/** Maanden van start t/m nu (max 24), met inkomsten/uitgaven/winst per maand. */
export function monthlySeries(start: Date, end: Date, invoices: InvoiceRow[], receipts: ReceiptRow[], transactions: TransactionRow[], locale = 'nl-NL') {
  const first = new Date(start.getFullYear(), start.getMonth(), 1);
  const months: { key: string; month: string; income: number; expenses: number; profit: number }[] = [];
  const total = (end.getFullYear() - first.getFullYear()) * 12 + end.getMonth() - first.getMonth();
  const from = Math.max(0, total - 23);
  for (let i = from; i <= total; i++) {
    const d = new Date(first.getFullYear(), first.getMonth() + i, 1);
    const label = new Intl.DateTimeFormat(locale, { month: 'short', ...(total > 11 ? { year: '2-digit' } : {}) }).format(d);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: label, income: 0, expenses: 0, profit: 0 });
  }
  const idx = new Map(months.map((m) => [m.key, m]));
  const at = (date?: string | null) => { if (!date) return undefined; const d = new Date(date); return idx.get(`${d.getFullYear()}-${d.getMonth()}`); };
  invoices.forEach((i) => { const m = at(i.invoice_date); if (m) { if (isSalesInvoice(i)) m.income += num(i.amount); else m.expenses += num(i.amount); } });
  receipts.forEach((r) => { const m = at(r.receipt_date); if (m) m.expenses += num(r.amount); });
  transactions.forEach((t) => { const m = at(t.date); if (m) { if (t.type === 'income') m.income += num(t.amount); else if (t.type === 'expense') m.expenses += num(t.amount); } });
  months.forEach((m) => { m.profit = m.income - m.expenses; });
  return months;
}

export const formatEUR = (v: number, locale = 'nl-NL') => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(v);
export const formatPercent = (v: number, locale = 'nl-NL', digits = 1) =>
  new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v / 100);
/** As-label: onder € 1.000 hele euro's, daarboven "€ 1,2k". */
export function formatAxisEUR(v: number, locale = 'nl-NL') {
  if (Math.abs(v) < 1000) return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(v);
  const k = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(v / 1000);
  return `€ ${k}k`;
}
