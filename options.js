// options.js

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apiKeyForm");
  var input = document.getElementById("apiKeyInput");
  var status = document.getElementById("status");
  var doubleClickCheckbox = document.getElementById("enableDoubleClick");
  var explanationCheckbox = document.getElementById("enableExplanation");

  // 保存済みの設定を読み込む
  chrome.storage.sync.get(["openaiApiKey", "enableDoubleClick", "enableExplanation"], function (data) {
    if (data.openaiApiKey) {
      input.value = data.openaiApiKey;
    }
    if (data.enableDoubleClick !== undefined) {
      doubleClickCheckbox.checked = data.enableDoubleClick;
    }
    if (data.enableExplanation !== undefined) {
      explanationCheckbox.checked = data.enableExplanation;
    }
  });

  // フォーム送信時の処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var apiKey = input.value.trim();
    var enableDoubleClick = doubleClickCheckbox.checked;
    var enableExplanation = explanationCheckbox.checked;
    
    chrome.storage.sync.set({ 
      openaiApiKey: apiKey,
      enableDoubleClick: enableDoubleClick,
      enableExplanation: enableExplanation
    }, function () {
      status.textContent = "保存しました。";
      setTimeout(function () {
        status.textContent = "";
      }, 2000);
    });
  });
});
