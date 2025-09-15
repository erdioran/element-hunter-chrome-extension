// Element Hunter Content Script
class ElementHunter {
    constructor() {
        this.isActive = false;
        this.elements = [];
        this.elementCounter = 1;
        this.overlay = null;
        this.captureAndClick = false; // Yeni mod: element yakala VE tıklama işlemini yap
        this.init();
        this.loadFromStorage(); // Sayfa yüklendiğinde storage'dan yükle
    }

    init() {
        // Extension aktif durumunu dinle
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                this.toggle();
                sendResponse({status: 'toggled', active: this.isActive});
            } else if (request.action === 'getElements') {
                sendResponse({elements: this.elements});
            } else if (request.action === 'clearElements') {
                this.elements = [];
                this.elementCounter = 1;
                this.saveToStorage();
                sendResponse({status: 'cleared'});
            } else if (request.action === 'setCaptureMode') {
                this.captureAndClick = request.captureAndClick;
                this.saveToStorage();
                this.updateOverlay();
                sendResponse({status: 'mode_updated', captureAndClick: this.captureAndClick});
            } else if (request.action === 'getMode') {
                sendResponse({captureAndClick: this.captureAndClick});
            } else if (request.action === 'getStatus') {
                sendResponse({isActive: this.isActive});
            }
        });
    }

    toggle() {
        this.isActive = !this.isActive;
        this.saveToStorage();
        if (this.isActive) {
            this.startHunting();
        } else {
            this.stopHunting();
        }
    }

    startHunting() {
        // Overlay oluştur
        this.createOverlay();
        
        // Click event listener ekle
        document.addEventListener('click', this.handleClick.bind(this), true);
        
        // Hover effect için mouseover listener
        document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
    }

    stopHunting() {
        // Event listener'ları kaldır
        document.removeEventListener('click', this.handleClick.bind(this), true);
        document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
        document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
        
        // Overlay'i kaldır
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Hover effect'leri temizle
        this.clearHoverEffects();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'element-hunter-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        this.overlay.innerHTML = `
            <div>🎯 Element Hunter Aktif</div>
            <div style="font-size: 12px; margin-top: 5px;">
                Mod: ${this.captureAndClick ? 'Yakala & Tıkla' : 'Sadece Yakala'}
            </div>
            <div style="font-size: 12px; margin-top: 2px;">
                Toplanan: ${this.elements.length} element
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    updateOverlay() {
        if (this.overlay) {
            this.overlay.innerHTML = `
                <div>🎯 Element Hunter Aktif</div>
                <div style="font-size: 12px; margin-top: 5px;">
                    Mod: ${this.captureAndClick ? 'Yakala & Tıkla' : 'Sadece Yakala'}
                </div>
                <div style="font-size: 12px; margin-top: 2px;">
                    Toplanan: ${this.elements.length} element
                </div>
            `;
        }
    }

    handleClick(event) {
        const element = event.target;
        const elementInfo = this.extractElementInfo(element);
        
        // Element zaten var mı kontrol et
        const exists = this.elements.some(el => 
            el.selector === elementInfo.selector && 
            el.text === elementInfo.text
        );
        
        if (!exists) {
            this.elements.push(elementInfo);
            this.saveToStorage(); // Element eklendiğinde kaydet
            this.updateOverlay();
            
            // Visual feedback
            this.showClickFeedback(element);
            
            console.log('Element Hunter - Yeni element eklendi:', elementInfo);
        }
        
        // Mod kontrolü: Sadece yakala modunda tıklamayı engelle
        if (!this.captureAndClick) {
            event.preventDefault();
            event.stopPropagation();
        }
        // captureAndClick true ise, normal tıklama işlemi devam eder
    }

    handleMouseOver(event) {
        const element = event.target;
        if (element.id !== 'element-hunter-overlay' && !element.closest('#element-hunter-overlay')) {
            element.style.outline = '2px solid #FF5722';
            element.style.backgroundColor = 'rgba(255, 87, 34, 0.1)';
        }
    }

    handleMouseOut(event) {
        const element = event.target;
        if (element.id !== 'element-hunter-overlay' && !element.closest('#element-hunter-overlay')) {
            element.style.outline = '';
            element.style.backgroundColor = '';
        }
    }

    clearHoverEffects() {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            el.style.outline = '';
            el.style.backgroundColor = '';
        });
    }

    showClickFeedback(element) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: absolute;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            animation: fadeOut 2s forwards;
        `;
        feedback.textContent = '✓ Element yakalandı!';
        
        const rect = element.getBoundingClientRect();
        feedback.style.left = (rect.left + window.scrollX) + 'px';
        feedback.style.top = (rect.top + window.scrollY - 30) + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }

    extractElementInfo(element) {
        const elementInfo = {
            timestamp: new Date().toISOString(),
            tagName: element.tagName.toLowerCase(),
            text: this.getElementText(element),
            attributes: this.getElementAttributes(element),
            selector: this.getBestSelector(element),
            selectorType: this.getSelectorType(element),
            xpath: this.getXPath(element),
            name: this.generateElementName(element),
            counts: this.getElementCounts(element)
        };

        return elementInfo;
    }

    getBestSelector(element) {
        // Öncelik sırası: id > name > className > data-* > xpath
        
        // 1. ID varsa kullan
        if (element.id) {
            return `#${element.id}`;
        }
        
        // 2. Name attribute varsa kullan
        if (element.name) {
            return `[name="${element.name}"]`;
        }
        
        // 3. Class varsa kullan (tek class tercih et)
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0 && classes[0]) {
                return `.${classes[0]}`;
            }
        }
        
        // 4. Data attribute varsa kullan
        const dataAttrs = Array.from(element.attributes).filter(attr => 
            attr.name.startsWith('data-')
        );
        if (dataAttrs.length > 0) {
            return `[${dataAttrs[0].name}="${dataAttrs[0].value}"]`;
        }
        
        // 5. Son çare olarak XPath kullan
        return this.getXPath(element);
    }

    getSelectorType(element) {
        if (element.id) return 'id';
        if (element.name) return 'name';
        if (element.className) return 'className';
        
        const dataAttrs = Array.from(element.attributes).filter(attr => 
            attr.name.startsWith('data-')
        );
        if (dataAttrs.length > 0) return 'dataAttribute';
        
        return 'xpath';
    }

    getXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        const parts = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let nbOfPreviousSiblings = 0;
            let hasNextSiblings = false;
            let sibling = element.previousSibling;
            
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                    nbOfPreviousSiblings++;
                }
                sibling = sibling.previousSibling;
            }
            
            sibling = element.nextSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                    hasNextSiblings = true;
                    break;
                }
                sibling = sibling.nextSibling;
            }
            
            const prefix = element.nodeName.toLowerCase();
            const nth = nbOfPreviousSiblings || hasNextSiblings ? `[${nbOfPreviousSiblings + 1}]` : '';
            parts.push(prefix + nth);
            element = element.parentNode;
        }
        
        return parts.length ? '/' + parts.reverse().join('/') : '';
    }

    getElementText(element) {
        // Element'in görünür text içeriğini al
        let text = '';
        
        if (element.value !== undefined) {
            text = element.value;
        } else if (element.textContent) {
            text = element.textContent.trim();
        } else if (element.innerText) {
            text = element.innerText.trim();
        }
        
        // Çok uzun text'leri kısalt
        if (text.length > 50) {
            text = text.substring(0, 47) + '...';
        }
        
        return text;
    }

    getElementAttributes(element) {
        const attrs = {};
        Array.from(element.attributes).forEach(attr => {
            attrs[attr.name] = attr.value;
        });
        return attrs;
    }

    generateElementName(element) {
        let name = '';
        
        // 1. ID varsa kullan
        if (element.id) {
            name = element.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        }
        // 2. Name attribute varsa kullan
        else if (element.name) {
            name = element.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        }
        // 3. Text içeriği varsa kullan
        else if (this.getElementText(element)) {
            const text = this.getElementText(element)
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .toUpperCase();
            name = text.substring(0, 20);
        }
        // 4. Tag name + counter kullan
        else {
            name = `${element.tagName.toUpperCase()}_${this.elementCounter}`;
        }
        
        // Benzersizlik için counter ekle
        const finalName = `${name}_ELEMENT`;
        this.elementCounter++;
        
        return finalName;
    }

    getElementCounts(element) {
        const counts = {};
        
        // ID count
        if (element.id) {
            counts.id = document.querySelectorAll(`#${element.id}`).length;
        }
        
        // ClassName count (ilk class)
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0 && classes[0]) {
                counts.className = document.querySelectorAll(`.${classes[0]}`).length;
            }
        }
        
        // CSS Selector count
        const selector = this.getBestSelector(element);
        if (selector && !selector.startsWith('/')) {
            try {
                counts.cssSelector = document.querySelectorAll(selector).length;
            } catch (e) {
                counts.cssSelector = 0;
            }
        }
        
        // XPath count
        const xpath = this.getXPath(element);
        if (xpath) {
            try {
                const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                counts.xpath = result.snapshotLength;
            } catch (e) {
                counts.xpath = 0;
            }
        }
        
        return counts;
    }

    getBestSelectorForSelenium(element) {
        // Öncelik sırasına göre benzersiz selector bul: id > className > cssSelector > xpath
        const counts = this.getElementCounts(element);
        
        // 1. ID varsa ve benzersizse kullan
        if (element.id && counts.id === 1) {
            return { value: element.id, type: 'id' };
        }
        
        // 2. ClassName varsa ve benzersizse kullan
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0 && classes[0] && counts.className === 1) {
                return { value: classes[0], type: 'className' };
            }
        }
        
        // 3. CSS Selector benzersizse kullan
        const selector = this.getBestSelector(element);
        if (selector && !selector.startsWith('/') && counts.cssSelector === 1) {
            return { value: selector, type: 'cssSelector' };
        }
        
        // 4. Son çare olarak XPath kullan
        const xpath = this.getXPath(element);
        return { value: xpath, type: 'xpath' };
    }

    // Storage işlemleri
    async saveToStorage() {
        try {
            await chrome.storage.local.set({
                elementHunterData: {
                    isActive: this.isActive,
                    elements: this.elements,
                    elementCounter: this.elementCounter,
                    captureAndClick: this.captureAndClick,
                    url: window.location.href,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Storage kaydetme hatası:', error);
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
                    this.elementCounter = data.elementCounter || 1;
                    this.captureAndClick = data.captureAndClick || false;
                    
                    // Aktif durumu geri yükle
                    if (data.isActive) {
                        this.isActive = true;
                        this.startHunting();
                    }
                }
            }
        } catch (error) {
            console.error('Storage yükleme hatası:', error);
        }
    }
}

// CSS animasyon ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Element Hunter'ı başlat
const elementHunter = new ElementHunter();
