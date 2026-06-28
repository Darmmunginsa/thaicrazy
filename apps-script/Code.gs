const SHEETS = {
  posts: 'Posts',
  comments: 'Comments',
  users: 'Users',
  suggestions: 'Suggestions',
  commentLikes: 'CommentLikes',
  settings: 'Settings',
  rateLimit: 'RateLimit',
}

const POST_HEADERS = [
  'id',
  'title',
  'slug',
  'description',
  'coverImage',
  'youtubeUrl',
  'sourceUrls',
  'category',
  'tags',
  'publishDate',
  'status',
  'timeline',
  'timelineYear',
  'views',
  'likes',
  'metaTitle',
  'metaDescription',
  'openGraphImage',
  'createdAt',
  'updatedAt',
]

const USER_HEADERS = [
  'userId',
  'googleId',
  'displayName',
  'email',
  'photoUrl',
  'role',
  'status',
  'createdAt',
  'lastLogin',
  'commentCount',
  'warningCount',
  'banReason',
]

const COMMENT_HEADERS = [
  'commentId',
  'postId',
  'userId',
  'displayName',
  'email',
  'photoUrl',
  'parentCommentId',
  'comment',
  'likeCount',
  'reportCount',
  'status',
  'pinned',
  'createdAt',
  'updatedAt',
  'ipHash',
]

const SUGGESTION_HEADERS = [
  'id',
  'displayName',
  'contact',
  'title',
  'summary',
  'sourceUrls',
  'category',
  'tags',
  'reason',
  'status',
  'adminNote',
  'createdTime',
  'updatedAt',
  'ipHash',
]

const COMMENT_LIKE_HEADERS = [
  'id',
  'commentId',
  'userId',
  'createdAt',
]

function doGet(event) {
  const action = event.parameter.action
  const payload = safeJson(event.parameter.payload || '{}')
  return route(action, payload, event)
}

function doPost(event) {
  const body = safeJson(event.postData.contents || '{}')
  return route(body.action, body.payload || {}, event)
}

function route(action, payload, event) {
  try {
    setupSheets()
    const handlers = {
      listPosts,
      getPost,
      loginUser,
      getCurrentUser,
      listUsers: requireRole(listUsers, ['Admin']),
      updateUserStatus: requireRole(updateUserStatus, ['Admin']),
      updateUserRole: requireRole(updateUserRole, ['Admin']),
      createComment: (data) => createComment(data, event),
      listComments,
      listCommentsByPost: listComments,
      updateComment,
      deleteOwnComment,
      likeComment,
      reportComment,
      adminHideComment: requireRole(adminHideComment, ['Admin', 'Moderator']),
      adminDeleteComment: requireRole(adminDeleteComment, ['Admin', 'Moderator']),
      adminPinComment: requireRole(adminPinComment, ['Admin', 'Moderator']),
      createSuggestion: (data) => createSuggestion(data, event),
      listSuggestions: requireAdmin(listSuggestions),
      moderateSuggestion: requireAdmin(moderateSuggestion),
      adminLogin,
      createPost: requireAdmin(createPost),
      updatePost: requireAdmin(updatePost),
      deletePost: requireAdmin(deletePost),
      moderateComment: requireAdmin(moderateComment),
      getSettings,
      sitemap,
    }
    if (!handlers[action]) throw new Error('Unknown action')
    return json({ ok: true, result: handlers[action](payload || {}) })
  } catch (error) {
    return json({ ok: false, error: error.message })
  }
}

function listPosts(filters) {
  const posts = cachedReadObjects(SHEETS.posts, POST_HEADERS, 120)
    .filter((post) => post.status === 'Published')
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
  if (!filters) return posts
  return posts.filter((post) => {
    const q = String(filters.q || '').toLowerCase()
    const year = String(filters.year || '')
    const matchesQ =
      !q ||
      [post.title, post.description, post.category, post.tags, post.publishDate]
        .join(' ')
        .toLowerCase()
        .includes(q)
    const matchesCategory = !filters.category || post.category === filters.category
    const matchesYear = !year || String(new Date(post.publishDate).getFullYear()) === year
    return matchesQ && matchesCategory && matchesYear
  })
}

