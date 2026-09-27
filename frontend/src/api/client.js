const API_BASE = import.meta.env.VITE_API_URL || '';

export const getAuthToken = () => {
  return localStorage.getItem('untracex_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('untracex_token', token);
  } else {
    localStorage.removeItem('untracex_token');
  }
};

export const getStoredUser = () => {
  const user = localStorage.getItem('untracex_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('untracex_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('untracex_user');
  }
};

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    setStoredUser(null);
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }
    return data;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response;
}

export const api = {
  // Auth
  register: async (name, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return apiRequest('/auth/me');
  },

  // Documents
  listDocuments: async () => {
    return apiRequest('/documents');
  },
  getDocument: async (id) => {
    return apiRequest(`/documents/${id}`);
  },
  uploadDocument: async (formData) => {
    return apiRequest('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },
  scanDocument: async (id) => {
    return apiRequest(`/documents/${id}/analyze`, {
      method: 'POST',
    });
  },
  analyzeDocument: async (id) => {
    return apiRequest(`/documents/${id}/analyze`, {
      method: 'POST',
    });
  },
  getAnalysis: async (id) => {
    return apiRequest(`/documents/${id}/analysis`);
  },
  improveText: async (id, customText = null, targetSentences = null) => {
    return apiRequest(`/documents/${id}/improve`, {
      method: 'POST',
      body: JSON.stringify({ custom_text: customText, target_sentences: targetSentences }),
    });
  },
  compareDocument: async (id) => {
    return apiRequest(`/documents/${id}/compare`);
  },
  cleanDocument: async (id, keysToRemove) => {
    return apiRequest(`/documents/${id}/clean`, {
      method: 'POST',
      body: JSON.stringify({ keys_to_remove: keysToRemove }),
    });
  },
  deleteDocument: async (id) => {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
  loadSample: async (sampleType) => {
    return apiRequest(`/documents/load-sample?sample_type=${sampleType}`, {
      method: 'POST',
    });
  },
  getDownloadUrl: (id, version = 'cleaned') => {
    return `${API_BASE}/documents/${id}/download?version=${version}`;
  },
  downloadFile: async (id, version = 'cleaned', filename = 'document') => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/documents/${id}/download?version=${version}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Download failed' }));
      throw new Error(err.detail || 'Download failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = version === 'cleaned' ? `untraced_${filename}` : filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
