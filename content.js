// グローバル変数を先頭で宣言
let globalSpeakButton = null;
let globalAudio = null;
let globalIsPlaying = false;

// 翻訳結果を表示するための要素を作成する関数
function createTranslationElement(originalText) {
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
    padding-right: 40px; // 閉じるボタン用のスペースを確保
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
    flex-grow: 1;
  `;

  // 読み上げボタンの作成
  const speakButton = document.createElement('button');
  speakButton.innerHTML = '🔊';
  speakButton.style.cssText = `
    border: none;
    background: none;
    cursor: pointer;
    font-size: 20px;
    padding: 0 10px;
    color: var(--chatgpt-text-color, #666);
    transition: opacity 0.2s;
    margin-right: 10px;
  `;
  speakButton.title = '原文を読み上げる';
  
  globalSpeakButton = speakButton;
  
  speakButton.onclick = () => {
    if (globalIsPlaying && globalAudio) {
      globalAudio.pause();
      globalAudio = null;
      globalIsPlaying = false;
      globalSpeakButton.innerHTML = '🔊';
      return;
    }

    globalSpeakButton.innerHTML = '⏳';
    chrome.runtime.sendMessage({ 
      action: "speak", 
      text: originalText 
    });
  };

  speakButton.onmouseover = () => {
    speakButton.style.opacity = '0.7';
  };
  
  speakButton.onmouseout = () => {
    speakButton.style.opacity = '1';
  };

  // ローディングアニメーションのスタイル
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #4CAF50;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    .dark-mode .loading-spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #4CAF50;
    }
  `;
  document.head.appendChild(style);

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
    container.classList.add('dark-mode');
  }

  // 要素を組み立て
  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(speakButton);
  header.appendChild(closeButton);
  container.appendChild(header);

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

// メッセージリスナーを1つにまとめる
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "showTranslation":
      // 既存の翻訳結果があれば削除
      const existingResult = document.getElementById('chatgpt-translation-result');
      if (existingResult) {
        existingResult.remove();
      }

      // 新しい翻訳結果を表示
      const container = createTranslationElement(message.originalText);
      
      // ローディングスピナーを追加
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'loading-spinner';
      
      const content = document.createElement('div');
      content.style.marginTop = '10px';
      content.textContent = '翻訳中...';
      content.appendChild(loadingSpinner);
      
      container.appendChild(content);
      document.body.appendChild(container);

      // 翻訳結果が来たら更新
      if (message.translation) {
        content.textContent = message.translation;
      }
      break;

    case "playAudio":
      try {
        // 受け取った配列をUint8Arrayに戻す
        const arrayBuffer = new Uint8Array(message.audioData);
        const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        
        if (globalAudio) {
          globalAudio.pause();
          URL.revokeObjectURL(globalAudio.src);
        }

        globalAudio = new Audio(url);
        
        globalAudio.onended = () => {
          globalIsPlaying = false;
          if (globalSpeakButton) {
            globalSpeakButton.innerHTML = '🔊';
          }
          URL.revokeObjectURL(url);
        };

        globalAudio.onerror = (e) => {
          console.error('Audio playback error:', e);
          if (globalSpeakButton) {
            globalSpeakButton.innerHTML = '🔊';
          }
          globalIsPlaying = false;
        };
        
        // 音声の読み込みを待ってから再生
        globalAudio.addEventListener('loadeddata', () => {
          globalAudio.play().then(() => {
            globalIsPlaying = true;
            if (globalSpeakButton) {
              globalSpeakButton.innerHTML = '⏸️';
            }
          }).catch(error => {
            console.error('Audio play error:', error);
            if (globalSpeakButton) {
              globalSpeakButton.innerHTML = '🔊';
            }
          });
        });
      } catch (error) {
        console.error('Audio processing error:', error);
        if (globalSpeakButton) {
          globalSpeakButton.innerHTML = '🔊';
        }
      }
      break;

    case "ttsError":
      console.error("TTS Error:", message.error);
      if (globalSpeakButton) {
        globalSpeakButton.innerHTML = '🔊';
      }
      break;
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