function getPost(payload) {
  const posts = cachedReadObjects(SHEETS.posts, POST_HEADERS, 120)
  const post = posts.find((item) => item.slug === payload.slug || item.id === payload.id)
  if (!post || post.status === 'Hidden') throw new Error('Post not found')
  return post
}

function createPost(payload) {
  const post = payload.post || payload
  const now = new Date().toISOString()
  const row = normalizeObject(
    {
      id: post.id || Utilities.getUuid(),
      title: clean(post.title),
      slug: clean(post.slug || slugify(post.title)),
      description: clean(post.description),
      coverImage: clean(post.coverImage),
      youtubeUrl: clean(post.youtubeUrl),
      sourceUrls: clean(post.sourceUrls),
      category: clean(post.category),
      tags: clean(post.tags),
      publishDate: post.publishDate || now.slice(0, 10),
      status: post.status || 'Draft',
      timeline: clean(post.timeline),
      timelineYear: clean(post.timelineYear),
      views: Number(post.views || 0),
      likes: Number(post.likes || 0),
      metaTitle: clean(post.metaTitle || post.title),
      metaDescription: clean(post.metaDescription || post.description),
      openGraphImage: clean(post.openGraphImage || post.coverImage),
      createdAt: now,
      updatedAt: now,
    },
    POST_HEADERS,
  )
  appendObject(SHEETS.posts, POST_HEADERS, row)
  invalidateSheetCache(SHEETS.posts)
  return row
}

function updatePost(payload) {
  const post = payload.post || payload
  if (!post.id) throw new Error('Post id is required')
  updateObject(SHEETS.posts, POST_HEADERS, post.id, { ...post, updatedAt: new Date().toISOString() })
  invalidateSheetCache(SHEETS.posts)
  return { id: post.id }
}

function deletePost(payload) {
  deleteObject(SHEETS.posts, POST_HEADERS, payload.id)
  invalidateSheetCache(SHEETS.posts)
  return { id: payload.id }
}

