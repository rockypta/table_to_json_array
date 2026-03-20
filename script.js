document.addEventListener('DOMContentLoaded', () => {
    const pasteArea = document.getElementById('paste_area');
    const mappingBody = document.getElementById('mapping_body');
    const addRowButton = document.getElementById('add_row_button');
    const jsonTemplateInput = document.getElementById('json_template');
    const generateButton = document.getElementById('generate_button');
    const outputArea = document.getElementById('output_area');
    const copyButton = document.getElementById('copy_button');
    const exportButton = document.getElementById('export_button');
    const importButtonTrigger = document.getElementById('import_button_trigger');
    const importInput = document.getElementById('import_input');

    // Function to add a new row to the mapping table
    function addRow(searchFrom = 'next_cell', regex = '', fieldName = '') {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="search_from">
                    <option value="next_cell" ${searchFrom === 'next_cell' ? 'selected' : ''}>next cell</option>
                    <option value="from_beginning" ${searchFrom === 'from_beginning' ? 'selected' : ''}>from beginning</option>
                </select>
            </td>
            <td><input type="text" class="regex" value="${regex}" placeholder="e.g., ID: (\\d+)"></td>
            <td><input type="text" class="field_name" value="${fieldName}" placeholder="id"></td>
            <td><button class="remove_row">Remove</button></td>
        `;
        mappingBody.appendChild(row);
    }

    // Add initial row
    addRow('from_beginning', 'ID: (\\d+)', 'id');

    // Event listener for adding rows
    addRowButton.addEventListener('click', () => addRow());

    // Event listener for exporting configuration
    exportButton.addEventListener('click', () => {
        const mappings = [];
        const rows = mappingBody.querySelectorAll('tr');
        rows.forEach(row => {
            mappings.push({
                searchFrom: row.querySelector('.search_from').value,
                regex: row.querySelector('.regex').value,
                fieldName: row.querySelector('.field_name').value.trim()
            });
        });

        const config = {
            mappings,
            jsonTemplate: jsonTemplateInput.value.trim()
        };

        const blob = new Blob([JSON.stringify(config, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Trigger file input for import
    importButtonTrigger.addEventListener('click', () => importInput.click());

    // Event listener for importing configuration
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                
                // Clear existing mapping body
                mappingBody.innerHTML = '';
                
                // Add new mappings
                config.mappings.forEach(m => {
                    addRow(m.searchFrom, m.regex, m.fieldName);
                });

                // Update template
                jsonTemplateInput.value = config.jsonTemplate;
            } catch (err) {
                console.error('Failed to import config:', err);
                alert('Invalid configuration file.');
            }
        };
        reader.readAsText(file);
    });

    // Event delegation for removing rows
    mappingBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove_row')) {
            e.target.closest('tr').remove();
        }
    });

    // Event listener for copying output
    copyButton.addEventListener('click', () => {
        const text = outputArea.textContent;
        if (!text || text.startsWith('Error:')) return;

        function updateButton() {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#27ae60';
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '';
            }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(updateButton).catch(err => {
                console.error('navigator.clipboard failed, trying fallback...', err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            fallbackCopyTextToClipboard(text);
        }

        function fallbackCopyTextToClipboard(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            
            // Avoid scrolling to bottom
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    updateButton();
                } else {
                    console.error('Fallback: Copy command was unsuccessful');
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }

            document.body.removeChild(textArea);
        }
    });

    generateButton.addEventListener('click', () => {
        try {
            const tableData = pasteArea.value.trim();
            const jsonTemplate = jsonTemplateInput.value.trim();

            if (!tableData || !jsonTemplate) {
                outputArea.textContent = 'Error: Data and JSON template are required.';
                return;
            }

            // Collect mapping data from the table
            const mappings = [];
            const rows = mappingBody.querySelectorAll('tr');
            rows.forEach(row => {
                const searchFrom = row.querySelector('.search_from').value;
                const regexStr = row.querySelector('.regex').value;
                const fieldName = row.querySelector('.field_name').value.trim();
                
                if (regexStr && fieldName) {
                    mappings.push({ searchFrom, regex: new RegExp(regexStr), fieldName });
                }
            });

            if (mappings.length === 0) {
                outputArea.textContent = 'Error: At least one field mapping is required.';
                return;
            }

            // Process each line of the table data
            const dataLines = tableData.split('\n');
            const jsonArray = [];

            for (const line of dataLines) {
                if (!line.trim()) continue;

                let currentPosition = 0;
                const rowData = {};

                for (const mapping of mappings) {
                    if (mapping.searchFrom === 'from_beginning') {
                        currentPosition = 0;
                    }

                    const substring = line.substring(currentPosition);
                    const match = substring.match(mapping.regex);

                    if (match) {
                        // Use the first capture group if it exists, otherwise the whole match
                        const value = match[1] !== undefined ? match[1] : match[0];
                        rowData[mapping.fieldName] = value.trim();
                        
                        // Update position relative to the original line
                        currentPosition += match.index + match[0].length;
                    } else {
                        rowData[mapping.fieldName] = ""; // Default to empty if no match
                    }
                }

                // Populate the JSON template
                let populatedTemplate = jsonTemplate;
                for (const [key, value] of Object.entries(rowData)) {
                    populatedTemplate = populatedTemplate.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
                }

                // Attempt to parse the resulting string as JSON
                try {
                    let result;
                    try {
                        result = JSON.parse(populatedTemplate);
                    } catch (e) {
                        // Fallback: try wrapping in brackets to support multiple comma-separated objects
                        try {
                            result = JSON.parse(`[${populatedTemplate}]`);
                        } catch (e2) {
                            throw e; // Rethrow original error if fallback also fails
                        }
                    }

                    if (Array.isArray(result)) {
                        jsonArray.push(...result);
                    } else {
                        jsonArray.push(result);
                    }
                } catch (e) {
                    console.warn(`Could not parse JSON for a row. Resulting template string: ${populatedTemplate}`);
                }
            }

            // Display the final JSON array
            outputArea.textContent = JSON.stringify(jsonArray, null, 2);

        } catch (error) {
            outputArea.textContent = `An unexpected error occurred: ${error.message}`;
            console.error(error);
        }
    });
});
