let tables = {};

document.getElementById('datatype').addEventListener('change', function() {
    const dataType = this.value;
    const dropdownOptions = document.getElementById('dropdownOptions');
    dropdownOptions.style.display = dataType === 'dropdown' ? 'block' : 'none';
});

document.getElementById('headerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const year = document.getElementById('year').value;
    const headerName = document.getElementById('headername').value;
    const dataType = document.getElementById('datatype').value;
    const options = dataType === 'dropdown' ? document.getElementById('options').value.split(',') : [];
    const index = parseInt(document.getElementById('index').value, 10);
    const timestamp = Date.now();

    let addtable = {
        id: timestamp,
        headername: headerName,
        Data: '',
        DataField: 'NotLocked',
        Datatype: dataType,
        options: options
    };

    if (!tables[year]) {
        tables[year] = [];
    }

    if (isNaN(index) || index >= tables[year].length) {
        tables[year].push(addtable);
    } else {
        tables[year].splice(index, 0, addtable);
    }
    console.log(tables);

    renderTable(year);
    resetForm();
});

function resetForm() {
    document.getElementById("headerInputs").innerHTML =
        `<label for="year">Year:</label>
        <input type="number" id="year" name="year" required>
        <label for="headername">Header Name:</label>
        <input type="text" id="headername" name="headername" required>
        <label for="datatype">Data Type:</label>
        <select id="datatype" name="datatype" required>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="dropdown">Dropdown</option>
            <option value="date">Date</option>
        </select>
        <div id="dropdownOptions" style="display: none;">
            <label for="options">Dropdown Options (comma-separated):</label>
            <input type="text" id="options" name="options">
        </div>
        <label for="index">Insert at Index:</label>
        <input type="number" id="index" name="index" min="0">`;

    document.getElementById("datatype").addEventListener("change", function () {
        const dataType = this.value;
        const dropdownOptionsDiv = document.getElementById("dropdownOptions");
        dropdownOptionsDiv.style.display =
            dataType === "dropdown" ? "block" : "none";
    });
}