function loginUser(payload) {
  const now = new Date().toISOString()
  const googleId = clean(payload.googleId)
  const email = clean(payload.email).toLowerCase()
  if (!googleId || !email) throw new Error('Google profile is required')

  const users = readObjects(SHEETS.users, USER_HEADERS)
  const existing = users.find((user) => user.googleId === googleId || String(user.email).toLowerCase() === email)
  const adminEmails = String(PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  const defaultRole = adminEmails.includes(email) ? 'Admin' : 'Member'

  if (!existing) {
    const user = normalizeObject(
      {
        userId: Utilities.getUuid(),
        googleId,
        displayName: clean(payload.displayName).slice(0, 120),
        email,
        photoUrl: clean(payload.photoUrl).slice(0, 500),
        role: defaultRole,
        status: 'Active',
        createdAt: now,
        lastLogin: now,
        commentCount: 0,
        warningCount: 0,
        banReason: '',
      },
      USER_HEADERS,
    )
    appendObject(SHEETS.users, USER_HEADERS, user)
    return publicUser(user)
  }

  updateObject(SHEETS.users, USER_HEADERS, existing.userId, {
    displayName: clean(payload.displayName).slice(0, 120),
    photoUrl: clean(payload.photoUrl).slice(0, 500),
    lastLogin: now,
    role: existing.role || defaultRole,
  })
  return publicUser({ ...existing, displayName: clean(payload.displayName), photoUrl: clean(payload.photoUrl), lastLogin: now })
}

function getCurrentUser(payload) {
  const user = getUserById(payload.userId)
  return publicUser(user)
}

function listUsers() {
  return readObjects(SHEETS.users, USER_HEADERS).map(publicUser)
}

function updateUserStatus(payload) {
  const status = clean(payload.status)
  if (!['Active', 'Suspended', 'Banned'].includes(status)) throw new Error('Invalid status')
  updateObject(SHEETS.users, USER_HEADERS, payload.targetUserId, {
    status,
    banReason: clean(payload.banReason || ''),
  })
  return { userId: payload.targetUserId, status }
}

function updateUserRole(payload) {
  const role = clean(payload.role)
  if (!['Admin', 'Moderator', 'Member'].includes(role)) throw new Error('Invalid role')
  updateObject(SHEETS.users, USER_HEADERS, payload.targetUserId, { role })
  return { userId: payload.targetUserId, role }
}

function listComments(payload) {
  return cachedReadObjects(SHEETS.comments, COMMENT_HEADERS, 30)
    .map(normalizeCommentRecord)
    .filter((item) => item.postId === payload.postId && item.status !== 'Deleted' && item.status !== 'Hidden')
    .sort((a, b) => Number(b.pinned === true || b.pinned === 'TRUE') - Number(a.pinned === true || a.pinned === 'TRUE') || new Date(b.createdAt) - new Date(a.createdAt))
}

function createComment(payload, event) {
  const user = getActiveUser(payload.userId)
  const fingerprint = hashIp(event)
  enforceCommentRateLimit(fingerprint)
  const comment = clean(payload.comment)
  if (isSpam(comment)) throw new Error('Spam detected')
  if (!comment || comment.length > 1000) throw new Error('Invalid comment')
  const row = normalizeObject(
    {
      commentId: Utilities.getUuid(),
      postId: clean(payload.postId),
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoUrl,
      parentCommentId: clean(payload.parentCommentId || payload.parentId || ''),
      comment: comment.slice(0, 1000),
      likeCount: 0,
      reportCount: 0,
      status: 'Visible',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: '',
      ipHash: fingerprint,
    },
    COMMENT_HEADERS,
  )
  appendObject(SHEETS.comments, COMMENT_HEADERS, row)
  invalidateSheetCache(SHEETS.comments)
  updateObject(SHEETS.users, USER_HEADERS, user.userId, { commentCount: Number(user.commentCount || 0) + 1 })
  invalidateSheetCache(SHEETS.users)
  return row
}

function updateComment(payload) {
  const user = getActiveUser(payload.userId)
  const comment = getCommentById(payload.commentId)
  if (comment.userId !== user.userId) throw new Error('Forbidden')
  const text = clean(payload.comment)
  if (!text || text.length > 1000) throw new Error('Invalid comment')
  updateCommentObject(payload.commentId, {
    comment: text,
    updatedAt: new Date().toISOString(),
  })
  invalidateSheetCache(SHEETS.comments)
  return { ...comment, comment: text, updatedAt: new Date().toISOString() }
}

function deleteOwnComment(payload) {
  const user = getUserById(payload.userId)
  const comment = getCommentById(payload.commentId)
  if (comment.userId !== user.userId) throw new Error('Forbidden')
  updateCommentObject(payload.commentId, {
    status: 'Deleted',
    updatedAt: new Date().toISOString(),
  })
  invalidateSheetCache(SHEETS.comments)
  return { commentId: payload.commentId }
}

function likeComment(payload) {
  getActiveUser(payload.userId)
  const commentId = payload.commentId || payload.id
  const existing = readObjects(SHEETS.commentLikes, COMMENT_LIKE_HEADERS).find(
    (item) => item.commentId === commentId && item.userId === payload.userId,
  )
  if (existing) return { commentId, alreadyLiked: true }
  appendObject(SHEETS.commentLikes, COMMENT_LIKE_HEADERS, {
    id: Utilities.getUuid(),
    commentId,
    userId: payload.userId,
    createdAt: new Date().toISOString(),
  })
  mutateCommentNumber(commentId, 'likeCount', 1)
  invalidateSheetCache(SHEETS.comments)
  invalidateSheetCache(SHEETS.commentLikes)
  return { commentId, alreadyLiked: false }
}

function reportComment(payload) {
  getActiveUser(payload.userId)
  mutateCommentNumber(payload.commentId || payload.id, 'reportCount', 1)
  invalidateSheetCache(SHEETS.comments)
  return { commentId: payload.commentId || payload.id }
}

function moderateComment(payload) {
  updateObject(SHEETS.comments, COMMENT_HEADERS, payload.id, payload.moderation || {})
  return { id: payload.id }
}

function adminHideComment(payload) {
  updateCommentObject(payload.commentId, { status: 'Hidden', updatedAt: new Date().toISOString() })
  invalidateSheetCache(SHEETS.comments)
  return { commentId: payload.commentId }
}

function adminDeleteComment(payload) {
  updateCommentObject(payload.commentId, { status: 'Deleted', updatedAt: new Date().toISOString() })
  invalidateSheetCache(SHEETS.comments)
  return { commentId: payload.commentId }
}

function adminPinComment(payload) {
  updateCommentObject(payload.commentId, { pinned: Boolean(payload.pinned), updatedAt: new Date().toISOString() })
  invalidateSheetCache(SHEETS.comments)
  return { commentId: payload.commentId, pinned: Boolean(payload.pinned) }
}

function createSuggestion(payload, event) {
  const fingerprint = hashIp(event)
  enforceSuggestionRateLimit(fingerprint)
  const title = clean(payload.title).slice(0, 180)
  const summary = clean(payload.summary).slice(0, 1800)
  const sourceUrls = clean(payload.sourceUrls).slice(0, 2000)
  if (!title || !summary || !sourceUrls) throw new Error('Title, summary, and source URLs are required')
  if (isSpam([title, summary, sourceUrls].join(' '))) throw new Error('Spam detected')

  const now = new Date().toISOString()
  const row = normalizeObject(
    {
      id: Utilities.getUuid(),
      displayName: clean(payload.displayName).slice(0, 80),
      contact: clean(payload.contact).slice(0, 160),
      title,
      summary,
      sourceUrls,
      category: clean(payload.category).slice(0, 80),
      tags: clean(payload.tags).slice(0, 240),
      reason: clean(payload.reason).slice(0, 600),
      status: 'new',
      adminNote: '',
      createdTime: now,
      updatedAt: now,
      ipHash: fingerprint,
    },
    SUGGESTION_HEADERS,
  )
  appendObject(SHEETS.suggestions, SUGGESTION_HEADERS, row)
  return { id: row.id, status: row.status, createdTime: row.createdTime }
}

function listSuggestions(payload) {
  const status = clean(payload.status || '')
  return readObjects(SHEETS.suggestions, SUGGESTION_HEADERS)
    .filter((item) => !status || item.status === status)
    .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime))
}

