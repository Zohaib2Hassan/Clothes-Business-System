import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRemote } from '../../remote/RemoteContext';
import { colors, Icon, type IconName } from '../../ui/kit';
const icons: Record<string, IconName> = { home: 'grid-outline', stock: 'shirt-outline', sell: 'add-circle', ledger: 'receipt-outline', more: 'ellipsis-horizontal' };
export default function LiveTabs() {
  const { session } = useRemote(); const inset = useSafeAreaInsets();
  if (!session) return <Redirect href="/connect" />;
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 68 + Math.max(8, inset.bottom), paddingTop: 8, paddingBottom: Math.max(8, inset.bottom) }, tabBarLabelPosition: 'below-icon', tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontWeight: '600' }, tabBarIconStyle: { height: 30 }, tabBarIcon: ({ color }) => <Icon name={icons[route.name]} color={typeof color === 'string' ? color : colors.green} size={route.name === 'sell' ? 32 : 22} /> })}>
    <Tabs.Screen name="home" options={{ title: 'Home' }} /><Tabs.Screen name="stock" options={{ title: 'Stock' }} /><Tabs.Screen name="sell" options={{ title: 'Sell' }} /><Tabs.Screen name="ledger" options={{ title: 'Ledger' }} /><Tabs.Screen name="more" options={{ title: 'More' }} />
  </Tabs>;
}
