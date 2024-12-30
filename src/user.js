import { schoolBasedOnYearAndSchoolName } from './takeschoolsbyYear.js';
import { generateInstallments, gatherInstallmentData } from './installments.js';
const urlParams = new URLSearchParams(window.location.search);
const selectedSchool = urlParams.get('school');
const username = urlParams.get('username');
const selectedYear = urlParams.get('year');
let tableHeaders = [];
let schoolData = null;
let currentAction = ''; // Add this line to track the current action
export function closeModal() {
    document.getElementById('installmentsModal').style.display = 'none';
}
export function generateUniqueId() {
    return Date.now();
}
export function addEntry(username, rawInstallments, selectedYear) {
    const entryData = gatherEntryData();
    if (Object.values(entryData).some(value => value === '')) {
        alert('Please fill in all fields');
        return;
    }
    const uniqueId = generateUniqueId();
    const registrationType = currentAction === 'renew' ? 'Renewed Registration' : currentAction === 'transfer' ? 'Transfer Registration' : 'New Registration';
    const studentData = { ...entryData, username, selectedYear, id: uniqueId, Instalments: rawInstallments, RegistrationType: registrationType };
    const completeEntry = { ...entryData, ...schoolBasedOnYearAndSchoolName, username, id: uniqueId, Instalments: rawInstallments, RegistrationType: registrationType };
    saveData('students', studentData, username, selectedYear);
    saveData('completeentrydb', completeEntry);
}
function gatherEntryData() {
    const entryData = {};
    document.querySelectorAll('#entry-form input, #entry-form select').forEach(input => {
        const key = input.id.replace('entry-', '');
        entryData[key] = input.value.trim();
    });
    return entryData;
}
function saveData(endpoint, data, username, selectedYear) {
    fetch('data/data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.json();
    })
    .then(existingData => {
        console.log('Fetched existing data:', existingData); // Log the fetched data
        if (!Array.isArray(existingData.students)) {
            throw new Error('Expected existingData.students to be an array');
        }
        const studentExists = existingData.students.some(student => student['Student Tezkere No'] === data['Student Tezkere No'] && student.selectedYear === selectedYear);
        console.log('Student exists:', studentExists); // Log if the student exists
        if (studentExists) {
            alert('This person is already in the system');
            return;
        }
        fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => handleResponse(response))
        .then(data => {
            console.log(`${endpoint} added:`, data);
            if (endpoint === 'students') {
                fetchStudents(username, selectedYear);
                fetchTableStructure(selectedYear);
            }
        })
        .catch(error => handleError(`Error adding ${endpoint}:`, error));
    })
    .catch(error => {
        console.error('Error checking existing data:', error);
        handleError('Error checking existing data:', error);
    });
}
function handleResponse(response) {
    if (!response.ok) {
        return response.text().then(text => {
            throw new Error(`Network response was not ok: ${text}`);
        });
    }
    return response.json();
}
function handleError(message, error) {
    console.error(message, error);
    alert(message);
}
function fetchTableStructure(year) {
    fetch(`/api/tables?year=${year}`)
    .then(response => handleResponse(response))
    .then(data => {
        const tableStructure = data[year];
        if (tableStructure && Array.isArray(tableStructure)) {
            tableHeaders = tableStructure;
            generateTableForm(tableStructure);
            generateEntryListHeaders(tableStructure);
            addInstallmentDropdownListener(tableStructure);
            fetchStudents(username, selectedYear);
        } else {
            throw new Error('Invalid table structure: headers are missing or not an array');
        }
    })
    .catch(error => handleError('Failed to fetch table structure', error));
}
function generateTableForm(headers) {
    const tableContainer = document.getElementById('table-container');
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.headername;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const dataRow = document.createElement('tr');
    headers.forEach(header => {
        const td = document.createElement('td');
        const input = createInput(header.headername, header.Data || '');
        if (input) {
            input.id = `entry-${header.headername}`;
            if (header.DataField === 'Locked') {
                input.disabled = true;
            }
            td.appendChild(input);
            dataRow.appendChild(td);
        }
    });
    tbody.appendChild(dataRow);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}
