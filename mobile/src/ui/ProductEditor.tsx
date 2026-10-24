import { useState } from 'react';
import { Text, View } from 'react-native';
import { useShop } from '../data/ShopContext';
import { CATEGORIES, newId, parseMoney, saveProduct, type Product } from '../domain/shop';
import { Button, Chip, confirm, Field, problem, Sheet, styles } from './kit';

export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { commit, busy } = useShop();
  const [id] = useState(() => product?.id || newId('product'));
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [size, setSize] = useState(product?.size || '');
  const [color, setColor] = useState(product?.color || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(product ? String(product.price / 100) : '');
  const [cost, setCost] = useState(product ? String(product.cost / 100) : '');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [lowAt, setLowAt] = useState(String(product?.lowAt ?? 5));
  const save = async () => {
    try {
      if (!/^\d+$/.test(stock) || !/^\d+$/.test(lowAt)) throw new Error('Stock quantities must be whole numbers.');
      const next: Product = { id, name, category, size, color, sku, price: parseMoney(price), cost: parseMoney(cost || '0'), stock: Number(stock), lowAt: Number(lowAt), archived: product?.archived || false };
      await commit((shop) => saveProduct(shop, next)); onClose();
    } catch (error) { problem(error); }
  };
  const archive = async () => {
    if (!product || !await confirm(product.archived ? 'Restore product?' : 'Archive product?', 'Past receipts will be kept. Archived products cannot be added to a sale.')) return;
    try { await commit((shop) => ({ ...shop, products: shop.products.map((p) => p.id === id ? { ...p, archived: !p.archived } : p) })); onClose(); } catch (error) { problem(error); }
  };
  return <Sheet title={product ? 'Edit product' : 'A new addition'} onClose={onClose} footer={<Button title={busy ? 'Saving…' : 'Save product'} onPress={save} disabled={busy} icon="checkmark" />}>
    <Field label="Product name" value={name} onChangeText={setName} maxLength={80} placeholder="e.g. Linen everyday kurta" autoFocus />
    <Text style={styles.label}>Category</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{CATEGORIES.map((c) => <Chip key={c} label={c} selected={c === category} onPress={() => setCategory(c)} />)}</View>
    <View style={styles.row}><Field label="Size" value={size} onChangeText={setSize} maxLength={30} placeholder="M / 3-piece" /><Field label="Colour" value={color} onChangeText={setColor} maxLength={40} placeholder="Sage" /></View>
    <View style={styles.row}><Field label="Selling price (PKR)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="3250" /><Field label="Unit cost (PKR)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="0" /></View>
    <Text style={styles.muted}>Enter your cost for accurate earnings. A blank cost is recorded as zero.</Text>
    <View style={styles.row}><Field label="Stock on hand" value={stock} onChangeText={setStock} keyboardType="number-pad" /><Field label="Low stock alert at" value={lowAt} onChangeText={setLowAt} keyboardType="number-pad" /></View>
    <Field label="SKU (optional)" value={sku} onChangeText={setSku} maxLength={50} autoCapitalize="characters" placeholder="KUR-SG-M" />
    {product && <Button title={product.archived ? 'Restore product' : 'Archive product'} onPress={archive} variant="danger" disabled={busy} icon="archive-outline" />}
  </Sheet>;
}
