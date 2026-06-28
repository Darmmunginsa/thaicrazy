# คนไทยลืมง่าย (KhonThaiLumNgai)

Responsive public-memory web application for collecting publicly available Thai society topics, source links, YouTube videos, official statements, and discussion threads. This project is not a news agency.

Only an administrator can create posts. Visitors can read articles, watch embedded YouTube videos, open original source links, comment, reply, like, and report comments.

## Stack

- React + Vite
- TailwindCSS v4
- React Router
- Google Apps Script REST API
- Google Sheet database

No Firebase and no Supabase.

## Folder Structure

```text
apps-script/
  Code.gs                 Google Apps Script REST backend
public/
  og-image.svg
  robots.txt
  sitemap.xml
src/
  components/             Shared UI
  data/                   Local demo fallback data
  hooks/
  pages/                  Home, post, timeline, admin, about
  services/api.js         Apps Script API client
  utils/                  SEO, YouTube, sanitize, format helpers
  config.js               Categories, API URL, site constants
```

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

If `VITE_APPS_SCRIPT_API_URL` is empty, the frontend uses local demo data so the app can be reviewed immediately.

## Google Sheet

Create or use an existing Google Sheet with these sheets. The Apps Script `setupSheets()` function creates missing sheets and headers automatically.

### Posts

`id, title, slug, description, coverImage, youtubeUrl, sourceUrls, category, tags, publishDate, status, timeline, timelineYear, views, likes, metaTitle, metaDescription, openGraphImage, createdAt, updatedAt`

### Comments

`id, postId, displayName, comment, parentId, createdTime, likes, reports, status, pinned, ipHash`

### Settings

`key, value`

### RateLimit

`fingerprint, lastCommentAt`

## Apps Script Deployment

1. Open the Google Sheet.
2. Go to Extensions -> Apps Script.
3. Paste `apps-script/Code.gs`.
4. In Apps Script, open Project Settings -> Script Properties.
5. Add `ADMIN_PASSWORD` with a strong password.
6. Run `setupSheets` once and approve permissions.
7. Deploy -> New deployment -> Web app.
8. Execute as: Me.
9. Who has access: Anyone.
10. Copy the `/exec` URL into `.env`:

```bash
VITE_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## API Actions

The frontend sends JSON with `{ action, payload }` to Apps Script.

- Public: `listPosts`, `getPost`, `listComments`, `createComment`, `likeComment`, `reportComment`, `getSettings`, `sitemap`
- Admin: `adminLogin`, `createPost`, `updatePost`, `deletePost`, `moderateComment`

Admin actions require a token returned from `adminLogin`.

## Features

- Newest posts first
- Search by title, description, category, tags, and year
- Trending sort by views, comments, and likes
- YouTube URL to embed conversion
- External source cards for any public URL
- Timeline browsing
- Related posts by shared tags
- Visitor comments, replies, likes, reports
- Admin dashboard, create post, moderation action support
- Draft, Published, Hidden statuses
- SEO metadata, OpenGraph image, JSON-LD per post
- Static `robots.txt` and starter `sitemap.xml`
- Dark/light mode
- Lazy loaded routes and lazy loaded media
- AdSense-ready layout slots
- Client-side comment sanitization plus server-side cleaning, rate limit, and spam checks

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` directory to any static host such as GitHub Pages, Netlify, Cloudflare Pages, or Vercel. For production, update `public/robots.txt` and `public/sitemap.xml` from `https://example.com` to the real domain.

## Important Editorial Note

Every post should prominently show publication date and source links. The site should describe itself as a public-memory archive or aggregator of publicly available information, not as a news publisher. The administrator is responsible for published content and comment moderation.
