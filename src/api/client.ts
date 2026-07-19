// Base URL for API
export const API_URL = 'https://api.thecelticore.com';

// Network Request Helper
async function request(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    // The auth token now lives in an httpOnly cookie set by the backend —
    // it's invisible to JS entirely (that's the point, it can't be stolen
    // via XSS). `credentials: 'include'` is what makes the browser attach
    // that cookie to every request automatically; there's nothing left
    // for this client to read or attach manually.
    credentials: 'include'
  };

  const res = await fetch(`${API_URL}${endpoint}`, config);
  if (!res.ok) {
    const errorText = await res.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      errorJson = { message: errorText || 'API Error' };
    }
    throw new Error(errorJson.message || `HTTP error ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) =>
    request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  put: (endpoint: string, body: any) =>
    request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' })
};