import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, colors, Field, Icon, serif, styles } from '../ui/kit';
import { request, websiteAddress } from '../remote/client';
import { useRemote } from '../remote/RemoteContext';
import type { User } from '../remote/types';
type AuthResult = User & { token: string; requires2FA?: boolean; tempToken?: string; message?: string; devCode?: string; emailSent?: boolean };
export default function Connect() {
  const { ready, session, website, rememberWebsite, accept } = useRemote();
  const [url, setUrl] = useState(website); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [register, setRegister] = useState(false); const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<AuthResult | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const inset = useSafeAreaInsets();
  if (!ready) return null; if (session) return <Redirect href="/live/home" />;
  const submit = async (resend = false) => {
    if (busy) return; setBusy(true); setError('');
    try {
      const base = websiteAddress(url || website, Platform.OS === 'web');
      if (!email.trim() || (!challenge && !password)) throw new Error('Enter your website email and password.');
      if (register && !name.trim()) throw new Error('Enter your name.');
      if (register && password.length < 6) throw new Error('Choose a password with at least six characters.');
      if (challenge && !resend && !/^\d{6}$/.test(code)) throw new Error('Enter the six-digit verification code.');
      await rememberWebsite(base);
      const path = challenge ? resend ? '/auth/resend-2fa' : '/auth/verify-2fa' : register ? '/auth/register' : '/auth/login';
      const data = await request<AuthResult>(base, path, { method: 'POST', body: challenge ? { tempToken: challenge.tempToken, ...(resend ? {} : { code }) } : { name: name.trim(), email: email.trim(), password } });
      if (resend) { setChallenge({ ...challenge!, ...data, requires2FA: true }); return; }
      if (data.requires2FA) { setChallenge(data); setPassword(''); return; }
      await accept(base, data); setPassword(''); setCode('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign-in failed.'); } finally { setBusy(false); }
  };
  return <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ maxWidth: 520, width: '100%', alignSelf: 'center', padding: 28, paddingTop: inset.top + 35, paddingBottom: inset.bottom + 30, gap: 20 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontSize: 23, color: colors.green, fontWeight: '800' }}>threadly pocket.</Text>
    <View style={{ backgroundColor: colors.green, padding: 25, borderRadius: 28, gap: 20 }}><Icon name="storefront-outline" color={colors.lime} size={42} /><Text style={{ color: colors.white, fontFamily: serif, fontSize: 34 }}>One shop.{ '\n' }Everywhere you work.</Text><Text style={{ color: colors.lime, lineHeight: 21 }}>Your website account, stock, sales and customers — on your phone.</Text></View>
    <Text accessibilityRole="header" style={{ fontFamily: serif, color: colors.ink, fontSize: 28 }}>{challenge ? 'Verify your sign-in' : register ? 'Create your website account' : 'Sign in to your website'}</Text>
    {!challenge && <Field label="Website address" value={url || website} onChangeText={setUrl} placeholder="https://your-shop.example" autoCapitalize="none" autoCorrect={false} keyboardType="url" />}
    {register && !challenge && <Field label="Your name" value={name} onChangeText={setName} maxLength={80} />}
    {!challenge ? <><Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} /></> : <><Text style={[styles.muted, { lineHeight: 21 }]}>{challenge.message || 'Enter the code from your website’s verification service.'}</Text>{challenge.devCode && !challenge.emailSent && <Text style={{ color: colors.amber }}>Website demo verification code: {challenge.devCode}</Text>}<Field label="Verification code" value={code} onChangeText={setCode} maxLength={6} keyboardType="number-pad" autoComplete="one-time-code" /></>}
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.red, lineHeight: 21 }}>{error}</Text>}
    <Button title={busy ? 'Connecting…' : challenge ? 'Verify and sign in' : register ? 'Create account' : 'Sign in'} disabled={busy} onPress={() => submit()} icon="arrow-forward" />
    {challenge ? <><Button title="Resend code" variant="ghost" disabled={busy} onPress={() => submit(true)} /><Button title="Back to sign in" variant="ghost" disabled={busy} onPress={() => { setChallenge(null); setCode(''); }} /></> : <Button title={register ? 'I already have an account' : 'Create a website account'} variant="ghost" onPress={() => { setRegister(!register); setError(''); }} />}
    <Text style={[styles.muted, { lineHeight: 21 }]}>Use your website’s address and existing account. Changes are saved to the same shop. An internet connection is required.</Text>
    <Button title="Open my on-device shop" variant="ghost" onPress={() => router.push('/local-start')} />
  </ScrollView>;
}
