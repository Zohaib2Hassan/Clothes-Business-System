export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}
export function websiteAddress(input: string, allowLocal = false) {
  let url: URL; try { url = new URL(input.trim()); } catch { throw new Error('Enter your full website address, starting with https://.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(allowLocal && local && url.protocol === 'http:')) throw new Error('Use an HTTPS website address. Localhost works only for a preview on this computer.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Use the website address without a password, query or fragment.');
  return url.origin + url.pathname.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}
export async function request<T>(url: string, path: string, options: { token?: string; method?: string; body?: unknown; signal?: AbortSignal; timeout?: number } = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError('Invalid API path.');
  const controller = new AbortController();
  const abort = () => controller.abort(); options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, options.timeout || 30000);
  try {
    const response = await fetch(`${url}/api${path}`, { method: options.method || 'GET', headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}), signal: controller.signal });
    const text = await response.text(); let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { throw new ApiError('This address did not return the Threadly API. Check the website address and server connection.', response.status); }
    if (!response.ok) throw new ApiError(typeof data === 'object' && data && 'message' in data ? String(data.message) : `The server returned ${response.status}.`, response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw new ApiError('Request cancelled.', -1);
    throw new ApiError('Could not reach the website. Check your connection and website address. If you were saving a sale, check Sales before trying again.');
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
}
