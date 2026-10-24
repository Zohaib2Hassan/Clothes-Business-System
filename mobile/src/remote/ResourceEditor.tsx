import { useRef, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Button, Chip, Field, Sheet, colors, styles } from '../ui/kit';
import { parseMoney } from '../domain/shop';
import { useRemote } from './RemoteContext';
type Kind = 'product' | 'customer' | 'expense' | 'business' | 'account';
type FieldSpec = { key: string; label: string; numeric?: boolean; integer?: boolean; required?: boolean; options?: string[]; multiline?: boolean };
const fields: Record<Kind, FieldSpec[]> = {
  product: [{ key: 'name', label: 'Product name', required: true }, { key: 'productId', label: 'SKU / product ID', required: true }, { key: 'category', label: 'Category', required: true, options: ['Kurtis','Unstitched','Stitched','Men','Pret','Accessories','Kids','Other'] }, { key: 'price', label: 'Selling price (PKR)', numeric: true, required: true }, { key: 'costPrice', label: 'Unit cost (PKR)', numeric: true }, { key: 'stock', label: 'Stock quantity', integer: true, required: true }, { key: 'sizes', label: 'Sizes, separated by commas' }, { key: 'colours', label: 'Colours, separated by commas' }, { key: 'image', label: 'Product image HTTPS URL' }],
  customer: [{ key: 'name', label: 'Customer name', required: true }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address', multiline: true }],
  expense: [{ key: 'name', label: 'Expense name', required: true }, { key: 'category', label: 'Category', required: true, options: ['Rent','Electricity','Salaries','Transport','Marketing','Other'] }, { key: 'amount', label: 'Amount (PKR)', numeric: true, required: true }, { key: 'date', label: 'Date (YYYY-MM-DD)', required: true }, { key: 'note', label: 'Note', multiline: true }],
  business: [{ key: 'businessName', label: 'Business name', required: true }, { key: 'businessType', label: 'Business type' }, { key: 'city', label: 'City' }, { key: 'phone', label: 'Business phone' }, { key: 'address', label: 'Business address', multiline: true }, { key: 'taxNumber', label: 'Tax number' }],
  account: [{ key: 'name', label: 'Your name', required: true }, { key: 'email', label: 'Email address', required: true }, { key: 'phone', label: 'Phone number' }],
};
export function ResourceEditor({ kind, initial = {}, onClose, onSaved }: { kind: Kind; initial?: Record<string, unknown>; onClose: () => void; onSaved: () => void }) {
  const { api, refreshUser } = useRemote();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {}; for (const field of fields[kind]) result[field.key] = initial[field.key] === undefined ? '' : String(initial[field.key]);
    if (kind === 'product') { result.category ||= 'Other'; result.productId ||= `MOB-${Date.now().toString(36).toUpperCase()}`; result.stock ||= '0'; const variants = initial.variants as { name: string; values: string }[] | undefined; result.sizes = variants?.find((v) => /size/i.test(v.name))?.values || ''; result.colours = variants?.find((v) => /colou?r/i.test(v.name))?.values || ''; }
    if (kind === 'expense') { result.category ||= 'Other'; result.date = result.date ? result.date.slice(0, 10) : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); }
    return result;
  });
  const saving = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const pickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.size || asset.size > 4 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP photo smaller than 4 MB.');
      if (!['image/jpeg','image/png','image/webp'].includes(asset.mimeType || '')) throw new Error('Choose a JPG, PNG or WebP photo.');
      const image = Platform.OS === 'web' && asset.base64 ? asset.base64 : `data:${asset.mimeType};base64,${await new File(asset.uri).base64()}`;
      if (Platform.OS === 'web' && asset.uri.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
      setValues((previous) => ({ ...previous, image })); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open this photo.'); }
  };
  const save = async () => {
    if (saving.current) return; saving.current = true; setBusy(true); setError('');
    try {
      const body: Record<string, unknown> = {};
      for (const field of fields[kind]) {
        const value = (values[field.key] || '').trim(); if (field.required && !value) throw new Error(`${field.label} is required.`);
        if (field.integer) { if (!/^\d+$/.test(value) || Number(value) > 1000000) throw new Error('Stock must be a whole number between 0 and 1,000,000.'); body[field.key] = Number(value); }
        else if (field.numeric) body[field.key] = parseMoney(value || '0') / 100;
        else body[field.key] = value;
      }
      if (kind === 'product') { if (!(Number(body.price) > 0)) throw new Error('Selling price must be greater than zero.'); if (body.image && !/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(String(body.image))) throw new Error('Use an HTTPS image URL.'); body.variants = [{ name: 'Size', values: values.sizes.trim() }, { name: 'Color', values: values.colours.trim() }].filter((v) => v.values); delete body.sizes; delete body.colours; }
      if (kind === 'expense') { if (!(Number(body.amount) > 0)) throw new Error('Expense amount must be greater than zero.'); const date = `${values.date}T12:00:00+05:00`; if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(date))) throw new Error('Enter a valid date as YYYY-MM-DD.'); body.date = new Date(date).toISOString(); }
      const base = { product: '/products', customer: '/customers', expense: '/expenses', business: '/business', account: '/auth/profile' }[kind];
      const single = kind === 'business' || kind === 'account';
      await api(single ? base : initial._id ? `${base}/${initial._id}` : base, { method: single || initial._id ? 'PUT' : 'POST', body });
      if (kind === 'account') await refreshUser(); onSaved(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); } finally { saving.current = false; setBusy(false); }
  };
  return <Sheet title={`${initial._id || kind === 'business' || kind === 'account' ? 'Edit' : 'New'} ${kind}`} onClose={() => { if (!busy) onClose(); }} footer={<Button title={busy ? 'Saving to website…' : 'Save to website'} disabled={busy} icon="checkmark" onPress={save} />}>
    <Text style={styles.muted}>Changes are shared with your website account.</Text>
    {kind === 'product' && <><Button title="Choose product photo" variant="ghost" onPress={pickPhoto} disabled={busy} />{!!values.image && <><Image source={{ uri: values.image }} style={{ width: 100, height: 100, borderRadius: 15 }} /><Button title="Remove photo" variant="ghost" onPress={() => setValues((v) => ({ ...v, image: '' }))} disabled={busy} /></>}</>}
    {fields[kind].map((field) => field.key === 'image' && values.image.startsWith('data:') ? <Text key={field.key} style={styles.muted}>Product photo attached</Text> : field.options ? <View key={field.key} style={{ gap: 9 }}><Text style={styles.label}>{field.label}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[...new Set([...field.options, values[field.key]].filter(Boolean))].map((option) => <Chip key={option} label={option} selected={values[field.key] === option} onPress={() => setValues((v) => ({ ...v, [field.key]: option }))} />)}</View></View> : <Field key={field.key} label={field.label} value={values[field.key]} onChangeText={(value) => setValues((v) => ({ ...v, [field.key]: value }))} keyboardType={field.integer ? 'number-pad' : field.numeric ? 'decimal-pad' : field.key === 'email' ? 'email-address' : 'default'} autoCapitalize={['email','image'].includes(field.key) ? 'none' : 'sentences'} maxLength={field.multiline ? 500 : field.key === 'image' ? 2000 : 120} multiline={field.multiline} />)}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.red, lineHeight: 21 }}>{error}</Text>}
  </Sheet>;
}
