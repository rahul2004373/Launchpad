# Worker S3 Deployment Guide
## Static Site Build & Serve — Complete Reference

---

## Overview

This document covers everything a deployment worker must handle to build, upload, and correctly serve static frontend projects on AWS S3. It covers three frameworks — CRA, Vite, and Next.js — including config patches, build verification, upload strategy, folder naming, ContentType mapping, routing, and all known edge cases.

---

## 1. Framework Detection

Before doing anything, detect which framework the project uses by reading `package.json`.

```js
function detectFramework(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['react-scripts'])          return 'cra';
  if (deps['vite'])                   return 'vite';
  if (deps['next'])                   return 'nextjs';
  if (deps['@angular/core'])          return 'angular';   // future
  if (deps['@vue/cli-service'])       return 'vue-cli';   // future

  return 'unknown';
}
```

If framework is `unknown`, throw a clear error — do not attempt to build blindly.

---

## 2. Folder Naming Convention

Every deployment gets a UUID folder inside the S3 bucket. This isolates deployments from each other and allows multiple projects to coexist in the same bucket.

```
bucket-name/
├── 6230a142-be9c-4078-9a24-23644e785993/   ← project A deployment
│   ├── index.html
│   └── static/
├── 91fa4c20-d3e1-4b77-bc12-7a9f3dc81004/   ← project B deployment
│   ├── index.html
│   └── _next/
```

**Rules:**
- Always use `uuid v4` for folder names — never project name, user name, or timestamp
- Never nest UUID folders inside each other
- One UUID folder = one deployment
- On redeploy of same project, **delete all objects in existing UUID folder first**, then upload fresh build

```js
import { v4 as uuidv4 } from 'uuid';

const deploymentId = existingDeployment?.id || uuidv4();
```

---

## 3. CRA — Create React App

### 3.1 Config Patch (`package.json`)

This is the most critical step. Must happen **before** `npm run build`.

```js
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Fix 1: Always force homepage to "." — covers no homepage, GitHub Pages URL, full domain
pkg.homepage = '.';

// Fix 2: Upgrade ancient react-scripts (fails on Node 18+)
const version = pkg.dependencies?.['react-scripts'] || '';
if (version && parseInt(version) < 5) {
  pkg.dependencies['react-scripts'] = '5.0.1';
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
```

### 3.2 Build

```js
execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
```

### 3.3 Output Folder

```
build/              ← upload everything inside here
├── static/
│   ├── css/
│   └── js/
├── index.html
├── asset-manifest.json
├── favicon.ico
├── manifest.json
├── robots.txt
└── logo192.png     ← don't forget public/ assets
```

### 3.4 Verification

```js
const buildDir = path.join(projectDir, 'build');

if (!fs.existsSync(buildDir))
  throw new Error('build/ not found — build failed');

if (!fs.existsSync(path.join(buildDir, 'index.html')))
  throw new Error('index.html missing in build/');

const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
if (html.includes('src="/static') || html.includes('href="/static'))
  throw new Error('Absolute paths detected — homepage patch failed');
```

### 3.5 CRA Edge Cases

| # | Case | Symptom | Fix |
|---|---|---|---|
| 1 | No `homepage` set | 403 on JS/CSS | Set `homepage: "."` |
| 2 | `homepage` = GitHub Pages URL | 403 on JS/CSS | Override to `"."` |
| 3 | `homepage` = full domain | Breaks on UUID subfolder | Override to `"."` |
| 4 | `react-scripts` v1.x/v2.x | Build fails Node 18+ | Upgrade to `5.0.1` |
| 5 | `node_modules` missing | Build fails | Run `npm install` |
| 6 | No `build` script in package.json | Build fails | Throw clear error |
| 7 | `build/` folder missing after build | Upload fails silently | Verify folder exists |
| 8 | `index.html` missing in build | Site 404 | Verify file exists |
| 9 | `static/` folder missing | JS/CSS 404 | Verify folder exists |
| 10 | Absolute paths in `index.html` | 403 on JS/CSS | Verify patch worked |
| 11 | Old files in S3 UUID folder | Old broken site served | Delete before upload |
| 12 | Only root files uploaded, `public/` missed | Images/fonts 404 | Upload all files recursively |
| 13 | Wrong ContentType on upload | Browser downloads file | Set correct MIME type |

