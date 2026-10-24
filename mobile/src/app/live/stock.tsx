import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useData } from '../../remote/useData';
import { useRemote } from '../../remote/RemoteContext';
import { ResourceEditor } from '../../remote/ResourceEditor';
import { LivePage, rupees } from '../../remote/ui';
import type { Product } from '../../remote/types';
import { Button, Card, Chip, colors, confirm, Empty, Field, Icon, problem, Sheet, styles } from '../../ui/kit';
export default function LiveStock() {
  const { data, loading, error, reload } = useData<Product[]>('/products'); const { api } = useRemote();
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All'); const [editing, setEditing] = useState<Product | 'new' | null>(null); const [selected, setSelected] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const products = (data || []).filter((p) => `${p.name} ${p.productId} ${p.category}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || (filter === 'Low stock' ? p.stock <= 10 : p.category === filter)));
  const remove = async () => { if (!selected || deleting || !await confirm('Delete website product?', `“${selected.name}” will be removed from the website and mobile catalogue. Past sales are kept by the server.`)) return; setDeleting(true); try { await api(`/products/${selected._id}`, { method: 'DELETE' }); setSelected(null); await reload(); } catch (e) { problem(e); } finally { setDeleting(false); } };
  return <LivePage title="Your website collection." subtitle={`${data?.length || 0} shared products`} loading={loading} error={error} reload={reload} action={<Button title="Add" small icon="add" onPress={() => setEditing('new')} />}>
    <Field label="Search website stock" value={search} onChangeText={setSearch} placeholder="Name, category or SKU" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 18 }}>{['All','Low stock', ...new Set((data || []).map((p) => p.category))].map((category) => <Chip key={category} label={category} selected={filter === category} onPress={() => setFilter(category)} />)}</ScrollView>
    <View style={{ gap: 10 }}>{products.slice(0, 100).map((product) => <Pressable key={product._id} accessibilityRole="button" accessibilityLabel={`Open ${product.name}`} onPress={() => setSelected(product)}><Card style={{ padding: 16 }}><View style={styles.row}>{product.image?.startsWith('https://') || product.image?.startsWith('data:image/') ? <Image source={{ uri: product.image }} style={{ width: 55, height: 65, borderRadius: 12 }} /> : <View style={{ padding: 15, backgroundColor: colors.pale, borderRadius: 15 }}><Icon name="shirt-outline" /></View>}<View style={{ flex: 1, gap: 6 }}><Text style={styles.label}>{product.name}</Text><Text style={styles.muted}>{product.productId} · {product.category}</Text><Text style={styles.amount}>{rupees(product.price)}</Text></View><Text style={{ color: product.stock <= 10 ? colors.amber : colors.green, fontWeight: '700' }}>{product.stock} left</Text></View></Card></Pressable>)}</View>
    {!loading && !error && !products.length && <Empty icon="shirt-outline" title="No matching products" description="Add a product or change your search. New website shops start with your own records." />}
    {products.length > 100 && <Text style={styles.muted}>Showing 100 matches. Search to narrow the collection.</Text>}
    {selected && !editing && <ResourceProductDetail product={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} onDelete={remove} deleting={deleting} />}
    {editing && <ResourceEditor kind="product" initial={editing === 'new' ? undefined : { ...editing }} onClose={() => setEditing(null)} onSaved={reload} />}
  </LivePage>;
}
function ResourceProductDetail({ product, onClose, onEdit, onDelete, deleting }: { product: Product; onClose: () => void; onEdit: () => void; onDelete: () => void; deleting: boolean }) { return <Sheet title={product.name} onClose={onClose}><Text style={styles.amount}>{rupees(product.price)}</Text><Text style={styles.muted}>{product.productId} · {product.category}</Text><Text style={styles.label}>{product.stock} units on hand</Text><Text style={styles.muted}>Recorded unit cost: {rupees(product.costPrice)}</Text>{product.variants?.map((v) => <Text style={styles.muted} key={v.name}>{v.name}: {v.values}</Text>)}<Button title="Edit website product" onPress={onEdit} /><Button title="Delete product" onPress={onDelete} disabled={deleting} variant="danger" /></Sheet>; }
