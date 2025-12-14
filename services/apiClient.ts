/**
 * MAEPLE API Client
 * 
 * Client for communicating with the local MAEPLE API server.
 * Handles auth tokens and request/response formatting.
 */

// API base URL - uses proxy server for proper routing
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

// Token storage key
const TOKEN_KEY = 'maeple_auth_token';

/**
 * Get stored auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set auth token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Clear auth token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has valid token)
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

/**
 * Make authenticated API request with timeout and retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<{ data?: T; error?: string; details?: string; contentType?: string; endpoint?: string }> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Add timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    console.log(`[API] Requesting ${endpoint} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    console.log(`[API] Response headers for ${endpoint}:`, {
      status: response.status,
      contentType,
      contentLength: response.headers.get('content-length')
    });

    // Handle response safely with content-type validation
    let data;
    try {
      const responseText = await response.text();
      console.log(`[API] Response from ${endpoint}:`, responseText);
      
      // Validate content-type before parsing JSON
      if (contentType && !contentType.includes('application/json')) {
        console.error(`[API] Non-JSON response for ${endpoint}:`, {
          contentType,
          response: responseText.substring(0, 200)
        });
      return { 
        error: 'Server returned non-JSON response',
        details: `Expected JSON but received ${contentType}`,
        contentType: contentType || undefined,
        endpoint
      };
      }

      // Check if response looks like HTML before parsing
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error(`[API] HTML response received for ${endpoint}:`, responseText.substring(0, 200));
        return { 
          error: 'Server returned HTML instead of JSON',
          details: 'The API endpoint may not exist or returned an error page',
          endpoint
        };
      }

      // Safe JSON parsing with better error messages
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`[API] JSON parse error for ${endpoint}:`, {
        error: parseError.message,
        response: responseText.substring(0, 200)
      });
      return { 
        error: 'Invalid JSON response from server',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        endpoint
      };
    }

    if (!response.ok) {
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      console.error(`[API] Error from ${endpoint}:`, errorMessage);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return { error: errorMessage };
      }
      
      // Retry on server errors (5xx) or network issues
      if (retryCount < maxRetries) {
        console.log(`[API] Retrying ${endpoint} in ${Math.pow(2, retryCount) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return apiRequest<T>(endpoint, options, retryCount + 1, maxRetries);
      }
      
      return { error: errorMessage };
    }

    console.log(`[API] Success from ${endpoint}`);
    return { data };
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error(`[API] Network error for ${endpoint} (attempt ${retryCount + 1}):`, error);
    
    // Retry on network errors
    if (retryCount < maxRetries && error instanceof Error && error.name !== 'AbortError') {
      console.log(`[API] Retrying ${endpoint} in ${Math.pow(2, retryCount) * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return apiRequest<T>(endpoint, options, retryCount + 1, maxRetries);
    }
    
    return { 
      error: error instanceof Error ? error.message : 'Network error',
      details: error instanceof Error ? error.name : 'Unknown'
    };
  }
}

// ============================================
// AUTH API
// ============================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });

  if (error) {
    return { error };
  }

  if (data?.token) {
    setToken(data.token);
  }

  return { user: data?.user };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await apiRequest<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (error) {
    return { error };
  }

  if (data?.token) {
    setToken(data.token);
  }

  return { user: data?.user };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<{ user?: User; error?: string }> {
  if (!hasToken()) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await apiRequest<{ user: User }>('/auth/me');
  
  if (error) {
    // Token might be invalid, clear it
    if (error.includes('401') || error.includes('403') || error.includes('Invalid')) {
      console.warn('Authentication token invalid, clearing token:', error);
      clearToken();
    }
    return { error };
  }

  return { user: data?.user };
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  if (hasToken()) {
    await apiRequest('/auth/signout', { method: 'POST' });
  }
  clearToken();
}

/**
 * Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (error) {
    return { error };
  }

  return { success: data?.success };
}

/**
 * Delete account
 */
export async function deleteAccount(): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean }>('/auth/account', {
    method: 'DELETE',
  });

  if (error) {
    return { error };
  }

  clearToken();
  return { success: data?.success };
}

// ============================================
// ENTRIES API
// ============================================

export interface Entry {
  id: string;
  [key: string]: any;
}

/**
 * Get all entries
 */
export async function getEntries(): Promise<{ entries?: Entry[]; error?: string }> {
  const { data, error } = await apiRequest<{ entries: Entry[] }>('/entries');
  
  if (error) {
    return { error };
  }

  return { entries: data?.entries || [] };
}

/**
 * Create entry
 */
export async function createEntry(entry: Entry): Promise<{ entry?: Entry; error?: string }> {
  const { data, error } = await apiRequest<{ entry: Entry }>('/entries', {
    method: 'POST',
    body: JSON.stringify({ entry }),
  });

  if (error) {
    return { error };
  }

  return { entry: data?.entry };
}

/**
 * Update entry
 */
export async function updateEntry(id: string, entry: Entry): Promise<{ entry?: Entry; error?: string }> {
  const { data, error } = await apiRequest<{ entry: Entry }>(`/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ entry }),
  });

  if (error) {
    return { error };
  }

  return { entry: data?.entry };
}

/**
 * Delete entry
 */
export async function deleteEntry(id: string): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean }>(`/entries/${id}`, {
    method: 'DELETE',
  });

  if (error) {
    return { error };
  }

  return { success: data?.success };
}

/**
 * Bulk sync entries (for migration from localStorage)
 */
export async function syncEntries(entries: Entry[]): Promise<{ synced?: number; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean; synced: number }>('/entries/sync', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });

  if (error) {
    return { error };
  }

  return { synced: data?.synced };
}

// ============================================
// SETTINGS API
// ============================================

/**
 * Get user settings
 */
export async function getSettings(): Promise<{ settings?: Record<string, any>; error?: string }> {
  const { data, error } = await apiRequest<{ settings: Record<string, any> }>('/settings');
  
  if (error) {
    return { error };
  }

  return { settings: data?.settings || {} };
}

/**
 * Update user settings
 */
export async function updateSettings(settings: Record<string, any>): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });

  if (error) {
    return { error };
  }

  return { success: data?.success };
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return { ok: data.status === 'ok' };
  } catch (error) {
    return { ok: false, error: 'API unavailable' };
  }
}
