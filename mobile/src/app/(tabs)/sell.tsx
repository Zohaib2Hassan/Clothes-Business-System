import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useShop } from '../../data/ShopContext';
import { checkout, money, newId, parseMoney, variant, type CartLine, type Sale } from '../../domain/shop';
import { Page } from '../../ui/Page';
import { Receipt } from '../../ui/Receipt';
import { Button, Card, Chip, colors, Empty, Field, Icon, problem, Section, Sheet, styles } from '../../ui/kit';

export default function Sell() {
  const { shop, commit, busy } = useShop();
  const [search, setSearch] = useState(''); const [cart, setCart] = useState<CartLine[]>([]);
  const [review, setReview] = useState(false); const [receipt, setReceipt] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState(''); const [discount, setDiscount] = useState(''); const [method, setMethod] = useState<Sale['method']>('Cash');
  const saleId = useRef(''); const saving = useRef(false);
  const products = shop.products.filter((p) => !p.archived && `${p.name} ${p.size} ${p.color} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((sum, line) => sum + (shop.products.find((p) => p.id === line.productId)?.price || 0) * line.quantity, 0);
  let discountValue = 0; try { discountValue = parseMoney(discount || '0'); } catch { /* Validation is shown on saving. */ }
  const adjust = (id: string, delta: number) => setCart((previous) => {
    const old = previous.find((l) => l.productId === id)?.quantity || 0;
    const available = shop.products.find((p) => p.id === id && !p.archived)?.stock || 0;
    const quantity = Math.max(0, Math.min(available, old + delta));
    return [...previous.filter((l) => l.productId !== id), ...(quantity ? [{ productId: id, quantity }] : [])];
  });
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      const amount = parseMoney(discount || '0');
      const id = saleId.current || (saleId.current = newId('sale'));
      const next = await commit((current) => checkout(current, cart, { id, customer, method, discount: amount }).shop);
      setReceipt(next.sales.find((s) => s.id === id)!); setReview(false); setCart([]); setCustomer(''); setDiscount(''); setMethod('Cash'); saleId.current = '';
    } catch (error) { problem(error); } finally { saving.current = false; }
  };
  return <Page title="One lovely sale." subtitle="Choose pieces, then record the details.">
    <Field label="Find a product" value={search} onChangeText={setSearch} placeholder="Search your collection" />
    <Section title="Your collection" />
    <View style={{ gap: 10 }}>{products.slice(0, 80).map((p) => {
      const count = cart.find((l) => l.productId === p.id)?.quantity || 0;
      return <Card key={p.id} style={{ padding: 15 }}><View style={styles.row}><View style={{ backgroundColor: colors.pale, padding: 13, borderRadius: 14 }}><Icon name="shirt-outline" size={26} /></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.label}>{p.name}</Text><Text style={styles.muted}>{variant(p)} · {p.stock} left</Text><Text style={styles.label}>{money(p.price)}</Text></View></View><View style={styles.between}><Text style={{ color: p.stock ? colors.muted : colors.red, fontSize: 12 }}>{p.stock ? 'Available to sell' : 'Out of stock'}</Text>{count ? <View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${p.name}`} onPress={() => adjust(p.id, -1)} style={{ padding: 9, backgroundColor: colors.pale, borderRadius: 10 }}><Icon name="remove" size={17} /></Pressable><Text style={styles.amount}>{count}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Add one ${p.name}`} disabled={count >= p.stock} onPress={() => adjust(p.id, 1)} style={{ padding: 9, backgroundColor: colors.lime, borderRadius: 10, opacity: count >= p.stock ? .4 : 1 }}><Icon name="add" size={17} /></Pressable></View> : <Button title="Add" accessibilityLabel={`Add ${p.name}`} onPress={() => adjust(p.id, 1)} small disabled={!p.stock} variant="ghost" icon="add" />}</View></Card>;
    })}</View>
    {!products.length && <Empty icon="bag-handle-outline" title={shop.products.some((p) => !p.archived) ? 'Nothing matches yet' : 'Your collection starts with one piece'} description="Add products in Stock before recording a sale." action="Go to stock" onPress={() => router.push('/stock')} />}
    {products.length > 80 && <Text style={[styles.muted, { marginTop: 12 }]}>Showing 80 results. Search to find a specific piece.</Text>}
    {!!cart.length && <View style={{ marginTop: 22, gap: 10 }}><Card style={{ backgroundColor: colors.lime }}><View style={styles.between}><View style={{ gap: 5 }}><Text style={styles.label}>{cart.reduce((sum, l) => sum + l.quantity, 0)} pieces in your bag</Text><Text style={styles.amount}>{money(subtotal)}</Text></View><Button title="Review sale" onPress={() => { saleId.current = newId('sale'); setReview(true); }} icon="arrow-forward" /></View></Card><Button title="Clear bag" variant="ghost" onPress={() => setCart([])} /></View>}
    {review && <Sheet title="The finishing touches" onClose={() => { if (!saving.current) setReview(false); }} footer={<Button title={busy ? 'Saving sale…' : `Record sale · ${money(Math.max(0, subtotal - discountValue))}`} onPress={save} disabled={busy} icon="checkmark" />}>
      {cart.map((l) => { const p = shop.products.find((p) => p.id === l.productId); return <View key={l.productId} style={styles.between}><View style={{ flex: 1, gap: 5 }}><Text style={styles.label}>{p?.name || 'Unavailable item'}</Text><Text style={styles.muted}>{l.quantity} × {money(p?.price || 0)}</Text></View><Text style={styles.amount}>{money((p?.price || 0) * l.quantity)}</Text></View>; })}
      <View style={styles.divider} /><Field label="Customer name (optional)" value={customer} onChangeText={setCustomer} maxLength={80} placeholder="Walk-in customer" /><Field label="Discount (PKR)" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" placeholder="0" />
      <Text style={styles.label}>Payment recorded as</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['Cash', 'Card', 'Bank transfer'] as const).map((m) => <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />)}</View><Text style={[styles.muted, { lineHeight: 21 }]}>This records a completed sale and reduces stock. Collect payment separately; this app does not process payments.</Text>
      <View style={styles.between}><Text style={styles.muted}>Subtotal</Text><Text style={styles.amount}>{money(subtotal)}</Text></View>
    </Sheet>}
    {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
  </Page>;
}
