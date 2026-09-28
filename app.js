const fileInput = document.querySelector('#file-input');
const dropZone = document.querySelector('#drop-zone');
const statusMessage = document.querySelector('#status');
const resultSection = document.querySelector('#result-section');
const previewCanvas = document.querySelector('#preview-canvas');
const fileName = document.querySelector('#file-name');
const decodedContent = document.querySelector('#decoded-content');
const contentNote = document.querySelector('#content-note');
const copyButton = document.querySelector('#copy-button');

let decodedText = '';
let currentRequest = 0;
let dragDepth = 0;

function setStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`.trim();
  statusMessage.hidden = !message;
}

function isImageFile(file) {
  return file && (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name));
}

function isPdfFile(file) {
  return file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(t('imageOpenFailed')));
    };
    image.src = url;
  });
}

function makeCanvas(source, maxSide, allowUpscale = false) {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const ratio = maxSide / Math.max(width, height);
  const scale = allowUpscale ? ratio : Math.min(ratio, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function decodeAtSize(source, maxSide) {
  const canvas = makeCanvas(source, maxSide, true);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return { result: jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' }), canvas };
}

async function decodeSource(source, sizes, request) {
  for (const size of [...new Set(sizes)]) {
    const attempt = decodeAtSize(source, size);
    if (attempt.result) return attempt;
    await new Promise(resolve => setTimeout(resolve, 0));
    if (request !== currentRequest) return null;
  }
  return null;
}

function showPreview(source, name) {
  const preview = makeCanvas(source, 1500);
  previewCanvas.width = preview.width;
  previewCanvas.height = preview.height;
  previewCanvas.getContext('2d').drawImage(preview, 0, 0);
  fileName.textContent = name;
  resultSection.hidden = false;
  return previewCanvas.getContext('2d');
}

function showNotFound(statusKey = 'notFoundStatus') {
  decodedContent.textContent = t('notDetected');
  contentNote.textContent = t('notDetectedHint');
  contentNote.className = 'content-note';
  copyButton.hidden = true;
  setStatus(t(statusKey), 'error');
}

function outlineQR(context, location, scaleX, scaleY) {
  const points = [location.topLeftCorner, location.topRightCorner, location.bottomRightCorner, location.bottomLeftCorner];
  context.beginPath();
  context.moveTo(points[0].x * scaleX, points[0].y * scaleY);
  for (const point of points.slice(1)) context.lineTo(point.x * scaleX, point.y * scaleY);
  context.closePath();
  context.lineWidth = Math.max(3, Math.min(previewCanvas.width, previewCanvas.height) / 180);
  context.strokeStyle = '#10b981';
  context.shadowColor = '#073c31';
  context.shadowBlur = 5;
  context.stroke();
  context.shadowBlur = 0;
}

function showDecodedText(text) {
  decodedText = text;
  decodedContent.textContent = '';
  contentNote.className = 'content-note';
  copyButton.hidden = false;
  copyButton.textContent = t('copy');

  const value = text.trim();
  let url;
  try { url = new URL(value); } catch { /* Ordinary text is expected. */ }

  if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
    const link = document.createElement('a');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = text;
    decodedContent.append(link);
    contentNote.textContent = t('urlNote');
  } else {
    decodedContent.textContent = text;
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
      contentNote.textContent = t('unsafeSchemeNote');
      contentNote.classList.add('warning');
    } else {
      contentNote.textContent = t('notUrlNote');
    }
  }
}

async function handleImage(file, request) {
  setStatus(t('reading'));
  const image = await loadImage(file);
  if (request !== currentRequest) return;
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(t('imageSizeUnknown'));

  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const previewContext = showPreview(image, file.name || t('pastedImage'));
  const sizes = [Math.min(longest, 1500), 1000, 700];
  if (longest < 750) sizes.push(Math.min(longest * 2, 1500), Math.min(longest * 3, 1500));
  const found = await decodeSource(image, sizes, request);
  if (request !== currentRequest) return;
  if (!found) {
    showNotFound();
    return;
  }

  outlineQR(previewContext, found.result.location, previewCanvas.width / found.canvas.width, previewCanvas.height / found.canvas.height);
  showDecodedText(found.result.data);
  setStatus(t('success'), 'success');
}

async function handlePdf(file, request) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  setStatus(t('readingPdf'));
  let loadingTask;
  let pdf;
  try {
    const data = await file.arrayBuffer();
    if (request !== currentRequest) return;
    loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    pdf = await loadingTask.promise;
    if (request !== currentRequest) return;
    if (!pdf.numPages) throw new Error('Invalid PDF');

    const pageLimit = Math.min(pdf.numPages, 50);
    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      if (request !== currentRequest) return;
      setStatus(t('scanningPage', { page: pageNumber, total: pdf.numPages }));
      await new Promise(resolve => setTimeout(resolve, 0));
      if (request !== currentRequest) return;

      const page = await pdf.getPage(pageNumber);
      if (request !== currentRequest) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2000 / Math.max(baseViewport.width, baseViewport.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      await page.render({ canvasContext: canvas.getContext('2d', { willReadFrequently: true }), viewport }).promise;
      page.cleanup();
      if (request !== currentRequest) return;

      const name = t('pageCount', { name: file.name || t('pastedPdf'), page: pageNumber, total: pdf.numPages });
      if (pageNumber === 1) showPreview(canvas, name);
      const found = await decodeSource(canvas, [2000, 1500, 1000, 700], request);
      if (request !== currentRequest) return;
      if (found) {
        const previewContext = pageNumber === 1 ? previewCanvas.getContext('2d') : showPreview(canvas, name);
        outlineQR(previewContext, found.result.location, previewCanvas.width / found.canvas.width, previewCanvas.height / found.canvas.height);
        showDecodedText(found.result.data);
        setStatus(t('success'), 'success');
        return;
      }
    }
    showNotFound(pdf.numPages > 50 ? 'scanLimitReached' : 'notFoundStatus');
  } catch (error) {
    if (request !== currentRequest) return;
    resultSection.hidden = true;
    const key = error?.name === 'PasswordException' ? 'pdfPasswordRequired' : 'pdfOpenFailed';
    setStatus(t(key), 'error');
  } finally {
    try {
      if (pdf) await pdf.destroy();
      else if (loadingTask) await loadingTask.destroy();
    } catch { /* The page result is already settled. */ }
  }
}

async function handleFile(file) {
  const request = ++currentRequest;
  resultSection.hidden = true;
  decodedText = '';
  if (!isImageFile(file) && !isPdfFile(file)) {
    setStatus(t('notImage'), 'error');
    return;
  }
  if (typeof jsQR !== 'function') {
    setStatus(t('libraryMissing'), 'error');
    return;
  }
  if (isPdfFile(file) && typeof pdfjsLib === 'undefined') {
    setStatus(t('pdfLibraryMissing'), 'error');
    return;
  }

  try {
    if (isPdfFile(file)) await handlePdf(file, request);
    else await handleImage(file, request);
  } catch (error) {
    if (request !== currentRequest) return;
    resultSection.hidden = true;
    setStatus(error instanceof Error ? error.message : t('genericError'), 'error');
  }
}

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

dropZone.addEventListener('keydown', event => {
  if (event.target === dropZone && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    fileInput.click();
  }
});

// Prevent navigation even if the file is dropped outside the drop zone.
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
dropZone.addEventListener('dragenter', event => {
  event.preventDefault();
  dragDepth += 1;
  dropZone.classList.add('is-dragging');
});
dropZone.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) dropZone.classList.remove('is-dragging');
});
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dragDepth = 0;
  dropZone.classList.remove('is-dragging');
  const file = event.dataTransfer?.files[0];
  if (file) handleFile(file);
});
window.addEventListener('drop', () => {
  dragDepth = 0;
  dropZone.classList.remove('is-dragging');
});

document.addEventListener('paste', event => {
  const files = [...(event.clipboardData?.items || [])]
    .filter(item => item.kind === 'file')
    .map(item => item.getAsFile());
  files.push(...(event.clipboardData?.files || []));
  const file = files.find(isPdfFile) || files.find(isImageFile);
  if (file) {
    event.preventDefault();
    handleFile(file);
  }
});

copyButton.addEventListener('click', async () => {
  try {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(decodedText);
        copied = true;
      } catch { /* Try the selection-based fallback below. */ }
    }
    if (!copied) {
      const temporary = document.createElement('textarea');
      temporary.value = decodedText;
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.append(temporary);
      try {
        temporary.select();
        copied = document.execCommand('copy');
      } finally {
        temporary.remove();
      }
    }
    if (!copied) throw new Error('Copy failed');
    copyButton.textContent = t('copied');
  } catch {
    setStatus(t('copyFailed'), 'error');
  }
});
