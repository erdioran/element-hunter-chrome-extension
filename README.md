# Element Hunter Chrome Extension

![Element Hunter Logo](icons/icon-128.png)

A modern Chrome extension for automatically capturing web element information for Selenium automation testing with an elegant dark-themed UI.

## 🎬 Demo

![Element Hunter Demo](https://i.imgur.com/9rZHpTU.gif)

## ✨ Features

### 🎆 Core Functionality
- **Smart Element Detection**: Automatically captures clicked elements with intelligent selector priority
- **Advanced Target Detection**: Handles overlapping elements and finds the most relevant target
- **Intelligent Element Naming**: English naming with Turkish translation and context awareness
- **Multiple Selector Types**: Supports ID, name, className, CSS selectors, and optimized XPath
- **Visual Feedback**: Real-time hover effects and click confirmations
- **Dual Export Formats**: Standard JSON and simplified Selenium automation JSON export
- **Persistent Storage**: Elements are saved across browser sessions with real site URLs

### 🌐 Multilingual Support
- **Language Switching**: Toggle between English and Turkish
- **Dynamic UI**: All interface elements update instantly
- **Persistent Preference**: Language choice saved automatically

### 📋 Copy & Export Functionality
- **One-Click Copy**: Copy element selectors with compact copy buttons
- **Multiple Export Formats**: Standard JSON and simplified Selenium automation format
- **Smart URL Detection**: Real website URLs instead of extension URLs
- **Instant Feedback**: Visual confirmation for copy operations

### ⚙️ Advanced Features
- **Dual Interface Modes**: Popup and Side Panel interface options
- **DevTools Integration**: Optional DevTools panel mode
- **Persistent Settings**: Language preferences saved automatically
- **Element Management**: Clear, add, and manage captured elements
- **Status Indicators**: Dynamic active/inactive status display
- **Centered UI Elements**: Professional alignment for developer information

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/erdioran/element-hunter-chrome-extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Element Hunter icon will appear in your Chrome toolbar

## 📖 Usage

### Basic Usage
1. Click the Element Hunter icon in your Chrome toolbar
2. Choose your preferred interface:
   - **Popup Mode**: Traditional popup window interface
   - **Side Panel Mode**: Dedicated side panel for better workspace
3. Click "Start" (or "Başlat" in Turkish) to begin capture mode
4. Navigate to your target webpage
5. Click on elements you want to capture
6. View captured elements in the interface with copy buttons
7. Export as JSON or Selenium format when ready

### Copy Element Selectors
- Each captured element has a small copy icon in the top-right corner
- Click the copy icon to copy the element's selector (e.g., `class: .header-button`)
- Visual feedback confirms successful copy operation

### Language Switching
- Click the settings icon (⚙️) in the popup header
- Select your preferred language (English/Türkçe)
- All UI elements update instantly

## 🎯 Element Selector Priority

The extension uses intelligent selector priority for maximum reliability:

1. **ID** - If element has a unique ID (`id: #unique-id`)
2. **Name** - If element has a unique name attribute (`name: "username"`)
3. **IMG Special Handling** - Optimized selectors for product images with index-based XPath
4. **Class Name** - If element has a unique class (`class: .unique-class`)
5. **Data Attributes** - Custom data attributes (`data-testid: "login-btn"`)
6. **XPath** - Fallback XPath selector with smart positioning

### 🎯 Advanced Target Detection
- **Overlay Handling**: Automatically detects and bypasses overlay elements
- **Element Priority**: IMG > Clickable elements > Important product elements
- **Context Awareness**: Detects navbar, product cards, and other UI contexts

## 📊 Export Formats

### Standard JSON Format
```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "url": "https://example.com",
    "totalElements": 2,
    "tool": "Element Hunter v2.1.0"
  },
  "elements": [
    {
      "name": "LOGIN_BUTTON",
      "selectorType": "id",
      "tagName": "button",
      "text": "Login",
      "selectors": [
        {
          "cssSelector": "#login-btn",
          "counts": 1
        },
        {
          "id": "login-btn",
          "counts": 1
        },
        {
          "className": "btn btn-primary",
          "counts": 5
        },
        {
          "xpath": "//*[@id='login-btn']",
          "counts": 1
        }
      ]
    }
  ]
}
```

### Selenium Automation Format (Simplified)
```json
{
  "LOGIN_BTN_BUTTON": {
    "value": "login-btn",
    "type": "id"
  },
  "CUSTOMER_EMAIL_INPUT": {
    "value": "customerEmail",
    "type": "id"
  },
  "NAVBAR_MEN_LINK": {
    "value": "/html/body/nav/ul/li[2]/a",
    "type": "xpath"
  },
  "PRODUCT_CARD_IMG_7": {
    "value": "(//img[contains(@class,'m-productCard__img')])[7]",
    "type": "xpath"
  }
}
```

## 🔧 Selenium Integration

### Python Example
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import json

# Load Selenium Automation format
with open('selenium_automation.json', 'r') as f:
    elements = json.load(f)  # Direct element dictionary

driver = webdriver.Chrome()

# Use captured elements with automatic selector type handling
for element_name, element_data in elements.items():
    selector_type = element_data['type']
    selector_value = element_data['value']
    
    if selector_type == 'id':
        web_element = driver.find_element(By.ID, selector_value)
    elif selector_type == 'className':
        web_element = driver.find_element(By.CLASS_NAME, selector_value)
    elif selector_type == 'cssSelector':
        web_element = driver.find_element(By.CSS_SELECTOR, selector_value)
    elif selector_type == 'xpath':
        web_element = driver.find_element(By.XPATH, selector_value)
```

### Java Example
```java
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

// Load and parse JSON (direct elements object)
Gson gson = new Gson();
JsonObject elements = gson.fromJson(jsonString, JsonObject.class);

WebDriver driver = new ChromeDriver();

// Use elements
for (String elementName : elements.keySet()) {
    JsonObject elementData = elements.getAsJsonObject(elementName);
    String type = elementData.get("type").getAsString();
    String value = elementData.get("value").getAsString();
    
    WebElement element = switch (type) {
        case "id" -> driver.findElement(By.id(value));
        case "className" -> driver.findElement(By.className(value));
        case "cssSelector" -> driver.findElement(By.cssSelector(value));
        case "xpath" -> driver.findElement(By.xpath(value));
        default -> throw new IllegalArgumentException("Unknown selector type: " + type);
    };
}
```

## 🏗️ Technical Architecture

### Core Components
- **Manifest V3**: Modern Chrome extension architecture
- **Content Script**: DOM interaction and element capture logic
- **Background Service Worker**: Extension lifecycle management
- **Dual Interface System**: Both popup and side panel interfaces
- **Side Panel Integration**: Chrome's native side panel API support
- **Chrome Storage API**: Persistent data storage

### Selector Priority Algorithm
1. **ID**: Highest priority if unique (count = 1)
2. **name**: Second priority if unique
3. **className**: Third priority if unique
4. **cssSelector**: Fourth priority if unique
5. **XPath**: Fallback option

### Storage Strategy
- Elements persist for 1 hour across page reloads
- State synchronization between content script and popup
- Automatic cleanup of expired data

## 🤝 Contributing

We welcome contributions! Please feel free to submit:
- Bug reports
- Feature requests
- Pull requests
- Documentation improvements

## 📄 License

This project is open source and available under the MIT License.

## 🔄 Version History

### v2.1.0 (Current)
- **🎯 Enhanced Element Naming**: Smart English naming with Turkish translation
- **🔄 CamelCase Word Separation**: `customerEmail` → `CUSTOMER_EMAIL_INPUT`
- **🏢 Context-Aware Naming**: CSS class context detection (`navbar` → `NAVBAR_MEN_LINK`)
- **🎯 Advanced Target Detection**: Handles overlapping elements and finds actual targets
- **🖼️ IMG Element Optimization**: Specialized selectors for product images with index-based XPath
- **📄 Simplified JSON Format**: Removed metadata wrapper from Selenium export
- **🌐 Real URL Detection**: Shows actual website URLs instead of extension URLs
- **⚙️ Smart Element Filtering**: Priority-based selection (IMG > clickable > important elements)
- **📱 Side Panel Interface**: Native Chrome side panel support for better workspace integration
- **🎨 UI Improvements**: Centered alignment for developer information titles

### v2.0.0
- **Major UI/UX Redesign**: Modern pastel theme with 320px compact popup
- **Multilingual Support**: English/Turkish language switching with persistence
- **Enhanced Button System**: Gradient colors, proper sizing, and hover effects
- **Settings Modal**: Clean modal interface for configuration and about info
- **Improved Element Display**: Shows last 5 elements with best selectors only
- **Logo Integration**: Custom 40px logo in header and extension icons
- **Fixed Layout Issues**: Consistent button sizing and responsive design
- **Optimized Controls**: Start/Stop, Mode (2-line), Clear buttons with flex layout

### v1.0.0
- Initial release
- Smart element detection and capture
- JSON export functionality
- Visual feedback system
- Persistent storage
- Basic popup interface

## 🎨 UI Screenshots

### Main Interface
- **Dual Interface Options**: Choose between popup and side panel modes
- **Compact Design**: 320px width with optimized spacing
- **Professional Theme**: Gradient buttons with pastel colors
- **Smart Layout**: Logo + title + settings in header
- **Responsive Controls**: Equal-width buttons with proper alignment

### Side Panel Interface
- **Native Integration**: Chrome's built-in side panel API
- **Better Workspace**: Dedicated panel for element capture workflow
- **Consistent Design**: Matches popup interface styling
- **Enhanced Productivity**: No popup window management needed

### Settings Modal
- **About Developer**: Contact information and links with centered alignment
- **Language Selection**: English/Turkish toggle buttons
- **Clean Design**: Modal overlay with rounded corners

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Chrome extension environment
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Erdi Oran**
- Email: erdioran@gmail.com
- GitHub: [erdioran](https://github.com/erdioran)

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues page to report bugs or request new features.

## 🚀 Recent Updates

### Latest (v2.1.0)
- ✅ **Smart Element Naming**: English naming with Turkish translation and context awareness
- ✅ **Advanced Target Detection**: Handles overlapping elements and overlay filtering
- ✅ **IMG Element Optimization**: Specialized selectors for product images
- ✅ **Simplified JSON Export**: Cleaner Selenium automation format
- ✅ **Real URL Detection**: Shows actual website URLs in exports
- ✅ **Enhanced Element Filtering**: Priority-based element selection
- ✅ **Side Panel Interface**: Native Chrome side panel support for better workflow
- ✅ **UI Improvements**: Centered developer information titles for professional appearance

### Previous (v2.0.0)
- ✅ Complete UI overhaul with modern design
- ✅ Multilingual support (EN/TR)
- ✅ Enhanced element capture display
- ✅ Fixed button sizing and layout issues
- ✅ Added settings modal with configuration options
- ✅ Improved user experience with better visual feedback

## 🎯 Element Naming Examples

| **Input** | **Output** | **Context** |
|-----------|------------|-------------|
| `loginBtn` | `LOGIN_BTN_BUTTON` | CamelCase separation |
| `customerEmail` | `CUSTOMER_EMAIL_INPUT` | Word boundary detection |
| `ERKEK` (Turkish) | `NAVBAR_MEN_LINK` | Translation + context |
| Product image | `PRODUCT_CARD_IMG_7` | Index-based naming |
| `hesabım` (Turkish) | `MY_ACCOUNT_BUTTON` | Turkish → English translation |
