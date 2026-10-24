import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import { Platform, Share } from 'react-native';
import { dayKey, money, receiptText, validateBackup, type Sale, type Shop } from '../domain/shop';

export async function shareFile(filename: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  const file = new File(Paths.cache, filename);
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Save or share your shop records' });
}
export function exportBackup(shop: Shop) { return shareFile(`Threadly-Pocket-${dayKey()}.json`, JSON.stringify(shop, null, 2), 'application/json'); }
export async function readBackup(): Promise<Shop | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 10 * 1024 * 1024) throw new Error('Choose a backup smaller than 10 MB.');
  const content = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  if (content.length > 10 * 1024 * 1024) throw new Error('Choose a backup smaller than 10 MB.');
  return validateBackup(JSON.parse(content));
}
const csv = (value: string | number) => {
  const raw = String(value);
  const safe = /^[\s]*[=+@\-]/.test(raw) ? "'" + raw : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};
export function exportSales(shop: Shop) {
  const rows = [['Receipt', 'Date (UTC)', 'Customer', 'Payment recorded', 'Subtotal (PKR)', 'Discount (PKR)', 'Total (PKR)', 'Status'], ...shop.sales.map((sale) => [sale.number, sale.date, sale.customer, sale.method, (sale.subtotal / 100).toFixed(2), (sale.discount / 100).toFixed(2), (sale.total / 100).toFixed(2), sale.voided ? 'Void' : 'Completed'])];
  return shareFile(`Threadly-Sales-${dayKey()}.csv`, '\uFEFF' + rows.map((row) => row.map(csv).join(',')).join('\r\n'), 'text/csv');
}
const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
export async function shareReceipt(shop: Shop, sale: Sale) {
  if (Platform.OS === 'web') { await Share.share({ message: receiptText(shop, sale) }); return; }
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  const html = `<html><head><meta charset="UTF-8"/><style>body{font-family:Helvetica,Arial;padding:40px;color:#193D33}h1{font-size:30px}table{width:100%;border-collapse:collapse;margin:30px 0}td,th{text-align:left;border-bottom:1px solid #ddd;padding:12px 0}small{color:#75847D}.total{font-size:24px;font-weight:bold}</style></head><body><h1>${escape(shop.settings.name)}</h1><p>${sale.voided ? 'VOID SALE' : 'SALES RECEIPT'} · ${escape(sale.number)}</p><small>${escape(new Date(sale.date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))} · Pakistan time</small><p>Customer: ${escape(sale.customer)}</p><table><tr><th>Item</th><th>Qty</th><th>Amount</th></tr>${sale.items.map((item) => `<tr><td>${escape(item.name)}<br/><small>${escape(item.variant)}</small></td><td>${item.quantity}</td><td>${money(item.price * item.quantity)}</td></tr>`).join('')}</table><p>Subtotal: ${money(sale.subtotal)}<br/>Discount: ${money(sale.discount)}</p><p class="total">Total: ${money(sale.total)}</p><p>Recorded payment: ${escape(sale.method)}</p><p>Thank you for shopping with us.</p></body></html>`;
  const result = await Print.printToFileAsync({ html });
  // The receiving app may read the file after the share sheet closes on Android.
  // Leave it in the OS-managed cache rather than deleting it during the handoff.
  await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: sale.number });
}
