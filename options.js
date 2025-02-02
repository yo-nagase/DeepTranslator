// options.js

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apiKeyForm");
  var input = document.getElementById("apiKeyInput");
  var status = document.getElementById("status");
  var doubleClickCheckbox = document.getElementById("enableDoubleClick");
  var explanationCheckbox = document.getElementById("enableExplanation");
  var modelSelect = document.getElementById("modelSelect");

  // 保存済みの設定を読み込む
  chrome.storage.sync.get(["openaiApiKey", "enableDoubleClick", "enableExplanation", "model"], function (data) {
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
  });

  // フォーム送信時の処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var apiKey = input.value.trim();
    var enableDoubleClick = doubleClickCheckbox.checked;
    var enableExplanation = explanationCheckbox.checked;
    var selectedModel = modelSelect.value;

    chrome.storage.sync.set({
      openaiApiKey: apiKey,
      enableDoubleClick: enableDoubleClick,
      enableExplanation: enableExplanation,
      model: selectedModel
    }, function () {
      status.textContent = "保存しました。";
      setTimeout(function () {
        status.textContent = "";
      }, 2000);
    });
  });
});