function moderateSuggestion(payload) {
  updateObject(SHEETS.suggestions, SUGGESTION_HEADERS, payload.id, {
    ...(payload.moderation || {}),
    updatedAt: new Date().toISOString(),
  })
  return { id: payload.id }
}

function adminLogin(payload) {
  const password = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')
  if (!password) throw new Error('ADMIN_PASSWORD is not configured')
  if (payload.password !== password) throw new Error('Invalid password')
  const token = Utilities.getUuid()
  CacheService.getScriptCache().put(`admin:${token}`, '1', 21600)
  return { token, name: 'Administrator' }
}

function requireAdmin(handler) {
  return (payload) => {
    const token = payload.token
    if (!token || CacheService.getScriptCache().get(`admin:${token}`) !== '1') {
      throw new Error('Unauthorized')
    }
    return handler(payload)
  }
}

function requireRole(handler, roles) {
  return (payload) => {
    const adminUserId = payload.adminUserId
    const user = getUserById(adminUserId)
    if (!roles.includes(user.role)) throw new Error('Unauthorized')
    if (user.status !== 'Active') throw new Error('Account restricted')
    return handler(payload)
  }
}

function getSettings() {
  return readObjects(SHEETS.settings, ['key', 'value']).reduce((result, item) => {
    result[item.key] = item.value
    return result
  }, {})
}

function sitemap() {
  return listPosts({}).map((post) => ({ slug: post.slug, updatedAt: post.updatedAt || post.publishDate }))
}

function setupSheets() {
  ensureSheet(SHEETS.posts, POST_HEADERS)
  ensureSheet(SHEETS.users, USER_HEADERS)
  ensureSheet(SHEETS.comments, COMMENT_HEADERS)
  ensureSheet(SHEETS.suggestions, SUGGESTION_HEADERS)
  ensureSheet(SHEETS.commentLikes, COMMENT_LIKE_HEADERS)
  ensureSheet(SHEETS.settings, ['key', 'value'])
  ensureSheet(SHEETS.rateLimit, ['fingerprint', 'lastCommentAt'])
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActive()
  let sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0]
  if (current.join('') === '') sheet.getRange(1, 1, 1, headers.length).setValues([headers])
  else {
    const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const missing = headers.filter((header) => !existing.includes(header))
    if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing])
  }
}

