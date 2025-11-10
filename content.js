// content.js - Only responds to the Alt+C command; does not intercept normal copy.
(function () {
  function inEditable(el) {
    if (!el) return false;
    if (el.tagName) {
      const tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return true;
    }
    if (el.isContentEditable) return true;
    return el.parentElement ? inEditable(el.parentElement) : false;
  }

  async function copySelectionAsMarkdown() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    // 入力欄内は素通り（何もしない）
    const anchorNode = sel.anchorNode;
    const anchorEl = anchorNode instanceof Element ? anchorNode : anchorNode && anchorNode.parentElement;
    if (inEditable(anchorEl)) return;

    // 選択範囲をクローンしてHTML→Markdown
    const range = sel.getRangeAt(0);
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());

    let md = "";
    if (window.__htmlToMarkdown) {
      md = window.__htmlToMarkdown(container);
    } else {
      md = container.textContent || "";
    }
    if (!md) return;

    // クリップボードへ書き込み（イベント無しでも動く書き方）
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          "text/markdown": new Blob([md], { type: "text/markdown" }),
          "text/plain": new Blob([md], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        // フォールバック（古い環境向け）
        const textarea = document.createElement("textarea");
        textarea.value = md;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (e) {
      // フォールバック（許可ダイアログ等で失敗した場合）
      const textarea = document.createElement("textarea");
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  // ★ここが呼び出し口（Alt+C で background.js から届く）
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === "copyMarkdown") {
      copySelectionAsMarkdown();
    }
  });

  // 必要ならグローバルにも公開（他スクリプトから呼びたい場合）
  window.copySelectionAsMarkdown = copySelectionAsMarkdown;
})();