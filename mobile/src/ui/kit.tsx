import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const colors = { ink: '#193D33', muted: '#75847D', green: '#214F40', lime: '#D9EF9F', cream: '#F6F7F1', white: '#FFFFFF', line: '#E7EBE3', red: '#B34E3E', amber: '#A56A2D', pale: '#ECF1E8' };
export type IconName = ComponentProps<typeof Ionicons>['name'];
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
export function Icon({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: string }) { return <Ionicons name={name} size={size} color={color} />; }
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[styles.card, style]}>{children}</View>; }
export function Eyebrow({ children }: { children: ReactNode }) { return <Text style={styles.eyebrow}>{children}</Text>; }
export function Button({ title, accessibilityLabel, onPress, icon, variant = 'green', disabled, small = false }: { title: string; accessibilityLabel?: string; onPress: () => void; icon?: IconName; variant?: 'green' | 'lime' | 'ghost' | 'danger'; disabled?: boolean; small?: boolean }) {
  const foreground = variant === 'green' ? colors.white : variant === 'danger' ? colors.red : colors.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, small && { minHeight: 40, paddingHorizontal: 14 }, { backgroundColor: variant === 'green' ? colors.green : variant === 'lime' ? colors.lime : variant === 'danger' ? '#FAEFEB' : colors.pale, opacity: disabled ? .45 : pressed ? .8 : 1 }]}>
    {icon && <Icon name={icon} size={small ? 18 : 20} color={foreground} />}<Text style={{ color: foreground, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 8, flex: 1 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#9AA49B" style={[styles.input, props.multiline && { minHeight: 90 }]} {...props} /></View>;
}
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: Boolean(selected) }} onPress={onPress} style={[styles.chip, selected && { backgroundColor: colors.green, borderColor: colors.green }]}><Text style={{ fontSize: 12, fontWeight: '600', color: selected ? colors.white : colors.muted }}>{label}</Text></Pressable>;
}
export function Section({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}><Text style={styles.actionText}>{action} →</Text></Pressable>}</View>;
}
export function Empty({ icon, title, description, action, onPress }: { icon: IconName; title: string; description: string; action?: string; onPress?: () => void }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Icon name={icon} size={30} color={colors.green} /></View><Text style={styles.sectionTitle}>{title}</Text><Text style={[styles.muted, { textAlign: 'center', lineHeight: 21, maxWidth: 290 }]}>{description}</Text>{action && onPress && <Button title={action} onPress={onPress} small variant="lime" />}</View>;
}
export function Sheet({ title, children, onClose, footer }: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <Modal animationType="slide" transparent visible onRequestClose={onClose}><View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.sheet, { paddingTop: Math.max(20, insets.top), paddingBottom: Math.max(20, insets.bottom) }]}>
    <View style={styles.sheetHeader}><Text accessibilityRole="header" style={styles.sheetTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12} style={styles.close}><Icon name="close" /></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    {footer && <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>{footer}</View>}
  </KeyboardAvoidingView></View></Modal>;
}
export function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Continue', style: 'destructive', onPress: () => resolve(true) }], { cancelable: true, onDismiss: () => resolve(false) }));
}
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
export function problem(error: unknown) { notify('Could not save', error instanceof Error ? error.message : 'Please try again.'); }

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.line, gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: colors.muted, textTransform: 'uppercase' },
  button: { minHeight: 50, paddingHorizontal: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink },
  input: { backgroundColor: colors.cream, borderColor: colors.line, borderWidth: 1, borderRadius: 13, minHeight: 50, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, color: colors.ink },
  chip: { paddingHorizontal: 15, minHeight: 36, justifyContent: 'center', borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.green },
  muted: { fontSize: 13, color: colors.muted },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 34, paddingHorizontal: 12 },
  emptyIcon: { width: 65, height: 65, borderRadius: 24, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalBackdrop: { flex: 1, backgroundColor: '#122A2366', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, width: '100%', maxWidth: 580, maxHeight: '95%' },
  sheetHeader: { paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.line },
  sheetTitle: { fontFamily: serif, fontSize: 25, color: colors.ink, flex: 1 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.cream },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { height: 1, backgroundColor: colors.line },
  amount: { fontSize: 17, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
});
