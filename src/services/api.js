import { SITE_CONFIG } from '../config.js'
import { mockComments, mockPosts } from '../data/mockData.js'

const cache = new Map()

async function request(action, payload = {}, { method = 'POST', cacheMs = 0 } = {}) {
  const cacheKey = `${action}:${JSON.stringify(payload)}`
  const cached = cache.get(cacheKey)
  if (cacheMs && cached && Date.now() - cached.time < cacheMs) return cached.data

  if (!SITE_CONFIG.apiBaseUrl) return mockRequest(action, payload)

  const url =
    method === 'GET'
      ? `${SITE_CONFIG.apiBaseUrl}?action=${encodeURIComponent(action)}&payload=${encodeURIComponent(
          JSON.stringify(payload),
        )}`
      : SITE_CONFIG.apiBaseUrl

  const response = await fetch(url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: method === 'POST' ? JSON.stringify({ action, payload }) : undefined,
  })

  if (!response.ok) throw new Error(`API error ${response.status}`)
  const data = await response.json()
  if (!data.ok) throw new Error(data.error || 'API request failed')
  if (cacheMs) cache.set(cacheKey, { time: Date.now(), data: data.result })
  return data.result
}

function mockRequest(action, payload) {
  if (action === 'listPosts') return Promise.resolve(mockPosts.filter((post) => post.status === 'Published'))
  if (action === 'getPost') {
    return Promise.resolve(mockPosts.find((post) => post.slug === payload.slug || post.id === payload.id))
  }
  if (action === 'listComments') return Promise.resolve(mockComments.filter((item) => item.postId === payload.postId))
  if (action === 'createComment') {
    return Promise.resolve({
      id: `local_${Date.now()}`,
      commentId: `local_${Date.now()}`,
      ...payload,
      displayName: payload.displayName || 'Demo Member',
      createdTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likeCount: 0,
      status: 'visible',
      pinned: false,
    })
  }
  if (action === 'loginUser') {
    return Promise.resolve({
      userId: `local_user_${payload.googleId || Date.now()}`,
      googleId: payload.googleId,
      displayName: payload.displayName,
      email: payload.email,
      photoUrl: payload.photoUrl,
      role: 'Member',
      status: 'Active',
    })
  }
  if (action === 'listUsers') return Promise.resolve([])
  if (action === 'likeComment') return Promise.resolve({ ok: true })
  if (action === 'createSuggestion') return Promise.resolve({ id: `suggestion_${Date.now()}`, ...payload })
  if (action === 'adminLogin') return Promise.resolve({ token: 'local-demo-token', name: 'Demo Admin' })
  return Promise.resolve({ ok: true })
}

export const api = {
  listPosts: (filters = {}) => request('listPosts', filters, { cacheMs: 60_000 }),
  getPost: (slug) => request('getPost', { slug }, { cacheMs: 60_000 }),
  loginUser: (profile) => request('loginUser', profile),
  getCurrentUser: (userId) => request('getCurrentUser', { userId }),
  listUsers: (adminUserId) => request('listUsers', { adminUserId }),
  updateUserStatus: (adminUserId, targetUserId, status, banReason = '') =>
    request('updateUserStatus', { adminUserId, targetUserId, status, banReason }),
  updateUserRole: (adminUserId, targetUserId, role) => request('updateUserRole', { adminUserId, targetUserId, role }),
  listComments: (postId) => request('listCommentsByPost', { postId }),
  createComment: (comment) => request('createComment', comment),
  updateComment: (commentId, userId, comment) => request('updateComment', { commentId, userId, comment }),
  deleteOwnComment: (commentId, userId) => request('deleteOwnComment', { commentId, userId }),
  likeComment: (commentId, userId) => request('likeComment', { commentId, userId }),
  reportComment: (commentId, userId) => request('reportComment', { commentId, userId }),
  adminHideComment: (adminUserId, commentId) => request('adminHideComment', { adminUserId, commentId }),
  adminDeleteComment: (adminUserId, commentId) => request('adminDeleteComment', { adminUserId, commentId }),
  adminPinComment: (adminUserId, commentId, pinned = true) => request('adminPinComment', { adminUserId, commentId, pinned }),
  createSuggestion: (suggestion) => request('createSuggestion', suggestion),
  listSuggestions: (token) => request('listSuggestions', { token }),
  moderateSuggestion: (id, moderation, token) => request('moderateSuggestion', { id, moderation, token }),
  adminLogin: (password) => request('adminLogin', { password }),
  createPost: (post, token) => request('createPost', { post, token }),
  updatePost: (post, token) => request('updatePost', { post, token }),
  deletePost: (id, token) => request('deletePost', { id, token }),
  moderateComment: (id, moderation, token) => request('moderateComment', { id, moderation, token }),
  getSettings: () => request('getSettings', {}, { cacheMs: 120_000 }),
}
