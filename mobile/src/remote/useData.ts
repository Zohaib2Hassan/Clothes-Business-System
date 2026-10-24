import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useRemote } from './RemoteContext';
export function useData<T>(path: string) {
  const { api, epoch } = useRemote();
  const key = `${epoch}:${path}`;
  const [stored, setStored] = useState<{ key: string; data: T } | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    controller.current?.abort(); const request = new AbortController(); controller.current = request; setLoading(true); setError('');
    try { const next = await api<T>(path, { signal: request.signal }); if (!request.signal.aborted) setStored({ key, data: next }); }
    catch (e) { if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load records.'); }
    finally { if (!request.signal.aborted) setLoading(false); }
  }, [api, path, key]);
  useFocusEffect(useCallback(() => { void reload(); return () => controller.current?.abort(); }, [reload]));
  return { data: stored?.key === key ? stored.data : null, error, loading, reload };
}
