import { Stack, usePathname } from 'expo-router';
import { RemoteProvider, useRemote } from '../remote/RemoteContext';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider, useShop } from '../data/ShopContext';
import { readBackup } from '../data/files';
import { Button, colors, confirm, problem, styles } from '../ui/kit';

function Routes() {
  const { ready, error, retry, replace, busy, epoch } = useShop();
  const remote = useRemote(); const pathname = usePathname();
  const isRemote = pathname === '/' || pathname === '/connect' || pathname.startsWith('/live') || pathname.startsWith('/workspace');
  if (!ready || !remote.ready) return <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', gap: 15 }}><ActivityIndicator color={colors.green} /><Text style={styles.muted}>Opening your shop…</Text></View>;
  if (error && !isRemote) return <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 30, gap: 20 }}><Text style={styles.sectionTitle}>Let’s recover your shop</Text><Text style={styles.muted}>{error}</Text><Button title="Try again" onPress={retry} /><Button title="Restore a backup" variant="ghost" disabled={busy} onPress={async () => { try { const backup = await readBackup(); if (backup && await confirm('Restore backup?', 'This will replace the saved data on this device.')) await replace(backup); } catch (e) { problem(e); } }} /></View>;
  return <Stack key={`${epoch}-${remote.epoch}`} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />;
}
export default function RootLayout() { return <SafeAreaProvider><ShopProvider><RemoteProvider><StatusBar style="dark" /><Routes /></RemoteProvider></ShopProvider></SafeAreaProvider>; }
