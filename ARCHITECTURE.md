# Frame Studio Architecture & Technical Reference

This document outlines the codebase structure, modules, data models, and rendering pipeline for the WP Kerala Frame Studio.

---

## 1. Directory Structure

```text
wckerala-frames/
├── src/
│   ├── components/
│   │   └── FrameStudio.astro        # Generator UI with step cards & live preview
│   ├── data/
│   │   └── events.js                # Central event catalog & frame coordinate configs
│   ├── layouts/
│   │   └── Layout.astro             # Global HTML shell, header, footer, metadata
│   ├── pages/
│   │   ├── index.astro              # Active event landing page
│   │   └── events/
│   │       ├── index.astro          # Event catalog & archive listing
│   │       └── [slug].astro         # Dynamic static route per event
│   ├── scripts/
│   │   ├── frame-studio.js          # Interactive controller (state, DOM events, UI)
│   │   ├── canvas-renderer.js       # Pure canvas rendering, font loading & math
│   │   ├── social-share.js          # Clipboard API, Web Share, PNG download & URLs
│   │   └── crypto.js                # SHA-256 and MD5 hashing for Gravatar resolution
│   └── styles/
│       └── global.css               # Design system, layout, typography & responsiveness
└── public/                          # Static assets (brand icons, frame PNGs, logos)
```

---

## 2. Core Modules

### `src/scripts/frame-studio.js`
The main client-side entry point. Responsible for:
- Initializing the studio DOM state from the embedded JSON configuration.
- Handling drag-and-drop / file upload validation (max 10MB, image MIME check).
- Debouncing profile text input and Gravatar email lookups.
- Managing interactive crop coordinates (zoom, horizontal/vertical pan).
- Triggering responsive accordion cards on mobile viewports.

### `src/scripts/canvas-renderer.js`
Pure canvas drawing and layout utilities:
- `drawRoundedPath(ctx, x, y, width, height, radius)`: Constructs rounded rectangular clipping paths.
- `drawFittedImage(ctx, image, area, mode, crop)`: Computes scale, zoom, and pan translations for photos within the frame aperture.
- `renderMultilineText(ctx, text, options)`: Handles word-wrapping, font measurement, and multiline text rendering.
- `ensureFonts(fontSpecs, timeoutMs)`: Awaits font loading via CSS Font Loading API (`document.fonts.load`).
- `renderFrameComposite(ctx, config, frame, sourceImage, frameImage, isCustomPhoto, crop, profile)`: Orchestrates the multi-layered composite render.

### `src/scripts/social-share.js`
Sharing and export actions:
- `copyCanvasImageToClipboard(canvas)`: Copies the canvas PNG blob using the Clipboard API (`ClipboardItem`).
- `downloadCanvasImage(canvas, filename)`: Triggers local browser PNG file download.
- `getShareNetworks(config)`: Builds social intent URLs with encoded parameters for X, Facebook, LinkedIn, WhatsApp, and Instagram.

### `src/scripts/crypto.js`
Avatar resolution helpers:
- `sha256Hex(text)`: Asynchronous SHA-256 hex digest using native `crypto.subtle`.
- `md5Hex(string)`: MD5 implementation for legacy Gravatar hash fallback.

---

## 3. Data Models (`src/data/events.js`)

### `EventConfig`
| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | Unique identifier for URLs and route generation. |
| `status` | `'active' \| 'archived'` | Event state. |
| `title` | `string` | Full official event title. |
| `shortTitle` | `string` | Short title for navigation/headers. |
| `dateLabel` | `string` | Formatted event date string. |
| `venue` | `string` | Event location and auditorium name. |
| `description` | `string` | Meta description text. |
| `heroTitle` | `string` | Studio hero banner headline. |
| `website` | `string` | Official event URL. |
| `logo` | `string` | Path to event logo PNG. |
| `canvas` | `{ width: number, height: number }` | Native canvas dimensions (e.g. 1080×1080). |
| `placeholder` | `string` | Default artwork placeholder URL. |
| `composition` | `EventComposition` | Composition mode and typography configuration. |
| `downloadPrefix` | `string` | File prefix for exported PNG images. |
| `shareMessage` | `string` | Default social share text template. |
| `hashtags` | `string[]` | Social hashtags. |
| `frames` | `FrameItem[]` | Array of frame options. |

### `FrameItem`
| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Frame identifier (e.g., `'attending'`, `'speaking'`). |
| `label` | `string` | Button display label. |
| `caption` | `string` | Share description (e.g., `"I'm attending"`). |
| `src` | `string` | Path to frame PNG asset. |
| `photoArea` | `PhotoArea` | Aperture window `{ x, y, width, height, radius }`. |
