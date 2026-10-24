import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useShop } from '../../data/ShopContext';
import { money, newId, parseMoney, saveExpense, summary, type Sale } from '../../domain/shop';
import { Page } from '../../ui/Page';
import { Receipt } from '../../ui/Receipt';
import { Button, Card, Chip, colors, confirm, Empty, Eyebrow, Field, Icon, problem, Sheet, styles } from '../../ui/kit';

export default function Ledger() {
  const { shop, commit, busy } = useShop();
  const [tab, setTab] = useState('Sales'); const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null); const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState('Supplies');
  const expenseId = useRef(''); const saving = useRef(false);
  const all = summary(shop);
  const sales = shop.sales.filter((s) => `${s.number} ${s.customer}`.toLowerCase().includes(search.toLowerCase()));
  const expenses = shop.expenses.filter((e) => `${e.title} ${e.category}`.toLowerCase().includes(search.toLowerCase()));
  const add = async () => {
    if (saving.current) return;
    saving.current = true;
    try { const expense = { id: expenseId.current, title, category, amount: parseMoney(amount), date: new Date().toISOString() }; await commit((s) => saveExpense(s, expense)); setAdding(false); setTitle(''); setAmount(''); } catch (error) { problem(error); } finally { saving.current = false; }
  };
  const remove = async (id: string) => { if (!await confirm('Remove expense?', 'This expense will be removed from your records. Export a backup first if you need to keep it.')) return; try { await commit((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })); } catch (error) { problem(error); } };
  return <Page title="The story in numbers." subtitle="Receipts and expenses, all accounted for." action={tab === 'Expenses' ? <Button title="Add" onPress={() => { expenseId.current = newId('expense'); setAdding(true); }} small icon="add" /> : undefined}>
    <View style={styles.row}><Card style={{ flex: 1, padding: 15 }}><Eyebrow>ALL SALES</Eyebrow><Text style={styles.amount}>{money(all.revenue)}</Text></Card><Card style={{ flex: 1, padding: 15 }}><Eyebrow>ALL EXPENSES</Eyebrow><Text style={styles.amount}>{money(all.expenses)}</Text></Card></View>
    <View style={[styles.row, { marginVertical: 18 }]}>{['Sales', 'Expenses'].map((t) => <Chip key={t} label={t} selected={tab === t} onPress={() => { setTab(t); setSearch(''); }} />)}</View>
    <Field label={tab === 'Sales' ? 'Search receipts' : 'Search expenses'} value={search} onChangeText={setSearch} placeholder={tab === 'Sales' ? 'Receipt number or customer' : 'Description or category'} />
    <View style={{ gap: 10, marginTop: 18 }}>{tab === 'Sales' ? sales.slice(0, 100).map((sale) => <Pressable key={sale.id} accessibilityRole="button" accessibilityLabel={`Open ${sale.number}`} onPress={() => setReceipt(sale)}><Card style={{ padding: 16 }}><View style={styles.between}><View style={styles.row}><View style={{ padding: 11, backgroundColor: colors.pale, borderRadius: 13 }}><Icon name={sale.voided ? 'close-circle-outline' : 'receipt-outline'} size={22} /></View><View style={{ gap: 5 }}><Text style={styles.label}>{sale.number}{sale.voided ? ' · VOID' : ''}</Text><Text style={styles.muted}>{sale.customer}</Text></View></View><Text style={[styles.amount, sale.voided && { color: colors.muted, textDecorationLine: 'line-through' }]}>{money(sale.total)}</Text></View><Text style={{ color: colors.muted, fontSize: 11 }}>{new Date(sale.date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })} · {sale.method}</Text></Card></Pressable>) : expenses.slice(0, 100).map((expense) => <Card key={expense.id} style={{ padding: 16 }}><View style={styles.between}><View style={{ flex: 1, gap: 6 }}><Text style={styles.label}>{expense.title}</Text><Text style={styles.muted}>{expense.category} · {new Date(expense.date).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}</Text></View><Text style={styles.amount}>{money(expense.amount)}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${expense.title}`} disabled={busy} onPress={() => remove(expense.id)} hitSlop={10}><Icon name="trash-outline" color={colors.red} size={19} /></Pressable></View></Card>)}</View>
    {(tab === 'Sales' ? !sales.length : !expenses.length) && <Empty icon={tab === 'Sales' ? 'receipt-outline' : 'wallet-outline'} title={search ? 'No matching records' : tab === 'Sales' ? 'Every sale has a story' : 'A clear view of your spending'} description={search ? 'Try a different search.' : tab === 'Sales' ? 'Your saved sales will appear here, with receipts ready to share.' : 'Record rent, packaging, delivery and other shop expenses.'} />}
    {(tab === 'Sales' ? sales.length : expenses.length) > 100 && <Text style={[styles.muted, { marginTop: 15 }]}>Showing the latest 100 matches. Search or export your full records in More.</Text>}
    {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    {adding && <Sheet title="A shop expense" onClose={() => { if (!saving.current) setAdding(false); }} footer={<Button title={busy ? 'Saving…' : 'Save expense'} onPress={add} disabled={busy} icon="checkmark" />}><Field label="Expense description" value={title} onChangeText={setTitle} maxLength={80} placeholder="e.g. Paper bags" autoFocus /><Field label="Amount (PKR)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="850" /><Text style={styles.label}>Category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Supplies', 'Rent', 'Delivery', 'Utilities', 'Other'].map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}</View><Text style={styles.muted}>Recorded for today, Pakistan time. Product costs belong on each product; avoid recording those costs again here.</Text></Sheet>}
  </Page>;
}
