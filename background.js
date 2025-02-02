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
    var endpoint = "https://api.openai.com/v1/chat/completions";
    var payload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたはプロの翻訳者です。以下のテキストを翻訳してください。" },
        { role: "user", content: text }
      ],
      temperature: 0.3
    };

    return fetch(endpoint, {
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
        return data.choices[0].message.content.trim();
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

    translateText(selectedText)
      .then(function (translation) {
        // 翻訳結果を通知で表示
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png", // 用意したアイコンファイル
          title: "翻訳結果",
          message: translation
        });
      })
      .catch(function (err) {
        console.error(err);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "翻訳エラー",
          message: err.toString()
        });
      });
  }
});

// メッセージリスナーを追加
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'translate') {
    translateText(request.text)
      .then(function (translation) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "翻訳結果",
          message: translation
        });
      })
      .catch(function (err) {
        console.error(err);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "翻訳エラー",
          message: err.toString()
        });
      });
  }
});