function readObjects(sheetName, headers) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const values = sheet.getDataRange().getValues()
  if (values.length <= 1) return []
  const actualHeaders = values[0]
  return values.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    return headers.reduce((item, header) => {
      const index = actualHeaders.indexOf(header)
      item[header] = index >= 0 ? row[index] : ''
      return item
    }, {})
  })
}

function cachedReadObjects(sheetName, headers, ttlSeconds) {
  const cache = CacheService.getScriptCache()
  const key = `sheet:${sheetName}:v2`
  const cached = cache.get(key)
  if (cached) return JSON.parse(cached)
  const rows = readObjects(sheetName, headers)
  cache.put(key, JSON.stringify(rows), ttlSeconds)
  return rows
}

function invalidateSheetCache(sheetName) {
  CacheService.getScriptCache().remove(`sheet:${sheetName}:v2`)
}

function appendObject(sheetName, headers, object) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const row = actualHeaders.map((header) => {
    if (Object.prototype.hasOwnProperty.call(object, header)) return object[header] ?? ''
    return ''
  })
  sheet.appendRow(row)
}

function updateObject(sheetName, headers, id, patch, idField) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const values = sheet.getDataRange().getValues()
  const keyField = idField || inferIdField(headers)
  const idColumn = values[0].indexOf(keyField)
  const rowIndex = values.findIndex((row, index) => index > 0 && row[idColumn] === id)
  if (rowIndex < 1) throw new Error('Row not found')
  const next = values[rowIndex].slice()
  headers.forEach((header) => {
    const colIndex = values[0].indexOf(header)
    if (colIndex >= 0 && Object.prototype.hasOwnProperty.call(patch, header)) next[colIndex] = patch[header]
  })
  sheet.getRange(rowIndex + 1, 1, 1, next.length).setValues([next])
}

function deleteObject(sheetName, headers, id, idField) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const values = sheet.getDataRange().getValues()
  const idColumn = values[0].indexOf(idField || inferIdField(headers))
  const rowIndex = values.findIndex((row, index) => index > 0 && row[idColumn] === id)
  if (rowIndex < 1) throw new Error('Row not found')
  sheet.deleteRow(rowIndex + 1)
}

function mutateNumber(sheetName, headers, id, field, delta, idField) {
  const rows = readObjects(sheetName, headers)
  const keyField = idField || inferIdField(headers)
  const row = rows.find((item) => item[keyField] === id)
  if (!row) throw new Error('Row not found')
  updateObject(sheetName, headers, id, { [field]: Number(row[field] || 0) + delta }, keyField)
}

function incrementPostViews(id) {
  try {
    mutateNumber(SHEETS.posts, POST_HEADERS, id, 'views', 1)
  } catch (error) {
    console.warn(error)
  }
}

function normalizeObject(object, headers) {
  return headers.reduce((result, header) => {
    result[header] = object[header] ?? ''
    return result
  }, {})
}

function inferIdField(headers) {
  if (headers.includes('id')) return 'id'
  if (headers.includes('userId')) return 'userId'
  if (headers.includes('commentId')) return 'commentId'
  return headers[0]
}

function getUserById(userId) {
  const user = readObjects(SHEETS.users, USER_HEADERS).find((item) => item.userId === userId)
  if (!user) throw new Error('User not found')
  return user
}

function getActiveUser(userId) {
  const user = getUserById(userId)
  if (user.status !== 'Active') throw new Error('Account restricted')
  return user
}

function getCommentById(commentId) {
  const comment = readObjects(SHEETS.comments, COMMENT_HEADERS)
    .map(normalizeCommentRecord)
    .find((item) => item.commentId === commentId || item.id === commentId)
  if (!comment) throw new Error('Comment not found')
  return comment
}

