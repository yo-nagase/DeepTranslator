document.addEventListener('DOMContentLoaded', function() {
  const historyContainer = document.getElementById('historyContainer');
  const clearButton = document.getElementById('clearHistory');

  // 履歴を表示
  function displayHistory() {
    chrome.storage.local.get('translationHistory', function(data) {
      const history = data.translationHistory || [];
      
      if (history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-message">翻訳履歴はありません</div>';
        return;
      }

      historyContainer.innerHTML = history
        .reverse()
        .map((item, index) => `
          <div class="history-item" data-index="${index}">
            <div class="history-content">
              <div class="original-text">${item.originalText}</div>
              <div class="translated-text">${item.translation}</div>
              <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
            </div>
            <button class="delete-button" title="この履歴を削除">×</button>
          </div>
        `)
        .join('');
    });
  }

  // 特定のインデックスの履歴を削除
  function deleteHistoryItem(index) {
    chrome.storage.local.get('translationHistory', function(data) {
      const history = data.translationHistory || [];
      // reverse()で表示を逆順にしているため、削除するインデックスも逆から数える
      const actualIndex = history.length - 1 - index;
      history.splice(actualIndex, 1);
      chrome.storage.local.set({ translationHistory: history }, function() {
        displayHistory();
      });
    });
  }

  // 履歴クリア
  clearButton.addEventListener('click', function() {
    if (confirm('翻訳履歴を削除してもよろしいですか？')) {
      chrome.storage.local.remove('translationHistory', function() {
        displayHistory();
      });
    }
  });

  // 履歴アイテムクリック時の処理
  historyContainer.addEventListener('click', function(e) {
    // 削除ボタンがクリックされた場合
    if (e.target.classList.contains('delete-button')) {
      e.stopPropagation();
      const historyItem = e.target.closest('.history-item');
      const index = parseInt(historyItem.dataset.index);
      deleteHistoryItem(index);
      return;
    }

    // 履歴内容がクリックされた場合
    const historyContent = e.target.closest('.history-content');
    if (historyContent) {
      const historyItem = historyContent.closest('.history-item');
      if (historyItem) {
        chrome.tabs.create({
          url: chrome.runtime.getURL('detail.html') + 
            '?index=' + historyItem.dataset.index
        });
      }
    }
  });

  // 初期表示
  displayHistory();
}); 