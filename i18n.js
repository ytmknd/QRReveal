const messages = {
  en: {
    eyebrow: 'Check it straight from an image or PDF',
    intro: 'Reads QR codes in images and PDFs and shows what they contain.',
    uploadHeading: 'Add an image or PDF',
    dropZoneLabel: 'Drop an image or PDF, or choose a file',
    dropTitle: 'Drag and drop an image or PDF here',
    dropSubtitle: 'or paste an image or PDF (Ctrl+V / ⌘+V)',
    chooseFile: 'Choose file',
    privacyNote: 'Images and PDFs are processed on this device and never uploaded.',
    resultHeading: 'Result',
    previewLabel: 'Preview',
    canvasLabel: 'The loaded image or PDF page and the location of the detected QR code',
    contentLabel: 'QR code content',
    copy: 'Copy content',
    copied: 'Copied',
    copyFailed: 'Could not copy. Please select the content and copy it manually.',
    pastedImage: 'Pasted image',
    pastedPdf: 'Pasted PDF',
    pageCount: '{name} — page {page} / {total}',
    urlNote: 'This can be opened as a URL.',
    unsafeSchemeNote: 'Caution: this is not an HTTP/HTTPS address, so it is not shown as a link for safety.',
    notUrlNote: 'This is not a URL.',
    notImage: 'Please choose an image or PDF file (PNG, JPEG, GIF, WebP, BMP, PDF, etc.).',
    libraryMissing: 'The QR reader library could not be loaded. Check your network connection and reload the page.',
    pdfLibraryMissing: 'The PDF reader library could not be loaded. Check your network connection and reload the page.',
    reading: 'Reading the image…',
    readingPdf: 'Opening the PDF…',
    scanningPage: 'Scanning page {page} of {total}…',
    imageOpenFailed: 'Could not open the image. Please choose a supported image file.',
    imageSizeUnknown: 'Could not determine the image size.',
    pdfPasswordRequired: 'This PDF is password-protected and cannot be opened.',
    pdfOpenFailed: 'Could not open or read this PDF. Please choose a valid PDF file.',
    notDetected: 'No QR code was detected.',
    notDetectedHint: 'Make sure the QR code is sharp and fully inside the image or page.',
    notFoundStatus: 'No QR code found.',
    scanLimitReached: 'No QR code found in the first 50 pages.',
    success: 'QR code read successfully.',
    genericError: 'An error occurred while processing the file.',
  },
  ja: {
    eyebrow: '画像やPDFから、すぐに確認',
    intro: '画像やPDF内のQRコードを読み取り、内容を表示します。',
    uploadHeading: '画像またはPDFを追加',
    dropZoneLabel: '画像またはPDFをドロップ、またはファイルを選択',
    dropTitle: 'ここに画像またはPDFをドラッグ＆ドロップ',
    dropSubtitle: 'または画像やPDFを貼り付け（Ctrl+V / ⌘+V）',
    chooseFile: 'ファイルを選択',
    privacyNote: '画像とPDFはこの端末内で処理され、アップロードされません。',
    resultHeading: '読み取り結果',
    previewLabel: 'プレビュー',
    canvasLabel: '読み込んだ画像またはPDFのページと検出したQRコードの位置',
    contentLabel: 'QRコードの内容',
    copy: '内容をコピー',
    copied: 'コピーしました',
    copyFailed: 'コピーできませんでした。内容を選択してコピーしてください。',
    pastedImage: '貼り付けた画像',
    pastedPdf: '貼り付けたPDF',
    pageCount: '{name} — {page} / {total} ページ',
    urlNote: 'URLとして開くことができます。',
    unsafeSchemeNote: '注意: HTTP/HTTPS以外の形式です。安全のためリンクにはしていません。',
    notUrlNote: 'URLではありません。',
    notImage: '画像またはPDFファイルを選んでください（PNG、JPEG、GIF、WebP、BMP、PDFなど）。',
    libraryMissing: 'QR読み取りライブラリを読み込めませんでした。ネットワーク接続を確認して再読み込みしてください。',
    pdfLibraryMissing: 'PDF読み取りライブラリを読み込めませんでした。ネットワーク接続を確認して再読み込みしてください。',
    reading: '画像を読み取っています…',
    readingPdf: 'PDFを開いています…',
    scanningPage: '{total} ページ中 {page} ページ目を調べています…',
    imageOpenFailed: '画像を開けませんでした。対応している画像ファイルを選んでください。',
    imageSizeUnknown: '画像のサイズを確認できませんでした。',
    pdfPasswordRequired: 'このPDFはパスワードで保護されているため、開けません。',
    pdfOpenFailed: 'PDFを開くか読み取ることができませんでした。有効なPDFファイルを選んでください。',
    notDetected: 'QRコードを検出できませんでした。',
    notDetectedHint: 'QRコードが鮮明で、画像またはページ内に収まっているか確認してください。',
    notFoundStatus: 'QRコードが見つかりませんでした。',
    scanLimitReached: '最初の50ページにQRコードが見つかりませんでした。',
    success: 'QRコードを読み取りました。',
    genericError: 'ファイルの処理中にエラーが発生しました。',
  },
};

// An explicit ?lang= wins; otherwise use the first supported browser language.
function detectLanguage() {
  const requested = new URLSearchParams(location.search).get('lang');
  const candidates = [requested, ...(navigator.languages || [navigator.language])];
  for (const candidate of candidates) {
    const base = candidate?.toLowerCase().split('-')[0];
    if (base && messages[base]) return base;
  }
  return 'en';
}

const language = detectLanguage();

function t(key, values = {}) {
  const message = messages[language][key] ?? messages.en[key] ?? key;
  return message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
}

function applyTranslations() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  }
}

applyTranslations();