function createInput(key, value) {
    console.log(`Creating input for key: ${key}, value: ${JSON.stringify(value)}`);
    const header = tableHeaders.find(h => h.headername === key);
    let input;
    if (header) {
        if (header.Datatype === 'text' || header.Datatype === 'string') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value;
        } else if (header.Datatype === 'dropdown') {
            input = document.createElement('select');
            console.log(`Dropdown options for ${key}:`, header.options);
            header.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                if (option === value || (key === 'Instalments' && typeof value === 'object' && option === `${Object.keys(value).length} Instalments`)) {
                    optionElement.selected = true;
                    console.log(`Selected option for ${key}: ${option}`);
                }
                input.appendChild(optionElement);
            });
        } else if (header.Datatype === 'date') {
            input = document.createElement('input');
            input.type = 'date';
            input.value = value.split('T')[0];
        } else if (header.Datatype === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.value = value;
        } else if (header.Datatype === 'object') {
            input = document.createElement('textarea');
            input.value = JSON.stringify(value, null, 2);
        }
        // Lock the input if the field is locked
        if (header.DataField === 'Locked') {
            input.disabled = true;
        }
    }
    return input || document.createTextNode('');
}
function generateEntryListHeaders(headers) {
    const entryList = document.getElementById('entry-list');
    const thead = entryList.querySelector('thead');
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.headername;
        const searchBox = createSearchBox(header.headername);
        th.appendChild(searchBox);
        headerRow.appendChild(th);
    });
    const th = document.createElement('th');
    th.textContent = 'Actions';
    headerRow.appendChild(th);
    thead.appendChild(headerRow);
}
function createSearchBox(headername) {
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.id = `search-${headername}`;
    searchBox.placeholder = `Search ${headername}`;
    searchBox.addEventListener('input', filterEntries);
    return searchBox;
}
function filterEntries() {
    const filterValues = {};
    tableHeaders.forEach(header => {
        const searchBox = document.getElementById(`search-${header.headername}`);
        if (searchBox) {
            filterValues[header.headername] = searchBox.value.toLowerCase();
        }
    });
    const rows = document.querySelectorAll('#student-list tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let match = true;
        cells.forEach((cell, index) => {
            const headerName = tableHeaders[index]?.headername;
            const filterValue = filterValues[headerName];
            if (filterValue && !cell.textContent.toLowerCase().includes(filterValue)) {
                match = false;
            }
        });
        row.style.display = match ? '' : 'none';
    });
}
function fetchStudents(username, selectedYear) {
    fetch(`/api/students?username=${encodeURIComponent(username)}&year=${encodeURIComponent(selectedYear)}`)
    .then(response => handleResponse(response))
    .then(data => {
        const studentList = document.querySelector('#student-list');
        studentList.innerHTML = '';
        data.forEach(student => {
            const row = document.createElement('tr');
            tableHeaders.forEach(header => {
                const cell = document.createElement('td');
                const value = student[header.headername];
                cell.textContent = header.headername === 'Instalments' && typeof value === 'object' ? `${Object.keys(value).length} Instalments` : value;
                row.appendChild(cell);
            });
            const actionCell = document.createElement('td');
            actionCell.appendChild(createButton('Print', () => printStudent(student)));
            actionCell.appendChild(createButton('Delete', () => deleteStudent(student.id, username, selectedYear)));
            actionCell.appendChild(createButton('Edit', () => editStudent(student, row)));
            row.appendChild(actionCell);
            studentList.appendChild(row);
        });
        addSearchBoxListeners();
    })
    .catch(error => handleError('Failed to fetch students', error));
}
function addSearchBoxListeners() {
    tableHeaders.forEach(header => {
        const searchBox = document.getElementById(`search-${header.headername}`);
        if (searchBox) {
            searchBox.addEventListener('input', filterEntries);
        }
    });
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

function deleteStudent(studentId, username, selectedYear) {
    deleteData('students', studentId, username, selectedYear);
    deleteData('completeentrydb', studentId, username, selectedYear);
}

function deleteData(endpoint, id, username, selectedYear) {
    fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
    .then(response => handleResponse(response))
    .then(data => {
        console.log(`${endpoint} deleted:`, data);
        if (endpoint === 'students') {
            fetchStudents(username, selectedYear);
        }
    })
    .catch(error => handleError(`Error deleting ${endpoint}:`, error));
}

function editStudent(student, row) {
    const updatedStudentData = {};
    const initialInstallmentsValue = student['Instalments'];
    let installmentsChanged = false;
    Object.entries(student).forEach(([key, value]) => {
        if (key !== 'username' && key !== 'id') {
            const cell = row.querySelector(`td:nth-child(${Object.keys(student).indexOf(key) + 1})`);
            if (cell) {
                const input = createInput(key, value);
                if (input) {
                    cell.innerHTML = '';
                    cell.appendChild(input);
                    input.addEventListener('input', () => updatedStudentData[key] = input.value);
                    if (key === 'Instalments') {
                        input.addEventListener('change', () => {
                            installmentsChanged = true;
                            const selectedValue = input.value;
                            if (selectedValue && selectedValue !== 'Paid') {
                                openInstallmentsModal(parseInt(selectedValue, 10));
                            }
                        });
                    }
                }
            }
        }
    });
    const actionCell = row.querySelector('td:last-child');
    actionCell.innerHTML = '';
    actionCell.appendChild(createButton('Save', () => {
        if (installmentsChanged) {
            updatedStudentData['Instalments'] = gatherInstallmentData();
        } else {
            updatedStudentData['Instalments'] = initialInstallmentsValue;
        }
        saveEditedData(student.id, updatedStudentData);
        saveEditedDatacompleteentrydb(student.id, updatedStudentData);
    }));
}

function saveEditedData(studentId, updatedStudentData) {
    fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudentData)
    })
    .then(response => handleResponse(response))
    .then(data => console.log('Student data saved:', data))
    .catch(error => handleError('Error saving student data:', error));
}

