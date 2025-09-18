// Popup JavaScript
class PopupController {
    constructor() {
        this.isActive = false;
        this.elements = [];
        this.captureAndClick = true;
        this.init();
    }

    init() {
        // DOM elementleri
        this.statusDiv = document.getElementById('status');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.seleniumBtn = document.getElementById('seleniumBtn');
        this.modeBtn = document.getElementById('modeBtn');
        this.elementCount = document.getElementById('elementCount');
        this.elementList = document.getElementById('elementList');

        // Settings modal
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.closeModalBtn = document.getElementById('closeModal');
        this.languageButtons = document.querySelectorAll('.language-btn');
        
        // UI Mode toggle
        this.uiModeToggle = document.getElementById('uiModeToggle');
        this.currentUIMode = 'popup';

        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleHunting());
        this.clearBtn.addEventListener('click', () => this.clearElements());
        this.downloadBtn.addEventListener('click', () => this.downloadJSON());
        document.getElementById('seleniumBtn').addEventListener('click', () => {
            this.downloadSeleniumFormat();
        });

        // Settings modal functionality
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('settingsModal');
            if (event.target === modal) {
                this.hideModal();
            }
        });

        // Language functionality
        document.getElementById('langEnBtn').addEventListener('click', () => {
            this.setLanguage('en');
        });
        
        document.getElementById('langTrBtn').addEventListener('click', () => {
            this.setLanguage('tr');
        });
        this.modeBtn.addEventListener('click', () => this.toggleMode());

        // Language buttons
        this.languageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
                this.hideModal();
            });
        });
        
        // UI Mode toggle
        if (this.uiModeToggle) {
            this.uiModeToggle.addEventListener('click', () => this.toggleUIMode());
        }
        
        // Load UI mode preference
        this.loadUIMode();

        // Başlangıç durumunu yükle
        this.loadCurrentState();
    }

    async loadUIMode() {
        try {
            const result = await chrome.storage.local.get(['uiMode']);
            this.currentUIMode = result.uiMode || 'popup';
            this.updateUIModeButton();
        } catch (error) {
            console.error('Error loading UI mode:', error);
        }
    }

    updateUIModeButton() {
        if (this.uiModeToggle) {
            const isPopup = this.currentUIMode === 'popup';
            this.uiModeToggle.textContent = isPopup ? 'Switch to Side Panel' : 'Switch to Popup';
            this.uiModeToggle.className = isPopup ? 'ui-mode-btn popup-mode' : 'ui-mode-btn sidepanel-mode';
        }
    }

    async toggleUIMode() {
        try {
            const newMode = this.currentUIMode === 'popup' ? 'sidepanel' : 'popup';
            
            // Send message to background script to update UI mode
            chrome.runtime.sendMessage({
                action: 'setUIMode',
                mode: newMode
            }, (response) => {
                if (response && response.status === 'ui_mode_updated') {
                    this.currentUIMode = newMode;
                    this.updateUIModeButton();
                    
                    // If switching to sidepanel, close popup 
                    // Side panel will be opened automatically by background script
                    if (newMode === 'sidepanel') {
                        window.close();
                    }
                }
            });
        } catch (error) {
            console.error('Error toggling UI mode:', error);
        }
    }

    async loadCurrentState() {
        try {
            // Aktif tab'ı al
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // Content script'ten tüm durumu al
            const elementsResponse = await chrome.tabs.sendMessage(tab.id, {action: 'getElements'});
            const modeResponse = await chrome.tabs.sendMessage(tab.id, {action: 'getMode'});
            const statusResponse = await chrome.tabs.sendMessage(tab.id, {action: 'getStatus'});
            
            if (elementsResponse && elementsResponse.elements) {
                this.elements = elementsResponse.elements;
            }
            
            if (modeResponse) {
                this.captureAndClick = modeResponse.captureAndClick;
            }
            
            if (statusResponse) {
                this.isActive = statusResponse.isActive;
            }
            
            this.updateUI();
        } catch (error) {
            console.log('Content script henüz yüklenmemiş:', error);
            // Storage'dan durumu yükle
            this.loadFromStorage();
        }
    }

    async loadFromStorage() {
        try {
            const result = await chrome.storage.local.get(['elementHunterData']);
            if (result.elementHunterData) {
                const data = result.elementHunterData;
                
                // Veriler 1 saatten eski değilse yükle
                const oneHour = 60 * 60 * 1000;
                if (Date.now() - data.timestamp < oneHour) {
                    this.elements = data.elements || [];
                    this.captureAndClick = data.captureAndClick || false;
                    this.isActive = data.isActive || false;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Storage yükleme hatası:', error);
        }
    }

    async toggleHunting() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'toggle'});
            
            if (response) {
                this.isActive = response.active;
                this.updateUI();
            }
        } catch (error) {
            console.error('Toggle işlemi başarısız:', error);
            this.showError('Content script yüklenemedi. Sayfayı yenileyin.');
        }
    }

    async clearElements() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            await chrome.tabs.sendMessage(tab.id, {action: 'clearElements'});
            
            this.elements = [];
            this.updateUI();
        } catch (error) {
            console.error('Clear işlemi başarısız:', error);
        }
    }

    async toggleMode() {
        try {
            this.captureAndClick = !this.captureAndClick;
            
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            await chrome.tabs.sendMessage(tab.id, {
                action: 'setCaptureMode',
                captureAndClick: this.captureAndClick
            });
            
            this.updateUI();
        } catch (error) {
            console.error('Mod değiştirme başarısız:', error);
        }
    }

    downloadJSON() {
        if (this.elements.length === 0) {
            alert('İndirilecek element yok!');
            return;
        }

        // Get current URL from storage or fallback
        chrome.storage.local.get(['elementHunterData'], (result) => {
            const currentUrl = result.elementHunterData?.url || window.location.href;
            
            // JSON formatını düzenle - attributes kaldır, className/cssSelector ekle
            const seleniumFormat = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    url: currentUrl,
                    totalElements: this.elements.length,
                    tool: 'Element Hunter v2.0'
                },
                elements: this.elements.map(element => {
                    const counts = element.counts || {};
                    const elementData = {
                        name: element.name,
                        tagName: element.tagName,
                        text: element.text,
                        timestamp: element.timestamp
                    };
                    
                    // Selectors objesi oluştur
                    const selectors = {};
                    
                    if (element.attributes?.id) {
                        selectors.id = `#${element.attributes.id}`;
                    }
                    
                    if (element.attributes?.class) {
                        const classes = element.attributes.class.split(' ');
                        selectors.className = `.${classes[0]}`;
                    }
                    
                    if (element.selector && !element.selector.startsWith('/')) {
                        selectors.cssSelector = element.selector;
                    }
                    
                    if (element.xpath) {
                        selectors.xpath = element.xpath;
                    }
                    
                    // Counts bilgisi ekle
                    if (Object.keys(counts).length > 0) {
                        selectors.counts = counts;
                    }
                    
                    elementData.selectors = selectors;
                    return elementData;
                })
            };

            // JSON dosyasını indir
            const blob = new Blob([JSON.stringify(seleniumFormat, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `elements_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    downloadSeleniumFormat() {
        // Basit Selenium formatı - sadece elementler
        const seleniumFormat = {};
        
        this.elements.forEach(element => {
            // Benzersizlik kontrolü ile type belirle: id > className > cssSelector > xpath
            let value, type;
            const counts = element.counts || {};
            
            // 1. ID varsa ve benzersizse kullan
            if (element.attributes?.id && counts.id === 1) {
                value = element.attributes.id;
                type = 'id';
            }
            // 2. ClassName varsa ve benzersizse kullan
            else if (element.attributes?.class && counts.className === 1) {
                value = element.attributes.class.split(' ')[0];
                type = 'className';
            }
            // 3. CSS Selector benzersizse kullan
            else if (element.selector && !element.selector.startsWith('/') && counts.cssSelector === 1) {
                value = element.selector;
                type = 'cssSelector';
            }
            // 4. Son çare olarak XPath kullan
            else {
                value = element.xpath;
                type = 'xpath';
            }
            
            seleniumFormat[element.name] = { value, type };
        });

        // JSON dosyasını indir
        const blob = new Blob([JSON.stringify(seleniumFormat, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selenium_automation_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setLanguage(lang) {
        // Update active button immediately
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(lang === 'en' ? 'langEnBtn' : 'langTrBtn').classList.add('active');
        
        // Update modal language immediately
        this.updateModalLanguage(lang);
        
        // Save language preference
        chrome.storage.local.set({ language: lang });
        
        // Update UI language
        this.updateLanguage(lang);
    }

    updateLanguage(lang) {
        const translations = {
            en: {
                title: 'Element Hunter',
                status_inactive: '⏹️ Inactive - Click to start',
                status_active: '🎯 Active - Click elements to capture',
                start: 'Start',
                stop: 'Stop',
                clear: 'Clear',
                mode_capture: 'Mode:<br>Capture Only',
                mode_highlight: 'Mode:<br>Capture & Click',
                download_json: 'Download JSON',
                selenium_format: 'Automation Json',
                statistics: '📊 Statistics: Collected Elements',
                recent_elements: '📋 Recent Captured Elements',
                no_elements: 'No elements captured yet',
                instructions: '💡 Click on webpage elements to capture them. Captured elements are automatically saved in JSON format.',
                about_developer: 'About Developer',
                status_active_text: 'Active',
                status_inactive_text: 'Inactive'
            },
            tr: {
                title: 'Element Hunter',
                status_inactive: '⏹️ Pasif - Başlatmak için tıklayın',
                status_active: '🎯 Aktif - Elementleri yakalamak için tıklayın',
                start: 'Başlat',
                stop: 'Durdur',
                clear: 'Temizle',
                mode_capture: 'Mod:<br>Sadece Yakala',
                mode_highlight: 'Mod:<br>Yakala ve Tıkla',
                download_json: 'JSON İndir',
                selenium_format: 'Otomasyon Json',
                statistics: '📊 İstatistikler: Toplanan Element',
                recent_elements: '📋 Son Toplanan Elementler',
                no_elements: 'Henüz element yakalanmadı',
                instructions: '💡 Web sayfasındaki elementleri yakalamak için tıklayın. Yakalanan elementler otomatik olarak JSON formatında kaydedilir.',
                about_developer: 'Geliştirici Hakkında',
                status_active_text: 'Aktif',
                status_inactive_text: 'Pasif'
            }
        };

        const t = translations[lang];
        
        // Update all text elements
        document.querySelector('h1').textContent = t.title;
        
        // Update toggle button with proper styling
        const toggleBtn = document.getElementById('toggleBtn');
        toggleBtn.textContent = this.isActive ? t.stop : t.start;
        if (this.isActive) {
            toggleBtn.classList.add('stop');
        } else {
            toggleBtn.classList.remove('stop');
        }
        
        document.getElementById('clearBtn').textContent = t.clear;
        document.getElementById('modeBtn').innerHTML = this.captureAndClick ? t.mode_highlight : t.mode_capture;
        document.getElementById('downloadBtn').textContent = t.download_json;
        document.getElementById('seleniumBtn').textContent = t.selenium_format;
        const statsElement = document.querySelector('.stats');
        if (statsElement) {
            statsElement.innerHTML = `${t.statistics} <span id="elementCount">${this.elements.length}</span>`;
        }
        const elementsSectionH3 = document.querySelector('.elements-section h3');
        if (elementsSectionH3) {
            elementsSectionH3.textContent = t.recent_elements;
        }
        document.querySelector('.instructions').textContent = t.instructions;
        document.querySelector('.about-section h3').textContent = t.about_developer;
        
        // Update status
        if (!this.isActive) {
            this.statusDiv.innerHTML = t.status_inactive;
        } else {
            this.statusDiv.innerHTML = t.status_active;
        }
        
        // Update empty state
        if (this.elements.length === 0) {
            const elementsList = document.getElementById('elementsList');
            if (elementsList) {
                elementsList.innerHTML = `
                    <div style="text-align: center; color: #64748b; padding: 16px; font-size: 12px;">
                        ${t.no_elements}
                    </div>
                `;
            }
        }

        return t;
    }

    updateUI() {
        // Load saved language preferences
        chrome.storage.local.get(['language'], (result) => {
            const lang = result.language || 'en';
            this.updateLanguage(lang);
            
            // Update active language button
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(lang === 'en' ? 'langEnBtn' : 'langTrBtn').classList.add('active');
        });

        // Update status and buttons based on current state
        const statusText = document.getElementById('statusText');
        const toggleBtn = document.getElementById('toggleBtn');
        
        // Get current language for status text
        chrome.storage.local.get(['language'], (result) => {
            const lang = result.language || 'en';
            const translations = {
                en: {
                    status_active_text: 'Active',
                    status_inactive_text: 'Inactive',
                    start: 'Start',
                    stop: 'Stop'
                },
                tr: {
                    status_active_text: 'Aktif',
                    status_inactive_text: 'Pasif',
                    start: 'Başlat',
                    stop: 'Durdur'
                }
            };
            const t = translations[lang];
            
            if (this.isActive) {
                statusText.textContent = t.status_active_text;
                statusText.className = 'status-text';
                toggleBtn.textContent = t.stop;
                toggleBtn.className = 'btn btn-stop';
            } else {
                statusText.textContent = t.status_inactive_text;
                statusText.className = 'status-text inactive';
                toggleBtn.textContent = t.start;
                toggleBtn.className = 'btn btn-start';
            }
        });

        // Update element count
        if (this.elementCount) {
            this.elementCount.textContent = this.elements.length;
        }

        // Update element list
        this.updateElementList();
    }

    updateElementList() {
        const elementsList = document.getElementById('elementsList');
        if (!elementsList) return;

        if (this.elements.length === 0) {
            chrome.storage.local.get(['language'], (result) => {
                const lang = result.language || 'en';
                const noElementsText = lang === 'en' ? 'No elements captured yet' : 'Henüz element yakalanmadı';
                elementsList.innerHTML = `
                    <div style="text-align: center; color: #64748b; padding: 16px; font-size: 12px;">
                        ${noElementsText}
                    </div>
                `;
            });
            return;
        }

        // Show last 5 elements
        const recentElements = this.elements.slice(-5);
        elementsList.innerHTML = recentElements.map((element, index) => {
            // Determine best selector
            let selectorText = '';
            const counts = element.counts || {};
            
            if (element.attributes?.id && counts.id === 1) {
                selectorText = `id: #${element.attributes.id}`;
            } else if (element.attributes?.class && counts.className === 1) {
                selectorText = `class: .${element.attributes.class.split(' ')[0]}`;
            } else if (element.selector && !element.selector.startsWith('/') && counts.cssSelector === 1) {
                selectorText = `css: ${element.selector}`;
            } else {
                selectorText = `xpath: ${element.xpath}`;
            }

            return `
                <div class="element-item">
                    <div class="element-icon">
                        <span class="material-symbols-outlined">ads_click</span>
                    </div>
                    <div class="element-content">
                        <p class="element-name">${element.name}</p>
                        <p class="element-selector">${selectorText}</p>
                    </div>
                    <button class="copy-btn" data-selector="${selectorText}" title="Copy selector">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners to copy buttons
        setTimeout(() => {
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const selectorText = btn.getAttribute('data-selector');
                    this.copyElementValue(selectorText, btn);
                });
            });
        }, 100);
    }

    showModal() {
        document.getElementById('settingsModal').classList.add('show');
        
        // Load and set active language button
        chrome.storage.local.get(['language'], (result) => {
            const lang = result.language || 'en';
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(lang === 'en' ? 'langEnBtn' : 'langTrBtn').classList.add('active');
            
            // Update modal language
            this.updateModalLanguage(lang);
        });
    }

    hideModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    updateModalLanguage(lang) {
        const modalTranslations = {
            en: {
                modal_title: 'Element Hunter Settings',
                developer_about: 'About Developer'
            },
            tr: {
                modal_title: 'Element Hunter Ayarları',
                developer_about: 'Geliştirici Hakkında'
            }
        };

        const t = modalTranslations[lang];
        
        // Update modal title
        const modalTitle = document.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = t.modal_title;
        }
        
        // Update section titles
        const sectionTitles = document.querySelectorAll('.section-title');
        if (sectionTitles.length > 0) {
            sectionTitles[0].textContent = t.developer_about;
        }
        if (sectionTitles.length > 1) {
            sectionTitles[1].textContent = 'Dil / Language';
        }
    }

    copyElementValue(selectorText, buttonElement) {
        console.log('Copying:', selectorText);
        
        // Show success feedback immediately
        const icon = buttonElement.querySelector('.material-symbols-outlined');
        const originalIcon = icon.textContent;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(selectorText).then(() => {
                console.log('Copied successfully with clipboard API');
                icon.textContent = 'check';
                buttonElement.classList.add('copied');
                
                setTimeout(() => {
                    icon.textContent = originalIcon;
                    buttonElement.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Clipboard API failed:', err);
                this.fallbackCopy(selectorText, icon, originalIcon, buttonElement);
            });
        } else {
            // Use fallback method
            this.fallbackCopy(selectorText, icon, originalIcon, buttonElement);
        }
    }

    fallbackCopy(selectorText, icon, originalIcon, buttonElement) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = selectorText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log('Copied successfully with fallback method');
                icon.textContent = 'check';
                buttonElement.classList.add('copied');
                
                setTimeout(() => {
                    icon.textContent = originalIcon;
                    buttonElement.classList.remove('copied');
                }, 1500);
            } else {
                console.error('Fallback copy failed');
            }
        } catch (err) {
            console.error('All copy methods failed:', err);
        }
    }
}

// Global reference for onclick handlers
let popupController;

// Popup yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    popupController = new PopupController();
});
