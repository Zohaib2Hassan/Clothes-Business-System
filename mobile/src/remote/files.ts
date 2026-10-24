import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { shareFile } from '../data/files';
import type { Sale } from './types';
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const format = (value: number | undefined) => `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
export async function shareLiveReceipt(business: { businessName: string; address?: string; phone?: string }, sale: Sale) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font:15px Arial;padding:35px;color:#193d33}table{width:100%;border-collapse:collapse}td,th{padding:12px 0;border-bottom:1px solid #ddd;text-align:left}.total{font-size:24px;font-weight:bold}</style></head><body><h1>${escape(business.businessName)}</h1><p>${escape(business.address)} ${escape(business.phone)}</p><h2>${escape(sale.receiptNumber || sale._id)}</h2><p>${escape(sale.customerName)} · ${escape(sale.date)}</p><table><tr><th>Item</th><th>Qty</th><th>Total</th></tr>${sale.items.map((item) => `<tr><td>${escape(item.productName)}<br>${escape(item.size)} ${escape(item.color)}</td><td>${item.qty}</td><td>${format(item.subtotal || item.qty * item.price)}</td></tr>`).join('')}</table><p>Subtotal: ${format(sale.subtotal)}<br>Discount: ${format(sale.discount)}<br>Tax: ${format(sale.tax)}</p><p class="total">Total: ${format(sale.totalAmount)}</p><p>Refunds recorded: ${format(sale.refundAmount)}<br>Payment recorded: ${escape(sale.paymentMethod)} · ${escape(sale.paymentStatus)}</p></body></html>`;
  if (Platform.OS === 'web') { await shareFile(`Threadly-${sale.receiptNumber || 'receipt'}.html`, html, 'text/html'); return; }
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  const file = await Print.printToFileAsync({ html }); await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share website receipt', UTI: 'com.adobe.pdf' });
}
export function exportWebsiteCsv(filename: string, rows: (string | number)[][]) {
  const cell = (value: string | number) => { const raw = String(value); return `"${(/^[\s]*[=+@\-]/.test(raw) ? "'" + raw : raw).replace(/"/g, '""')}"`; };
  return shareFile(filename, '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n'), 'text/csv');
}
