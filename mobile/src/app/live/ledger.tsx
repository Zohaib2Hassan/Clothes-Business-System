import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useData } from '../../remote/useData';
import { useRemote } from '../../remote/RemoteContext';
import { ResourceEditor } from '../../remote/ResourceEditor';
import { LiveReceipt } from '../../remote/LiveReceipt';
import { LivePage, onDate, rupees } from '../../remote/ui';
import type { Expense, Sale } from '../../remote/types';
import { Button, Card, Chip, colors, confirm, Empty, Field, problem, styles } from '../../ui/kit';
export default function LiveLedger() {
  const sales = useData<Sale[]>('/sales'); const expenses = useData<{ expenses: Expense[] }>('/expenses'); const { api } = useRemote(); const [tab, setTab] = useState('Sales'); const [search, setSearch] = useState(''); const [receipt, setReceipt] = useState<Sale | null>(null); const [edit, setEdit] = useState<Expense | 'new' | null>(null);
  const records = (sales.data || []).filter((s) => `${s.receiptNumber || ''} ${s.customerName} ${s.customerPhone || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => Date.parse(b.date) - Date.parse(a.date));
  const spending = (expenses.data?.expenses || []).filter((e) => `${e.name} ${e.category}`.toLowerCase().includes(search.toLowerCase())); const source = tab === 'Sales' ? sales : expenses;
  return <LivePage title="Your website ledger." subtitle="Receipts, returns and expenses" loading={source.loading} error={source.error} reload={source.reload} action={tab === 'Expenses' ? <Button title="Add" icon="add" small onPress={() => setEdit('new')} /> : undefined}>
    <View style={[styles.row, { marginBottom: 18 }]}>{['Sales','Expenses'].map((t) => <Chip key={t} label={t} selected={tab === t} onPress={() => { setTab(t); setSearch(''); }} />)}</View><Field label="Search website records" value={search} onChangeText={setSearch} placeholder={tab === 'Sales' ? 'Customer or receipt' : 'Expense or category'} />
    <View style={{ marginTop: 18, gap: 10 }}>{tab === 'Sales' ? records.slice(0,100).map((sale) => <Pressable key={sale._id} accessibilityRole="button" accessibilityLabel={`Open ${sale.receiptNumber || sale._id}`} onPress={() => setReceipt(sale)}><Card><View style={styles.between}><View style={{ flex: 1, gap: 7 }}><Text style={styles.label}>{sale.receiptNumber || 'Website sale'}</Text><Text style={styles.muted}>{sale.customerName}</Text></View><Text style={styles.amount}>{rupees(sale.totalAmount)}</Text></View><Text style={styles.muted}>{onDate(sale.date)} · {sale.paymentStatus}</Text>{!!sale.refundAmount && <Text style={{ color: colors.amber, fontSize: 12 }}>Refunds: {rupees(sale.refundAmount)}</Text>}</Card></Pressable>) : spending.slice(0,100).map((expense) => <Card key={expense._id}><View style={styles.between}><Text style={[styles.label, { flex: 1 }]}>{expense.name}</Text><Text style={styles.amount}>{rupees(expense.amount)}</Text></View><Text style={styles.muted}>{expense.category} · {onDate(expense.date)}</Text><View style={styles.row}><Button title={`Edit ${expense.name}`} small variant="ghost" onPress={() => setEdit(expense)} /><Button title={`Delete ${expense.name}`} small variant="danger" onPress={async () => { if (!await confirm('Delete website expense?', 'This removes the expense from your website and mobile records.')) return; try { await api(`/expenses/${expense._id}`, { method: 'DELETE' }); await expenses.reload(); } catch (e) { problem(e); } }} /></View></Card>)}</View>
    {!source.loading && !source.error && !(tab === 'Sales' ? records.length : spending.length) && <Empty icon="receipt-outline" title="No matching records" description="Your website records will appear here. Pull down to refresh." />}
    {receipt && <LiveReceipt sale={receipt} onClose={() => setReceipt(null)} onChanged={sales.reload} />}{edit && <ResourceEditor kind="expense" initial={edit === 'new' ? undefined : { ...edit }} onClose={() => setEdit(null)} onSaved={expenses.reload} />}
  </LivePage>;
}
