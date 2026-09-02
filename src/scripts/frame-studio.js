import { sha256Hex, md5Hex } from './crypto.js';
import { loadImage, ensureFonts, renderFrameComposite } from './canvas-renderer.js';
import { SHARE_ICONS, getShareNetworks, copyCanvasImageToClipboard, downloadCanvasImage } from './social-share.js';

const studioRoot = document.querySelector('[data-frame-studio]');

if (studioRoot) {
  initFrameStudio(studioRoot);
}

/**
 * Initializes Frame Studio state, event listeners, and live rendering.
 */
export async function initFrameStudio(root) {
  const configElement = document.getElementById(root.dataset.configId || '');
  if (!configElement || !configElement.textContent) return;

  const config = JSON.parse(configElement.textContent);
  const canvas = root.querySelector('#resultCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

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

  async function loadTypography() {
    if (state.fontsReady) return;
    await ensureFonts(['700 48px "DM Sans"', '400 30px "DM Sans"'], 1200);
    state.fontsReady = true;
  }

  async function getFrameImage(frame) {
    if (state.frameCache.has(frame.id)) {
      return state.frameCache.get(frame.id);
    }
    const image = await loadImage(frame.src);
    state.frameCache.set(frame.id, image);
    return image;
  }

  async function getSourceImage() {
    if (state.image) return state.image;
    try {
      return await loadImage(config.placeholder);
    } catch {
      return null;
    }
  }

  async function render() {
    const renderVersion = ++state.renderVersion;
    setLoading(true);
    setStatus(elements.renderStatus, 'Rendering your frame…');

    try {
      if (config.composition.mode === 'legacy' || config.composition.showProfileFields) {
        await loadTypography();
      }

      const [sourceImage, frameImage] = await Promise.all([
        getSourceImage(),
        getFrameImage(state.frame)
      ]);

      if (renderVersion !== state.renderVersion) return;
      if (!sourceImage) throw new Error('No drawable source image is available.');

      state.frameImage = frameImage;
      const isCustomPhoto = Boolean(state.image);
      const profileData = {
        userName: elements.userName?.value ?? '',
        companyName: elements.companyName?.value ?? ''
      };

      renderFrameComposite(
        ctx,
        config,
        state.frame,
        sourceImage,
        frameImage,
        isCustomPhoto,
        state.crop,
        profileData
      );

      state.hasRendered = true;
      elements.download.disabled = false;
      elements.share.disabled = false;
      setStatus(elements.renderStatus, 'Ready to download and share.');

      if (elements.previewHint) {
        elements.previewHint.textContent = `${state.frame.label} · ${config.canvas.width} × ${config.canvas.height}px PNG`;
      }
    } catch {
      if (renderVersion !== state.renderVersion) return;
      state.hasRendered = false;
      elements.download.disabled = true;
      elements.share.disabled = true;
      setStatus(elements.renderStatus, 'We could not render this frame. Please try again.', true);
    } finally {
      if (renderVersion === state.renderVersion) {
        setLoading(false);
      }
    }
  }

  function selectFrame(frameId) {
    const frame = config.frames.find((item) => item.id === frameId);
    if (!frame) return;
    state.frame = frame;
    elements.frames.forEach((button) => {
      const isSelected = button.dataset.frameId === frameId;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
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
    if (elements.zoomValue) {
      elements.zoomValue.value = `${Number(elements.zoom.value).toFixed(2).replace(/\.00$/, '')}×`;
    }
    if (elements.horizontalValue) {
      elements.horizontalValue.value = getPositionLabel(Number(elements.horizontal.value));
    }
    if (elements.verticalValue) {
      elements.verticalValue.value = getPositionLabel(Number(elements.vertical.value));
    }
  }

  function getPositionLabel(value) {
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

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
      const image = await loadImage(objectUrl);
      if (state.imageObjectUrl) URL.revokeObjectURL(state.imageObjectUrl);

      state.imageObjectUrl = objectUrl;
      state.image = image;
      state.imageName = file.name;
      elements.uploadFileRow.hidden = false;
      elements.uploadFileName.textContent = file.name;
      setStatus(elements.imageStatus, 'Photo loaded. Adjust the crop if you need to.');
      resetCrop();
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
    try {
      hashes.push(await sha256Hex(email));
    } catch {}
    hashes.push(md5Hex(email));

    for (const hash of hashes) {
      try {
        const image = await loadImage(`https://gravatar.com/avatar/${hash}?s=1080&d=404`, true);
        state.image = image;
        setStatus(elements.imageStatus, 'Gravatar loaded.');
        render();
        return;
      } catch {}
    }

    setStatus(elements.imageStatus, 'No Gravatar was found, so the placeholder is being used.', true);
    state.image = null;
    render();
  }

  async function handleDownload() {
    if (!state.hasRendered) return;
    const filename = `${config.downloadPrefix}-${state.frame.id}.png`;
    const success = await downloadCanvasImage(canvas, filename);
    if (success) {
      setStatus(elements.renderStatus, 'Download started.');
    }
  }

  async function handleShare() {
    if (!state.hasRendered) return;

    const canNativeShare = typeof navigator.share === 'function';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const filename = `${config.downloadPrefix}-${state.frame.id}.png`;
    const file = blob ? new File([blob], filename, { type: 'image/png' }) : null;

    const shareTitle = `${state.frame.caption} · ${config.title}`;
    const shareMessage = config.shareMessage ?? `I’m part of ${config.title}.`;
    const sharePayload = { title: shareTitle, text: shareMessage, url: config.website };

    const canShareFile = Boolean(
      file &&
      canNativeShare &&
      (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }))
    );

    if (canNativeShare && canShareFile && file) {
      try {
        await navigator.share({ ...sharePayload, files: [file] });
        setStatus(elements.renderStatus, 'Shared successfully.');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    if (canNativeShare) {
      const copied = await copyCanvasImageToClipboard(canvas);
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
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    const copied = await copyCanvasImageToClipboard(canvas);
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

  function buildShareLinks() {
    if (!elements.shareLinks || elements.shareLinks.dataset.ready === 'true') return;
    const networks = getShareNetworks(config);

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
        const copied = await copyCanvasImageToClipboard(canvas);
        setStatus(
          elements.renderStatus,
          copied
            ? `Frame copied — paste it into your ${network.label} post.`
            : `Opening ${network.label}. Use Download PNG to attach your frame.`,
          !copied
        );
      });

      elements.shareLinks?.appendChild(anchor);
    });
    elements.shareLinks.dataset.ready = 'true';
  }

  async function handleCopyImage() {
    const label = elements.copyImage?.querySelector('.copy-image-label');
    const originalText = elements.copyImage?.dataset.label ?? 'Copy image';
    const copied = await copyCanvasImageToClipboard(canvas);

    if (copied && elements.copyImage) {
      elements.copyImage.classList.add('is-copied');
      if (label) label.textContent = 'Copied';
      window.setTimeout(() => {
        elements.copyImage?.classList.remove('is-copied');
        if (label) label.textContent = originalText;
      }, 1800);
      setStatus(elements.renderStatus, 'Image copied — paste it into any post.');
    } else {
      setStatus(elements.renderStatus, 'Your browser blocked copying. Use Download PNG instead.', true);
    }
  }

  async function handleCopyLink() {
    const url = config.website;
    try {
      await navigator.clipboard.writeText(url);
      if (elements.copyLink) {
        elements.copyLink.textContent = 'Event link copied';
        window.setTimeout(() => {
          if (elements.copyLink) elements.copyLink.textContent = 'Copy event link';
        }, 1800);
      }
    } catch {
      setStatus(elements.renderStatus, url);
    }
  }

  function bindEvents() {
    elements.uploadTrigger.addEventListener('click', () => elements.uploadInput.click());
    elements.uploadInput.addEventListener('change', (event) => {
      handleFile(event.target.files?.[0]);
    });
    elements.clearImage.addEventListener('click', clearImage);
    elements.frames.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.frameId) selectFrame(button.dataset.frameId);
      });
    });

    elements.zoom.addEventListener('input', () => {
      state.crop.zoom = Number(elements.zoom.value);
      updateCropLabels();
      render();
    });
    elements.horizontal.addEventListener('input', () => {
      state.crop.x = Number(elements.horizontal.value);
      updateCropLabels();
      render();
    });
    elements.vertical.addEventListener('input', () => {
      state.crop.y = Number(elements.vertical.value);
      updateCropLabels();
      render();
    });

    elements.resetCrop.addEventListener('click', resetCrop);
    elements.download.addEventListener('click', handleDownload);
    elements.share.addEventListener('click', handleShare);
    elements.copyImage?.addEventListener('click', handleCopyImage);
    elements.copyLink?.addEventListener('click', handleCopyLink);

    let textDebounceTimer;
    const onTextInput = () => {
      window.clearTimeout(textDebounceTimer);
      textDebounceTimer = window.setTimeout(render, 160);
    };
    elements.userName?.addEventListener('input', onTextInput);
    elements.companyName?.addEventListener('input', onTextInput);

    let gravatarDebounceTimer;
    elements.email?.addEventListener('input', () => {
      window.clearTimeout(gravatarDebounceTimer);
      gravatarDebounceTimer = window.setTimeout(loadGravatar, 500);
    });

    ['dragenter', 'dragover'].forEach((type) => {
      elements.uploadTrigger.addEventListener(type, (event) => {
        event.preventDefault();
        elements.uploadTrigger.classList.add('is-dragging');
      });
    });

    ['dragleave', 'drop'].forEach((type) => {
      elements.uploadTrigger.addEventListener(type, (event) => {
        event.preventDefault();
        elements.uploadTrigger.classList.remove('is-dragging');
      });
    });

    elements.uploadTrigger.addEventListener('drop', (event) => {
      handleFile(event.dataTransfer?.files?.[0]);
    });
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
      chevron.innerHTML =
        '<svg class="icon-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>' +
        '<svg class="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
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
