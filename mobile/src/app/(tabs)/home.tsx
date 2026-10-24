import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useShop } from '../../data/ShopContext';
import { dayKey, money, summary, weeklySales, type Sale } from '../../domain/shop';
import { Page } from '../../ui/Page';
import { Receipt } from '../../ui/Receipt';
import { Button, Card, colors, Empty, Eyebrow, Icon, Section, serif, styles } from '../../ui/kit';

export default function Home() {
  const { shop } = useShop();
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const today = summary(shop, dayKey());
  const week = weeklySales(shop);
  const largest = Math.max(1, ...week.map((d) => d.revenue));
  const low = shop.products.filter((p) => !p.archived && p.stock <= p.lowAt);
  return <Page title="A good day starts here." subtitle={shop.settings.name} action={<View style={{ backgroundColor: colors.white, padding: 12, borderRadius: 18 }}><Icon name="sunny-outline" /></View>}>
    <Card style={{ backgroundColor: colors.green, borderWidth: 0 }}><Text style={{ color: colors.lime, fontSize: 11, letterSpacing: 1.5 }}>TODAY’S SALES · PKR</Text><Text style={{ fontFamily: serif, color: colors.white, fontSize: 42, letterSpacing: -1 }}>{money(today.revenue)}</Text><View style={{ flexDirection: 'row', gap: 24 }}><Text style={{ color: '#D3E0D6', fontSize: 12 }}>{today.orders} sales recorded</Text><Text style={{ color: '#D3E0D6', fontSize: 12 }}>{today.units} pieces sold</Text></View><Button title="Record a sale" onPress={() => router.push('/sell')} variant="lime" icon="add" /></Card>
    <View style={[styles.row, { marginTop: 12 }]}><Card style={{ flex: 1, padding: 16 }}><Eyebrow>EARNINGS TODAY</Eyebrow><Text style={styles.amount}>{money(today.earnings)}</Text><Text style={{ color: colors.muted, fontSize: 10 }}>After recorded costs</Text></Card><Card style={{ flex: 1, padding: 16 }}><Eyebrow>EXPENSES</Eyebrow><Text style={styles.amount}>{money(today.expenses)}</Text><Text style={{ color: colors.muted, fontSize: 10 }}>Today, Pakistan time</Text></Card></View>
    <Section title="Your week at a glance" /><Card><View style={styles.between}><View style={{ gap: 4 }}><Eyebrow>LAST 7 DAYS</Eyebrow><Text style={styles.amount}>{money(week.reduce((s, d) => s + d.revenue, 0))}</Text></View><Icon name="bar-chart-outline" color={colors.muted} /></View><View accessibilityLabel="Sales over the last seven days" style={{ flexDirection: 'row', height: 130, gap: 12, alignItems: 'flex-end' }}>{week.map((d, i) => <View key={i} style={{ flex: 1, alignItems: 'center', gap: 9 }}><View accessibilityLabel={`${d.day}: ${money(d.revenue)}`} style={{ width: '100%', maxWidth: 42, height: d.revenue ? Math.max(7, d.revenue / largest * 90) : 3, backgroundColor: i === 6 ? colors.green : colors.lime, borderRadius: 7 }} /><Text style={{ color: colors.muted, fontSize: 10 }}>{d.day}</Text></View>)}</View></Card>
    <Section title="A little stock check" action="View stock" onPress={() => router.push('/stock')} />
    {low.length ? <Card>{low.slice(0, 3).map((p) => <View key={p.id} style={styles.between}><View style={{ flex: 1, gap: 4 }}><Text style={styles.label}>{p.name}</Text><Text style={styles.muted}>{p.size} · {p.color}</Text></View><Text style={{ fontSize: 12, color: p.stock ? colors.amber : colors.red, fontWeight: '700' }}>{p.stock ? `${p.stock} left` : 'Out of stock'}</Text></View>)}{low.length > 3 && <Text style={styles.muted}>+ {low.length - 3} more need attention</Text>}</Card> : <Card><View style={styles.row}><Icon name="checkmark-circle-outline" /><Text style={styles.muted}>{shop.products.length ? 'Stock looks healthy. You’re all set.' : 'Add products to start tracking your stock.'}</Text></View></Card>}
    <Section title="Recent receipts" action="View all" onPress={() => router.push('/ledger')} />
    {shop.sales.length ? <Card>{shop.sales.slice(0, 3).map((sale) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${sale.number}`} key={sale.id} onPress={() => setReceipt(sale)} style={styles.between}><View style={styles.row}><View style={{ padding: 10, backgroundColor: colors.pale, borderRadius: 12 }}><Icon name="receipt-outline" size={18} /></View><View style={{ gap: 4 }}><Text style={styles.label}>{sale.customer}</Text><Text style={styles.muted}>{sale.number}{sale.voided ? ' · Void' : ''}</Text></View></View><Text style={styles.amount}>{money(sale.total)}</Text></Pressable>)}</Card> : <Empty icon="receipt-outline" title="Your first sale is a fresh start" description="Record a sale and we’ll keep its receipt and update your stock." />}
    {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
  </Page>;
}
