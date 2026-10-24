import { useState } from 'react';
import { Redirect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShop } from '../data/ShopContext';
import { emptyShop, sampleShop } from '../domain/shop';
import { Button, colors, Eyebrow, Field, Icon, problem, serif, styles } from '../ui/kit';

export default function Welcome() {
  const { started, commit, busy } = useShop();
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();
  if (started) return <Redirect href="/home" />;
  const start = async (sample = false) => { try { if (!sample && !name.trim()) throw new Error('Enter your shop name to begin.'); await commit(() => sample ? sampleShop() : { ...emptyShop(), settings: { name: name.trim(), owner: '' } }); } catch (error) { problem(error); } };
  return <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 28, paddingTop: insets.top + 35, paddingBottom: insets.bottom + 30, maxWidth: 520, width: '100%', alignSelf: 'center', gap: 22 }} keyboardShouldPersistTaps="handled">
    <View style={styles.between}><Text style={{ fontSize: 21, color: colors.green, fontWeight: '800', letterSpacing: -.7 }}>threadly<Text style={{ color: colors.muted, fontWeight: '400' }}> pocket.</Text></Text><Icon name="leaf-outline" /></View>
    <View style={{ backgroundColor: colors.green, borderRadius: 38, padding: 28, marginTop: 15, minHeight: 230, justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Icon name="shirt-outline" size={60} color={colors.lime} /><View style={{ backgroundColor: '#FFFFFF15', borderRadius: 14, padding: 12, alignSelf: 'flex-start' }}><Icon name="checkmark-done" color={colors.lime} /></View></View><Text style={{ fontFamily: serif, color: colors.white, fontSize: 32, marginTop: 20 }}>Small shop.{ '\n' }Room to grow.</Text><Text style={{ color: colors.lime, fontSize: 10, letterSpacing: 2, marginTop: 18 }}>MADE FOR YOUR EVERYDAY</Text></View>
    <View style={{ gap: 10 }}><Eyebrow>YOUR SHOP, IN YOUR POCKET</Eyebrow><Text accessibilityRole="header" style={{ fontFamily: serif, fontSize: 34, color: colors.ink, letterSpacing: -1 }}>A little less admin.{ '\n' }A little more you.</Text><Text style={[styles.muted, { lineHeight: 22 }]}>Keep your clothing stock, sales and expenses together. Works offline, with no account to remember.</Text></View>
    <Field label="Your shop name" value={name} onChangeText={setName} maxLength={80} placeholder="e.g. Zohaib’s Clothing" />
    <Button title={busy ? 'Opening…' : 'Create my shop'} onPress={() => start()} disabled={busy} icon="arrow-forward" />
    <Button title="Explore a sample shop" onPress={() => start(true)} variant="ghost" disabled={busy} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, justifyContent: 'center' }}><Icon name="lock-closed-outline" size={15} /><Text style={{ fontSize: 11, color: colors.muted }}>Stored on this device. Export backups to keep it safe.</Text></View>
  </ScrollView>;
}
