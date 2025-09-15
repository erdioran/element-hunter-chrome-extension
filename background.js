// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Element Hunter extension yüklendi');
});

// Tab güncellendiğinde content script'i yeniden enjekte et
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(err => {
            // Hata durumunda sessizce devam et
            console.log('Content script enjekte edilemedi:', err);
        });
    }
});

// Extension icon'a tıklandığında popup'ı aç
chrome.action.onClicked.addListener((tab) => {
    chrome.action.openPopup();
});
