// Background Service Worker
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Element Hunter extension installed - Side Panel Mode Only');
    
    try {
        // Configure for side panel mode
        await chrome.action.setPopup({ popup: '' });
        
        // Set side panel to open on action click
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        
        console.log('Extension configured for side panel only');
    } catch (error) {
        console.error('Error configuring extension:', error);
    }
});

// Configure action on startup
chrome.runtime.onStartup.addListener(async () => {
    try {
        await chrome.action.setPopup({ popup: '' });
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('Extension startup - side panel mode configured');
    } catch (error) {
        console.error('Error on startup:', error);
    }
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

// Handle extension icon click - always open side panel
chrome.action.onClicked.addListener(async (tab) => {
    try {
        console.log('Extension icon clicked - opening side panel');
        
        // Enable side panel for this tab first
        await chrome.sidePanel.setOptions({
            tabId: tab.id,
            enabled: true,
            path: 'sidepanel.html'
        });
        
        // Then open it
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('Side panel opened successfully');
        
    } catch (error) {
        console.error('Error opening side panel:', error);
        
        // Fallback: try to set panel options globally
        try {
            await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
            console.log('Fallback: Set panel to open on action click');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSidePanel') {
        // Open side panel programmatically
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
        sendResponse({status: 'sidepanel_opened'});
    }
    // Remove UI mode switching - only side panel mode now
});
