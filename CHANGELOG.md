# Changelog

All notable changes to this project are documented here.

## [3.2.0]

### Added
- Dark theme support with automatic device preference detection (`prefers-color-scheme`), real-time OS theme change listener, persistent `localStorage` toggle, and dynamic `<meta name="theme-color">` sync.
- High-contrast official dark mode logos (`logo-dark.png`) for WP Future Conclave 2026 and WordCamp Kerala 2024.
- Header toolbar layout featuring active event logo, vertical separator divider, and theme toggle button.
- Responsive mobile header event icon: automatically switches to the compact square site icon on mobile screens.
- Self-hosted variable `.woff2` font files (`dm-sans.woff2`, `space-grotesk.woff2`) in `/public/assets/fonts/` with font preloading.
- Dedicated architecture and schema reference documentation in `ARCHITECTURE.md`.

### Changed
- Refactored JavaScript into focused modules: `canvas-renderer.js`, `social-share.js`, `crypto.js`, and `frame-studio.js`.
- Cleaned codebase comments: removed redundant inline commentary in function bodies while keeping essential 1-line docblocks for top-level exports.
- Quantized and optimized brand and logo image assets with FastOctree compression, reducing payload by up to 97%.
- Improved WCAG AA/AAA color contrast ratios across dark and light themes for all badges, text elements, and progress steps.

### Fixed
- Fixed potential `ObjectURL` leak in file handling by ensuring revoked object URLs in `catch` blocks.
- Fixed malformed Moon SVG arc path that caused browser console rendering warnings.
- Fixed accessible form labeling on hidden file upload input and resolved accessible link name mismatch.
- Eliminated external render-blocking font requests to Google Fonts servers.

## [3.1.0]

### Added
- WP Kerala branding across the site (name, header logo, favicons, PWA manifest, and social meta) generated from the shared WP Kerala site icon.
- Optional name and company drawn on WP Future Conclave 2026 frames, positioned below the photo via a per-event `composition.text` config.
- "Copy image" action that copies the framed PNG to the clipboard for pasting into any composer.
- Desktop social share fallback with icon buttons for Instagram, X, Facebook, LinkedIn, and WhatsApp, including a ready-made message and event link.
- Per-event `shareMessage` and `hashtags` configuration.
- Collapsible, numbered step cards on all screen sizes with a +/- toggle.
- Live re-render while typing name and company.

### Changed
- Gravatar lookups now use SHA-256 (Gravatar's current standard) with an MD5 fallback, and request from `gravatar.com`.
- Default preview now shows the current event logo, fit inside the photo aperture, until a photo is added.
- Header shows the event logo only (no text label) and links to the event site; the top navigation was removed in favour of the footer archive link.
- Event URLs corrected: WP Future Conclave 2026 points to its wordpress.org event page; WordCamp Kerala 2024 points to its WordCamp site.
- Mobile step order refined, with the crop card placed last (just above the preview) and matching the desktop order.

### Fixed
- Stuck "Rendering…" overlay caused by a CSS `display` rule overriding the `hidden` attribute.
- First render could hang waiting on web fonts; text layouts now race font loading against a short timeout and non-text layouts skip it.
- "Copy event link" copied the current page URL instead of the actual event URL.
- Uneven social icons: rebuilt on a shared viewBox with consistent sizing.

## [3.0.0]

### Changed
- Rebuilt the single-page generator as a static Astro site.
- Introduced an event-driven architecture with a shared event catalog and per-event asset namespaces.
- Added WP Future Conclave 2026 as the default active event.
- Added an events archive with active and past collections at `/events/`.
- Preserved WordCamp Kerala 2024 as an archived event using the legacy photo-and-text layout.
- Added a GitHub Actions workflow to build and deploy to GitHub Pages.

## [2.x]

- Original single-page WordCamp Kerala 2024 poster generator (HTML, SCSS, and vanilla JavaScript).
