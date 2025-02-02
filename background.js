// ※ OpenAI の API キーを以下にセットしてください
const OPENAI_API_KEY = "YOUR_API_KEY_HERE";

// 拡張機能インストール時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateText",
    title: "ChatGPTで翻訳する",
    contexts: ["selection"]  // 選択したテキストがある場合にメニュー表示
  });
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateText") {
    const selectedText = info.selectionText;
    if (!selectedText) return;

    // ChatGPT API にテキストを投げて翻訳結果を取得
    translateText(selectedText)
      .then(translation => {
        // 翻訳結果を通知で表示
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png", // 事前に用意したアイコンファイル
          title: "翻訳結果",
          message: translation
        });
      })
      .catch(err => {
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

/**
 * 選択テキストを ChatGPT API に送信して翻訳を依頼する関数
 * @param {string} text - 翻訳したいテキスト
 * @returns {Promise<string>} - 翻訳結果の文字列
 */
async function translateText(text) {
  const endpoint = "https://api.openai.com/v1/chat/completions";

  // API に送信するペイロード。ここではシンプルに「翻訳してください」と依頼しています。
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "あなたはプロの翻訳者です。以下のテキストを翻訳してください。" },
      { role: "user", content: text }
    ],
    temperature: 0.3
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTPエラー: ${response.status}`);
  }

  const data = await response.json();
  // API のレスポンスから翻訳結果を取り出す
  return data.choices[0].message.content.trim();
}
