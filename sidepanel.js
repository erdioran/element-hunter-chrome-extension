// Side Panel JavaScript
class SidePanelController {
    constructor() {
        this.isActive = false;
        this.elements = [];
        this.captureAndClick = true;
        this.currentLanguage = 'en';
        this.init();
        this.loadData();
        this.startPolling();
    }

    init() {
        // DOM elementleri
        this.statusIndicator = document.getElementById('statusIndicator');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.toggleText = document.getElementById('toggleText');
        this.clearBtn = document.getElementById('clearBtn');
        this.modeBtn = document.getElementById('modeBtn');
        this.modeText = document.getElementById('modeText');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.seleniumBtn = document.getElementById('seleniumBtn');
        this.elementsList = document.getElementById('elementsList');
        this.elementsCount = document.getElementById('elementsCount');
        this.noElements = document.getElementById('noElements');

        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleCapture());
        this.clearBtn.addEventListener('click', () => this.clearElements());
        this.modeBtn.addEventListener('click', () => this.toggleMode());
        this.downloadBtn.addEventListener('click', () => this.downloadJSON());
        this.seleniumBtn.addEventListener('click', () => this.downloadSeleniumFormat());

        // Language toggle
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
            });
        });
        
        // Developer modal
        this.developerBtn = document.getElementById('developerBtn');
        this.developerModal = document.getElementById('developerModal');
        this.closeDeveloperModal = document.getElementById('closeDeveloperModal');
        
        if (this.developerBtn) {
            this.developerBtn.addEventListener('click', () => this.showDeveloperModal());
        }
        
        if (this.closeDeveloperModal) {
            this.closeDeveloperModal.addEventListener('click', () => this.hideDeveloperModal());
        }
        
        // Close modal on outside click
        if (this.developerModal) {
            this.developerModal.addEventListener('click', (e) => {
                if (e.target === this.developerModal) {
                    this.hideDeveloperModal();
                }
            });
        }

        // Load saved language - default to English
        chrome.storage.local.get(['elementHunterLanguage'], (result) => {
            const savedLanguage = result.elementHunterLanguage || 'en'; // Default to English
            this.switchLanguage(savedLanguage);
        });
    }

    async loadData() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                // Get status from content script
                chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
                    if (response) {
                        this.isActive = response.isActive;
                        this.updateUI();
                    }
                });

                // Get elements from content script
                chrome.tabs.sendMessage(tab.id, { action: 'getElements' }, (response) => {
                    if (response && response.elements) {
                        this.elements = response.elements;
                        this.renderElements();
                    }
                });

                // Get mode from content script
                chrome.tabs.sendMessage(tab.id, { action: 'getMode' }, (response) => {
                    if (response) {
                        this.captureAndClick = response.captureAndClick;
                        this.updateModeButton();
                    }
                });
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    startPolling() {
        // Poll for updates every 2 seconds
        setInterval(() => {
            this.loadData();
        }, 2000);
    }

    async toggleCapture() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
                    if (response) {
                        this.isActive = response.active;
                        this.updateUI();
                    }
                });
            }
        } catch (error) {
            console.error('Error toggling capture:', error);
        }
    }

    async clearElements() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                chrome.tabs.sendMessage(tab.id, { action: 'clearElements' }, (response) => {
                    if (response && response.status === 'cleared') {
                        this.elements = [];
                        this.renderElements();
                    }
                });
            }
        } catch (error) {
            console.error('Error clearing elements:', error);
        }
    }

    async toggleMode() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                const newMode = !this.captureAndClick;
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'setCaptureMode', 
                    captureAndClick: newMode 
                }, (response) => {
                    if (response && response.status === 'mode_updated') {
                        this.captureAndClick = newMode;
                        this.updateModeButton();
                    }
                });
            }
        } catch (error) {
            console.error('Error toggling mode:', error);
        }
    }

    updateUI() {
        // Update status indicator
        if (this.isActive) {
            this.statusIndicator.classList.add('active');
            this.toggleBtn.className = 'btn btn-secondary';
            this.toggleBtn.innerHTML = `
                <span class="material-symbols-outlined">stop</span>
                <span>${this.getTranslation('stop')}</span>
            `;
        } else {
            this.statusIndicator.classList.remove('active');
            this.toggleBtn.className = 'btn btn-primary';
            this.toggleBtn.innerHTML = `
                <span class="material-symbols-outlined">play_arrow</span>
                <span>${this.getTranslation('start')}</span>
            `;
        }
        // Update clear button text
        const clearBtnText = document.getElementById('clearText');
        if (clearBtnText) {
            clearBtnText.textContent = this.getTranslation('clear');
        }
    }

    updateModeButton() {
        const modeKey = this.captureAndClick ? 'mode_highlight' : 'mode_capture';
        this.modeText.innerHTML = this.getTranslation(modeKey);
    }

    renderElements() {
        this.elementsCount.textContent = this.elements.length;

        if (this.elements.length === 0) {
            this.elementsList.innerHTML = `
                <div class="no-elements">
                    <div class="material-symbols-outlined">touch_app</div>
                    <div>${this.getTranslation('no_elements')}</div>
                </div>
            `;
            return;
        }

        // Show last 10 elements
        const recentElements = this.elements.slice(-10).reverse();
        
        this.elementsList.innerHTML = recentElements.map((element, index) => `
            <div class="element-item">
                <div class="element-name">${element.name}</div>
                <div class="element-selector">${this.truncateSelector(element.selector)}</div>
                <button class="copy-btn" onclick="sidePanelController.copySelector('${element.selector.replace(/'/g, "\\'")}', this)">
                    <span class="material-symbols-outlined" style="font-size: 12px;">content_copy</span>
                </button>
            </div>
        `).join('');
    }

    truncateSelector(selector) {
        if (selector.length > 60) {
            return selector.substring(0, 57) + '...';
        }
        return selector;
    }

    copySelector(selector, button) {
        navigator.clipboard.writeText(selector).then(() => {
            button.classList.add('copied');
            button.innerHTML = '<span class="material-symbols-outlined" style="font-size: 12px;">check</span>';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = '<span class="material-symbols-outlined" style="font-size: 12px;">content_copy</span>';
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = selector;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            button.innerHTML = '<span class="material-symbols-outlined" style="font-size: 12px;">check</span>';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = '<span class="material-symbols-outlined" style="font-size: 12px;">content_copy</span>';
            }, 2000);
        });
    }

    downloadJSON() {
        if (this.elements.length === 0) {
            alert(this.getTranslation('no_elements_download'));
            return;
        }

        chrome.storage.local.get(['elementHunterData'], (result) => {
            const currentUrl = result.elementHunterData?.url || window.location.href;
            
            const seleniumFormat = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    url: currentUrl,
                    totalElements: this.elements.length,
                    tool: 'Element Hunter v2.1.0'
                },
                elements: this.elements.map(element => {
                    const counts = element.counts || {};
                    const elementData = {
                        name: element.name,
                        tagName: element.tagName,
                        text: element.text,
                        timestamp: element.timestamp
                    };
                    
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
                    
                    if (Object.keys(counts).length > 0) {
                        selectors.counts = counts;
                    }
                    
                    elementData.selectors = selectors;
                    return elementData;
                })
            };

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
        if (this.elements.length === 0) {
            alert(this.getTranslation('no_elements_download'));
            return;
        }

        const seleniumFormat = {};
        
        this.elements.forEach(element => {
            let value, type;
            const counts = element.counts || {};
            
            if (element.attributes?.id && counts.id === 1) {
                value = element.attributes.id;
                type = 'id';
            }
            else if (element.attributes?.class && counts.className === 1) {
                value = element.attributes.class.split(' ')[0];
                type = 'className';
            }
            else if (element.selector && !element.selector.startsWith('/') && counts.cssSelector === 1) {
                value = element.selector;
                type = 'cssSelector';
            }
            else {
                value = element.xpath;
                type = 'xpath';
            }
            
            seleniumFormat[element.name] = { value, type };
        });

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

    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Save language preference
        chrome.storage.local.set({ elementHunterLanguage: lang });

        // Update all UI text
        this.updateLanguage();
    }

    updateLanguage() {
        // Update button texts
        document.getElementById('sectionTitle').textContent = this.getTranslation('recent_elements');
        document.getElementById('downloadText').textContent = this.getTranslation('download_json');
        document.getElementById('seleniumText').textContent = this.getTranslation('selenium_format');
        
        // Update developer modal
        this.updateDeveloperModal();
        
        // Update UI state
        this.updateUI();
        this.updateModeButton();
        this.renderElements();
    }

    updateDeveloperModal() {
        const modalTitle = document.querySelector('.developer-modal-title');
        const emailLabel = document.querySelector('.developer-info p:nth-child(2) strong');
        const githubLabel = document.querySelector('.developer-info p:nth-child(3) strong');
        const versionLabel = document.querySelector('.developer-info p:nth-child(4) strong');
        const description = document.querySelector('.developer-info p:last-child');
        
        if (modalTitle) modalTitle.textContent = this.getTranslation('about_developer');
        if (emailLabel) emailLabel.textContent = this.getTranslation('email') + ':';
        if (githubLabel) githubLabel.textContent = this.getTranslation('github') + ':';
        if (versionLabel) versionLabel.textContent = this.getTranslation('version') + ':';
        if (description) description.textContent = this.getTranslation('description');
    }

    showDeveloperModal() {
        if (this.developerModal) {
            this.developerModal.classList.add('show');
        }
    }

    hideDeveloperModal() {
        if (this.developerModal) {
            this.developerModal.classList.remove('show');
        }
    }

    getTranslation(key) {
        const translations = {
            en: {
                start: 'Start',
                stop: 'Stop',
                clear: 'Clear',
                mode_capture: 'Mode:<br>Capture Only',
                mode_highlight: 'Mode:<br>Capture & Click',
                download_json: 'JSON',
                selenium_format: 'Selenium',
                recent_elements: 'Captured Elements',
                no_elements: 'No elements captured yet.<br>Click on webpage elements to capture them.',
                no_elements_download: 'No elements to download!',
                about_developer: 'About Developer',
                developer_name: 'Erdi Oran',
                email: 'Email',
                github: 'GitHub',
                version: 'Version',
                description: 'Smart element capture extension for Selenium automation with advanced naming and target detection.'
            },
            tr: {
                start: 'Başlat',
                stop: 'Durdur',
                clear: 'Temizle',
                mode_capture: 'Mod:<br>Sadece Yakala',
                mode_highlight: 'Mod:<br>Yakala & Tıkla',
                download_json: 'JSON',
                selenium_format: 'Selenium',
                recent_elements: 'Yakalanan Elementler',
                no_elements: 'Henüz element yakalanmadı.<br>Web sayfasındaki elementlere tıklayın.',
                no_elements_download: 'İndirilecek element yok!',
                about_developer: 'Geliştirici Hakkında',
                developer_name: 'Erdi Oran',
                email: 'E-posta',
                github: 'GitHub',
                version: 'Sürüm',
                description: 'Gelişmiş isimlendirme ve hedef algılama ile Selenium otomasyonu için akıllı element yakalama uzantısı.'
            }
        };

        return translations[this.currentLanguage]?.[key] || translations.en[key] || key;
    }
}

// Initialize side panel controller
const sidePanelController = new SidePanelController();