---

## 4. Vite

### 4.1 Config Patch (`vite.config.js` / `vite.config.ts`)

```js
const configPath = fs.existsSync('vite.config.ts') ? 'vite.config.ts' : 'vite.config.js';
let config = fs.readFileSync(configPath, 'utf8');

// Inject base: './' if missing
if (!config.includes("base:") && !config.includes('base :')) {
  config = config.replace(
    'defineConfig({',
    "defineConfig({\n  base: './',"
  );
  fs.writeFileSync(configPath, config);
}
```

### 4.2 Build

```js
execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
```

### 4.3 Output Folder

```
dist/               ← upload everything inside here
├── assets/
│   ├── index-abc123.js
│   └── index-abc123.css
└── index.html
```

### 4.4 Verification

```js
const distDir = path.join(projectDir, 'dist');

if (!fs.existsSync(distDir))
  throw new Error('dist/ not found — build failed');

if (!fs.existsSync(path.join(distDir, 'index.html')))
  throw new Error('index.html missing in dist/');

const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
if (html.includes('src="/assets') || html.includes('href="/assets'))
  throw new Error('Absolute paths detected — base patch failed');
```

### 4.5 Vite Edge Cases

| # | Case | Symptom | Fix |
|---|---|---|---|
| 1 | `base` not set | 403 on JS/CSS | Set `base: './'` in vite.config.js |
| 2 | Custom `outDir` in config | Worker uploads wrong folder | Read `build.outDir` from vite config, default to `dist` |
| 3 | TypeScript config file | Patch targets wrong file | Check for both `.js` and `.ts` config files |
| 4 | Multiple config files | Wrong config patched | Prioritise `vite.config.ts` over `vite.config.js` |
| 5 | `dist/` folder missing | Upload fails | Verify folder exists after build |

---

## 5. Next.js

### 5.1 Critical Difference

Next.js is a **server-side framework by default**. Without the static export config, `npm run build` creates `.next/` (a Node.js server build) — this **cannot be served on S3**. The worker must force static export mode which outputs `out/`.

```
.next/   ← server build, Node.js needed       ❌ cannot serve on S3
out/     ← static export, plain HTML/JS/CSS   ✅ can serve on S3
```

### 5.2 Config Patch (`next.config.js`)

```js
const configPath = path.join(projectDir, 'next.config.js');

if (!fs.existsSync(configPath)) {
  // Create config from scratch
  fs.writeFileSync(configPath, `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
module.exports = nextConfig;
  `);
} else {
  let config = fs.readFileSync(configPath, 'utf8');

  // Patch output if missing
  if (!config.includes("output: 'export'") && !config.includes('output: "export"')) {
    config = config.replace(
      /const nextConfig\s*=\s*\{/,
      "const nextConfig = {\n  output: 'export',\n  trailingSlash: true,\n  images: { unoptimized: true },"
    );
    fs.writeFileSync(configPath, config);
  }
}
```

**Why each option is needed:**

| Option | Why Required |
|---|---|
| `output: 'export'` | Tells Next.js to generate static HTML files into `out/` |
| `trailingSlash: true` | Creates `/about/index.html` instead of `/about.html` — needed for S3 subfolder routing |
| `images: { unoptimized: true }` | S3 cannot run Next.js image optimizer — this disables it |

### 5.3 Build

```js
execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
```

> **Next.js version < 13 only:** Also run `npx next export` after build.

