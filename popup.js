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

        // Feedback functionality
        document.getElementById('sendFeedbackBtn').addEventListener('click', () => {
            this.sendFeedback();
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

    sendFeedback() {
        const feedbackText = document.getElementById('feedbackText').value.trim();
        
        if (!feedbackText) {
            alert('Please enter your feedback before sending.');
            return;
        }

        // Create mailto link with feedback
        const subject = encodeURIComponent('Element Hunter Extension Feedback');
        const body = encodeURIComponent(`Feedback from Element Hunter Extension:\n\n${feedbackText}\n\n---\nExtension Version: 1.0\nBrowser: ${navigator.userAgent}`);
        const mailtoLink = `mailto:erdioran@gmail.com?subject=${subject}&body=${body}`;
        
        // Open email client
        window.open(mailtoLink);
        
        // Clear textarea and show confirmation
        document.getElementById('feedbackText').value = '';
        
        // Show temporary success message
        const btn = document.getElementById('sendFeedbackBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Sent!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#f59e0b';
        }, 2000);
    }

    updateUI() {
        // Status güncelle
        if (this.isActive) {
            this.statusDiv.className = 'status status-active';
            this.statusDiv.innerHTML = '🎯 Active - Click on elements';
            this.toggleBtn.textContent = 'Stop';
            this.toggleBtn.className = 'btn btn-secondary';
        } else {
            this.statusDiv.className = 'status status-inactive';
            this.statusDiv.innerHTML = '⏹️ Inactive - Click to start';
            this.toggleBtn.textContent = 'Start';
            this.toggleBtn.className = 'btn btn-primary';
        }

        // Element sayısını güncelle
        if (this.elementCount) {
            this.elementCount.textContent = this.elements.length;
        }

        // Element listesini güncelle
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

        elementsList.innerHTML = this.elements.map(element => {
            const counts = element.counts || {};
            let countsText = '';
            
            // Counts bilgisini oluştur
            const countEntries = [];
            if (counts.id) countEntries.push(`ID: ${counts.id}`);
            if (counts.className) countEntries.push(`Class: ${counts.className}`);
            if (counts.cssSelector) countEntries.push(`CSS: ${counts.cssSelector}`);
            if (counts.xpath) countEntries.push(`XPath: ${counts.xpath}`);
            
            if (countEntries.length > 0) {
                countsText = `<div class="element-details" style="margin-top: 4px;">Counts: ${countEntries.join(', ')}</div>`;
            }
            
            return `
                <div class="element-item">
                    <div class="element-name">${element.name}</div>
                    <div class="element-details">
                        <strong>${element.selectorType}:</strong> ${element.selector}
                    </div>
                    ${element.text ? `<div class="element-details" style="font-style: italic;">"${element.text}"</div>` : ''}
                    ${countsText}
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
