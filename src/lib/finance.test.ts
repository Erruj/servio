// @ts-ignore - draait met bun test
import { describe, expect, test } from 'bun:test';
import { computeTotals, computeVat, expenseCategories, monthlySeries, formatAxisEUR, formatEUR } from './finance';

const ziggo = { amount: 26.75, vat_amount: 4.64, invoice_date: '2026-03-09', category: 'utilities', supplier: 'Ziggo', customer_id: null };
const sale = { amount: 121, vat_amount: 21, invoice_date: '2026-03-15', category: 'other', customer_id: 'c1' };
const receipt = { amount: 12.1, receipt_date: '2026-03-20', category: 'food' };

describe('finance', () => {
  test('inkoopfactuur telt als uitgave, niet als omzet', () => {
    const t = computeTotals([ziggo], [], []);
    expect(t.income).toBe(0);
    expect(t.expenses).toBeCloseTo(26.75);
    expect(t.profit).toBeCloseTo(-26.75);
    expect(t.profitMargin).toBeNull();
  });
  test('inkoopfactuur geeft terug te vragen btw van 4,64', () => {
    expect(computeVat([ziggo], []).balance).toBeCloseTo(-4.64);
  });
  test('verkoop, inkoop en bonnetje samen', () => {
    const t = computeTotals([ziggo, sale], [receipt], []);
    expect(t.income).toBeCloseTo(121);
    expect(t.expenses).toBeCloseTo(38.85);
    expect(computeVat([ziggo, sale], [receipt]).balance).toBeCloseTo(21 - 4.64 - 2.1);
  });
  test('categorieën komen uit facturen en bonnetjes', () => {
    const c = expenseCategories([ziggo], [receipt], []);
    expect(c.map((x) => x.category)).toEqual(['utilities', 'food']);
  });
  test('grafiek "dit jaar" begint in januari en bevat maart', () => {
    const m = monthlySeries(new Date(2026, 0, 1), new Date(2026, 9, 11), [ziggo], [], []);
    expect(m.length).toBe(10);
    expect(m[2].expenses).toBeCloseTo(26.75);
  });
  test('Nederlandse notatie', () => {
    expect(formatEUR(1234.5).replace(/\s/g, ' ')).toBe('€ 1.234,50');
    expect(formatAxisEUR(20).replace(/\s/g, ' ')).toBe('€ 20');
    expect(formatAxisEUR(1200)).toBe('€ 1,2k');
  });
});
