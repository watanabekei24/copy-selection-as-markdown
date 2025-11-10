
// A compact HTML -> Markdown converter handling common elements.
// Not as complete as Turndown, but good for most web content.
(function(){
  function escapeMD(text) {
    // Escape Markdown control characters in plain text segments.
    return text
      .replace(/\\/g, '\\\\')
      .replace(/([*_`~])/g, '\\$1')
      .replace(/^(#+)\s/gm, m => m.replace(/#/g, '\\#'))
      .replace(/^>\s/gm, '\\> ')
      .replace(/\|/g, '\\|');
  }

  function repeat(ch, n){ return Array(n+1).join(ch); }

  function isBlock(node){
    if (!node || node.nodeType !== 1) return false;
    const display = window.getComputedStyle(node).display;
    return display && (display === 'block' || display === 'table' || display === 'list-item' || display === 'flex' || display === 'grid');
  }

  function trimBlankLines(str){
    return str.replace(/^\s*\n+/,'').replace(/\n+\s*$/,'');
  }

  function serializeInline(node, inTableCell){
    if (node.nodeType === Node.TEXT_NODE) {
      let text = escapeMD(node.nodeValue);
      // テーブルセル内では改行を<br>タグに変換
      if (inTableCell) {
        text = text.replace(/\n/g, '<br>');
      }
      return text;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const tag = node.tagName.toLowerCase();
    if (tag === 'br') {
      // テーブルセル内では<br>タグとして保持
      return inTableCell ? '<br>' : '  \n';
    }
    if (tag === 'code' && node.parentElement && node.parentElement.tagName.toLowerCase() !== 'pre') {
      return '`' + trimBlankLines(node.textContent) + '`';
    }
    if (tag === 'strong' || tag === 'b') {
      return '**' + Array.from(node.childNodes).map(n => serializeInline(n, inTableCell)).join('') + '**';
    }
    if (tag === 'em' || tag === 'i') {
      return '_' + Array.from(node.childNodes).map(n => serializeInline(n, inTableCell)).join('') + '_';
    }
    if (tag === 'del' || tag === 's' || tag === 'strike') {
      return '~~' + Array.from(node.childNodes).map(n => serializeInline(n, inTableCell)).join('') + '~~';
    }
    if (tag === 'a') {
      const href = node.getAttribute('href') || '';
      const text = trimBlankLines(Array.from(node.childNodes).map(n => serializeInline(n, inTableCell)).join('')) || href;
      // 「@」で始まるテキストならリンク化せずにそのまま出力
      if (/@[\p{L}\p{N}_.\-ー一-龠ぁ-んァ-ンａ-ｚＡ-Ｚ０-９々〆〤]+/u.test(text)) {
        return text;
      }
      return `[${text}](${href})`;
    }
    if (tag === 'img') {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return `![${alt}](${src})`;
    }
    // default inline: descend
    return Array.from(node.childNodes).map(n => serializeInline(n, inTableCell)).join('');
  }

  function serializeBlock(node, ctx){
    // ctx: {listIndent: number, inBlockquote: boolean}
    if (!ctx) ctx = { listIndent: 0, inBlockquote: false };

    if (node.nodeType === Node.TEXT_NODE) {
      return escapeMD(node.nodeValue.replace(/\s+/g,' '));
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const tag = node.tagName.toLowerCase();

    if (tag.match(/^h[1-6]$/)) {
      const level = parseInt(tag[1], 10);
      const text = trimBlankLines(Array.from(node.childNodes).map(n => serializeInline(n, false)).join(''));
      return '\n\n' + repeat('#', level) + ' ' + text + '\n\n';
    }
    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer' || tag === 'main') {
      const body = trimBlankLines(Array.from(node.childNodes).map(n => serializeInline(n, false)).join(''));
      if (!body) return '';
      return '\n\n' + body + '\n\n';
    }
    if (tag === 'blockquote') {
      const inner = trimBlankLines(Array.from(node.childNodes).map(n => serializeBlock(n, { ...ctx, inBlockquote: true })).join(''));
      const quoted = inner.split('\n').map(l => '> ' + l).join('\n');
      return '\n' + quoted + '\n\n';
    }
    if (tag === 'pre') {
      // Try to detect code language from class e.g. language-js
      let lang = '';
      const code = node.querySelector('code');
      let text = node.textContent || '';
      if (code) {
        const cls = code.getAttribute('class') || '';
        const m = cls.match(/language-([a-z0-9#+\-]+)/i) || cls.match(/lang(uage)?-?([a-z0-9#+\-]+)/i);
        if (m) lang = (m[1] && m[1] !== 'language' ? m[1] : (m[2] || '')).toLowerCase();
        text = code.textContent;
      }
      text = text.replace(/\n+$/,''); // trim trailing newlines
      return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
    }
    if (tag === 'ul' || tag === 'ol') {
      let i = 0;
      const items = Array.from(node.children).filter(el => el.tagName && el.tagName.toLowerCase() === 'li').map(li => {
        i++;
        const marker = tag === 'ol' ? (i + '.') : '-';
        const lines = trimBlankLines(Array.from(li.childNodes).map(n => {
          if (n.nodeType === Node.ELEMENT_NODE && (n.tagName.toLowerCase() === 'ul' || n.tagName.toLowerCase() === 'ol')) {
            return serializeBlock(n, { ...ctx, listIndent: ctx.listIndent + 1 });
          }
          // treat as inline for first paragraph
          return serializeBlock(n, ctx);
        }).join('')).split('\n');
        const ind = repeat('  ', ctx.listIndent);
        const first = `${ind}${marker} ${lines.shift() || ''}`;
        const rest = lines.map(l => `${ind}  ${l}`).join('\n');
        return [first, rest].filter(Boolean).join('\n');
      });
      return '\n' + items.join('\n') + '\n\n';
    }
    if (tag === 'li') {
      // Should be handled by parent list serializer
      return Array.from(node.childNodes).map(n => serializeBlock(n, ctx)).join('');
    }
    if (tag === 'table') {
      // Basic table conversion
      const rows = Array.from(node.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => trimBlankLines(serializeInline(td, true))));
      if (!rows.length) return '';
      const header = rows[0];
      const alignRow = header.map(() => '---');
      const body = rows.slice(1);
      let out = '|' + header.join('|') + '|\n|' + alignRow.join('|') + '|\n';
      body.forEach(r => { out += '|' + r.join('|') + '|\n'; });
      return out + '\n';
    }
    if (tag === 'hr') {
      return '\n\n---\n\n';
    }
    // default behavior:
    if (isBlock(node)) {
      const inner = trimBlankLines(Array.from(node.childNodes).map(n => serializeBlock(n, ctx)).join(''));
      return inner ? '\n\n' + inner + '\n\n' : '';
    }
    return serializeInline(node, false);
  }

  function htmlToMarkdown(container){
    // container is a Node containing HTML fragment
    let parts = Array.from(container.childNodes).map(n => serializeBlock(n, {listIndent:0, inBlockquote:false})).join('');
    parts = trimBlankLines(parts);
    // Normalize excessive blank lines
    parts = parts.replace(/\n{3,}/g, '\n\n');
    return parts;
  }

  // Expose globally
  window.__htmlToMarkdown = htmlToMarkdown;
})();
