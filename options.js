// options.js

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apiKeyForm");
  var input = document.getElementById("apiKeyInput");
  var status = document.getElementById("status");
  var doubleClickCheckbox = document.getElementById("enableDoubleClick");

  // 保存済みの設定を読み込む
  chrome.storage.sync.get(["openaiApiKey", "enableDoubleClick"], function (data) {
    if (data.openaiApiKey) {
      input.value = data.openaiApiKey;
    }
    if (data.enableDoubleClick !== undefined) {
      doubleClickCheckbox.checked = data.enableDoubleClick;
    }
  });

  // フォーム送信時の処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var apiKey = input.value.trim();
    var enableDoubleClick = doubleClickCheckbox.checked;
    
    chrome.storage.sync.set({ 
      openaiApiKey: apiKey,
      enableDoubleClick: enableDoubleClick 
    }, function () {
      status.textContent = "保存しました。";
      setTimeout(function () {
        status.textContent = "";
      }, 2000);
    });
  });
});
