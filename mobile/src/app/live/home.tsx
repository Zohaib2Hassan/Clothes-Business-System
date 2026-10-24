import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useData } from '../../remote/useData';
import { LivePage, rupees } from '../../remote/ui';
import type { Dashboard } from '../../remote/types';
import { Button, Card, colors, Eyebrow, Section, styles } from '../../ui/kit';
export default function LiveHome() {
  const { data, loading, error, reload } = useData<Dashboard>('/dashboard/stats?period=7');
  return <LivePage title="Your shop, together." subtitle="Live records from your website" loading={loading} error={error} reload={reload}>
    {data && <><Card style={{ backgroundColor: colors.green }}><Text style={{ color: colors.lime, fontSize: 11 }}>TODAY’S RECORDED SALES</Text><Text style={{ fontSize: 39, color: colors.white, fontWeight: '700' }}>{rupees(data.todaySales)}</Text><Text style={{ color: colors.white }}>{data.todayOrdersCount} orders · Pakistan time</Text><Button title="Record a website sale" variant="lime" icon="add" onPress={() => router.push('/live/sell')} /></Card>
      <View style={[styles.row, { marginTop: 12 }]}><Card style={{ flex: 1 }}><Eyebrow>PRODUCTS</Eyebrow><Text style={styles.amount}>{data.totalProducts}</Text></Card><Card style={{ flex: 1 }}><Eyebrow>ALL SALES</Eyebrow><Text style={styles.amount}>{data.totalSalesCount}</Text></Card></View>
      <Section title="Last 7 days" /><Card><Text style={styles.amount}>{rupees(data.periodRevenue)}</Text><View style={{ height: 115, flexDirection: 'row', gap: 9, alignItems: 'flex-end' }}>{data.chartData.map((day, i) => <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}><View accessibilityLabel={`${day.date}: ${rupees(day.sales)}`} style={{ width: '100%', borderRadius: 6, backgroundColor: colors.lime, height: Math.max(3, day.sales / Math.max(1, ...data.chartData.map((d) => d.sales)) * 85) }} /><Text style={{ fontSize: 9, color: colors.muted }}>{day.name || day.date?.slice(-2)}</Text></View>)}</View></Card>
      <Section title="Stock that needs attention" /><Card><Text style={styles.label}>{data.lowStockCount} low-stock products · {data.outOfStockCount} sold out</Text><Button title="Manage inventory" variant="ghost" onPress={() => router.push('/workspace/inventory')} /></Card>
      <Section title="Shop shortcuts" /><View style={{ gap: 10 }}><Button title="Customers" icon="people-outline" onPress={() => router.push('/workspace/customers')} variant="ghost" /><Button title="Analytics & reports" icon="bar-chart-outline" onPress={() => router.push('/workspace/reports')} variant="ghost" /><Button title="Website notifications" icon="notifications-outline" onPress={() => router.push('/workspace/notifications')} variant="ghost" /></View>
      <Section title="Top products" /><Card>{data.topProducts.length ? data.topProducts.slice(0, 5).map((p) => <View key={p.name} style={styles.between}><Text style={[styles.label, { flex: 1 }]}>{p.name}</Text><Text style={styles.muted}>{p.qty} sold</Text></View>) : <Text style={styles.muted}>Your sales will build this list.</Text>}</Card>
    </>}
  </LivePage>;
}
