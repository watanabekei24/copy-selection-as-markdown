
# Copy Selection as Markdown (Chrome Extension)

この拡張機能は、Webページ上でテキストや要素を選択してコピーしたときに、選択範囲を **Markdown** としてクリップボードに書き込みます。

- 見出し（h1〜h6）、リンク、画像、箇条書き/番号付きリスト、`pre/code`、引用、表などの一般的な要素に対応。
- 入力欄（`input`/`textarea`/`contenteditable`）内のコピーは邪魔しません（通常のコピーになります）。
- クリップボードには `text/markdown` と `text/plain` の両方で書き込みます。

> 注意: 100% 完全な変換ではありません。サイト固有の複雑な装飾は Markdown に簡略化されます。

## インストール手順（開発者モード）

1. このフォルダをZIPでダウンロードして解凍、またはそのまま保存します。
2. Chromeで `chrome://extensions` を開き、右上の **デベロッパーモード** をオンにします。
3. **パッケージ化されていない拡張機能を読み込む** をクリックし、この拡張機能フォルダを選択します。

## 使い方

- Webページ上でコピー（`Cmd/Ctrl + C` 、右クリック -> コピー）すると、選択範囲が Markdown としてクリップボードに入ります。
- エディタや入力欄内のコピーは、そのまま通常のコピーです。

## 既知の制限 / カスタマイズ

- さらに網羅的な変換をしたい場合は、`html_to_markdown.js` を置き換えたり、ルールを追加してください。
- 一時的に無効化したい場合は、`chrome://extensions` でトグルしてオフにしてください。

## ファイル構成

- `manifest.json` … Chrome 拡張.Manifest v3
- `content.js` … コピーイベントをフックして Markdown を生成・書き込み
- `html_to_markdown.js` … HTML→Markdown の軽量コンバータ
- `icon*.png` … アイコン
