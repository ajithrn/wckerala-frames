# WP Kerala Frame Studio

![Version](https://img.shields.io/badge/version-3.2.0-15b9a7)
![Built with Astro](https://img.shields.io/badge/built%20with-Astro-0d1f2d)
![License: MIT](https://img.shields.io/badge/license-MIT-0a66c2)

A static, browser-based frame generator for events organised by the WordPress community in Kerala. Visitors add a photo, pick a role frame, and download or share a personalised graphic. The current event is **WP Future Conclave 2026**; earlier collections stay available through the archive.

Live site: [frames.wpkerala.org](https://frames.wpkerala.org/)

All image compositing runs on the Canvas API in the visitor's browser. Photos are never uploaded to a server.

## Features

- **Event-driven** — one codebase serves every event from a single catalog, with per-event artwork, layout, and copy.
- **Two layouts** — an `aperture` mode for overlay frames with a transparent photo window, and a `legacy` mode for the 2024 photo-and-text design.
- **Guided workflow** — collapsible, numbered step cards for photo, details, frame, and crop, with a live preview.
- **Flexible input** — upload or drag-and-drop an image, or opt in to Gravatar (SHA-256 with an MD5 fallback).
- **On-frame text** — optional name and company, positioned per event.
- **Export and share** — download a PNG, copy the frame to the clipboard, share via the native sheet on mobile, or use desktop buttons for Instagram, X, Facebook, LinkedIn, and WhatsApp.
- **Static output** — pre-rendered archive and per-event pages, deployable to GitHub Pages with no server.

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check `.astro` files |

## Project structure

```text
wckerala-frames/
├── src/
│   ├── components/   FrameStudio.astro — generator UI
│   ├── data/         events.js — event catalog & frame config
│   ├── layouts/      Layout.astro — shell, header, footer, meta
│   ├── pages/        index + events archive + per-event routes
│   ├── scripts/      frame-studio.js — compositor & share logic
│   └── styles/       global.css — UI and responsive layout
├── public/
│   ├── assets/brand/    shared WP Kerala logo, favicons, app icons
│   ├── assets/events/   per-event logos and frame artwork
│   ├── assets/images/   shared fallback assets
│   ├── favicon.ico      multi-resolution favicon
│   ├── site.webmanifest PWA manifest
│   └── CNAME            custom GitHub Pages domain
└── .github/workflows/   deploy.yml — build & deploy to Pages
```

### Routes

| Path | Page |
| --- | --- |
| `/` | Current event generator |
| `/events/` | Archive of active and past events |
| `/events/wpfc26/` | WP Future Conclave 2026 |
| `/events/wordcamp-kerala-2024/` | WordCamp Kerala 2024 (archived) |

The archive is statically generated, so it needs no server or client-side router.

## Adding an event

1. Place the event's artwork under `public/assets/events/<slug>/`.
2. Add an entry to `src/data/events.js` and set `status` to `active` or `archived`.
3. Add one frame object per artwork file.
4. Choose a compositing mode:
   - `aperture` — for overlay frames; define each frame's transparent photo window (`photoArea`) in canvas coordinates.
   - `legacy` — for the 2024 photo-and-text layout only.
5. To draw a name and company, set `composition.showProfileFields: true` and tune the `composition.text` block.
6. Set `website`, `shareMessage`, and `hashtags` for sharing.
7. Run `npm run build`, then review the archive and the event page.

Frame configuration (aperture mode):

```js
{
  id: 'attending',
  label: 'Attending',
  caption: "I'm attending",
  src: '/assets/events/my-event/frames/attending.png',
  photoArea: { x: 610, y: 253, width: 307, height: 310, radius: 42 }
}
```

`photoArea` is the transparent window in the overlay, measured against the artwork's native canvas size. The frame is drawn on top of the photo, so its border and design stay visible. Optional on-frame text is configured per event:

```js
composition: {
  mode: 'aperture',
  showProfileFields: true,
  text: { startY: 600, maxWidth: 470, nameFont: '700 42px "DM Sans"' }
}
```

## Privacy and sharing

Uploaded photos are read via a local object URL and composited with the Canvas API; they never leave the device. Gravatar is opt-in and requested only after an email is entered, using a client-side, lowercased SHA-256 hash.

Sharing adapts to the platform:

- **Mobile / supported browsers** — the native share sheet sends the actual PNG with a ready-made message and event link.
- **Desktop** — social share links cannot carry a local file, so each button copies the frame to the clipboard (paste it into the post) and opens the network with the event link and message. A standalone "Copy image" action and a PNG download are always available.

## Deployment

The site deploys to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The custom domain is defined in `public/CNAME` and mirrored by `site` in `astro.config.mjs`.

## License

Released under the [MIT License](./LICENSE). Event logos and frame artwork remain subject to their respective event and community usage terms.

---

<p>
  <a href="./CHANGELOG.md">Changelog</a> ·
  <a href="./LICENSE">License</a> ·
  <a href="https://frames.wpkerala.org/">Live site</a>
</p>
