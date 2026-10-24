import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShop } from '../data/ShopContext';
import { colors, Eyebrow, Icon, serif, styles } from './kit';

export function Page({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { shop } = useShop();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32, paddingHorizontal: 22, width: '100%', maxWidth: 760, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
    <View style={[styles.between, { marginBottom: 25 }]}><View style={{ flex: 1, gap: 7 }}><Eyebrow>THREADLY / POCKET</Eyebrow><Text accessibilityRole="header" style={pageStyles.title}>{title}</Text><Text style={styles.muted}>{subtitle}</Text></View>{action}</View>
    {shop.mode === 'sample' && <View style={pageStyles.banner}><Icon name="flask-outline" size={17} /><Text style={{ color: colors.ink, fontSize: 12, flex: 1 }}>Sample shop · practice data. Start your own in More.</Text></View>}
    {children}
    <View style={{ alignItems: 'center', marginTop: 30 }}><Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1 }}>A LITTLE ORDER. A LOT MORE ROOM.</Text></View>
  </ScrollView>;
}
const pageStyles = StyleSheet.create({ title: { fontFamily: serif, fontSize: 35, color: colors.ink, letterSpacing: -1 }, banner: { flexDirection: 'row', gap: 9, backgroundColor: colors.lime, padding: 13, borderRadius: 12, marginBottom: 18, alignItems: 'center' } });
