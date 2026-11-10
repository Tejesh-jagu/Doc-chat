const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('docchat_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Invalid credentials');
    }
    return res.json();
  },

  async googleAuth(data) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Google authentication failed' }));
      throw new Error(err.detail || 'Google authentication failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update password' }));
      throw new Error(err.detail || 'Failed to update password');
    }
    return res.json();
  },

  // Documents
  async listDocuments(search = '', sortBy = 'date', sortOrder = 'desc', folderId = null) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);
    if (sortOrder) params.append('sort_order', sortOrder);
    if (folderId !== null && folderId !== undefined) params.append('folder_id', folderId);

    const res = await fetch(`${API_BASE}/documents/?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to list documents');
    return res.json();
  },

  async uploadDocuments(files, folderId = null) {
    const token = localStorage.getItem('docchat_token');
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    const url = folderId ? `${API_BASE}/documents/upload?folder_id=${folderId}` : `${API_BASE}/documents/upload`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async renameDocument(id, filename) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filename })
    });
    if (!res.ok) throw new Error('Failed to rename document');
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  getDocumentFileUrl(id) {
    const token = localStorage.getItem('docchat_token');
    return `${API_BASE}/documents/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  async getStorageStats() {
    const res = await fetch(`${API_BASE}/documents/storage`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch storage stats');
    return res.json();
  },

  // Folders
  async listFolders() {
    const res = await fetch(`${API_BASE}/documents/folders/list`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
  },

  async createFolder(name, color = 'indigo') {
    const res = await fetch(`${API_BASE}/documents/folders/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, color })
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },

  async deleteFolder(id) {
    const res = await fetch(`${API_BASE}/documents/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete folder');
    return res.json();
  },

  // Chats
  async listChats(documentId = null) {
    const params = documentId ? `?document_id=${documentId}` : '';
    const res = await fetch(`${API_BASE}/chats/${params}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
  },

  async createChat(title = 'New Chat', documentIds = []) {
    const res = await fetch(`${API_BASE}/chats/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, document_ids: documentIds })
    });
    if (!res.ok) throw new Error('Failed to create chat');
    return res.json();
  },

  async getChat(id) {
    const res = await fetch(`${API_BASE}/chats/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch chat details');
    return res.json();
  },

  async sendMessage(chatId, content, documentIds = null, model = null) {
    const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, document_ids: documentIds, model })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  async retryMessage(chatId, messageId) {
    const res = await fetch(`${API_BASE}/chats/${chatId}/messages/${messageId}/retry`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to retry message');
    return res.json();
  },

  async setFeedback(chatId, messageId, feedback) {
    const res = await fetch(`${API_BASE}/chats/${chatId}/messages/${messageId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedback })
    });
    if (!res.ok) throw new Error('Failed to update feedback');
    return res.json();
  },

  async deleteChat(id) {
    const res = await fetch(`${API_BASE}/chats/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete chat');
    return res.json();
  },

  // System
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/system/settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};

