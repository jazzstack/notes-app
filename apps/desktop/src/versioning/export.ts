import { Note, ExportOptions } from '@notes-app/shared';

function mergeOptions(options: Partial<ExportOptions> = {}): ExportOptions {
  return {
    includeMetadata: true,
    includeBacklinks: false,
    includeFrontmatter: false,
    theme: 'light',
    ...options,
  };
}

export async function exportToMarkdown(note: Note, _options?: Partial<ExportOptions>): Promise<string> {
  let content = '';
  
  if (note.title) {
    content += `# ${note.title}\n\n`;
  }
  
  content += note.content;
  
  return content;
}

export async function exportToHTML(note: Note, options?: Partial<ExportOptions>): Promise<string> {
  const opts = mergeOptions(options);
  const { includeMetadata = true, theme = 'light' } = opts;
  
  const titleColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';
  const textColor = theme === 'dark' ? '#e5e5e5' : '#333333';
  const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
  const linkColor = theme === 'dark' ? '#8b5cf6' : '#8b5cf6';
  
  const htmlContent = note.content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  const metadata = includeMetadata ? `
    <meta name="author" content="Notes App">
    <meta name="created" content="${note.createdAt}">
    <meta name="modified" content="${note.updatedAt}">
  ` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)}</title>
  ${metadata}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: ${textColor};
      background: ${bgColor};
    }
    h1, h2, h3 { color: ${titleColor}; margin-top: 1.5em; }
    h1 { font-size: 2em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.5em; }
    code {
      background: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }
    pre { background: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'}; padding: 1em; border-radius: 5px; overflow-x: auto; }
    a { color: ${linkColor}; }
    ul { padding-left: 1.5em; }
    blockquote {
      border-left: 4px solid ${linkColor};
      margin: 1em 0;
      padding-left: 1em;
      color: ${theme === 'dark' ? '#a0a0a0' : '#666666'};
    }
  </style>
</head>
<body>
  ${htmlContent ? `<p>${htmlContent}</p>` : ''}
  <footer style="margin-top: 3em; padding-top: 1em; border-top: 1px solid #e5e5e5; font-size: 0.8em; color: #888;">
    Exported from Notes App on ${new Date().toLocaleDateString()}
  </footer>
</body>
</html>`;
}

export async function exportToJSON(note: Note, options?: Partial<ExportOptions>): Promise<string> {
  const opts = mergeOptions(options);
  const { includeMetadata = true } = opts;
  
  const exportData: Record<string, unknown> = {
    title: note.title,
    content: note.content,
  };
  
  if (includeMetadata) {
    exportData.createdAt = note.createdAt;
    exportData.updatedAt = note.updatedAt;
    exportData.tags = note.tags;
    exportData.metadata = note.metadata;
  }
  
  return JSON.stringify(exportData, null, 2);
}

export async function exportToPDF(note: Note): Promise<Blob> {
  const html = await exportToHTML(note, { theme: 'light' });
  
  return new Blob([html], { type: 'text/html' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export async function exportNote(
  note: Note,
  format: 'pdf' | 'html' | 'markdown' | 'json',
  options?: Partial<ExportOptions>
): Promise<void> {
  const sanitizedTitle = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'markdown': {
      const content = await exportToMarkdown(note, options);
      downloadText(content, `${sanitizedTitle}_${timestamp}.md`, 'text/markdown');
      break;
    }
    case 'html': {
      const content = await exportToHTML(note, options);
      downloadText(content, `${sanitizedTitle}_${timestamp}.html`, 'text/html');
      break;
    }
    case 'json': {
      const content = await exportToJSON(note, options);
      downloadText(content, `${sanitizedTitle}_${timestamp}.json`, 'application/json');
      break;
    }
    case 'pdf': {
      const blob = await exportToPDF(note);
      downloadBlob(blob, `${sanitizedTitle}_${timestamp}.html`);
      break;
    }
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getExportFormats() {
  return [
    { type: 'markdown' as const, name: 'Markdown', extension: 'md', mimeType: 'text/markdown' },
    { type: 'html' as const, name: 'HTML', extension: 'html', mimeType: 'text/html' },
    { type: 'json' as const, name: 'JSON', extension: 'json', mimeType: 'application/json' },
    { type: 'pdf' as const, name: 'PDF (via HTML)', extension: 'html', mimeType: 'text/html' },
  ];
}
