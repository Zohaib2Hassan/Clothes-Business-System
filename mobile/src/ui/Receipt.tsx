import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useShop } from '../data/ShopContext';
import { shareReceipt } from '../data/files';
import { money, voidSale, type Sale } from '../domain/shop';
import { Button, colors, confirm, Eyebrow, Icon, problem, serif, Sheet, styles } from './kit';

export function Receipt({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { shop, commit, busy } = useShop();
  const [sharing, setSharing] = useState(false);
  const current = shop.sales.find((s) => s.id === sale.id) || sale;
  const share = async () => { setSharing(true); try { await shareReceipt(shop, current); } catch (error) { problem(error); } finally { setSharing(false); } };
  const cancel = async () => {
    if (!await confirm('Void this sale?', 'The sale will stay in your records as void. Its items will be returned to stock and its revenue removed.')) return;
    try { await commit((s) => voidSale(s, sale.id)); } catch (error) { problem(error); }
  };
  return <Sheet title="Sales receipt" onClose={onClose} footer={<Button title={sharing ? 'Preparing…' : Platform.OS === 'web' ? 'Share receipt' : 'Share PDF receipt'} onPress={share} disabled={sharing} icon="share-outline" />}>
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 15 }}><View style={{ backgroundColor: colors.lime, padding: 18, borderRadius: 50 }}><Icon name={current.voided ? 'close' : 'checkmark'} size={30} /></View><Eyebrow>{current.voided ? 'VOID SALE' : 'SALE RECORDED'}</Eyebrow><Text style={{ fontFamily: serif, fontSize: 29, color: colors.ink }}>{shop.settings.name}</Text><Text style={styles.muted}>{current.number} · {new Date(current.date).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}</Text><Text style={styles.muted}>{current.customer}</Text></View>
    <View style={styles.divider} />
    {current.items.map((item) => <View key={item.productId} style={styles.between}><View style={{ flex: 1, gap: 5 }}><Text style={styles.label}>{item.name}</Text><Text style={styles.muted}>{item.variant} · {item.quantity} × {money(item.price)}</Text></View><Text style={styles.amount}>{money(item.quantity * item.price)}</Text></View>)}
    <View style={styles.divider} /><View style={styles.between}><Text style={styles.muted}>Subtotal</Text><Text style={styles.label}>{money(current.subtotal)}</Text></View><View style={styles.between}><Text style={styles.muted}>Discount</Text><Text style={styles.label}>− {money(current.discount)}</Text></View><View style={styles.between}><Text style={styles.sectionTitle}>Total</Text><Text style={{ fontSize: 27, color: colors.ink, fontWeight: '700' }}>{money(current.total)}</Text></View>
    <Text style={styles.muted}>Recorded payment: {current.method}. Payments are handled outside this app.</Text>
    {!current.voided && <Button title="Void sale and restore stock" onPress={cancel} disabled={busy} variant="danger" />}
  </Sheet>;
}
