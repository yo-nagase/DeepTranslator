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
 * @returns {Promise<string>} - 翻訳結果の文字列
 */
function translateText(text) {
  return getApiKey().then(function (apiKey) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get("enableExplanation", function (data) {
        var systemPrompt = data.enableExplanation
          ? "あなたはプロの翻訳者です。以下のテキストを翻訳してください。"
          : "あなたはプロの翻訳者です。以下のテキストを翻訳し、その後に翻訳の解説（言い回しの違いや文化的な違いなど）を追加してください。解説は「【解説】」という見出しの後に記述してください。"

        var endpoint = "https://api.openai.com/v1/chat/completions";
        var payload = {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
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
            resolve(data.choices[0].message.content.trim());
          })
          .catch(reject);
      });
    });
  });
}

// 拡張機能のインストール時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(function () {
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
      translation: null
    });

    translateText(selectedText)
      .then(function (translation) {
        // 翻訳結果を送信
        chrome.tabs.sendMessage(tab.id, {
          action: "showTranslation",
          translation: translation
        });
      })
      .catch(function (err) {
        console.error(err);
        chrome.tabs.sendMessage(tab.id, {
          action: "showTranslation",
          translation: "エラーが発生しました: " + err.toString()
        });
      });
  }
});
