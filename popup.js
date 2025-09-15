// Popup JavaScript
class PopupController {
    constructor() {
        this.isActive = false;
        this.elements = [];
        this.captureAndClick = false;
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

        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleHunting());
        this.clearBtn.addEventListener('click', () => this.clearElements());
        this.downloadBtn.addEventListener('click', () => this.downloadJSON());
        document.getElementById('seleniumBtn').addEventListener('click', () => {
            this.downloadSeleniumFormat();
        });

        // Settings modal functionality
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'block';
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('settingsModal');
            if (event.target === modal) {
                modal.style.display = 'none';
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

        // Başlangıç durumunu yükle
        this.loadCurrentState();
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

        // JSON formatını düzenle - attributes kaldır, className/cssSelector ekle
        const seleniumFormat = {
            metadata: {
                generatedAt: new Date().toISOString(),
                url: window.location?.href || 'unknown',
                totalElements: this.elements.length,
                tool: 'Element Hunter v1.0'
            },
            elements: this.elements.map(element => {
                const counts = element.counts || {};
                const elementData = {
                    name: element.name,
                    selectorType: element.selectorType,
                    tagName: element.tagName,
                    text: element.text
                };

                // Selector'ları ayrı objeler olarak ekle
                const selectors = [];
                
                if (element.selector) {
                    selectors.push({
                        cssSelector: element.selector,
                        counts: counts.cssSelector || 0
                    });
                }
                
                if (element.attributes?.id) {
                    selectors.push({
                        id: element.attributes.id,
                        counts: counts.id || 0
                    });
                }
                
                if (element.attributes?.class) {
                    selectors.push({
                        className: element.attributes.class,
                        counts: counts.className || 0
                    });
                }
                
                if (element.xpath) {
                    selectors.push({
                        xpath: element.xpath,
                        counts: counts.xpath || 0
                    });
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
    }

    downloadSeleniumFormat() {
        // Selenium Otomasyonu formatı
        const seleniumAutomationFormat = {};
        
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
                value = element.attributes.class.split(' ')[0]; // İlk class'ı al
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
            
            seleniumAutomationFormat[element.name] = {
                value: value,
                type: type
            };
        });

        const seleniumFormat = {
            metadata: {
                generatedAt: new Date().toISOString(),
                url: window.location?.href || 'unknown',
                totalElements: this.elements.length,
                tool: 'Element Hunter v1.0'
            },
            elements: seleniumAutomationFormat
        };

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
        // Save language preference
        chrome.storage.local.set({ language: lang });
        
        // Update UI language
        this.updateLanguage(lang);
        
        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(lang === 'en' ? 'langEnBtn' : 'langTrBtn').classList.add('active');
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
                mode_highlight: 'Mode:<br>Capture and Click',
                download_json: 'Download JSON',
                selenium_format: 'Selenium Automation Format',
                statistics: '📊 Statistics: Collected Elements',
                recent_elements: '📋 Recent Captured Elements',
                no_elements: 'No elements captured yet',
                instructions: '💡 Click on webpage elements to capture them. Captured elements are automatically saved in JSON format.',
                about_developer: 'About Developer'
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
                selenium_format: 'Selenium Otomasyonu Formatı',
                statistics: '📊 İstatistikler: Toplanan Element',
                recent_elements: '📋 Son Toplanan Elementler',
                no_elements: 'Henüz element yakalanmadı',
                instructions: '💡 Web sayfasındaki elementleri yakalamak için tıklayın. Yakalanan elementler otomatik olarak JSON formatında kaydedilir.',
                about_developer: 'Geliştirici Hakkında'
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
        document.querySelector('.stats').innerHTML = `${t.statistics} <span id="elementCount">${this.elements.length}</span>`;
        document.querySelector('.elements-section h3').textContent = t.recent_elements;
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
    }

    updateUI() {
        // Load saved language preference
        chrome.storage.local.get(['language'], (result) => {
            const lang = result.language || 'en';
            this.updateLanguage(lang);
            
            // Update active language button
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(lang === 'en' ? 'langEnBtn' : 'langTrBtn').classList.add('active');
        });

        // Update status and buttons based on current state
        if (this.isActive) {
            this.statusDiv.className = 'status active';
        } else {
            this.statusDiv.className = 'status inactive';
        }

        // Update toggle button styling immediately
        const toggleBtn = document.getElementById('toggleBtn');
        if (this.isActive) {
            toggleBtn.classList.add('stop');
        } else {
            toggleBtn.classList.remove('stop');
        }

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
            elementsList.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 16px; font-size: 12px;">
                    No elements captured yet
                </div>
            `;
            return;
        }

        // Son 5 elementi göster
        const recentElements = this.elements.slice(-5).reverse();
        
        elementsList.innerHTML = recentElements.map(element => {
            // En uygun selector'ı belirle
            let bestSelector = '';
            if (element.attributes?.id) {
                bestSelector = `id: #${element.attributes.id}`;
            } else if (element.attributes?.name) {
                bestSelector = `name: ${element.attributes.name}`;
            } else if (element.attributes?.class) {
                bestSelector = `class: .${element.attributes.class.split(' ')[0]}`;
            } else if (element.selector && !element.selector.startsWith('/')) {
                bestSelector = `css: ${element.selector}`;
            } else {
                bestSelector = `xpath: ${element.xpath}`;
            }
            
            return `
                <div class="element-item">
                    <div class="element-name">${element.name}</div>
                    <div class="element-selector">${bestSelector}</div>
                </div>
            `;
        }).join('');
    }

    showError(message) {
        this.statusDiv.className = 'status status-inactive';
        this.statusDiv.innerHTML = `❌ ${message}`;
    }
}

// Popup yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