function renderTable(year) {
    const tablesContainer = document.getElementById('tablesContainer');
    let yearSection = document.getElementById(`year-${year}`);

    if (!yearSection) {
        yearSection = document.createElement('div');
        yearSection.setAttribute('id', `year-${year}`);
        yearSection.innerHTML = `<h2>Year ${year}</h2>
                                 <table border="1">
                                     <thead>
                                         <tr id="headerRow-${year}"></tr>
                                     </thead>
                                     <tbody>
                                         <tr id="dataRow-${year}"></tr>
                                     </tbody>
                                 </table>`;
        tablesContainer.appendChild(yearSection);
    }

    const headerRow = document.getElementById(`headerRow-${year}`);
    const dataRow = document.getElementById(`dataRow-${year}`);

    while (headerRow.firstChild) {
        headerRow.removeChild(headerRow.firstChild);
    }

    while (dataRow.firstChild) {
        dataRow.removeChild(dataRow.firstChild);
    }

    tables[year].forEach((table, index) => {
        const headerCell = document.createElement('th');
        headerCell.textContent = table.headername;
        headerCell.setAttribute('id', `header-${table.id}`);
        headerRow.appendChild(headerCell);

        const dataCell = document.createElement('td');
        dataCell.setAttribute('id', `data-${table.id}`);

        let inputField;
        if (table.Datatype === 'dropdown') {
            inputField = document.createElement('select');
            table.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.trim();
                opt.textContent = option.trim();
                inputField.appendChild(opt);
            });
        } else {
            inputField = document.createElement('input');
            inputField.setAttribute('type', table.Datatype);
        }

        inputField.setAttribute('name', table.headername.toLowerCase());
        inputField.disabled = table.DataField === 'Locked';
        inputField.value = table.Data; // Set the input field value to the current data
        inputField.addEventListener('input', function() {
            table.Data = inputField.value; // Update the Data field in the tables array
        });
        dataCell.appendChild(inputField);

        const lockCheckbox = document.createElement('input');
        lockCheckbox.setAttribute('type', 'checkbox');
        lockCheckbox.setAttribute('id', `lock-${table.id}`);
        lockCheckbox.checked = table.DataField === 'Locked';
        lockCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            table.DataField = isChecked ? 'Locked' : 'NotLocked';
            inputField.disabled = isChecked;
            console.log(tables);
        });

        const lockLabel = document.createElement('label');
        lockLabel.setAttribute('for', `lock-${table.id}`);
        lockLabel.textContent = 'Lock';

        dataCell.appendChild(lockCheckbox);
        dataCell.appendChild(lockLabel);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('data-id', table.id);
        deleteButton.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            tables[year] = tables[year].filter(table => table.id !== parseInt(id));
            console.log(tables);
            document.getElementById(`header-${id}`).remove();
            document.getElementById(`data-${id}`).remove();
            this.remove();
            editButton.remove();
        });

        dataCell.appendChild(deleteButton);

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.setAttribute('data-id', table.id);
        editButton.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tableEntry = tables[year].find(table => table.id === parseInt(id));

            if (tableEntry) {
                const headerCell = document.querySelector(`#header-${id}`);
                headerCell.setAttribute('contenteditable', 'true');
                headerCell.focus();

                const dataCell = document.querySelector(`#data-${id}`);
                const currentInput = dataCell.querySelector('input, select');
                const newDataType = document.createElement('select');
                ['text', 'number', 'dropdown', 'date'].forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                    if (type === tableEntry.Datatype) {
                        option.selected = true;
                    }
                    newDataType.appendChild(option);
                });
                dataCell.replaceChild(newDataType, currentInput);

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.addEventListener('click', function() {
                    tableEntry.headername = headerCell.textContent;
                    tableEntry.Datatype = newDataType.value;
                    if (newDataType.value === 'dropdown') {
                        const newOptions = prompt('Enter new options (comma-separated):', tableEntry.options.join(','));
                        tableEntry.options = newOptions.split(',');
                        const newSelect = document.createElement('select');
                        tableEntry.options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.trim();
                            opt.textContent = option.trim();
                            newSelect.appendChild(opt);
                        });
                        dataCell.replaceChild(newSelect, newDataType);
                    } else {
                        const newInput = document.createElement('input');
                        newInput.setAttribute('type', newDataType.value);
                        newInput.setAttribute('name', tableEntry.headername.toLowerCase());
                        dataCell.replaceChild(newInput, newDataType);
                    }
                    headerCell.setAttribute('contenteditable', 'false');
                    saveButton.remove();
                    cancelButton.remove();
                    deleteButton.style.display = 'inline';
                    editButton.style.display = 'inline';
                    lockCheckbox.style.display = 'inline';
                    lockLabel.style.display = 'inline';
                    inputField.disabled = lockCheckbox.checked; // Ensure input field is disabled if locked
                    console.log(tables);
                });

                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.addEventListener('click', function() {
                    headerCell.textContent = tableEntry.headername;
                    const originalInput = document.createElement(tableEntry.Datatype === 'dropdown' ? 'select' : 'input');
                    if (tableEntry.Datatype === 'dropdown') {
                        tableEntry.options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.trim();
                            opt.textContent = option.trim();
                            originalInput.appendChild(opt);
                        });
                    } else {
                        originalInput.setAttribute('type', tableEntry.Datatype);
                    }
                    originalInput.setAttribute('name', tableEntry.headername.toLowerCase());
                    originalInput.disabled = tableEntry.DataField === 'Locked';
                    dataCell.replaceChild(originalInput, newDataType);
                    headerCell.setAttribute('contenteditable', 'false');
                    saveButton.remove();
                    cancelButton.remove();
                    deleteButton.style.display = 'inline';
                    editButton.style.display = 'inline';
                    lockCheckbox.style.display = 'inline';
                    lockLabel.style.display = 'inline';
                });

                dataCell.appendChild(saveButton);
                dataCell.appendChild(cancelButton);

                deleteButton.style.display = 'none';
                editButton.style.display = 'none';
                lockCheckbox.style.display = 'none';
                lockLabel.style.display = 'none';
            }
        });

        dataCell.appendChild(editButton);
        dataRow.appendChild(dataCell);
    });
}

function saveTables() {
    // Filter out null values before saving
    const filteredTables = Object.fromEntries(
        Object.entries(tables).map(([year, tableArray]) => [year, tableArray.filter(table => table !== null)])
    );

    fetch('/api/save-tables', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filteredTables)
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('Data saved successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving data');
    });
}

function fetchTables() {
    fetch('/api/tables')
    .then(response => response.json())
    .then(data => {
        tables = data.tables;
        Object.keys(tables).forEach(year => renderTable(year));
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error fetching data');
    });
}

// Create a container for the form and the table
const container = document.createElement('div');
document.body.appendChild(container);

// Append the form to the container
const form = document.getElementById('headerForm');
container.appendChild(form);

// Add a button to save the tables data
const saveButton = document.createElement('button');
saveButton.textContent = 'Save Tables';
saveButton.addEventListener('click', saveTables);
container.appendChild(saveButton);

// Add a button to go back to the admin page
const backButton = document.createElement('button');
backButton.textContent = 'Back to Admin Page';
backButton.addEventListener('click', function() {
    window.location.href = 'admin.html';
});
container.appendChild(backButton);

// Fetch and render the tables data on page load
fetchTables();