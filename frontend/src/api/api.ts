const viteApiUrl = import.meta.env.VITE_API_URL;
// Ensure no double slashes and correct /api suffix
const cleanViteUrl = viteApiUrl ? viteApiUrl.replace(/\/$/, '') : '';
const BASE_URL = cleanViteUrl ? `${cleanViteUrl}/api` : '/api';

console.log('API Base URL:', BASE_URL);

let jwtToken = localStorage.getItem('splitmint_token') || '';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (e) {
      // Fallback
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

