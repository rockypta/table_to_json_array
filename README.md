# Table to JSON Array Converter

A powerful, browser-based utility for extracting structured data from flat files or pasted table data and converting it into a custom JSON array using sequential regular expressions.

## Features

- **Sequential Regex Matching**: Extract multiple fields from a single line by searching from the start of the line or from where the last match ended.
- **Dynamic Field Mapping**: Add as many fields as needed with custom Regex patterns and field names.
- **Capture Group Support**: Automatically extracts data from the first capture group `()` if present, or the whole match.
- **Custom JSON Templating**: Define exactly how your output should look using `{placeholder}` syntax.
- **Config Management**: Export your extraction logic and templates to a `.json` file and import them later for reuse.
- **One-Click Copy**: Quickly copy the resulting JSON to your clipboard with built-in feedback and fallback support.
- **Privacy Focused**: All processing happens locally in your browser; no data is ever sent to a server.

## How to Use

### 1. Paste Table Data
Paste your raw data (CSV, logs, fixed-width text, etc.) into the first section. The tool processes data line by line.

### 2. Map Fields
Define your extraction rules in the table:
- **Search From**: 
    - `next cell`: Starts searching from the end of the previous field's match. Ideal for sequential data like CSVs.
    - `from beginning`: Resets the search pointer to the start of the line. Useful for extracting multiple pieces of data that might appear in any order.
- **Regular Expression**: Enter a JavaScript-compatible regex. 
    - *Example*: `ID: (\d+)` will extract only the numbers.
- **Field Name**: The key used in your JSON template (e.g., `id`).

### 3. Provide JSON Template
Create a JSON structure using your field names as placeholders:
```json
{
  "user_id": "{id}",
  "details": {
    "name": "{name}"
  }
}
```

### 4. Generate & Copy
Click **Generate JSON** to see the result. Use the **Copy JSON** button to grab the final array.

## Configuration Reuse
Click **Export Config** to save your mapping table and template to a file. Next time you have similar data, simply use **Import Config** to restore your settings instantly.

## Installation / Setup
This is a standalone web application.
1. Clone the repository.
2. Open `index.html` in any modern web browser.

No dependencies or build steps required.
