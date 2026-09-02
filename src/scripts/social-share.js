export const SHARE_ICONS = {
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.53 3h2.94l-6.42 7.34L21.6 21h-5.9l-4.63-6.05L5.77 21H2.83l6.87-7.85L2.4 3h6.05l4.18 5.53L17.53 3Zm-1.03 16.2h1.63L7.6 4.7H5.85L16.5 19.2Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8.2h2.76l.41-3.2H13.5V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.13c-.3-.04-1.3-.13-2.47-.13-2.45 0-4.12 1.5-4.12 4.24v2.36H7.43v3.2h2.76V21h3.31Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.94 8.58H3.86V21h3.08V8.58ZM5.4 3a1.79 1.79 0 1 0 0 3.58A1.79 1.79 0 0 0 5.4 3Zm5.34 5.58H7.8V21h3.06v-6.55c0-1.73.33-3.4 2.47-3.4 2.11 0 2.14 1.97 2.14 3.51V21h3.07v-6.7c0-2.66-.57-4.9-3.68-4.9-1.5 0-2.5.82-2.91 1.6h-.04V8.58Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.64L3 21l4.5-1.18A9 9 0 1 0 12 3Zm0 1.8a7.2 7.2 0 0 1 5.09 12.29A7.2 7.2 0 0 1 7.98 18.4l-.32-.19-2.67.7.71-2.6-.2-.33A7.2 7.2 0 0 1 12 4.8Zm-2.83 3.5c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72 0 1.01.74 1.99.84 2.13.1.14 1.43 2.28 3.54 3.1 1.75.68 2.11.55 2.49.51.38-.03 1.23-.5 1.4-.98.18-.49.18-.9.12-.99-.05-.09-.19-.14-.4-.24-.21-.11-1.23-.6-1.42-.67-.19-.07-.33-.1-.47.1-.14.21-.54.67-.66.81-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.24-1.16-1.45-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.36.1-.12.14-.2.21-.34.07-.14.03-.26-.02-.36-.05-.1-.46-1.13-.64-1.55-.17-.4-.34-.35-.47-.36h-.4Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4.62c2.4 0 2.69.01 3.64.05.88.04 1.35.19 1.67.31.42.16.72.36 1.03.67.31.31.51.61.67 1.03.12.32.27.79.31 1.67.04.95.05 1.24.05 3.64s-.01 2.69-.05 3.64c-.04.88-.19 1.35-.31 1.67-.16.42-.36.72-.67 1.03-.31.31-.61.51-1.03.67-.32.12-.79.27-1.67.31-.95.04-1.24.05-3.64.05s-2.69-.01-3.64-.05c-.88-.04-1.35-.19-1.67-.31a2.78 2.78 0 0 1-1.03-.67 2.78 2.78 0 0 1-.67-1.03c-.12-.32-.27-.79-.31-1.67-.04-.95-.05-1.24-.05-3.64s.01-2.69.05-3.64c.04-.88.19-1.35.31-1.67.16-.42.36-.72.67-1.03.31-.31.61-.51 1.03-.67.32-.12.79-.27 1.67-.31.95-.04 1.24-.05 3.64-.05Zm0 3.16A4.22 4.22 0 1 0 12 16.22 4.22 4.22 0 0 0 12 7.78Zm0 6.96A2.74 2.74 0 1 1 12 9.26a2.74 2.74 0 0 1 0 5.48Zm4.38-7.13a.99.99 0 1 1-1.97 0 .99.99 0 0 1 1.97 0Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

/**
 * Copies the canvas image to the system clipboard.
 */
export async function copyCanvasImageToClipboard(canvas) {
  try {
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      return false;
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;

    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers browser download of the canvas as a PNG file.
 */
export async function downloadCanvasImage(canvas, filename) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return true;
}

/**
 * Returns pre-configured social share URLs for the event.
 */
export function getShareNetworks(config) {
  const url = config.website;
  const text = config.shareMessage ?? `I’m part of ${config.title}.`;
  const encUrl = encodeURIComponent(url);
  const encText = encodeURIComponent(text);
  const encTextUrl = encodeURIComponent(`${text} ${url}`);
  const tags = (config.hashtags ?? []).join(',');

  return [
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}${tags ? `&hashtags=${encodeURIComponent(tags)}` : ''}` },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}` },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}` },
    { id: 'whatsapp', label: 'WhatsApp', href: `https://api.whatsapp.com/send?text=${encTextUrl}` }
  ];
}