```js
const nextVersion = parseInt(pkg.dependencies?.['next'] || '0');
if (nextVersion < 13) {
  execSync('npx next export', { cwd: projectDir, stdio: 'inherit' });
}
```

### 5.4 Output Folder

```
out/                ← upload everything inside here
├── _next/
│   └── static/     ← JS/CSS chunks
├── index.html      ← home page
├── about/
│   └── index.html  ← /about route (trailingSlash creates real files)
├── product/
│   └── index.html  ← /product route
├── 404.html
└── favicon.ico
```

### 5.5 Verification

```js
const outDir = path.join(projectDir, 'out');

if (!fs.existsSync(outDir))
  throw new Error('out/ not found — ensure output: "export" is in next.config.js');

if (!fs.existsSync(path.join(outDir, 'index.html')))
  throw new Error('index.html missing in out/');
```

### 5.6 Next.js Edge Cases

| # | Case | Symptom | Fix |
|---|---|---|---|
| 1 | `output: 'export'` missing | `.next/` created, no `out/` | Add `output: 'export'` to next.config.js |
| 2 | `next.config.js` missing | Server build, no static output | Create config file from scratch |
| 3 | `images.unoptimized` not set | Build fails with image error | Add `images: { unoptimized: true }` |
| 4 | `trailingSlash` missing | Route refresh gives 404 | Add `trailingSlash: true` |
| 5 | App uses API routes `/api/*` | API calls fail on S3 | Warn user — S3 cannot run API routes |
| 6 | App uses `getServerSideProps` | Build fails on those pages | Cannot export SSR pages — warn user |
| 7 | Next.js version < 13 | `out/` not created | Run `npx next export` after build |
| 8 | Dynamic routes without `generateStaticParams` | Dynamic pages 404 on S3 | Warn user — only pre-generated slugs work |
| 9 | `out/` missing after build | Upload fails | Check and throw clear error |
| 10 | `_next/` paths are absolute | 403 on JS/CSS | Add `assetPrefix: './'` to next.config.js |

---

## 6. Upload Strategy

### 6.1 Always Delete Old Files First

```js
// Get all existing objects in UUID folder
const existing = await s3.send(new ListObjectsV2Command({
  Bucket: BUCKET_NAME,
  Prefix: `${deploymentId}/`
}));

// Delete them all
if (existing.Contents?.length > 0) {
  await s3.send(new DeleteObjectsCommand({
    Bucket: BUCKET_NAME,
    Delete: {
      Objects: existing.Contents.map(obj => ({ Key: obj.Key }))
    }
  }));
}
```

### 6.2 Upload All Files Recursively

```js
function getAllFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? getAllFiles(full, base) : [full];
  });
}

const buildDir = getBuildDir(framework, projectDir);
// CRA → 'build/', Vite → 'dist/', Next.js → 'out/'

const files = getAllFiles(buildDir);

for (const file of files) {
  const key = `${deploymentId}/${path.relative(buildDir, file).replace(/\\/g, '/')}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fs.readFileSync(file),
    ContentType: getContentType(file),
    // For HTML files, disable caching so refreshes get latest
    CacheControl: file.endsWith('.html') ? 'no-cache' : 'max-age=31536000',
  }));
}
```

### 6.3 ContentType Map

```js
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html':  'text/html',
    '.js':    'application/javascript',
    '.mjs':   'application/javascript',
    '.css':   'text/css',
    '.json':  'application/json',
    '.png':   'image/png',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.gif':   'image/gif',
    '.svg':   'image/svg+xml',
    '.ico':   'image/x-icon',
    '.webp':  'image/webp',
    '.txt':   'text/plain',
    '.xml':   'application/xml',
    '.woff':  'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':   'font/ttf',
    '.eot':   'application/vnd.ms-fontobject',
    '.map':   'application/json',
  }[ext] || 'application/octet-stream';
}
```

---

## 7. S3 Bucket Configuration

### 7.1 Block Public Access — Must be OFF

All four block public access settings must be unchecked for static website hosting.

### 7.2 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### 7.3 Static Website Hosting

Must be enabled with error document set to `index.html` — this is what makes client-side routing work.

```js
await s3.send(new PutBucketWebsiteCommand({
  Bucket: BUCKET_NAME,
  WebsiteConfiguration: {
    IndexDocument: { Suffix: 'index.html' },
    ErrorDocument: { Key: 'index.html' }  // handles all SPA routing
  }
}));
```

---

## 8. Routing Support

### 8.1 How Routing Works Per Framework

| Framework | Routing Type | How S3 Serves It |
|---|---|---|
| CRA + React Router | Client-side only | Error doc fallback → `index.html` → React Router handles |
| Vite + React Router | Client-side only | Same as CRA |
| Vite + Vue Router | Client-side only | Same as CRA |
| Next.js static export | File-based | Real HTML file per route in `out/` + error doc as fallback |

### 8.2 URL to Use

Always return the **S3 website endpoint URL** — not the raw object URL. Raw object URL does not support routing fallback.

```
✅ Website endpoint (routing works):
http://BUCKET.s3-website.REGION.amazonaws.com/UUID/

