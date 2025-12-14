const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Get current user ID from localStorage
 * Returns the user ID (e.g., 'onur', 'hayrullah') or null if not logged in
 */
function getCurrentUserId(): string | null {
  const saved = localStorage.getItem('esca-webkasa-user');
  if (!saved) return null;
  
  // Map email to user ID
  if (saved === 'onur@esca-food.com') return 'onur';
  if (saved === 'hayrullah@esca-food.com') return 'hayrullah';
  
  return null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const userId = getCurrentUserId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add user ID header if available
  if (userId) {
    headers['x-user-id'] = userId;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    console.error('apiRequest - error response:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      url,
    });
    const error = new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    (error as any).response = { status: response.status, data: errorData };
    throw error;
  }

  const jsonData = await response.json();
  console.log('apiRequest - success response:', {
    url,
    data: jsonData,
    dataType: typeof jsonData,
    isArray: Array.isArray(jsonData),
    length: Array.isArray(jsonData) ? jsonData.length : 'N/A',
  });
  return jsonData;
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

export function apiPost<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function apiPut<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

