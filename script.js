document.addEventListener('DOMContentLoaded', () => {
    const pasteArea = document.getElementById('paste_area');
    const parsingLogicInput = document.getElementById('parsing_logic');
    const columnMappingInput = document.getElementById('column_mapping');
    const jsonTemplateInput = document.getElementById('json_template');
    const generateButton = document.getElementById('generate_button');
    const outputArea = document.getElementById('output_area');

    generateButton.addEventListener('click', () => {
        try {
            const tableData = pasteArea.value.trim();
            const parsingLogic = parsingLogicInput.value;
            const columnMappingStr = columnMappingInput.value.trim();
            const jsonTemplate = jsonTemplateInput.value.trim();

            if (!tableData || !parsingLogic || !columnMappingStr || !jsonTemplate) {
                outputArea.textContent = 'Error: All input fields are required.';
                return;
            }

            // 1. Parse Column Mappings
            const columnMap = new Map();
            columnMappingStr.split('\n').forEach(line => {
                const [index, fieldName] = line.split(':');
                if (index && fieldName) {
                    columnMap.set(parseInt(index.trim(), 10), fieldName.trim());
                }
            });

            // 2. Create RegExp from parsing logic string
            const logicParts = parsingLogic.match(new RegExp('^/(.*?)/([gimsuy]*)$'));
            if (!logicParts) {
                outputArea.textContent = 'Error: Invalid parsing logic. Must be a valid JavaScript RegExp literal (e.g., /.../flags).';
                return;
            }
            const regex = new RegExp(logicParts[1], logicParts[2]);
            
            // 3. Process each line of the table data
            const rows = tableData.split('\n');
            const jsonArray = [];

            for (const row of rows) {
                const matches = row.match(regex);
                if (!matches) continue;

                let populatedTemplate = jsonTemplate;
                
                // Use the column map to get the field names
                for (const [captureGroupIndex, fieldName] of columnMap.entries()) {
                    const value = matches[captureGroupIndex];
                    if (value !== undefined) {
                        // Replace all occurrences of the placeholder
                        populatedTemplate = populatedTemplate.replace(new RegExp(`\\{${fieldName}\\}`, 'g'), value.trim());
                    }
                }
                
                // Attempt to parse the resulting string as JSON
                try {
                    jsonArray.push(JSON.parse(populatedTemplate));
                } catch (e) {
                    console.warn(`Could not parse JSON for a row. Resulting template string: ${populatedTemplate}`);
                }
            }

            // 4. Display the final JSON array
            outputArea.textContent = JSON.stringify(jsonArray, null, 2);

        } catch (error) {
            outputArea.textContent = `An unexpected error occurred: ${error.message}`;
            console.error(error);
        }
    });
});
