# QRReveal

English | [日本語](README.ja.md)

QRReveal is a static web app that reads QR codes in images and PDFs and shows what they contain — right in your browser.

## Features

- **Three ways to load an image or PDF:** drag and drop, file picker, or paste a file from the clipboard (Ctrl+V / ⌘+V).
- **Private by design:** files are decoded locally and never uploaded. Neither the file nor the result leaves your device.
- **PDF page scanning:** scans pages in order, stops at the first QR code, and checks up to 50 pages.
- **Visual feedback:** the detected QR code is outlined on the image or PDF page preview. If none is found in a PDF, page 1 is shown.
- **Safe links:** only `http:` and `https:` URLs are turned into clickable links. Other schemes (such as `javascript:` or `tel:`) are shown as plain text with a warning.
- **Robust decoding:** retries at several scales and also tries inverted colors (light-on-dark codes).
- **One-click copy** of the decoded content.
- **Multilingual UI:** English and Japanese.

## Usage

Open `index.html` in a browser. There is no build step and no server is required.

An internet connection is needed to load [jsQR](https://github.com/cozmo/jsQR) and [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist@3.11.174`, including its worker) from jsDelivr.

Supported formats: PDF, PNG, JPEG, GIF, WebP, BMP, and any other image type your browser can display. Password-protected PDFs cannot be opened.

## Language

The UI language follows your browser's language settings and falls back to English. Override it with the `lang` query parameter:

```
index.html?lang=en
index.html?lang=ja
```

### Adding a language

Add an entry to the `messages` object in `i18n.js` with the same keys as `en`. Any missing key falls back to English.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup; translatable text is marked with `data-i18n` / `data-i18n-aria-label` |
| `i18n.js` | Message catalog, language detection, and the `t()` helper |
| `app.js` | Image and PDF loading, QR decoding, and result display |
| `style.css` | Styles |
