// background.js

/**
 * chrome.storage.sync から保存された API キーを取得する関数
 * @returns {Promise<string>}
 */
function getApiKey() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get("openaiApiKey", function (data) {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      var apiKey = data.openaiApiKey;
      if (!apiKey) {
        return reject(new Error("API キーが設定されていません。オプションページから設定してください。"));
      }
      resolve(apiKey);
    });
  });
}

/**
 * 選択テキストを ChatGPT API に送信して翻訳を依頼する関数
 * @param {string} text - 翻訳したいテキスト
 * @returns {Promise<{translation: string, explanation: string}>} - 翻訳結果と解説
 */
function translateText(text) {
  return getApiKey().then(function (apiKey) {
    return new Promise((resolve, reject) => {
      const systemPrompt = `あなたはプロの翻訳者です。以下のテキストを翻訳し、その後に翻訳の解説を追加してください。
解説は以下の項目を含めてHTML形式で返してください：

[翻訳]
{翻訳文}

[解説]
<div class="explanation">
  <h3>重要な単語・表現</h3>
  <ul>
    {原文に含まれる重要な英単語や英語表現について、以下の形式で説明}
    <li><strong>英単語・表現</strong> - 意味、用法、ニュアンスの説明</li>
    例：
    <li><strong>take into account</strong> - 考慮に入れる。「consider」よりも形式的な表現で、ビジネスなどで使用。</li>
  </ul>
  
  <h3>文法・構文</h3>
  <ul>
    <li>使用されている文法や構文の説明</li>
  </ul>

  {文化的な背景や注意点がある場合のみ}
  <h3>文化的背景・注意点</h3>
  <ul>
    <li>英語圏での使用状況、文化的な違いなどの説明</li>
  </ul>
</div>

重要な単語・表現の解説では：
- 原文の英単語や英語表現を<strong>タグで囲んで強調
- カジュアル/フォーマル、ビジネス/一般的、アメリカ/イギリスなどの使用場面の違いも説明
- 類似表現との違いやニュアンスの違いも説明
- 慣用句の場合は、その由来や使用状況も説明`;

      var endpoint = "https://api.openai.com/v1/chat/completions";
      var payload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `翻訳対象テキスト: ${text}\n\n以下の形式で返してください：\n[翻訳]\n{翻訳文}\n\n[解説]\n{解説文}`
          }
        ],
        temperature: 0.3
      };

      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTPエラー: " + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          const content = data.choices[0].message.content.trim();
          const parts = content.split('[解説]');
          const translation = parts[0].replace('[翻訳]', '').trim();
          const explanation = parts[1] ? parts[1].trim() : '';

          resolve({
            translation: translation,
            explanation: explanation
          });
        })
        .catch(reject);
    });
  });
}

/**
 * OpenAI TTS APIを使用してテキストを音声に変換する関数
 * @param {string} text - 読み上げるテキスト
 * @returns {Promise<ArrayBuffer>} - 音声データ
 */
async function textToSpeech(text) {
  const apiKey = await getApiKey();
  const endpoint = "https://api.openai.com/v1/audio/speech";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy"
    })
  });

  if (!response.ok) {
    throw new Error(`音声生成エラー: ${response.status}`);
  }

  return await response.arrayBuffer();
}

// 拡張機能のインストール時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  }

  chrome.contextMenus.create({
    id: "translateText",
    title: "ChatGPTで翻訳する",
    contexts: ["selection"]  // 選択したテキストがある場合にメニュー表示
  });
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "translateText") {
    var selectedText = info.selectionText;
    if (!selectedText) return;

    // まずローディング表示を送信
    chrome.tabs.sendMessage(tab.id, {
      action: "showTranslation",
      translation: null,
      originalText: selectedText
    });

    translateText(selectedText)
      .then(function (result) {
        chrome.tabs.sendMessage(tab.id, {
          action: "showTranslation",
          translation: result.translation,
          explanation: result.explanation,
          originalText: selectedText
        });
      })
      .catch(function (err) {
        console.error(err);
        chrome.tabs.sendMessage(tab.id, {
          action: "showTranslation",
          translation: "エラーが発生しました: " + err.toString(),
          originalText: selectedText
        });
      });
  }
});

// メッセージリスナーを修正
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "speak":
      textToSpeech(message.text)
        .then(audioData => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "playAudio",
            audioData: Array.from(new Uint8Array(audioData))
          });
        })
        .catch(error => {
          console.error("TTS error:", error);
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "ttsError",
            error: error.message
          });
        });
      return true;

    case "translate":
      // まずローディング表示を送信
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "showTranslation",
        translation: null,
        originalText: message.text
      });

      translateText(message.text)
        .then(function (result) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTranslation",
            translation: result.translation,
            explanation: result.explanation,
            originalText: message.text
          });
        })
        .catch(function (err) {
          console.error(err);
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTranslation",
            translation: "エラーが発生しました: " + err.toString(),
            originalText: message.text
          });
        });
      return true;
  }
});

// コマンドのリスナーを追加
chrome.commands.onCommand.addListener((command) => {
  if (command === "translate-selection") {
    // アクティブなタブを取得して翻訳を実行
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "shortcutPressed"
      });
    });
  }
});
