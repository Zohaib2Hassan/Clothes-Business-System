import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, Eyebrow, Icon, serif, styles } from '../ui/kit';
import { useRemote } from './RemoteContext';
export function LivePage({ title, subtitle, children, loading = false, error, reload, action, back = false }: { title: string; subtitle?: string; children: ReactNode; loading?: boolean; error?: string; reload?: () => void; action?: ReactNode; back?: boolean }) {
  const { session } = useRemote(); const inset = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} keyboardShouldPersistTaps="handled" refreshControl={reload ? <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.green} /> : undefined} contentContainerStyle={{ padding: 22, paddingTop: inset.top + 20, paddingBottom: inset.bottom + 35, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
    {back && <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/live/home')} style={[styles.row, { marginBottom: 22 }]}><Icon name="arrow-back" size={20} /><Text style={styles.label}>Back</Text></Pressable>}
    <View style={[styles.between, { marginBottom: 22 }]}><View style={{ flex: 1, gap: 8 }}><Eyebrow>THREADLY / CONNECTED</Eyebrow><Text accessibilityRole="header" style={{ fontFamily: serif, color: colors.ink, fontSize: 34 }}>{title}</Text><Text style={styles.muted}>{subtitle || session?.user.name || 'Your website shop'}</Text></View>{action}</View>
    {error ? <View accessibilityRole="alert" style={{ backgroundColor: '#FAEFEB', padding: 17, borderRadius: 16, gap: 12, marginBottom: 18 }}><Text style={{ color: colors.red, lineHeight: 21 }}>{error}</Text>{reload && <Button title="Try again" onPress={reload} small variant="ghost" />}</View> : null}
    {loading && <ActivityIndicator color={colors.green} style={{ marginBottom: 18 }} />}{children}
    <Text style={{ color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 30 }}>Shared with your website · pull down to refresh</Text>
  </ScrollView>;
}
export const rupees = (value: number | undefined) => `Rs. ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
export const onDate = (value: string) => new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' });
