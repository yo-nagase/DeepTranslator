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
    max-height: calc(100vh - 40px);
    background: var(--chatgpt-bg-color, #ffffff);
    color: var(--chatgpt-text-color, #000000);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    font-size: 14px;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
  `;

  // ヘッダー部分の作成
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    margin: 0;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.2);
    padding-right: 40px;
    flex-shrink: 0;
  `;

  // アイコンの作成
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icon.png');
  icon.style.cssText = `
    width: 14px;
    height: 14px;
    margin-right: 6px;
  `;

  // タイトルの作成
  const title = document.createElement('span');
  title.textContent = '翻訳君';
  title.style.cssText = `
    font-weight: bold;
    font-size: 13px;
    flex-grow: 1;
  `;

  // 読み上げボタンの作成
  const speakButton = document.createElement('button');
  speakButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  `;
  speakButton.style.cssText = `
    border: none;
    background: none;
    cursor: pointer;
    padding: 0 8px;
    color: var(--chatgpt-text-color, #666);
    transition: opacity 0.2s;
    margin-right: 8px;
    display: flex;
    align-items: center;
    height: 24px;
  `;
  speakButton.title = '原文を読み上げる';
  
  globalSpeakButton = speakButton;
  
  speakButton.onclick = () => {
    if (globalIsPlaying && globalAudio) {
      globalAudio.pause();
      globalAudio = null;
      globalIsPlaying = false;
      globalSpeakButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      `;
      return;
    }

    globalSpeakButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M10 8v8l6-4-6-4z"/>
      </svg>
    `;
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
    top: 8px;
    right: 8px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--chatgpt-text-color, #666);
    padding: 4px;
    line-height: 1;
  `;
  closeButton.onclick = () => container.remove();

  // ダークモード検出とカラー設定
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    container.style.setProperty('--chatgpt-bg-color', '#2d2d2d');
    container.style.setProperty('--chatgpt-text-color', '#ffffff');
    container.classList.add('dark-mode');
  }

  // スクロール可能なコンテンツ領域を作成
  const scrollableContent = document.createElement('div');
  scrollableContent.style.cssText = `
    padding: 12px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
  `;

  // スクロールバーのスタイルを追加
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `
    #chatgpt-translation-result > div:last-child::-webkit-scrollbar {
      width: 8px;
    }
    
    #chatgpt-translation-result > div:last-child::-webkit-scrollbar-track {
      background: transparent;
    }
    
    #chatgpt-translation-result > div:last-child::-webkit-scrollbar-thumb {
      background-color: rgba(128, 128, 128, 0.3);
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    
    #chatgpt-translation-result > div:last-child::-webkit-scrollbar-thumb:hover {
      background-color: rgba(128, 128, 128, 0.5);
    }
    
    .dark-mode#chatgpt-translation-result > div:last-child::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    .dark-mode#chatgpt-translation-result > div:last-child::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
  `;
  document.head.appendChild(scrollbarStyle);

  // 要素を組み立て
  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(speakButton);
  header.appendChild(closeButton);
  container.appendChild(header);
  container.appendChild(scrollableContent);

  // 翻訳結果コンテナ
  const contentContainer = document.createElement('div');
  contentContainer.style.marginTop = '10px';
  scrollableContent.appendChild(contentContainer);

  // 解説ボタンの作成
  const explanationButton = document.createElement('button');
  explanationButton.style.cssText = `
    display: none;
    width: 100%;
    padding: 8px;
    margin-top: 12px;
    background: none;
    border: 1px solid var(--chatgpt-text-color, #666);
    border-radius: 4px;
    color: var(--chatgpt-text-color, #666);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  `;
  explanationButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: -2px;">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    解説を表示
  `;
  explanationButton.onmouseover = () => {
    explanationButton.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
  };
  explanationButton.onmouseout = () => {
    explanationButton.style.backgroundColor = 'transparent';
  };

  // 解説コンテナ
  const explanationContainer = document.createElement('div');
  explanationContainer.style.cssText = `
    display: none;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(128, 128, 128, 0.2);
    font-size: 13px;
    color: var(--chatgpt-text-color, #666);
  `;

  // 解説用のスタイルを追加
  const explanationStyle = document.createElement('style');
  explanationStyle.textContent = `
    .explanation h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 12px 0 8px;
      color: var(--chatgpt-text-color, #444);
    }
    
    .explanation h3:first-child {
      margin-top: 0;
    }
    
    .explanation ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .explanation li {
      margin: 4px 0;
      line-height: 1.5;
    }
    
    .explanation li strong {
      color: var(--chatgpt-text-color, #444);
    }
    
    .dark-mode .explanation h3 {
      color: var(--chatgpt-text-color, #ccc);
    }
    
    .dark-mode .explanation li strong {
      color: var(--chatgpt-text-color, #ddd);
    }
  `;
  document.head.appendChild(explanationStyle);

  scrollableContent.appendChild(contentContainer);
  scrollableContent.appendChild(explanationButton);
  scrollableContent.appendChild(explanationContainer);

  let isExplanationVisible = false;
  explanationButton.onclick = () => {
    isExplanationVisible = !isExplanationVisible;
    explanationContainer.style.display = isExplanationVisible ? 'block' : 'none';
    explanationButton.innerHTML = isExplanationVisible ? `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: -2px;">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      解説を隠す
    ` : `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: -2px;">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      解説を表示
    `;
  };

  return {
    container,
    contentContainer,
    explanationButton,
    explanationContainer
  };
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
      const existingResult = document.getElementById('chatgpt-translation-result');
      if (existingResult) {
        existingResult.remove();
      }

      const elements = createTranslationElement(message.originalText);
      
      if (!message.translation) {
        // ローディング表示
        elements.contentContainer.textContent = '翻訳中...';
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        elements.contentContainer.appendChild(loadingSpinner);
      } else {
        // 翻訳結果と解説を表示
        elements.contentContainer.textContent = message.translation;
        if (message.explanation) {
          elements.explanationButton.style.display = 'block';
          elements.explanationContainer.innerHTML = message.explanation;
        }
      }
      
      document.body.appendChild(elements.container);
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
            globalSpeakButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            `;
          }
          URL.revokeObjectURL(url);
        };

        globalAudio.onerror = (e) => {
          console.error('Audio playback error:', e);
          if (globalSpeakButton) {
            globalSpeakButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            `;
          }
          globalIsPlaying = false;
        };
        
        // 音声の読み込みを待ってから再生
        globalAudio.addEventListener('loadeddata', () => {
          globalAudio.play().then(() => {
            globalIsPlaying = true;
            if (globalSpeakButton) {
              globalSpeakButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              `;
            }
          }).catch(error => {
            console.error('Audio play error:', error);
            if (globalSpeakButton) {
              globalSpeakButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              `;
            }
          });
        });
      } catch (error) {
        console.error('Audio processing error:', error);
        if (globalSpeakButton) {
          globalSpeakButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          `;
        }
      }
      break;

    case "ttsError":
      console.error("TTS Error:", message.error);
      if (globalSpeakButton) {
        globalSpeakButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        `;
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