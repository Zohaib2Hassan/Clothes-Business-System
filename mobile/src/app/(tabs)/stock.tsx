import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useShop } from '../../data/ShopContext';
import { CATEGORIES, money, variant, type Product } from '../../domain/shop';
import { Page } from '../../ui/Page';
import { ProductEditor } from '../../ui/ProductEditor';
import { Button, Card, Chip, colors, Empty, Field, Icon, styles } from '../../ui/kit';

export default function Stock() {
  const { shop } = useShop();
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All');
  const [editor, setEditor] = useState<Product | 'new' | null>(null);
  const active = shop.products.filter((p) => !p.archived);
  const products = shop.products.filter((p) => (filter === 'Archived' ? p.archived : !p.archived) && (['All', 'Archived'].includes(filter) || (filter === 'Low stock' ? p.stock <= p.lowAt : p.category === filter)) && `${p.name} ${p.sku} ${p.color} ${p.size}`.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Everything in its place." subtitle={`${active.length} products · ${active.reduce((sum, p) => sum + p.stock, 0)} pieces on hand`} action={<Button title="Add" onPress={() => setEditor('new')} icon="add" small />}>
    <Field label="Search stock" value={search} onChangeText={setSearch} placeholder="Name, colour, size or SKU" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 18 }}>{['All', 'Low stock', ...CATEGORIES, 'Archived'].map((c) => <Chip label={c} key={c} selected={filter === c} onPress={() => setFilter(c)} />)}</ScrollView>
    <FlatList scrollEnabled={false} data={products} keyExtractor={(p) => p.id} ItemSeparatorComponent={() => <View style={{ height: 10 }} />} renderItem={({ item: p }) => <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${p.name}`} onPress={() => setEditor(p)}><Card style={{ padding: 16 }}><View style={styles.row}><View style={{ width: 58, height: 66, borderRadius: 16, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}><Icon name={p.category === 'Accessories' ? 'bag-handle-outline' : 'shirt-outline'} size={31} /></View><View style={{ flex: 1, gap: 6 }}><Text style={styles.label}>{p.name}</Text><Text style={styles.muted}>{variant(p)}</Text><Text style={{ color: colors.green, fontWeight: '700', fontSize: 14 }}>{money(p.price)}</Text></View><View style={{ alignItems: 'flex-end', gap: 7 }}><Text style={{ fontWeight: '700', color: p.stock <= p.lowAt ? colors.amber : colors.green }}>{p.stock}</Text><Text style={{ fontSize: 10, color: colors.muted }}>{p.archived ? 'archived' : p.stock === 0 ? 'sold out' : p.stock <= p.lowAt ? 'low stock' : 'in stock'}</Text><Icon name="chevron-forward" size={15} color={colors.muted} /></View></View></Card></Pressable>} ListEmptyComponent={<Empty icon="shirt-outline" title={shop.products.length ? 'No matching pieces' : 'Make room for your collection'} description={shop.products.length ? 'Try another search or category.' : 'Add your first product with its price, cost and available stock.'} action={!shop.products.length ? 'Add first product' : undefined} onPress={() => setEditor('new')} />} />
    {editor && <ProductEditor product={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
  </Page>;
}
