# QRReveal

[English](README.md) | 日本語

画像やPDF内のQRコードをブラウザーで読み取り、内容を表示する静的Webアプリです。画像とPDFのドラッグ＆ドロップ、ファイル選択、クリップボードからのファイル貼り付けに対応しています。

PDFはページ順に最大50ページまで調べ、最初に見つかったQRコードのページをプレビューに表示します。見つからなかった場合は1ページ目を表示します。画像もPDFも複数の解像度と反転色でQRコードを読み取ります。対応形式はPDF、PNG、JPEG、GIF、WebP、BMP、およびブラウザーが表示できるその他の画像形式です。パスワード付きPDFは開けません。

`index.html` をブラウザーで開いて使用してください。ビルドもサーバーも不要です。[jsQR](https://github.com/cozmo/jsQR) と [pdf.js](https://mozilla.github.io/pdf.js/)（`pdfjs-dist@3.11.174` とそのワーカー）をjsDelivr CDNから読み込むため、インターネット接続が必要です。画像、PDF、読み取り結果はサーバーへ送信されません。

表示言語はブラウザーの言語設定（日本語・英語）に合わせて自動で切り替わります。`index.html?lang=ja` や `index.html?lang=en` で指定することもできます。
