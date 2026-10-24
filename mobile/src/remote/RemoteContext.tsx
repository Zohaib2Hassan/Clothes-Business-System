import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { ApiError, request, websiteAddress } from './client';
import config from './config.json';
import type { Session, User } from './types';

const KEY = 'threadly.website.session.v1';
const URL_KEY = 'threadly.website.url.v1';
async function readSession() { return Platform.OS === 'web' ? sessionStorage.getItem(KEY) : SecureStore.getItemAsync(KEY); }
async function writeSession(value: string | null) {
  if (Platform.OS === 'web') { if (value) sessionStorage.setItem(KEY, value); else sessionStorage.removeItem(KEY); }
  else if (value) await SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  else await SecureStore.deleteItemAsync(KEY);
}
type Remote = { ready: boolean; session: Session | null; website: string; epoch: number; accept: (url: string, user: User & { token: string }) => Promise<void>; signOut: () => Promise<void>; api: <T>(path: string, options?: { method?: string; body?: unknown; signal?: AbortSignal; timeout?: number }) => Promise<T>; rememberWebsite: (url: string) => Promise<void>; refreshUser: () => Promise<void> };
const Context = createContext<Remote | null>(null);
export function RemoteProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false); const [session, setSession] = useState<Session | null>(null); const [website, setWebsite] = useState(config.websiteUrl); const [epoch, setEpoch] = useState(0);
  const current = useRef<Session | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    Promise.all([readSession(), AsyncStorage.getItem(URL_KEY)]).then(([value, savedUrl]) => {
      if (!active) return;
      if (savedUrl) setWebsite(savedUrl);
      if (value) { const parsed = JSON.parse(value) as Session; if (parsed.token && parsed.user?._id && websiteAddress(parsed.url, Platform.OS === 'web') === parsed.url) { current.current = parsed; setSession(parsed); setWebsite(parsed.url); } }
    }).catch(() => { /* An unavailable session requires signing in again; local shop records remain separate. */ }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const signOut = useCallback(async () => { generation.current++; current.current = null; setSession(null); setEpoch((v) => v + 1); await writeSession(null); }, []);
  const accept = async (url: string, user: User & { token: string }) => {
    if (!user.token || !user._id) throw new Error('The server did not return a valid login session.');
    const next = { url, token: user.token, user: { _id: user._id, name: user.name, email: user.email } };
    await AsyncStorage.setItem(URL_KEY, url); await writeSession(JSON.stringify(next));
    generation.current++; current.current = next; setWebsite(url); setSession(next); setEpoch((v) => v + 1);
  };
  const api = useCallback(async <T,>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal; timeout?: number } = {}) => {
    const captured = current.current; if (!captured) throw new ApiError('Please sign in to your website account.', 401);
    const capturedGeneration = generation.current;
    try {
      const result = await request<T>(captured.url, path, { ...options, token: captured.token });
      if (generation.current !== capturedGeneration) throw new ApiError('The account changed. Please refresh.', -1);
      return result;
    } catch (error) { if (error instanceof ApiError && error.status === 401 && generation.current === capturedGeneration) await signOut(); throw error; }
  }, [signOut]);
  const refreshUser = async () => { const captured = current.current; const user = await api<User>('/auth/profile'); if (captured && current.current === captured) { const next = { ...captured, user }; current.current = next; setSession(next); } };
  const rememberWebsite = async (url: string) => { await AsyncStorage.setItem(URL_KEY, url); setWebsite(url); };
  return <Context.Provider value={{ ready, session, website, epoch, accept, signOut, api, rememberWebsite, refreshUser }}>{children}</Context.Provider>;
}
export function useRemote() { const context = useContext(Context); if (!context) throw new Error('RemoteProvider is missing.'); return context; }
