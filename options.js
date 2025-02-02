// options.js

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apiKeyForm");
  var input = document.getElementById("apiKeyInput");
  var status = document.getElementById("status");
  var doubleClickCheckbox = document.getElementById("enableDoubleClick");
  var explanationCheckbox = document.getElementById("enableExplanation");
  var modelSelect = document.getElementById("modelSelect");

  // 保存済みの設定を読み込む
  chrome.storage.sync.get([
    "openaiApiKey", 
    "enableDoubleClick", 
    "showOriginalText",
    "model"
  ], function (data) {
    if (data.openaiApiKey) {
      input.value = data.openaiApiKey;
    }
    doubleClickCheckbox.checked = !!data.enableDoubleClick; // デフォルトはfalse
    if (data.enableExplanation !== undefined) {
      explanationCheckbox.checked = data.enableExplanation;
    }
    if (data.model) {
      modelSelect.value = data.model;
    } else {
      modelSelect.value = "gpt-4o-mini"; // デフォルト値
    }
    // デフォルトはtrue
    const showOriginalCheckbox = document.getElementById('showOriginalText');
    showOriginalCheckbox.checked = data.showOriginalText !== false;
  });

  // フォーム送信時の処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var apiKey = input.value.trim();
    var enableDoubleClick = doubleClickCheckbox.checked;
    var showOriginalText = document.getElementById('showOriginalText').checked;
    var selectedModel = modelSelect.value;

    // APIキーのバリデーション
    if (!apiKey) {
      status.textContent = "APIキーを入力してください";
      status.style.color = "#f44336";
      return;
    }

    chrome.storage.sync.set({
      openaiApiKey: apiKey,
      enableDoubleClick: enableDoubleClick,
      showOriginalText: showOriginalText,
      model: selectedModel
    }, function () {
      if (chrome.runtime.lastError) {
        status.textContent = "エラー: " + chrome.runtime.lastError.message;
        status.style.color = "#f44336";
        return;
      }
      status.textContent = "保存しました。";
      status.style.color = "#4CAF50";
      setTimeout(function () {
        status.textContent = "";
      }, 2000);
    });
  });
});
