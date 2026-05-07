import { escapeHtml } from './html';

/**
 * Wrap rendered HTML content in an A4-optimized HTML template for PDF generation.
 * Includes Pretendard font CDN, highlight.js styles, and @page rules.
 */
export function wrapForPdf(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css">
<style>
@page { size: A4; margin: 30px; }
@media print {
  html, body { margin: 0; padding: 0; }
}
html, body {
  font-family: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1a1916;
  line-height: 1.7;
  font-size: 11pt;
  margin: 0 auto;
  padding: 30px;
  box-sizing: border-box;
}
h1, h2, h3 {
  page-break-after: avoid;
  margin-top: 1.5em;
}
pre, table, img, figure {
  page-break-inside: avoid;
}
code {
  background: #f1f0ec;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}
pre {
  background: #f1f0ec;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 10pt;
  font-family: 'JetBrains Mono', monospace;
}
pre code {
  background: none;
  padding: 0;
}
blockquote {
  border-left: 3px solid #1a56db;
  padding-left: 12px;
  color: #555;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid #e2e0d8;
  padding: 6px 10px;
  text-align: left;
}
th {
  background: #f1f0ec;
}
a {
  color: #1a56db;
  text-decoration: none;
}
img {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${bodyHtml}
</body>
</html>`;
}
