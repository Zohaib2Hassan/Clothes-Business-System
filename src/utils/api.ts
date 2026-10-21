// Helper function to get auth headers for API calls
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const stored = localStorage.getItem('threadly_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch {
    // ignore parse errors
  }

  return headers;
}

// Helper for fetch with auth
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(getAuthHeaders());
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  // Capture the request's session so an old response cannot sign out a newly
  // logged-in user while requests from the previous session are still pending.
  const requestAuthorization = headers.get('Authorization');
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && requestAuthorization && requestAuthorization === getAuthHeaders().Authorization) {
    console.warn(`[authFetch] 401 Unauthorized encountered on ${url}`);
    // If unauthorized, broadcast custom event so UI can react if needed
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
  }

  return response;
}
