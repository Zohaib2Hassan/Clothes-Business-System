import type { Expense, Sale } from './types';
const key = (date: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
export function websiteReport(sales: Sale[], expenses: Expense[], days = 30, now = new Date()) {
  const today = key(now.toISOString());
  const start = days ? key(new Date(new Date(`${today}T00:00:00+05:00`).getTime() - (days - 1) * 86400000).toISOString()) : '';
  const included = (date: string) => date && Number.isFinite(Date.parse(date)) && Date.parse(date) <= now.getTime() && (!start || key(date) >= start) && key(date) <= today;
  const orders = sales.filter((sale) => included(sale.date)); const spending = expenses.filter((expense) => included(expense.date));
  const gross = orders.reduce((n,s) => n + s.totalAmount,0); const refunds = orders.reduce((n,s) => n + (s.refundAmount || 0),0); const costs = spending.reduce((n,e) => n + e.amount,0);
  const products = new Map<string,{ name: string; units: number }>();
  for (const sale of orders) for (const item of sale.items) { const name = item.productName || (typeof item.product === 'object' ? item.product.name : '') || 'Product'; const old = products.get(name) || {name,units:0}; old.units += Math.max(0,item.qty - (item.returnedQty || 0)); products.set(name,old); }
  const categories = new Map<string, number>(); for(const expense of spending) categories.set(expense.category,(categories.get(expense.category)||0)+expense.amount);
  return { orders, spending, gross, refunds, netSales:gross-refunds, expenses:costs, beforeProductCosts:gross-refunds-costs, topProducts:[...products.values()].sort((a,b)=>b.units-a.units), expenseCategories:[...categories].map(([name,amount])=>({name,amount})), start, end:today };
}
