// ダブルクリックイベントのリスナーを設定
chrome.storage.sync.get('enableDoubleClick', function(data) {
  if (data.enableDoubleClick) {
    document.addEventListener('dblclick', function() {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        chrome.runtime.sendMessage({ 
          action: 'translate', 
          text: selectedText 
        });
      }
    });
  }
}); 