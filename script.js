document.addEventListener('DOMContentLoaded', () => {
    const pasteArea = document.getElementById('paste_area');
    const mappingBody = document.getElementById('mapping_body');
    const addRowButton = document.getElementById('add_row_button');
    const jsonTemplateInput = document.getElementById('json_template');
    const generateButton = document.getElementById('generate_button');
    const outputArea = document.getElementById('output_area');

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

    // Event delegation for removing rows
    mappingBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove_row')) {
            e.target.closest('tr').remove();
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
                    jsonArray.push(JSON.parse(populatedTemplate));
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