function updateCommentObject(commentId, patch) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.comments)
  const values = sheet.getDataRange().getValues()
  const headers = values[0]
  const commentIdColumn = headers.indexOf('commentId')
  const legacyIdColumn = headers.indexOf('id')
  const rowIndex = values.findIndex((row, index) => {
    if (index === 0) return false
    return (commentIdColumn >= 0 && row[commentIdColumn] === commentId) || (legacyIdColumn >= 0 && row[legacyIdColumn] === commentId)
  })
  if (rowIndex < 1) throw new Error('Row not found')

  const row = values[rowIndex].slice()
  const normalized = normalizeCommentRecord(
    COMMENT_HEADERS.reduce((item, header) => {
      const colIndex = headers.indexOf(header)
      item[header] = colIndex >= 0 ? row[colIndex] : ''
      return item
    }, {}),
  )
  const isLegacyShifted = normalized.commentId === row[legacyIdColumn] && normalized.status === row[headers.indexOf('ipHash')]
  const mappedPatch = isLegacyShifted ? legacyCommentPatch(patch) : patch

  Object.keys(mappedPatch).forEach((header) => {
    const colIndex = headers.indexOf(header)
    if (colIndex >= 0) row[colIndex] = mappedPatch[header]
  })
  sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row])
  invalidateSheetCache(SHEETS.comments)
}

function mutateCommentNumber(commentId, field, delta) {
  const comment = getCommentById(commentId)
  updateCommentObject(commentId, { [field]: Number(comment[field] || 0) + delta })
}

function legacyCommentPatch(patch) {
  const mapped = {}
  if (Object.prototype.hasOwnProperty.call(patch, 'comment')) mapped.reports = patch.comment
  if (Object.prototype.hasOwnProperty.call(patch, 'likeCount')) mapped.status = patch.likeCount
  if (Object.prototype.hasOwnProperty.call(patch, 'reportCount')) mapped.pinned = patch.reportCount
  if (Object.prototype.hasOwnProperty.call(patch, 'status')) mapped.ipHash = patch.status
  if (Object.prototype.hasOwnProperty.call(patch, 'pinned')) mapped.updatedAt = patch.pinned
  if (Object.prototype.hasOwnProperty.call(patch, 'updatedAt')) mapped.createdAt = patch.updatedAt
  return mapped
}

function publicUser(user) {
  return {
    userId: user.userId,
    googleId: user.googleId,
    displayName: user.displayName,
    email: user.email,
    photoUrl: user.photoUrl,
    role: user.role || 'Member',
    status: user.status || 'Active',
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    commentCount: Number(user.commentCount || 0),
    warningCount: Number(user.warningCount || 0),
    banReason: user.banReason || '',
  }
}

function normalizeCommentRecord(item) {
  if (!['Visible', 'Deleted', 'Hidden', 'PendingReview'].includes(item.ipHash)) return item

  return {
    commentId: item.id,
    postId: item.postId,
    userId: item.displayName,
    displayName: item.comment,
    email: item.parentId,
    photoUrl: item.createdTime,
    parentCommentId: '',
    comment: item.reports,
    likeCount: Number(item.status || 0),
    reportCount: Number(item.pinned || 0),
    status: ['Deleted', 'Hidden', 'PendingReview'].includes(item.status) ? item.status : item.ipHash,
    pinned: item.updatedAt === true || item.updatedAt === 'TRUE',
    createdAt: item.userId,
    updatedAt: '',
    ipHash: item.photoUrl,
  }
}

function enforceCommentRateLimit(fingerprint) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.rateLimit)
  const values = sheet.getDataRange().getValues()
  const now = Date.now()
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === fingerprint) {
      if (now - Number(values[i][1]) < 30000) throw new Error('Rate limited')
      sheet.getRange(i + 1, 2).setValue(now)
      return
    }
  }
  sheet.appendRow([fingerprint, now])
}

function enforceSuggestionRateLimit(fingerprint) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.rateLimit)
  const values = sheet.getDataRange().getValues()
  const now = Date.now()
  const key = `suggestion:${fingerprint}`
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === key) {
      if (now - Number(values[i][1]) < 300000) throw new Error('Rate limited')
      sheet.getRange(i + 1, 2).setValue(now)
      return
    }
  }
  sheet.appendRow([key, now])
}

function hashIp(event) {
  const raw = JSON.stringify(event.parameter || {}) + Session.getTemporaryActiveUserKey()
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw)).slice(0, 32)
}

function clean(value) {
  return String(value || '').replace(/[<>]/g, '').trim()
}

function isSpam(value) {
  return [/free money/i, /casino bonus/i, /bit\.ly/i, /(.)\1{12,}/].some((pattern) => pattern.test(value))
}

function slugify(value) {
  return clean(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
}

function safeJson(value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return {}
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}
