const SHEETS = {
  posts: 'Posts',
  comments: 'Comments',
  suggestions: 'Suggestions',
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

const COMMENT_HEADERS = [
  'id',
  'postId',
  'displayName',
  'comment',
  'parentId',
  'createdTime',
  'likes',
  'reports',
  'status',
  'pinned',
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
      createComment: (data) => createComment(data, event),
      listComments,
      likeComment,
      reportComment,
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
  const posts = readObjects(SHEETS.posts, POST_HEADERS)
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
  const posts = readObjects(SHEETS.posts, POST_HEADERS)
  const post = posts.find((item) => item.slug === payload.slug || item.id === payload.id)
  if (!post || post.status === 'Hidden') throw new Error('Post not found')
  incrementPostViews(post.id)
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
  return row
}

function updatePost(payload) {
  const post = payload.post || payload
  if (!post.id) throw new Error('Post id is required')
  updateObject(SHEETS.posts, POST_HEADERS, post.id, { ...post, updatedAt: new Date().toISOString() })
  return { id: post.id }
}

function deletePost(payload) {
  deleteObject(SHEETS.posts, POST_HEADERS, payload.id)
  return { id: payload.id }
}

function listComments(payload) {
  return readObjects(SHEETS.comments, COMMENT_HEADERS)
    .filter((item) => item.postId === payload.postId && item.status !== 'deleted' && item.status !== 'hidden')
    .sort((a, b) => Number(b.pinned === true || b.pinned === 'TRUE') - Number(a.pinned === true || a.pinned === 'TRUE') || new Date(b.createdTime) - new Date(a.createdTime))
}

function createComment(payload, event) {
  const fingerprint = hashIp(event)
  enforceCommentRateLimit(fingerprint)
  const comment = clean(payload.comment)
  if (isSpam(comment)) throw new Error('Spam detected')
  const row = normalizeObject(
    {
      id: Utilities.getUuid(),
      postId: clean(payload.postId),
      displayName: clean(payload.displayName).slice(0, 80),
      comment: comment.slice(0, 1200),
      parentId: clean(payload.parentId || ''),
      createdTime: new Date().toISOString(),
      likes: 0,
      reports: 0,
      status: 'visible',
      pinned: false,
      ipHash: fingerprint,
    },
    COMMENT_HEADERS,
  )
  appendObject(SHEETS.comments, COMMENT_HEADERS, row)
  return row
}

function likeComment(payload) {
  mutateNumber(SHEETS.comments, COMMENT_HEADERS, payload.id, 'likes', 1)
  return { id: payload.id }
}

function reportComment(payload) {
  mutateNumber(SHEETS.comments, COMMENT_HEADERS, payload.id, 'reports', 1)
  return { id: payload.id }
}

function moderateComment(payload) {
  updateObject(SHEETS.comments, COMMENT_HEADERS, payload.id, payload.moderation || {})
  return { id: payload.id }
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
  ensureSheet(SHEETS.comments, COMMENT_HEADERS)
  ensureSheet(SHEETS.suggestions, SUGGESTION_HEADERS)
  ensureSheet(SHEETS.settings, ['key', 'value'])
  ensureSheet(SHEETS.rateLimit, ['fingerprint', 'lastCommentAt'])
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActive()
  let sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0]
  if (current.join('') === '') sheet.getRange(1, 1, 1, headers.length).setValues([headers])
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

function appendObject(sheetName, headers, object) {
  SpreadsheetApp.getActive().getSheetByName(sheetName).appendRow(headers.map((header) => object[header] ?? ''))
}

function updateObject(sheetName, headers, id, patch) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const values = sheet.getDataRange().getValues()
  const idColumn = values[0].indexOf('id')
  const rowIndex = values.findIndex((row, index) => index > 0 && row[idColumn] === id)
  if (rowIndex < 1) throw new Error('Row not found')
  const next = values[rowIndex].slice()
  headers.forEach((header) => {
    if (Object.prototype.hasOwnProperty.call(patch, header)) next[values[0].indexOf(header)] = patch[header]
  })
  sheet.getRange(rowIndex + 1, 1, 1, next.length).setValues([next])
}

function deleteObject(sheetName, headers, id) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const values = sheet.getDataRange().getValues()
  const idColumn = values[0].indexOf('id')
  const rowIndex = values.findIndex((row, index) => index > 0 && row[idColumn] === id)
  if (rowIndex < 1) throw new Error('Row not found')
  sheet.deleteRow(rowIndex + 1)
}

function mutateNumber(sheetName, headers, id, field, delta) {
  const rows = readObjects(sheetName, headers)
  const row = rows.find((item) => item.id === id)
  if (!row) throw new Error('Row not found')
  updateObject(sheetName, headers, id, { [field]: Number(row[field] || 0) + delta })
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
