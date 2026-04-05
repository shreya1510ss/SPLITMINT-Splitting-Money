const viteApiUrl = import.meta.env.VITE_API_URL;

// Simple and robust URL logic: ensure it starts with the URL and ends with /api
const getBaseUrl = () => {
  if (!viteApiUrl) return '/api';
  const cleanUrl = viteApiUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const BASE_URL = getBaseUrl();
console.log('Production API URL:', BASE_URL);

let jwtToken = localStorage.getItem('splitmint_token') || '';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        // Handle both string and array details from FastAPI
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      errorMessage = `API Error: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
});

export const api = {
  setToken(token: string) {
    jwtToken = token;
    localStorage.setItem('splitmint_token', token);
  },

  clearToken() {
    jwtToken = '';
    localStorage.removeItem('splitmint_token');
  },

  async get(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

