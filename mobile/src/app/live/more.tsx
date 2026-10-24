import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useRemote } from '../../remote/RemoteContext';
import { LivePage } from '../../remote/ui';
import { Button, Card, colors, confirm, Icon, problem, Section, styles, type IconName } from '../../ui/kit';
const links: { title: string; detail: string; path: string; icon: IconName }[] = [
  { title: 'Customers', detail: 'Profiles, purchase history and contact details', path: 'customers', icon: 'people-outline' },
  { title: 'Inventory', detail: 'Live stock status and adjustments', path: 'inventory', icon: 'cube-outline' },
  { title: 'Analytics & reports', detail: 'Sales, refunds, expenses and CSV exports', path: 'reports', icon: 'bar-chart-outline' },
  { title: 'Demand forecasts', detail: 'Your website’s predictions and stockout risks', path: 'predictions', icon: 'trending-up-outline' },
  { title: 'AI assistant', detail: 'Ask questions using your website’s shop context', path: 'assistant', icon: 'sparkles-outline' },
  { title: 'Notifications', detail: 'Read and manage your website alerts', path: 'notifications', icon: 'notifications-outline' },
  { title: 'Business details', detail: 'Your shared shop profile and receipt details', path: 'business', icon: 'storefront-outline' },
  { title: 'Account & security', detail: 'Profile, password, verification and account deletion', path: 'account', icon: 'person-circle-outline' },
  { title: 'Subscription status', detail: 'Your website plan, credits and billing history', path: 'subscription', icon: 'card-outline' },
  { title: 'Privacy & connection', detail: 'Website address, data handling and local records', path: 'privacy', icon: 'shield-checkmark-outline' },
];
export default function LiveMore() {
  const { session, signOut } = useRemote();
  return <LivePage title="Your whole shop." subtitle={session?.user.email}>
    <Card><Text style={styles.sectionTitle}>{session?.user.name}</Text><Text style={[styles.muted, { lineHeight: 21 }]}>{session?.url}</Text><Text style={{ color: colors.green, fontSize: 12 }}>Connected to your website account</Text></Card>
    <Section title="Website tools, on your phone" /><Card>{links.map((link) => <Pressable key={link.path} accessibilityRole="button" accessibilityLabel={link.title} onPress={() => router.push(`/workspace/${link.path}`)} style={[styles.row, { paddingVertical: 13 }]}><View style={{ padding: 10, backgroundColor: colors.pale, borderRadius: 12 }}><Icon name={link.icon} /></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.label}>{link.title}</Text><Text style={[styles.muted, { lineHeight: 19 }]}>{link.detail}</Text></View><Icon name="chevron-forward" size={16} /></Pressable>)}</Card>
    <View style={{ marginTop: 24 }}><Button title="Sign out of website" variant="ghost" onPress={async () => { if (!await confirm('Sign out on this device?', 'Your website records stay on the server. Your separate on-device shop is also kept.')) return; try { await signOut(); router.replace('/connect'); } catch (e) { problem(e); } }} /></View>
  </LivePage>;
}