❌ Raw S3 object URL (routing breaks on refresh):
https://BUCKET.s3.amazonaws.com/UUID/index.html
```

### 8.3 Next.js Dynamic Routes Warning

With `output: 'export'`, only routes pre-generated at build time get HTML files. Unknown dynamic routes 404 on S3 because no file exists for them.

```
✅ /blog/post-1        → pre-generated with generateStaticParams
❌ /blog/unknown-post  → no HTML file, S3 returns 404
```

If dynamic routes are detected without `generateStaticParams`, warn the user in the deployment response.

---

## 9. Worker Build Output Map

| Framework | Config to Patch | Build Command | Output Folder | Key Check |
|---|---|---|---|---|
| CRA | `package.json` → `homepage: "."` | `npm run build` | `build/` | `index.html` has `./static/` |
| Vite | `vite.config.js` → `base: './'` | `npm run build` | `dist/` | `index.html` has `./assets/` |
| Next.js | `next.config.js` → `output: 'export'` + `trailingSlash` + `images.unoptimized` | `npm run build` | `out/` | `out/` exists, not `.next/` only |

---

## 10. Complete Worker Checklist

```
PRE-BUILD
✅ Read package.json and detect framework
✅ Throw clear error if framework is unknown
✅ Check Node.js version compatibility
✅ Patch config before every build (never skip even if already set)

CRA
✅ Set homepage: "." in package.json
✅ Upgrade react-scripts to 5.0.1 if version < 5

VITE
✅ Set base: './' in vite.config.js or vite.config.ts

NEXT.JS
✅ Create or patch next.config.js with output:'export', trailingSlash:true, images:{unoptimized:true}
✅ Detect version < 13 and run npx next export after build

BUILD
✅ Run npm install
✅ Verify build script exists in package.json
✅ Run npm run build
✅ Verify output folder exists after build
✅ Verify index.html exists in output folder
✅ Verify asset paths are relative (not absolute) in index.html

UPLOAD
✅ Delete all old objects in UUID folder before uploading
✅ Upload ALL files recursively (not just root files)
✅ Set correct ContentType for every file
✅ Set CacheControl: no-cache for HTML, long cache for assets

S3 CONFIG (one-time setup)
✅ Block public access OFF
✅ Bucket policy allows s3:GetObject for /*
✅ Static website hosting enabled
✅ Index document: index.html
✅ Error document: index.html (critical for SPA routing)

RESPONSE
✅ Return S3 website endpoint URL (not raw object URL)
✅ Warn user if API routes detected (Next.js)
✅ Warn user if SSR pages (getServerSideProps) detected
✅ Warn user if dynamic routes lack generateStaticParams
```

---

*Last updated: April 2026*
