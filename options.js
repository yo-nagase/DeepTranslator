// options.js

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("apiKeyForm");
  var input = document.getElementById("apiKeyInput");
  var status = document.getElementById("status");

  // 保存済みの API キーを読み込む
  chrome.storage.sync.get("openaiApiKey", function (data) {
    if (data.openaiApiKey) {
      input.value = data.openaiApiKey;
    }
  });

  // フォーム送信時の処理
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var apiKey = input.value.trim();
    chrome.storage.sync.set({ openaiApiKey: apiKey }, function () {
      status.textContent = "保存しました。";
      setTimeout(function () {
        status.textContent = "";
      }, 2000);
    });
  });
});
