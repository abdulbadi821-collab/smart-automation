const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Public health check
  health: () => request('/api/health'),

  // Dashboard stats
  getDashboardStats: (token) => request('/api/dashboard/stats', { method: 'GET' }, token),

  // Conversations
  getConversations: (token) => request('/api/conversations', { method: 'GET' }, token),
  
  createConversation: (token, title = 'New conversation') =>
    request(
      '/api/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      },
      token
    ),

  deleteConversation: (token, id) =>
    request(
      `/api/conversations/${id}`,
      {
        method: 'DELETE',
      },
      token
    ),

  // Messages
  getConversationMessages: (token, conversationId) =>
    request(`/api/conversations/${conversationId}/messages`, { method: 'GET' }, token),

  sendMessage: (token, conversationId, question) =>
    request(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      },
      token
    ),
};
