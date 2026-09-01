const root = document.querySelector('[data-frame-studio]');

if (root) {
  initFrameStudio(root);
}

async function initFrameStudio(root) {
  const configElement = document.getElementById(root.dataset.configId);
  if (!configElement) return;

  const config = JSON.parse(configElement.textContent);
  const canvas = root.querySelector('#resultCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const elements = {
    uploadTrigger: root.querySelector('#uploadTrigger'),
    uploadInput: root.querySelector('#uploadImage'),
    uploadFileRow: root.querySelector('#uploadFileRow'),
    uploadFileName: root.querySelector('#uploadFileName'),
    clearImage: root.querySelector('#clearImage'),
    email: root.querySelector('#email'),
    userName: root.querySelector('#userName'),
    companyName: root.querySelector('#companyName'),
    zoom: root.querySelector('#zoomControl'),
    horizontal: root.querySelector('#horizontalControl'),
    vertical: root.querySelector('#verticalControl'),
    zoomValue: root.querySelector('#zoomValue'),
    horizontalValue: root.querySelector('#horizontalValue'),
    verticalValue: root.querySelector('#verticalValue'),
    resetCrop: root.querySelector('#resetCrop'),
    frames: [...root.querySelectorAll('[data-frame-id]')],
    loading: root.querySelector('#canvasLoading'),
    imageStatus: root.querySelector('#imageStatus'),
    renderStatus: root.querySelector('#renderStatus'),
    previewHint: root.querySelector('#previewHint'),
    download: root.querySelector('#downloadBtn'),
    share: root.querySelector('#shareBtn'),
    fallback: root.querySelector('#fallbackShare'),
    shareLinks: root.querySelector('#shareLinks'),
    copyImage: root.querySelector('#copyImage'),
    copyLink: root.querySelector('#copyLink')
  };

  const state = {
    image: null,
    imageObjectUrl: null,
    imageName: '',
    frame: config.frames[0],
    frameImage: null,
    frameCache: new Map(),
    renderVersion: 0,
    hasRendered: false,
    fontsReady: false,
    crop: { zoom: 1, x: 0, y: 0 }
  };

  canvas.width = config.canvas.width;
  canvas.height = config.canvas.height;
  elements.download.disabled = true;
  elements.share.disabled = true;

  function setStatus(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', isError);
  }

  function setLoading(isLoading) {
    if (elements.loading) elements.loading.hidden = !isLoading;
  }

  function loadImage(src, crossOrigin = false) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (crossOrigin) image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image: ${src}`));
      image.src = src;
      if (image.complete && image.naturalWidth > 0) resolve(image);
    });
  }

  async function ensureFonts() {
    if (state.fontsReady) return;
    try {
      if (document.fonts?.load) {
        await Promise.race([
          Promise.all([
            document.fonts.load('700 48px "DM Sans"'),
            document.fonts.load('400 30px "DM Sans"')
          ]),
          new Promise((resolve) => setTimeout(resolve, 1200))
        ]);
      }
    } catch { }
    state.fontsReady = true;
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius || 0, width / 2, height / 2);
    if (r === 0) {
      context.rect(x, y, width, height);
      return;
    }
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawImageInArea(image, area, mode = 'cover') {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const fit = mode === 'contain'
      ? Math.min(area.width / imageWidth, area.height / imageHeight)
      : Math.max(area.width / imageWidth, area.height / imageHeight);
    const scale = fit * (mode === 'contain' ? 0.82 : state.crop.zoom);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const allowOffset = mode !== 'contain';
    const maxOffsetX = allowOffset ? Math.max(0, (drawWidth - area.width) / 2) : 0;
    const maxOffsetY = allowOffset ? Math.max(0, (drawHeight - area.height) / 2) : 0;
    const drawX = area.x + (area.width - drawWidth) / 2 + state.crop.x * maxOffsetX;
    const drawY = area.y + (area.height - drawHeight) / 2 + state.crop.y * maxOffsetY;

    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, area.x, area.y, area.width, area.height, area.radius || 0);
    ctx.clip();
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  function renderText(text, { centerX, y, font, color = '#000000', maxWidth, lineHeight }) {
    if (!text?.trim()) return y;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const words = text.trim().split(/\s+/);
    let line = '';
    let lineY = y;

    words.forEach((word, index) => {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && index > 0) {
        ctx.fillText(line, centerX, lineY);
        line = word;
        lineY += lineHeight;
      } else {
        line = candidate;
      }
    });
    ctx.fillText(line, centerX, lineY);
    return lineY + lineHeight;
  }

  function drawComposite(image, frameImage) {
    const { width, height } = config.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    const fitMode = state.image ? 'cover' : 'contain';

    if (config.composition.mode === 'aperture') {
      const area = state.frame.photoArea;
      drawImageInArea(image, area, fitMode);
      ctx.drawImage(frameImage, 0, 0, width, height);

      if (config.composition.showProfileFields) {
        const text = config.composition.text ?? {};
        const centerX = area.x + area.width / 2;
        const startY = text.startY ?? area.y + area.height + (text.gap ?? 28);
        const maxWidth = text.maxWidth ?? Math.max(area.width + 120, 360);
        let cursorY = renderText(elements.userName?.value ?? '', {
          centerX,
          y: startY,
          font: text.nameFont ?? '700 40px "DM Sans"',
          color: text.color ?? '#0d1f2d',
          maxWidth,
          lineHeight: text.nameLineHeight ?? 46
        });
        renderText(elements.companyName?.value ?? '', {
          centerX,
          y: cursorY + (text.companyGap ?? 4),
          font: text.companyFont ?? '500 26px "DM Sans"',
          color: text.companyColor ?? '#50616b',
          maxWidth,
          lineHeight: text.companyLineHeight ?? 32
        });
      }
    } else {
      const area = config.composition.photoArea;
      drawImageInArea(image, area, fitMode);
      ctx.drawImage(frameImage, 0, 0, width, height);
      const centerX = area.x + area.width / 2;
      const maxWidth = area.width;
      renderText(elements.userName?.value ?? '', {
        centerX, y: config.composition.nameY, font: '700 48px "DM Sans"', maxWidth, lineHeight: 54
      });
      renderText(elements.companyName?.value ?? '', {
        centerX, y: config.composition.companyY, font: '400 30px "DM Sans"', maxWidth, lineHeight: 38
      });
    }
  }

  async function getFrameImage(frame) {
    if (state.frameCache.has(frame.id)) return state.frameCache.get(frame.id);
    const image = await loadImage(frame.src);
    state.frameCache.set(frame.id, image);
    return image;
  }

  async function getSourceImage() {
    if (state.image) return state.image;
    try {
      const placeholder = await loadImage(config.placeholder);
      return placeholder;
    } catch {
      return null;
    }
  }

  async function render() {
    const renderVersion = ++state.renderVersion;
    setLoading(true);
    setStatus(elements.renderStatus, 'Rendering your frame…');
    try {
      if (config.composition.mode === 'legacy' || config.composition.showProfileFields) await ensureFonts();
      const [image, frameImage] = await Promise.all([getSourceImage(), getFrameImage(state.frame)]);
      if (renderVersion !== state.renderVersion) return;
      if (!image) throw new Error('No drawable source image is available.');
      state.frameImage = frameImage;
      drawComposite(image, frameImage);
      state.hasRendered = true;
      elements.download.disabled = false;
      elements.share.disabled = false;
      setStatus(elements.renderStatus, 'Ready to download and share.');
      if (elements.previewHint) elements.previewHint.textContent = `${state.frame.label} · ${config.canvas.width} × ${config.canvas.height}px PNG`;
    } catch (error) {
      console.error(error);
      if (renderVersion !== state.renderVersion) return;
      state.hasRendered = false;
      elements.download.disabled = true;
      elements.share.disabled = true;
      setStatus(elements.renderStatus, 'We could not render this frame. Please try again.', true);
    } finally {
      if (renderVersion === state.renderVersion) setLoading(false);
    }
  }

  function selectFrame(frameId) {
    const frame = config.frames.find((item) => item.id === frameId);
    if (!frame) return;
    state.frame = frame;
    elements.frames.forEach((button) => {
      const selected = button.dataset.frameId === frameId;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
  }

  function resetCrop() {
    state.crop = { zoom: 1, x: 0, y: 0 };
    elements.zoom.value = '1';
    elements.horizontal.value = '0';
    elements.vertical.value = '0';
    updateCropLabels();
    render();
  }

  function updateCropLabels() {
    if (elements.zoomValue) elements.zoomValue.value = `${Number(elements.zoom.value).toFixed(2).replace(/\.00$/, '')}×`;
    if (elements.horizontalValue) elements.horizontalValue.value = positionLabel(Number(elements.horizontal.value));
    if (elements.verticalValue) elements.verticalValue.value = positionLabel(Number(elements.vertical.value));
  }

  function positionLabel(value) {
    if (Math.abs(value) < 0.05) return 'Centre';
    return value < 0 ? 'Left / Up' : 'Right / Down';
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus(elements.imageStatus, 'Please choose a PNG, JPG, or WebP image.', true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus(elements.imageStatus, 'That image is larger than 10 MB. Please choose a smaller file.', true);
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const image = await loadImage(objectUrl);
      if (state.imageObjectUrl) URL.revokeObjectURL(state.imageObjectUrl);
      state.imageObjectUrl = objectUrl;
      state.image = image;
      state.imageName = file.name;
      elements.uploadFileRow.hidden = false;
      elements.uploadFileName.textContent = file.name;
      setStatus(elements.imageStatus, 'Photo loaded. Adjust the crop if you need to.');
      resetCrop();
    } catch (error) {
      console.error(error);
      setStatus(elements.imageStatus, 'That image could not be read. Please try another file.', true);
    }
  }

  function clearImage() {
    if (state.imageObjectUrl) URL.revokeObjectURL(state.imageObjectUrl);
    state.imageObjectUrl = null;
    state.imageName = '';
    state.image = null;
    if (elements.email) elements.email.value = '';
    elements.uploadInput.value = '';
    elements.uploadFileRow.hidden = true;
    setStatus(elements.imageStatus, 'Using the preview placeholder.');
    resetCrop();
  }

  async function loadGravatar() {
    if (state.imageObjectUrl) return;
    const email = elements.email?.value.trim().toLowerCase();
    if (!email) {
      state.image = null;
      render();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus(elements.imageStatus, 'Enter a valid email address to use Gravatar.', true);
      return;
    }
    setStatus(elements.imageStatus, 'Looking for your Gravatar…');
    const hashes = [];
    try { hashes.push(await sha256Hex(email)); } catch { }
    hashes.push(md5(email));

    for (const hash of hashes) {
      try {
        const image = await loadImage(`https://gravatar.com/avatar/${hash}?s=1080&d=404`, true);
        state.image = image;
        setStatus(elements.imageStatus, 'Gravatar loaded.');
        render();
        return;
      } catch { }
    }

    setStatus(elements.imageStatus, 'No Gravatar was found, so the placeholder is being used.', true);
    state.image = null;
    render();
  }

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function downloadImage() {
    if (!state.hasRendered) return;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${config.downloadPrefix}-${state.frame.id}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus(elements.renderStatus, 'Download started.');
  }

  function shareText() {
    return config.shareMessage ?? `I’m part of ${config.title}.`;
  }

  async function shareImage() {
    if (!state.hasRendered) return;

    const canNativeShare = typeof navigator.share === 'function';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const filename = `${config.downloadPrefix}-${state.frame.id}.png`;
    const file = blob ? new File([blob], filename, { type: 'image/png' }) : null;

    const shareTitle = `${state.frame.caption} · ${config.title}`;
    const sharePayload = { title: shareTitle, text: shareText(), url: config.website };

    const canShareFile = Boolean(
      file && canNativeShare &&
      (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }))
    );

    if (canNativeShare && canShareFile) {
      try {
        await navigator.share({ ...sharePayload, files: [file] });
        setStatus(elements.renderStatus, 'Shared successfully.');
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    if (canNativeShare) {
      const copied = await copyImageToClipboard();
      try {
        await navigator.share(sharePayload);
        setStatus(
          elements.renderStatus,
          copied
            ? 'Shared. Your frame is on the clipboard — paste it into the post.'
            : 'Shared. Use Download PNG to attach your frame.',
          !copied
        );
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    const copied = await copyImageToClipboard();
    buildShareLinks();
    elements.fallback.hidden = false;
    setStatus(
      elements.renderStatus,
      copied
        ? 'Frame copied to your clipboard. Pick a network below and paste it in.'
        : 'Pick a network below, then attach your downloaded frame to the post.',
      !copied
    );
    elements.fallback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const SHARE_ICONS = {
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.53 3h2.94l-6.42 7.34L21.6 21h-5.9l-4.63-6.05L5.77 21H2.83l6.87-7.85L2.4 3h6.05l4.18 5.53L17.53 3Zm-1.03 16.2h1.63L7.6 4.7H5.85L16.5 19.2Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8.2h2.76l.41-3.2H13.5V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.13c-.3-.04-1.3-.13-2.47-.13-2.45 0-4.12 1.5-4.12 4.24v2.36H7.43v3.2h2.76V21h3.31Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.94 8.58H3.86V21h3.08V8.58ZM5.4 3a1.79 1.79 0 1 0 0 3.58A1.79 1.79 0 0 0 5.4 3Zm5.34 5.58H7.8V21h3.06v-6.55c0-1.73.33-3.4 2.47-3.4 2.11 0 2.14 1.97 2.14 3.51V21h3.07v-6.7c0-2.66-.57-4.9-3.68-4.9-1.5 0-2.5.82-2.91 1.6h-.04V8.58Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.64L3 21l4.5-1.18A9 9 0 1 0 12 3Zm0 1.8a7.2 7.2 0 0 1 5.09 12.29A7.2 7.2 0 0 1 7.98 18.4l-.32-.19-2.67.7.71-2.6-.2-.33A7.2 7.2 0 0 1 12 4.8Zm-2.83 3.5c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72 0 1.01.74 1.99.84 2.13.1.14 1.43 2.28 3.54 3.1 1.75.68 2.11.55 2.49.51.38-.03 1.23-.5 1.4-.98.18-.49.18-.9.12-.99-.05-.09-.19-.14-.4-.24-.21-.11-1.23-.6-1.42-.67-.19-.07-.33-.1-.47.1-.14.21-.54.67-.66.81-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.24-1.16-1.45-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.36.1-.12.14-.2.21-.34.07-.14.03-.26-.02-.36-.05-.1-.46-1.13-.64-1.55-.17-.4-.34-.35-.47-.36h-.4Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4.62c2.4 0 2.69.01 3.64.05.88.04 1.35.19 1.67.31.42.16.72.36 1.03.67.31.31.51.61.67 1.03.12.32.27.79.31 1.67.04.95.05 1.24.05 3.64s-.01 2.69-.05 3.64c-.04.88-.19 1.35-.31 1.67-.16.42-.36.72-.67 1.03-.31.31-.61.51-1.03.67-.32.12-.79.27-1.67.31-.95.04-1.24.05-3.64.05s-2.69-.01-3.64-.05c-.88-.04-1.35-.19-1.67-.31a2.78 2.78 0 0 1-1.03-.67 2.78 2.78 0 0 1-.67-1.03c-.12-.32-.27-.79-.31-1.67-.04-.95-.05-1.24-.05-3.64s.01-2.69.05-3.64c.04-.88.19-1.35.31-1.67.16-.42.36-.72.67-1.03.31-.31.61-.51 1.03-.67.32-.12.79-.27 1.67-.31.95-.04 1.24-.05 3.64-.05Zm0 3.16A4.22 4.22 0 1 0 12 16.22 4.22 4.22 0 0 0 12 7.78Zm0 6.96A2.74 2.74 0 1 1 12 9.26a2.74 2.74 0 0 1 0 5.48Zm4.38-7.13a.99.99 0 1 1-1.97 0 .99.99 0 0 1 1.97 0Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  function buildShareLinks() {
    if (!elements.shareLinks || elements.shareLinks.dataset.ready === 'true') return;
    const url = config.website;
    const text = shareText();
    const encUrl = encodeURIComponent(url);
    const encText = encodeURIComponent(text);
    const encTextUrl = encodeURIComponent(`${text} ${url}`);
    const tags = (config.hashtags ?? []).join(',');

    const networks = [
      { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
      { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}${tags ? `&hashtags=${encodeURIComponent(tags)}` : ''}` },
      { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}` },
      { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}` },
      { id: 'whatsapp', label: 'WhatsApp', href: `https://api.whatsapp.com/send?text=${encTextUrl}` }
    ];

    elements.shareLinks.innerHTML = '';
    networks.forEach((network) => {
      const anchor = document.createElement('a');
      anchor.className = `share-link share-link-${network.id}`;
      anchor.href = network.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.title = `Share on ${network.label}`;
      anchor.setAttribute('aria-label', `Share on ${network.label}`);
      anchor.innerHTML = SHARE_ICONS[network.id] ?? network.label;
      anchor.addEventListener('click', async () => {
        const copied = await copyImageToClipboard();
        setStatus(
          elements.renderStatus,
          copied
            ? `Frame copied — paste it into your ${network.label} post.`
            : `Opening ${network.label}. Use Download PNG to attach your frame.`,
          !copied
        );
      });
      elements.shareLinks.appendChild(anchor);
    });
    elements.shareLinks.dataset.ready = 'true';
  }

  async function copyImageToClipboard() {
    if (!state.hasRendered) return false;
    try {
      if (!navigator.clipboard || !window.ClipboardItem) return false;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return false;
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async function handleCopyImage() {
    const label = elements.copyImage?.querySelector('.copy-image-label');
    const original = elements.copyImage?.dataset.label ?? 'Copy image';
    const copied = await copyImageToClipboard();
    if (copied) {
      elements.copyImage.classList.add('is-copied');
      if (label) label.textContent = 'Copied';
      window.setTimeout(() => {
        elements.copyImage.classList.remove('is-copied');
        if (label) label.textContent = original;
      }, 1800);
      setStatus(elements.renderStatus, 'Image copied — paste it into any post.');
    } else {
      setStatus(elements.renderStatus, 'Your browser blocked copying. Use Download PNG instead.', true);
    }
  }

  async function copyLink() {
    const url = config.website;
    try {
      await navigator.clipboard.writeText(url);
      elements.copyLink.textContent = 'Event link copied';
      window.setTimeout(() => { elements.copyLink.textContent = 'Copy event link'; }, 1800);
    } catch {
      setStatus(elements.renderStatus, url);
    }
  }

  function bindEvents() {
    elements.uploadTrigger.addEventListener('click', () => elements.uploadInput.click());
    elements.uploadInput.addEventListener('change', (event) => handleFile(event.target.files?.[0]));
    elements.clearImage.addEventListener('click', clearImage);
    elements.frames.forEach((button) => button.addEventListener('click', () => selectFrame(button.dataset.frameId)));
    elements.zoom.addEventListener('input', () => { state.crop.zoom = Number(elements.zoom.value); updateCropLabels(); render(); });
    elements.horizontal.addEventListener('input', () => { state.crop.x = Number(elements.horizontal.value); updateCropLabels(); render(); });
    elements.vertical.addEventListener('input', () => { state.crop.y = Number(elements.vertical.value); updateCropLabels(); render(); });
    elements.resetCrop.addEventListener('click', resetCrop);
    elements.download.addEventListener('click', downloadImage);
    elements.share.addEventListener('click', shareImage);
    elements.copyImage?.addEventListener('click', handleCopyImage);
    elements.copyLink?.addEventListener('click', copyLink);

    let textTimer;
    const onTextInput = () => {
      window.clearTimeout(textTimer);
      textTimer = window.setTimeout(render, 160);
    };
    elements.userName?.addEventListener('input', onTextInput);
    elements.companyName?.addEventListener('input', onTextInput);

    let gravatarTimer;
    elements.email?.addEventListener('input', () => {
      window.clearTimeout(gravatarTimer);
      gravatarTimer = window.setTimeout(loadGravatar, 500);
    });

    ['dragenter', 'dragover'].forEach((type) => elements.uploadTrigger.addEventListener(type, (event) => {
      event.preventDefault();
      elements.uploadTrigger.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach((type) => elements.uploadTrigger.addEventListener(type, (event) => {
      event.preventDefault();
      elements.uploadTrigger.classList.remove('is-dragging');
    }));
    elements.uploadTrigger.addEventListener('drop', (event) => handleFile(event.dataTransfer.files?.[0]));
  }

  function setupCollapsibleCards() {
    const cards = [...root.querySelectorAll('.control-card')];
    cards.forEach((card, index) => {
      const heading = card.querySelector('.card-heading');
      if (!heading || card.dataset.collapsible === 'true') return;

      const body = document.createElement('div');
      body.className = 'card-body';
      let node = heading.nextElementSibling;
      while (node) {
        const next = node.nextElementSibling;
        body.appendChild(node);
        node = next;
      }
      card.appendChild(body);

      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.classList.add('card-heading-toggle');
      const chevron = document.createElement('span');
      chevron.className = 'card-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.innerHTML = ''
        + '<svg class="icon-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>'
        + '<svg class="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
      heading.appendChild(chevron);

      const setOpen = (open) => {
        card.classList.toggle('is-collapsed', !open);
        heading.setAttribute('aria-expanded', String(open));
      };
      const startCollapsed = window.matchMedia('(max-width: 760px)').matches && index !== 0;
      setOpen(!startCollapsed);

      const toggle = () => setOpen(card.classList.contains('is-collapsed'));
      heading.addEventListener('click', toggle);
      heading.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
      card.dataset.collapsible = 'true';
    });
  }

  setupCollapsibleCards();

  bindEvents();
  updateCropLabels();
  selectFrame(state.frame.id);
}

function md5(string) {
  function cmn(q, a, b, x, s, t) { return add32(rol(add32(add32(a, q), add32(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
  function md5cycle(x, k) {
    let [a, b, c, d] = x;
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function md5blk(s) { const blocks = []; for (let i = 0; i < 64; i += 4) blocks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24); return blocks; }
  function md51(s) { let n = s.length; const state = [1732584193, -271733879, -1732584194, 271733878]; let i; for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i))); s = s.substring(i - 64); const tail = Array(16).fill(0); for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3); tail[i >> 2] |= 0x80 << ((i % 4) << 3); if (i > 55) { md5cycle(state, tail); tail.fill(0); } tail[14] = n * 8; md5cycle(state, tail); return state; }
  function rhex(n) { let s = ''; for (let j = 0; j < 4; j++) s += `${(n >> (j * 8 + 4)) & 0x0f}${(n >> (j * 8)) & 0x0f}`; return s; }
  function add32(a, b) { return (a + b) & 0xffffffff; }
  function rol(num, count) { return (num << count) | (num >>> (32 - count)); }
  const encoded = new TextEncoder().encode(string);
  return md51(String.fromCharCode(...encoded)).map(rhex).join('');
}
