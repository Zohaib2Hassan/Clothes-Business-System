import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyShop, validateBackup, type Shop } from '../domain/shop';

export const STORAGE_KEY = 'threadly-pocket:shop:v1';
type Store = { shop: Shop; ready: boolean; started: boolean; busy: boolean; error: string; epoch: number; retry: () => void; commit: (change: (current: Shop) => Shop) => Promise<Shop>; replace: (next: Shop) => Promise<void> };
const Context = createContext<Store | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<Shop>(emptyShop);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const current = useRef(shop);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (cancelled) return;
      const loaded = value ? validateBackup(JSON.parse(value)) : emptyShop();
      current.current = loaded;
      setShop(loaded);
      setStarted(Boolean(value));
      setError('');
      setReady(true);
    }).catch(() => {
      if (!cancelled) { setError('Your saved shop could not be opened. Your data has not been erased. Please try again.'); setReady(true); }
    });
    return () => { cancelled = true; };
  }, [reload]);

  const commit = (change: (previous: Shop) => Shop): Promise<Shop> => {
    setPending((count) => count + 1);
    const operation = queue.current.then(async () => {
      try {
        const next = change(current.current);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        current.current = next;
        setShop(next);
        setStarted(true);
        setError('');
        return next;
      } finally { setPending((count) => count - 1); }
    });
    queue.current = operation.catch(() => undefined);
    return operation;
  };
  const replace = async (next: Shop) => { await commit(() => next); setEpoch((value) => value + 1); };
  return <Context.Provider value={{ shop, ready, started, busy: pending > 0, error, epoch, retry: () => { setReady(false); setReload((value) => value + 1); }, commit, replace }}>{children}</Context.Provider>;
}

export function useShop() {
  const context = useContext(Context);
  if (!context) throw new Error('ShopProvider is missing.');
  return context;
}
