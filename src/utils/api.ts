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
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    console.warn(`[authFetch] 401 Unauthorized encountered on ${url}`);
    // If unauthorized, broadcast custom event so UI can react if needed
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
  }

  return response;
}
