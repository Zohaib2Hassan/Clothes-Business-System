import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShop } from '../../data/ShopContext';
import { colors, Icon, type IconName } from '../../ui/kit';
const icons: Record<string, IconName> = { home: 'grid-outline', stock: 'shirt-outline', sell: 'add-circle', ledger: 'receipt-outline', more: 'ellipsis-horizontal' };
export default function TabLayout() {
  const { started } = useShop();
  const insets = useSafeAreaInsets();
  if (!started) return <Redirect href="/" />;
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 68 + Math.max(insets.bottom, 8), paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) }, tabBarLabelPosition: 'below-icon', tabBarIconStyle: { height: 30 }, tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontWeight: '600' }, tabBarIcon: ({ color }) => <Icon name={icons[route.name]} color={typeof color === 'string' ? color : colors.green} size={route.name === 'sell' ? 32 : 22} /> })}>
    <Tabs.Screen name="home" options={{ title: 'Home' }} /><Tabs.Screen name="stock" options={{ title: 'Stock' }} /><Tabs.Screen name="sell" options={{ title: 'Sell' }} /><Tabs.Screen name="ledger" options={{ title: 'Ledger' }} /><Tabs.Screen name="more" options={{ title: 'More' }} />
  </Tabs>;
}
