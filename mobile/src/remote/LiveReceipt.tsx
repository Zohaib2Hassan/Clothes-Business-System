import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, colors, confirm, Field, Sheet, styles } from '../ui/kit';
import { useRemote } from './RemoteContext';
import type { Sale } from './types';
import { onDate, rupees } from './ui';
import { shareLiveReceipt } from './files';
export function LiveReceipt({ sale, onClose, onChanged }: { sale: Sale; onClose: () => void; onChanged: () => void }) {
  const { api } = useRemote(); const [current, setCurrent] = useState(sale); const [quantities, setQuantities] = useState<Record<string, string>>({}); const [returning, setReturning] = useState(false); const [reason, setReason] = useState('Customer return'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const act = async (share = false) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      if (share) { const response = await api<{ sale: Sale; business: { businessName: string; address?: string; phone?: string } }>(`/pos/receipt/${current._id}`); const business = await api<{ businessName: string; address?: string; phone?: string }>('/business'); await shareLiveReceipt({ ...business, businessName: business.businessName || 'Your shop' }, response.sale); return; }
      const itemsToReturn = current.items.flatMap((item, index) => { const value = quantities[String(index)] || '0'; if (!/^\d+$/.test(value)) throw new Error('Return quantities must be whole numbers.'); const qty = Number(value); if (qty > item.qty - (item.returnedQty || 0)) throw new Error('Return quantity exceeds the remaining purchased quantity.'); return qty > 0 ? [{ itemId: item._id, productId: item.productId, qty }] : []; });
      if (!itemsToReturn.length) throw new Error('Choose at least one quantity to return.');
      if (!await confirm('Record return on your website?', 'The server will record a refund and restore stock. Handle the actual customer refund outside the app.')) return;
      const response = await api<{ updatedSale: Sale }>('/pos/returns', { method: 'POST', body: { saleId: current._id, itemsToReturn, reason, paymentMethod: current.paymentMethod || 'Easypaisa' } });
      setCurrent(response.updatedSale); setReturning(false); setQuantities({}); onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not complete this action.'); } finally { lock.current = false; setBusy(false); }
  };
  return <Sheet title={current.receiptNumber || 'Website receipt'} onClose={() => { if (!busy) onClose(); }} footer={<Button title={busy ? 'Please wait…' : returning ? 'Record return & restock' : 'Share receipt'} icon={returning ? 'return-down-back' : 'share-outline'} onPress={() => act(!returning)} disabled={busy} />}>
    <Text style={styles.sectionTitle}>{current.customerName}</Text><Text style={styles.muted}>{onDate(current.date)}</Text><Text style={styles.muted}>{current.customerPhone || 'Walk-in sale'} · {current.paymentMethod}</Text>
    {current.items.map((item, index) => <Card key={item._id || index} style={{ padding: 14 }}><View style={styles.between}><View style={{ flex: 1, gap: 5 }}><Text style={styles.label}>{item.productName || (typeof item.product === 'object' ? item.product.name : '') || 'Product'}</Text><Text style={styles.muted}>{[item.size, item.color].filter(Boolean).join(' · ')} · {item.qty} × {rupees(item.price)}</Text>{!!item.returnedQty && <Text style={{ color: colors.amber, fontSize: 12 }}>{item.returnedQty} already returned</Text>}</View><Text style={styles.label}>{rupees(item.subtotal || item.qty * item.price)}</Text></View>{returning && item.qty > (item.returnedQty || 0) && <Field label={`Return quantity ${index + 1}`} value={quantities[String(index)] || ''} placeholder={`0 to ${item.qty - (item.returnedQty || 0)}`} keyboardType="number-pad" onChangeText={(value) => setQuantities((previous) => ({ ...previous, [index]: value }))} />}</Card>)}
    {([['Subtotal',current.subtotal],['Discount',current.discount],['Tax',current.tax],['Total',current.totalAmount],['Refunds recorded',current.refundAmount]] as const).map(([label, amount]) => <View key={label} style={styles.between}><Text style={styles.muted}>{label}</Text><Text style={styles.amount}>{rupees(amount)}</Text></View>)}
    <Text style={styles.muted}>Status: {current.paymentStatus}. This app records payments and refunds; it does not transfer money.</Text>
    {returning ? <><Field label="Return reason" value={reason} onChangeText={setReason} maxLength={200} /><Button title="Cancel return" variant="ghost" onPress={() => setReturning(false)} disabled={busy} /></> : current.items.some((item) => item.qty > (item.returnedQty || 0)) && <Button title="Return items" variant="ghost" onPress={() => setReturning(true)} />}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.red, lineHeight: 21 }}>{error}</Text>}
  </Sheet>;
}