function saveEditedDatacompleteentrydb(studentId, updatedStudentData) {
    fetch(`/api/completeentrydb/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudentData)
    })
    .then(response => handleResponse(response))
    .then(data => {
        console.log(`Student updated:`, data);
        fetchStudents(username, selectedYear);
    })
    .catch(error => handleError(`Error updating student:`, error));
}

function addInstallmentDropdownListener(headers) {
    headers.forEach(header => {
        if (header.headername === 'Instalments') {
            const installmentDropdown = document.getElementById(`entry-${header.headername}`);
            if (installmentDropdown) {
                installmentDropdown.addEventListener('change', () => {
                    const selectedValue = installmentDropdown.value;
                    if (selectedValue && selectedValue !== 'Paid') {
                        openInstallmentsModal(parseInt(selectedValue, 10));
                    }
                });
            }
        }
    });
}

function openInstallmentsModal(numInstallments) {
    document.getElementById('installmentsModal').style.display = 'block';
    generateInstallments(numInstallments);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!selectedSchool) {
        alert('No school selected');
        window.location.href = 'index.html';
        return;
    }
    fetchSchoolData(selectedSchool);
    // Create buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'button-container';
    document.body.insertBefore(buttonContainer, document.body.firstChild);
    const newRegistrationButton = document.createElement('button');
    newRegistrationButton.textContent = 'New Registration';
    buttonContainer.appendChild(newRegistrationButton);
    const renewRegistrationButton = document.createElement('button');
    renewRegistrationButton.textContent = 'Renew Registration';
    buttonContainer.appendChild(renewRegistrationButton);
    const transferRegistrationButton = document.createElement('button');
    transferRegistrationButton.textContent = 'Transfer Registration';
    buttonContainer.appendChild(transferRegistrationButton);

    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        document.body.classList.add('disable-pointer-events'); // Disable pointer events on background
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        document.body.classList.remove('disable-pointer-events'); // Enable pointer events on background
    };

    transferRegistrationButton.addEventListener('click', () => {
        currentAction = 'transfer'; // Set current action to transfer
        openModal('search-modal');
    });

    renewRegistrationButton.addEventListener('click', () => {
        currentAction = 'renew'; // Set current action to renew
        openModal('search-modal');
    });

    const closeSearchModalButton = document.querySelector('.close-search-modal');
    closeSearchModalButton.addEventListener('click', () => {
        const modalContent = document.getElementById('search-modal').querySelector('.modal-content');
        
        // Remove previous search results
        const previousResults = document.getElementById('student-info-table');
        if (previousResults) {
            previousResults.remove();
        }

        // Remove previous apply button
        const previousApplyButton = document.getElementById('apply-button');
        if (previousApplyButton) {
            previousApplyButton.remove();
        }

        // Clear the search box
        document.getElementById('search-tezkere').value = '';

        closeModal('search-modal');
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('search-modal');
        if (event.target === modal) {
            const modalContent = document.getElementById('search-modal').querySelector('.modal-content');
            
            // Remove previous search results
            const previousResults = document.getElementById('student-info-table');
            if (previousResults) {
                previousResults.remove();
            }

            // Remove previous apply button
            const previousApplyButton = document.getElementById('apply-button');
            if (previousApplyButton) {
                previousApplyButton.remove();
            }

            // Clear the search box
            document.getElementById('search-tezkere').value = '';

            closeModal('search-modal');
        }
    });

document.getElementById('search-button').addEventListener('click', () => {
    const studenttezkereNo = document.getElementById('search-tezkere').value.trim();
    const schoolName = selectedSchool; // Assuming selectedSchool is already defined

    if (studenttezkereNo) {
        // Clear the search box
        document.getElementById('search-tezkere').value = '';

        // Remove previous search results
        const previousResults = document.getElementById('student-info-table');
        if (previousResults) {
            previousResults.remove();
        }

        // Remove previous apply button
        const previousApplyButton = document.getElementById('apply-button');
        if (previousApplyButton) {
            previousApplyButton.remove();
        }

        let url = `/api/completeentrydb?studenttezkereNo=${encodeURIComponent(studenttezkereNo)}`;
        if (currentAction === 'renew') {
            url += `&schoolName=${encodeURIComponent(schoolName)}`;
        }
        fetch(url)
        .then(response => handleResponse(response))
        .then(data => {
            console.log('Fetched data:', data);
            if (data.length > 0) {
                const student = data[0];
                const studentInfoTable = document.createElement('table');
                studentInfoTable.id = 'student-info-table';

                // Create table headers dynamically
                const headerRow = document.createElement('tr');
                tableHeaders.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header.headername;
                    headerRow.appendChild(th);
                });
                studentInfoTable.appendChild(headerRow);

                // Create table rows dynamically
                const dataRow = document.createElement('tr');
                tableHeaders.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = student[header.headername] || '';
                    dataRow.appendChild(td);
                });
                studentInfoTable.appendChild(dataRow);

                document.getElementById('search-modal').querySelector('.modal-content').appendChild(studentInfoTable);

                const applyButton = document.createElement('button');
applyButton.textContent = 'Apply';
applyButton.id = 'apply-button';
document.getElementById('search-modal').querySelector('.modal-content').appendChild(applyButton);

applyButton.addEventListener('click', () => {
    fetch('data/data.json') // Ensure the path is correct
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);

            // Extract the indexesforinformationpass values
            const indexes = data.inputs
            console.log(indexes)
            if (!Array.isArray(indexes) || indexes.some(index => isNaN(index) || index < 0 || index >= tableHeaders.length)) {
                alert('Invalid index values');
                return;
            }

            openModal('entry-modal');
            closeModal('search-modal');

            indexes.forEach(index => {
                const header = tableHeaders[index];
                const input = document.getElementById(`entry-${header.headername}`);
                if (input) {
                    input.value = student[header.headername] || '';
                    input.disabled = true; // Lock the inputs to prevent editing
                }
            });
        })
        .catch(error => {
            console.error('Failed to fetch index data:', error);
            handleError('Failed to fetch index data', error);
        });
});
            } else {
                alert('Student not found');
            }
        })
        .catch(error => {
            console.error('Failed to fetch student:', error);
            handleError('Failed to fetch student', error);
        });
    } else {
        alert('Please enter Tezkere No');
    }
});

    newRegistrationButton.addEventListener('click', () => {
        openModal('entry-modal');
    });

    const closeButton = document.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        closeModal('entry-modal');
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('entry-modal');
        if (event.target === modal) {
            closeModal('entry-modal');
        }
    });

    document.getElementById('entry-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const rawInstallments = gatherInstallmentData();
        addEntry(username, rawInstallments, selectedYear);
        closeModal('entry-modal');
    });

    document.getElementById('add-entry').addEventListener('click', () => {
        const rawInstallments = gatherInstallmentData();
        addEntry(username, rawInstallments, selectedYear);
    });

    document.getElementById('preview-entry').addEventListener('click', previewEntry);
    document.getElementById('back-button').addEventListener('click', () => window.location.href = 'index.html');

    function fetchSchoolData(school) {
        fetch('/api/schools')
        .then(response => handleResponse(response))
        .then(data => {
            schoolData = data.find(s => s.name === school);
            if (!schoolData) {
                alert('School not found');
                window.location.href = 'index.html';
            } else {
                fetchTableStructure(selectedYear);
            }
        })
        .catch(error => handleError('Failed to fetch school data', error));
    }

    function previewEntry() {
        const entryData = gatherEntryData();
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write('<h1>Preview Entry</h1>');
        previewWindow.document.write('<table>');
        Object.keys(entryData).forEach(key => {
            previewWindow.document.write(`<tr><td>${key}</td><td>${entryData[key]}</td></tr>`);
        });
        previewWindow.document.write('</table>');
        previewWindow.document.write('<button onclick="window.print()">Print</button>');
        previewWindow.document.close();
    }

    function printStudent(student) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<h1>Student Information</h1>');
        printWindow.document.write('<table>');
        Object.keys(student).forEach(key => {
            printWindow.document.write(`<tr><td>${key}</td><td>${student[key]}</td></tr>`);
        });
        printWindow.document.write('</table>');
        printWindow.document.write('<button onclick="window.print()">Print</button>');
        printWindow.document.close();
    }

    document.querySelector('.okay')?.addEventListener('click', closeModal);
    document.getElementById('filter-input')?.addEventListener('input', function() {
        const filterValue = this.value.toLowerCase();
        document.querySelectorAll('#student-list tr').forEach(row => {
            const match = Array.from(row.querySelectorAll('td')).some(cell => cell.textContent.toLowerCase().includes(filterValue));
            row.style.display = match ? '' : 'none';
        });
    });
});