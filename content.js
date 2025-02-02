// 翻訳結果を表示するための要素を作成する関数
function createTranslationElement() {
  const container = document.createElement('div');
  container.id = 'chatgpt-translation-result';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    padding: 15px;
    background: var(--chatgpt-bg-color, #ffffff);
    color: var(--chatgpt-text-color, #000000);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    font-size: 14px;
    line-height: 1.5;
  `;

  // ヘッダー部分の作成
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  `;

  // アイコンの作成
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icon.png');
  icon.style.cssText = `
    width: 20px;
    height: 20px;
    margin-right: 8px;
  `;

  // タイトルの作成
  const title = document.createElement('span');
  title.textContent = '翻訳君';
  title.style.cssText = `
    font-weight: bold;
    font-size: 16px;
  `;

  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--chatgpt-text-color, #666);
    padding: 5px;
    line-height: 1;
  `;
  closeButton.onclick = () => container.remove();

  // ダークモード検出とカラー設定
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    container.style.setProperty('--chatgpt-bg-color', '#2d2d2d');
    container.style.setProperty('--chatgpt-text-color', '#ffffff');
  }

  // 要素を組み立て
  header.appendChild(icon);
  header.appendChild(title);
  container.appendChild(header);
  container.appendChild(closeButton);

  return container;
}

// ダークモードの変更を監視
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addListener((e) => {
  const container = document.getElementById('chatgpt-translation-result');
  if (container) {
    if (e.matches) {
      container.style.setProperty('--chatgpt-bg-color', '#2d2d2d');
      container.style.setProperty('--chatgpt-text-color', '#ffffff');
    } else {
      container.style.setProperty('--chatgpt-bg-color', '#ffffff');
      container.style.setProperty('--chatgpt-text-color', '#000000');
    }
  }
});

// メッセージリスナーを設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showTranslation") {
    // 既存の翻訳結果があれば削除
    const existingResult = document.getElementById('chatgpt-translation-result');
    if (existingResult) {
      existingResult.remove();
    }

    // 新しい翻訳結果を表示
    const container = createTranslationElement();
    const content = document.createElement('div');
    content.style.marginTop = '10px';
    content.textContent = message.translation;
    container.appendChild(content);
    document.body.appendChild(container);
  }
});

// ダブルクリックイベントのリスナーを設定
chrome.storage.sync.get('enableDoubleClick', function(data) {
  if (data.enableDoubleClick) {
    document.addEventListener('dblclick', function() {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        chrome.runtime.sendMessage({ 
          action: 'translate', 
          text: selectedText 
        });
      }
    });
  }
}); 