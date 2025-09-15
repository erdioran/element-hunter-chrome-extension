# Element Hunter Chrome Extension

Element Hunter is a powerful Chrome extension designed to help Selenium automation testers capture web elements dynamically. Click on any element on a webpage, and the extension will automatically extract its selector information with intelligent prioritization and uniqueness validation.

## 🚀 Features

### Core Functionality
- **Smart Element Capture**: Automatically captures clicked elements with visual feedback
- **Intelligent Selector Priority**: ID → className → cssSelector → XPath with uniqueness validation
- **Dual Capture Modes**: "Capture Only" or "Capture & Click" modes
- **Persistent Storage**: Elements persist across page reloads and navigation
- **Real-time Element Counting**: Shows how many elements match each selector type

### Advanced Features
- **Automatic Element Naming**: Generates meaningful names based on content and attributes
- **Multiple JSON Export Formats**: Standard format and Selenium Automation format
- **Uniqueness Validation**: Automatically selects the most unique selector for Selenium
- **Visual Overlay**: Shows capture status and element count on page
- **Cross-page Persistence**: Maintains captured elements across different pages

## 📦 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Element Hunter icon should appear in your Chrome toolbar

## 🎯 Usage

### Basic Usage
1. **Start Capturing**: Click the Element Hunter icon and press "Start Capturing"
2. **Choose Mode**: Toggle between "Capture Only" and "Capture & Click" modes
3. **Capture Elements**: Click on elements you want to capture on any webpage
4. **View Results**: Open popup to see captured elements with count information
5. **Export Data**: Choose between two JSON export formats

### Capture Modes
- **Capture Only**: Intercepts clicks to capture element data without triggering page actions
- **Capture & Click**: Captures element data and allows normal click behavior

## 📊 JSON Export Formats

### Standard Format
```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "url": "https://example.com",
    "totalElements": 2,
    "tool": "Element Hunter v1.0"
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

### Selenium Automation Format
```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "url": "https://example.com",
    "totalElements": 2,
    "tool": "Element Hunter v1.0"
  },
  "elements": {
    "LOGIN_BUTTON": {
      "value": "login-btn",
      "type": "id"
    },
    "SEARCH_INPUT": {
      "value": "search-field",
      "type": "className"
    }
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
with open('selenium_elements.json', 'r') as f:
    data = json.load(f)

driver = webdriver.Chrome()

# Use captured elements with automatic selector type handling
elements = data['elements']
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

// Load and parse JSON
Gson gson = new Gson();
JsonObject data = gson.fromJson(jsonString, JsonObject.class);
JsonObject elements = data.getAsJsonObject("elements");

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
- **Popup Interface**: User controls and element management
- **Chrome Storage API**: Persistent data storage

### Selector Priority Algorithm
1. **ID**: Highest priority if unique (count = 1)
2. **className**: Second priority if unique
3. **cssSelector**: Third priority if unique
4. **XPath**: Fallback option

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

- **v1.0**: Initial release with basic element capture
- **v1.1**: Added dual capture modes and persistence
- **v1.2**: Implemented element counting and uniqueness validation
- **v1.3**: Added Selenium Automation format and improved JSON structure
