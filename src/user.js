import { schoolBasedOnYearAndSchoolName,  } from './takeschoolsbyYear.js';
import { allDiscountOptionsforFee } from './feecalculator.js';

const urlParams = new URLSearchParams(window.location.search);
const selectedSchool = urlParams.get('school');
const username = urlParams.get('username');
const selectedYear = urlParams.get('year');
let tableHeaders = [];
let schoolData = null;
let currentAction = ''; // Add this line to track the current action
let currentStudentId = null;
let updatedStudentData = {};


export function generateUniqueId() {
    return Date.now();
}

function captureInstallmentData() {
    const installmentData = {};
    const installmentCount = parseInt(document.getElementById('installmentCount').value, 10);
    const advancePayment = parseFloat(document.getElementById('advancePayment').value) || 0;
    const totalDiscount = parseFloat(document.getElementById('totalDiscount').value.replace(/[^0-9.-]+/g, '')) || 0;
    const totalDiscountRate = parseFloat(document.getElementById('totalDiscountRate').value.replace('%', '')) || 0;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value.replace(/[^0-9.-]+/g, '')) || 0;

    for (let i = 1; i <= installmentCount; i++) {
        const installmentDate = document.getElementById(`installmentDate${i}`).value;
        const installmentAmount = parseFloat(document.getElementById(`installmentAmount${i}`).value.replace(/[^0-9.-]+/g, ''));

        installmentData[`${i}${getOrdinalSuffix(i)} Installment Date`] = installmentDate;
        installmentData[`${i}${getOrdinalSuffix(i)} Installment Amount`] = installmentAmount;
    }

    installmentData.advancePayment = advancePayment;
    installmentData.totalDiscount = totalDiscount;
    installmentData.totalDiscountRate = totalDiscountRate;
    installmentData.totalAmount = totalAmount;

    console.log('Installment Data:', installmentData);
    debugger;

    return installmentData;
}

function getOrdinalSuffix(i) {
    const j = i % 10,
          k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}

export function addEntry(username, selectedYear) {
    const entryData = gatherEntryData();
    if (Object.values(entryData).some(value => value === '')) {
        alert('Please fill in all fields');
        return;
    }
    const uniqueId = generateUniqueId();
    const registrationType = currentAction === 'renew' ? 'Renewed Registration' : currentAction === 'transfer' ? 'Transfer Registration' : 'New Registration';
    const capturedinformationfromscreen = captureInstallmentData(); // Capture installment data
    console.log('Installment Data:', capturedinformationfromscreen);
    debugger;
    const studentData = { ...entryData,...schoolBasedOnYearAndSchoolName, username, selectedYear, id: uniqueId, RegistrationType: registrationType, ...capturedinformationfromscreen };
    console.log('Student Data:', studentData);
    debugger;
    saveData('students', studentData, username, selectedYear);
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
        if (!Array.isArray(existingData.students)) {
            throw new Error('Expected existingData.students to be an array');
        }
        const studentExists = existingData.students.some(student => student['Student Tezkere No'] === data['Student Tezkere No'] && student.selectedYear === selectedYear);
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
            fetchStudents(username, selectedYear);
        } else {
            throw new Error('Invalid table structure: headers are missing or not an array');
        }
    })
    .catch(error => handleError('Failed to fetch table structure', error));
}



// Add input fields for installment number, date, and amount
function generateinstalmentform() {
    let preenrollmentstudent = {}; // Define the preenrollmentstudent variable
    preenrollmentstudent = { ...preenrollmentstudent, ...schoolBasedOnYearAndSchoolName }; // Merge objects

    // Function to update preenrollmentstudent object
    function updatePreenrollmentStudent() {
        document.querySelectorAll('#entry-form input, #entry-form select').forEach(input => {
            const key = input.id.replace('entry-', '');
            preenrollmentstudent[key] = input.value.trim();
            return preenrollmentstudent;
        });
    }

    // Initialize preenrollmentstudent object with current form values
    updatePreenrollmentStudent();

    // Add event listeners to update preenrollmentstudent object on input change
    document.querySelectorAll('#entry-form input, #entry-form select').forEach(input => {
        input.addEventListener('input', updatePreenrollmentStudent);
    });

    function calculateSchoolDays(startDate, endDate) {
        const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
        let schoolDays = 0;
        for (let day = 0; day < totalDays; day++) {
            const currentDay = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
            if (currentDay.getDay() !== 5) {
                schoolDays++;
            }
        }
        console.log(schoolDays);
        return schoolDays;
    }
    // Function to convert a value to a number
    function convertToNumber(value) {
        if (typeof value === 'string') {
            return parseFloat(value) || 0;
        }
        return value;
    }
    // Function to calculate prorated fee based on registeration day
    function calculateProratedFee(preenrollmentstudent) {
        const academicYearStart = new Date(preenrollmentstudent.academicYearStart);
        const academicYearEnd = new Date(preenrollmentstudent.academicYearEnd);
        const registrationDate = new Date(preenrollmentstudent["Registeration Date"]);
    
        const totalSchoolDays = calculateSchoolDays(academicYearStart, academicYearEnd);
        const dailyTuitionFee = preenrollmentstudent.tuitionFee / totalSchoolDays;
    
        const remainingSchoolDays = calculateSchoolDays(registrationDate, academicYearEnd);
        const proratedTuitionFee = dailyTuitionFee * remainingSchoolDays;
        console.log('Prorated Tuition Fee:', proratedTuitionFee);   
        return proratedTuitionFee;

    }
    // Function to apply discounts to the prorated fee
    function applyDiscounts(proratedFee, preenrollmentstudent) {
        const discountOptions = Object.keys(preenrollmentstudent).filter(key => key.includes('Discount')).map(key => preenrollmentstudent[key].trim());
        let finalTuitionFee = proratedFee;
        let totalDiscountAmount = 0;

        console.log('Applying discounts for student:', preenrollmentstudent["Student's Name"]);
        console.log('Initial prorated fee:', proratedFee);
        console.log('Discount options:', discountOptions);

        discountOptions.forEach(discountOption => {
            const discount = allDiscountOptionsforFee.find(d => d.option.trim() === discountOption);
            if (discount) {
                console.log(`Applying discount: ${discount.option} with rate: ${discount.discountRate}`);
                const discountAmount = finalTuitionFee * (discount.discountRate / 100);
                finalTuitionFee -= discountAmount; // Apply the discount amount
                totalDiscountAmount += discountAmount;
                console.log('Updated final tuition fee:', finalTuitionFee);
            } else {
                console.log(`Discount option not found: ${discountOption}`);
            }
        });

        const totalDiscountRate = ((proratedFee - finalTuitionFee) / proratedFee) * 100;
        console.log('Total discount rate:', totalDiscountRate);
        console.log('Total discount amount:', totalDiscountAmount);
        console.log('Final tuition fee:', finalTuitionFee);

        return {
            finalTuitionFee: Number(finalTuitionFee.toFixed(2)),
            totalDiscountRate: totalDiscountRate.toFixed(2),
            totalDiscountAmount: totalDiscountAmount.toFixed(2)
        };
    }

    // Function to calculate fees
    function calculateFees() {
        const invoicedStudentList = [preenrollmentstudent].map(student => {
            const proratedFee = calculateProratedFee(preenrollmentstudent);
            const { finalTuitionFee, totalDiscountRate, totalDiscountAmount } = applyDiscounts(proratedFee, preenrollmentstudent);
            
            console.log('Student:', preenrollmentstudent); // Log the entire student object
            const lunchFee = convertToNumber(preenrollmentstudent.lunchFee);
            const clothesFee = convertToNumber(preenrollmentstudent.cloth);
            const booksFee = convertToNumber(preenrollmentstudent.books);
            const dormitoryFee = convertToNumber(preenrollmentstudent.dormitory);
        
            // Log the converted values
            console.log('Lunch Fee:', lunchFee);
            console.log('Clothes Fee:', clothesFee);
            console.log('Books Fee:', booksFee);
            console.log('Dormitory Fee:', dormitoryFee);
            
            const totalFeeToBePaid = finalTuitionFee + lunchFee + clothesFee + booksFee + dormitoryFee;
        
            return {
            ...preenrollmentstudent,
            finalTuitionFee: finalTuitionFee.toFixed(2) + ' AFN',
            totalDiscountRate: totalDiscountRate + '%',
            totalDiscountAmount: totalDiscountAmount + ' AFN',
            totalFeeToBePaid: totalFeeToBePaid.toFixed(2) + ' AFN'
            };
        });
        console.log('Invoiced Student List:', invoicedStudentList);
        return invoicedStudentList;
    }

    const container = document.createElement('div'); // Define the container variable

    // Create the summary table
    const summaryTable = document.createElement('div');
    summaryTable.id = 'summary-table';
    summaryTable.innerHTML = `
        <div class="summary-header">
            <span>Tuition Fee</span>
            <span>Lunch Fee</span>
            <span>Total Discount</span>
            <span>Total Discount Rate</span>
            <span>Total Amount to be Paid</span>
        </div>
        <div class="summary-body">
            <span><input type="text" id="tuitionFee" readonly></span>
            <span><input type="text" id="lunchFee" readonly></span>
            <span><input type="text" id="totalDiscount" readonly></span>
            <span><input type="text" id="totalDiscountRate" readonly></span>
            <span><input type="text" id="totalAmount" readonly></span>
        </div>
    `;
    container.appendChild(summaryTable);

    const installmentCountLabel = document.createElement('label');
    installmentCountLabel.textContent = 'Number of Installments';
    const installmentCountSelect = document.createElement('select');
    installmentCountSelect.id = 'installmentCount';

    // Add "Choose" option at the beginning
    const chooseOption = document.createElement('option');
    chooseOption.value = ''; // Empty value for "Choose"
    chooseOption.textContent = 'Choose';
    installmentCountSelect.appendChild(chooseOption);
    
    // Add "Paid" option
    const paidOption = document.createElement('option');
    paidOption.value = 0; // Assuming 0 represents "Paid"
    paidOption.textContent = 'Paid';
    installmentCountSelect.appendChild(paidOption);
    
    // Add options for 1 to 12 installments
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        installmentCountSelect.appendChild(option);
    }
    
    container.appendChild(installmentCountLabel);
    container.appendChild(installmentCountSelect);

    const advancePaymentLabel = document.createElement('label');
    advancePaymentLabel.textContent = 'Advance Payment';
    const advancePaymentInput = document.createElement('input');
    advancePaymentInput.type = 'number';
    advancePaymentInput.id = 'advancePayment';
    advancePaymentInput.value = 0;
    container.appendChild(advancePaymentLabel);
    container.appendChild(advancePaymentInput);

    const entryFormContainer = document.getElementsByClassName('modal-content')[0]; // Access the first element in the collection
    let installmentFormsContainer = document.getElementById('installment-forms-container');
    if (!installmentFormsContainer) {
        installmentFormsContainer = document.createElement('div');
        installmentFormsContainer.id = 'installment-forms-container';
        entryFormContainer.appendChild(installmentFormsContainer);
    } else {
        installmentFormsContainer.innerHTML = ''; // Clear existing installment forms
    }

    installmentFormsContainer.appendChild(container); // Append the container to the installment forms container

    installmentCountSelect.addEventListener('change', () => {
        const selectedCount = parseInt(installmentCountSelect.value, 10);
        const advancePayment = parseFloat(advancePaymentInput.value) || 0;
        const existingForms = document.querySelectorAll('.installment-form');
        existingForms.forEach(existingForm => existingForm.remove());

        const totalAmount = parseFloat(document.getElementById('totalAmount').value.replace(/[^0-9.-]+/g, ''));
        const remainingAmount = totalAmount - advancePayment;
        const installmentAmount = remainingAmount / selectedCount;

        for (let i = 1; i <= selectedCount; i++) {
            const installmentForm = document.createElement('div');
            installmentForm.className = 'installment-form';

            const installmentDateLabel = document.createElement('label');
            installmentDateLabel.textContent = `${i}${getOrdinalSuffix(i)} Installment Date`;
            const installmentDateInput = document.createElement('input');
            installmentDateInput.type = 'date';
            installmentDateInput.id = `installmentDate${i}`;
            installmentForm.appendChild(installmentDateLabel);
            installmentForm.appendChild(installmentDateInput);

            const installmentAmountLabel = document.createElement('label');
            installmentAmountLabel.textContent = `${i}${getOrdinalSuffix(i)} Installment Amount`;
            const installmentAmountInput = document.createElement('input');
            installmentAmountInput.type = 'text';
            installmentAmountInput.id = `installmentAmount${i}`;
            installmentAmountInput.value = parseFloat(installmentAmount.toFixed(2)).toLocaleString() + ' AFN';
            installmentForm.appendChild(installmentAmountLabel);
            installmentForm.appendChild(installmentAmountInput);

            installmentFormsContainer.appendChild(installmentForm);
        }
    });

    function getOrdinalSuffix(i) {
        const j = i % 10,
              k = i % 100;
        if (j == 1 && k != 11) {
            return "st";
        }
        if (j == 2 && k != 12) {
            return "nd";
        }
        if (j == 3 && k != 13) {
            return "rd";
        }
        return "th";
    }
    // Add event listener to calculate fees on dropdown change
    document.querySelectorAll('#entry-modal .modal-content #entry-form select').forEach(select => {
        select.addEventListener('change', () => {
            const invoicedStudentList = calculateFees();
            if (invoicedStudentList.length > 0) {
                const student = invoicedStudentList[0];
                document.getElementById('tuitionFee').value = Number(student.finalTuitionFee.replace(' AFN', '')).toLocaleString() + ' AFN';
                document.getElementById('lunchFee').value = Number(student.lunchFee).toLocaleString() + ' AFN';
                document.getElementById('totalDiscount').value = Number(student.totalDiscountAmount.replace(' AFN', '')).toLocaleString() + ' AFN';
                document.getElementById('totalDiscountRate').value = student.totalDiscountRate;
                document.getElementById('totalAmount').value = Number(student.totalFeeToBePaid.replace(' AFN', '')).toLocaleString() + ' AFN';
            }
        });
    });

    // Add event listener to recalculate installments on advance payment change
    advancePaymentInput.addEventListener('input', () => {
        installmentCountSelect.dispatchEvent(new Event('change'));
    });
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
    const header = tableHeaders.find(h => h.headername === key);
    let input;
    if (header) {
        if (header.Datatype === 'text' || header.Datatype === 'string') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value;
        } else if (header.Datatype === 'dropdown') {
            input = document.createElement('select');
            header.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.trim(); // Trim the option value
                optionElement.textContent = option.trim(); // Trim the option text
                if (option.trim() === value.trim()) { // Trim the value for comparison
                    optionElement.selected = true;
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
                cell.textContent = value;
                row.appendChild(cell);
            });
            console.log(student);
            const actionCell = document.createElement('td');
            actionCell.appendChild(createButton('Preview', () => previewStudent(student)));
            if (student.finalenrollment !== "yes") {
                actionCell.appendChild(createButton('Delete', () => deleteStudent(student.id, username, selectedYear)));
                actionCell.appendChild(createButton('Edit', () => editStudent(student, row)));
                actionCell.appendChild(createButton('Final Enrollment', () => finalEnrollment(student, row)));
            }
            row.appendChild(actionCell);
            studentList.appendChild(row);
        });
        addSearchBoxListeners();
    })
    .catch(error => handleError('Failed to fetch students', error));
}

function finalEnrollment(student, row) {
    // Add final enrollment information to the student
    student.finalenrollment = "yes";

    // Update the student data on the server
    const endpoint = `/api/students/${student.id}`;
    fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
    })
    .then(response => handleResponse(response))
    .then(data => {
        // Update the UI to show only the preview button
        const actionCell = row.querySelector('td:last-child');
        actionCell.innerHTML = '';
        actionCell.appendChild(createButton('Preview', () => previewStudent(student)));
    })
    .catch(error => handleError(`Error updating student:`, error));
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
}

function deleteData(endpoint, id, username, selectedYear) {
    fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
    .then(response => handleResponse(response))
    .then(data => {
        if (endpoint === 'students') {
            fetchStudents(username, selectedYear);
        }
    })
    .catch(error => handleError(`Error deleting ${endpoint}:`, error));
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('disable-pointer-events'); // Disable pointer events on background

        // Disable pointer events on sticky elements
        document.getElementById('button-container').style.pointerEvents = 'none';
        document.querySelectorAll('table thead th').forEach(th => th.style.pointerEvents = 'none');

        // Clear the search box and student information table when the search modal is opened
        if (modalId === 'search-modal') {
            const searchBox = document.getElementById('search-tezkere');
            if (searchBox) {
                searchBox.value = '';
            }
            const studentInfoTable = document.getElementById('student-info-table');
            if (studentInfoTable) {
                studentInfoTable.remove();
            }
            const applyButton = document.getElementById('apply-button');
            if (applyButton) {
                applyButton.remove();
            }
        }

        // Regenerate the entry form when the entry modal is opened
        if (modalId === 'entry-modal') {
            const entryFormContainer = document.getElementsByClassName('modal-content')[0];
            const installmentFormsContainer = document.getElementById('installment-forms-container');
            if (installmentFormsContainer) {
                installmentFormsContainer.innerHTML = ''; // Clear existing installment forms
            }
            generateinstalmentform();
        }

        // Prevent modal from closing when clicking on the background
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                event.stopPropagation();
            }
        });
    } else {
        console.error(`Modal with id ${modalId} not found.`);
    }
}
function toggleButtons(showUpdate) {
    const addButton = document.getElementById('add-entry');
    const updateButton = document.getElementById('update-entry');

    if (showUpdate) {
        addButton.style.display = 'none';
        updateButton.style.display = 'inline-block';
    } else {
        addButton.style.display = 'inline-block';
        updateButton.style.display = 'none';
    }
}

function editStudent(student, row) {
    const currentvaluesofinputs = {};
    updatedStudentData = {}; // Reset the updatedStudentData object


    // Collect current values before editing
    Object.entries(student).forEach(([key, value]) => {
        if (key !== 'username') {
            currentvaluesofinputs[key] = value;
        }
        console.log(currentvaluesofinputs);

    });

    openModal('entry-modal');
    toggleButtons(true);

    // Populate the form with the current values
    Object.entries(currentvaluesofinputs).forEach(([key, value]) => {
        const input = document.getElementById(`entry-${key}`);
        if (input) {
            input.value = value;
            input.addEventListener('input', () => {
                updatedStudentData[key] = input.value.trim();
            });
        }
    });

    // Create and populate the summary table
    const summaryTable = document.createElement('div');
    summaryTable.id = 'summary-table';
    summaryTable.innerHTML = `
        <div class="summary-header">
            <span>Tuition Fee</span>
            <span>Lunch Fee</span>
            <span>Total Discount</span>
            <span>Total Discount Rate</span>
            <span>Total Amount to be Paid</span>
        </div>
        <div class="summary-body">
            <span><input type="text" id="tuitionFee" readonly></span>
            <span><input type="text" id="lunchFee" readonly></span>
            <span><input type="text" id="totalDiscount" readonly></span>
            <span><input type="text" id="totalDiscountRate" readonly></span>
            <span><input type="text" id="totalAmount" readonly></span>
        </div>
    `;
    const container = document.getElementById('installment-forms-container');
    container.innerHTML = ''; // Clear existing content
    container.appendChild(summaryTable);

    // Populate summary table data
    document.getElementById('tuitionFee').value = student.tuitionFee ? Number(student.tuitionFee).toLocaleString() + ' AFN' : '';
    document.getElementById('lunchFee').value = student.lunchFee ? Number(student.lunchFee).toLocaleString() + ' AFN' : '';
    document.getElementById('totalDiscount').value = student.totalDiscount ? Number(student.totalDiscount).toLocaleString() + ' AFN' : '';
    document.getElementById('totalDiscountRate').value = student.totalDiscountRate ? student.totalDiscountRate + '%' : '';
    document.getElementById('totalAmount').value = student.totalAmount ? Number(student.totalAmount).toLocaleString() + ' AFN' : '';

    // Create and populate the number of installments dropdown
    const installmentCountLabel = document.createElement('label');
    installmentCountLabel.textContent = 'Number of Installments';
    const installmentCountSelect = document.createElement('select');
    installmentCountSelect.id = 'installmentCount';
    
    // Add "Choose" option at the beginning
    const chooseOption = document.createElement('option');
    chooseOption.value = ''; // Empty value for "Choose"
    chooseOption.textContent = 'Choose';
    installmentCountSelect.appendChild(chooseOption);
    
    // Add "Paid" option
    const paidOption = document.createElement('option');
    paidOption.value = 0; // Assuming 0 represents "Paid"
    paidOption.textContent = 'Paid';
    installmentCountSelect.appendChild(paidOption);
    
    // Add options for 1 to 12 installments
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        installmentCountSelect.appendChild(option);
    }
    
    container.appendChild(installmentCountLabel);
    container.appendChild(installmentCountSelect);

    // Set the number of installments
    const installmentCount = Object.keys(student).filter(key => key.includes('Installment Date')).length;
    installmentCountSelect.value = installmentCount;

    // Create and populate the advance payment field
    const advancePaymentLabel = document.createElement('label');
    advancePaymentLabel.textContent = 'Advance Payment';
    const advancePaymentInput = document.createElement('input');
    advancePaymentInput.type = 'number';
    advancePaymentInput.id = 'advancePayment';
    advancePaymentInput.value = student.advancePayment || 0;
    container.appendChild(advancePaymentLabel);
    container.appendChild(advancePaymentInput);

    // Function to create installment fields
    function createInstallmentFields(count) {
        const existingForms = document.querySelectorAll('.installment-form');
        existingForms.forEach(existingForm => existingForm.remove());

        const totalAmount = parseFloat(document.getElementById('totalAmount').value.replace(/[^0-9.-]+/g, ''));
        const advancePayment = parseFloat(advancePaymentInput.value) || 0;
        const remainingAmount = totalAmount - advancePayment;
        const installmentAmount = remainingAmount / count;

        for (let i = 1; i <= count; i++) {
            const installmentForm = document.createElement('div');
            installmentForm.className = 'installment-form';

            const installmentDateLabel = document.createElement('label');
            installmentDateLabel.textContent = `${i}${getOrdinalSuffix(i)} Installment Date`;
            const installmentDateInput = document.createElement('input');
            installmentDateInput.type = 'date';
            installmentDateInput.id = `installmentDate${i}`;
            installmentForm.appendChild(installmentDateLabel);
            installmentForm.appendChild(installmentDateInput);

            const installmentAmountLabel = document.createElement('label');
            installmentAmountLabel.textContent = `${i}${getOrdinalSuffix(i)} Installment Amount`;
            const installmentAmountInput = document.createElement('input');
            installmentAmountInput.type = 'text';
            installmentAmountInput.id = `installmentAmount${i}`;
            installmentAmountInput.value = parseFloat(installmentAmount.toFixed(2)).toLocaleString() + ' AFN';
            installmentForm.appendChild(installmentAmountLabel);
            installmentForm.appendChild(installmentAmountInput);

            container.appendChild(installmentForm);
        }
    }

    // Populate installment data
    createInstallmentFields(installmentCount);
    for (let i = 1; i <= installmentCount; i++) {
        const installmentDate = student[`${i}st Installment Date`] || student[`${i}nd Installment Date`] || student[`${i}rd Installment Date`] || student[`${i}th Installment Date`];
        const installmentAmount = student[`${i}st Installment Amount`] || student[`${i}nd Installment Amount`] || student[`${i}rd Installment Amount`] || student[`${i}th Installment Amount`];

        if (installmentDate && installmentAmount) {
            const installmentDateInput = document.getElementById(`installmentDate${i}`);
            const installmentAmountInput = document.getElementById(`installmentAmount${i}`);

            if (installmentDateInput) {
                installmentDateInput.value = installmentDate;
                installmentDateInput.addEventListener('input', (event) => {
                    updatedStudentData[`${i}st Installment Date`] = event.target.value;
                });
            }

            if (installmentAmountInput) {
                installmentAmountInput.value = Number(installmentAmount).toLocaleString() + ' AFN';
                installmentAmountInput.addEventListener('input', (event) => {
                    updatedStudentData[`${i}st Installment Amount`] = parseFloat(event.target.value.replace(/[^0-9.-]+/g, '').replace(/,/g, ''));
                });
            }
        }
    }

    // Add event listener to the installment count dropdown
    installmentCountSelect.addEventListener('change', () => {
        const selectedCount = parseInt(installmentCountSelect.value, 10);
        createInstallmentFields(selectedCount);
    });

    // Add event listener to the advance payment input
    advancePaymentInput.addEventListener('input', () => {
        const selectedCount = parseInt(installmentCountSelect.value, 10);
        createInstallmentFields(selectedCount);
    });

    // Set the current student ID
    currentStudentId = student.id;


    const actionCell = row.querySelector('td:last-child');
    actionCell.innerHTML = '';
    actionCell.appendChild(createButton('Save', () => {
        saveEditedData(student.id, updatedStudentData);
    }));
    actionCell.appendChild(createButton('Cancel', () => {
        fetchStudents(username, selectedYear); // Reload the students to revert changes
    }));
}





function saveEditedData(studentId, updatedStudentData) {
    // Remove existing installment data
    for (let i = 1; i <= 12; i++) {
        delete updatedStudentData[`${i}st Installment Date`];
        delete updatedStudentData[`${i}st Installment Amount`];
        delete updatedStudentData[`${i}nd Installment Date`];
        delete updatedStudentData[`${i}nd Installment Amount`];
        delete updatedStudentData[`${i}rd Installment Date`];
        delete updatedStudentData[`${i}rd Installment Amount`];
        delete updatedStudentData[`${i}th Installment Date`];
        delete updatedStudentData[`${i}th Installment Amount`];
    }

    // Capture new installment data
    const installmentData = captureInstallmentData();
    Object.assign(updatedStudentData, installmentData);

    const endpoint = `/api/students/${studentId}`;
    console.log('Saving updated student data:', updatedStudentData);
    console.log('Endpoint:', endpoint);

    fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudentData)
    })
    .then(response => handleResponse(response))
    .then(data => {
        fetchStudents(username, selectedYear);
    })
    .catch(error => handleError(`Error updating student:`, error));
}

// Function to fetch school data
// Removed duplicate fetchSchoolData function

function previewStudent(student) {
    const printArea = document.createElement('div');
    printArea.style.display = 'block'; // Ensure the print area is visible
    printArea.innerHTML = `
        <div class="contract-container printable">
            <div class="header">
                <img src="logo.png" alt="Logo">
                <h1>${student.name}</h1>
            </div>
            <div class="section-title">STUDENT INFORMATION</div>
            <div class="student-id-info">
                <div class="form-group">
                    <span>Student Tezkere No</span>
                    <input type="text" value="${student["Student Tezkere No"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Student Name</span>
                    <input type="text" value="${student["Student's Name"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Student Surname</span>
                    <input type="text" value="${student["Stutend's Surname"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Parent Tezkere No</span>
                    <input type="text" value="${student["Parent Tezkere No"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Parent Name</span>
                    <input type="text" value="${student["Parent Name"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Parent Surname</span>
                    <input type="text" value="${student["Parent Surname"]}" readonly>
                </div>
                <div class="form-group">
                    <span>Class</span>
                    <input type="text" value="${student.Class}" readonly>
                </div>
                <div class="form-group">
                    <span>School Code</span>
                    <input type="text" value="${student.schoolCode || ''}" readonly>
                </div>
            </div>
            <hr>
            <div class="section-title">REGISTRATION INFORMATION</div>
            <div class="form-group">
                <span style="flex: 2;background-color: #EAECEE;">Registration Date</span>
                <input type="text" value="${student["Registeration Date"]}" readonly style="flex: 1;">
                <span style="flex: 2;background-color: #EAECEE;">Registration Type</span>
                <input type="text" value="${student.RegistrationType}" readonly style="flex: 1;">
            </div>
            <hr>
            <div class="section-title">FEE INFORMATION</div>
            <div class="form-group">
                <span class="fee-label" style="background:rgba(10, 204, 252, 0.93); text-align: center; border-radius: 5px;">Tuition Fee</span>
                <span class="fee-label" style="background:rgba(10, 204, 252, 0.93); text-align: center; border-radius: 5px;">Lunch Fee</span>
                <span class="fee-label" style="background:rgba(10, 204, 252, 0.93); text-align: center; border-radius: 5px;">Total Fee</span>
            </div>
            <div class="form-group">
                <input type="text" value="${Number(student.tuitionFee).toLocaleString()} AFN" readonly>
                <input type="text" value="${Number(student.lunchFee).toLocaleString()} AFN" readonly>
                <input type="text" value="${Number(student.totalAmount).toLocaleString()} AFN" readonly>
            </div>
            <div class="form-group">
                <span style="text-align: center;background:rgba(10, 204, 252, 0.93);">Net Fee</span>
                <span style="text-align: center;background:rgba(10, 204, 252, 0.93);">Total Discount</span>
                <span style="text-align: center;background:rgba(10, 204, 252, 0.93);">Fee to be Paid</span>
            </div>
            <div class="form-group">
                <input type="text" value="${Number(student.netFee || student.tuitionFee).toLocaleString()} AFN" readonly>
                <input type="text" value="${Number(student.totalDiscount).toLocaleString()} AFN" readonly>
                <input type="text" value="${Number(student.totalAmount).toLocaleString()} AFN" readonly>
            </div>
            <div class="advance-payment">
                <span>Advance Payment</span>
                <input type="text" value="${Number(student.advancePayment).toLocaleString()} AFN" readonly style="text-align: center;">
            </div>
            <hr>
            <div class="section-title">INSTALLMENT SCHEDULE</div>
            <div class="installment-schedule">
                <div class="form-group">
                    <span style="background:rgba(10, 204, 252, 0.93);">1st Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">2nd Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">3rd Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">4th Installment Date</span>
                </div>
                <div class="form-group">
                    <input type="text" value="${student["1st Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["2nd Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["3rd Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["4th Installment Date"] || ''}" readonly>
                </div>
                <div class="form-group">
                    <input type="text" value="${Number(student["1st Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["2nd Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["3rd Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["4th Installment Amount"] || '').toLocaleString()} AFN" readonly>
                </div>
                <div class="form-group">
                    <span style="background:rgba(10, 204, 252, 0.93);">5th Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">6th Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">7th Installment Date</span>
                    <span style="background:rgba(10, 204, 252, 0.93);">8th Installment Date</span>
                </div>
                <div class="form-group">
                    <input type="text" value="${student["5th Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["6th Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["7th Installment Date"] || ''}" readonly>
                    <input type="text" value="${student["8th Installment Date"] || ''}" readonly>
                </div>
                <div class="form-group">
                    <input type="text" value="${Number(student["5th Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["6th Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["7th Installment Amount"] || '').toLocaleString()} AFN" readonly>
                    <input type="text" value="${Number(student["8th Installment Amount"] || '').toLocaleString()} AFN" readonly>
                </div>
            </div>
            <div class="signature-section">
                <div>
                    <p>Parent/Guardian Signature</p>
                </div>
                <div>
                    <p>Principal Signature</p>
                </div>
            </div>    
        </div>
    `;

    document.body.appendChild(printArea);

    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
        @media print {
            body {
                color-adjust: exact; /* Ensures colors are preserved in print */
                -webkit-print-color-adjust: exact; /* For Webkit browsers like Chrome and Safari */
                print-color-adjust: exact; /* Fallback for some browsers */
            }

            .printable {
                background-color: #f0f8ff; /* Light blue */
                color: #000; /* Black text */
            }

            body * {
                visibility: hidden;
            }
            .contract-container, .contract-container * {
                visibility: visible;
            }
            .contract-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: #fff;
                padding: 10px;
                border-radius: 10px;
                box-shadow: none;
                box-sizing: border-box;
                font-size: 12px; /* Reduce font size */
            }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .header img { width: 150px; height: 50px; } /* Reduce image size */
            .header h1 { flex: 1; text-align: center; font-size: 16px; } /* Reduce font size */
            .section-title { font-size: 20px; color:rgb(0, 0, 0); margin-top: 20px; text-align: center; text-transform: uppercase; } /* Increase font size, center, and uppercase */
            .form-group { display: flex; justify-content: space-between; margin-bottom: 10px; } /* Increase margin */
            .form-group span { flex: 1; font-weight: bold; padding: 3px; border-radius: 5px; } /* Reduce padding */
            .form-group input { flex: 2; padding: 5px; border: 1px solid #ccc; border-radius: 5px; text-align: center; } /* Reduce padding */
            .contract-table { width: 100%; border-collapse: collapse; margin-top: 20px; } /* Increase margin */
            .contract-table th, .contract-table td { border: 1px solid #ddd; padding: 5px; text-align: left; } /* Reduce padding */
            .contract-table th { background-color: #4CAF50; color: white; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 30px; } /* Increase margin */
            .signature-section div { text-align: center; }
            .signature-section p { margin-top: 30px; border-top: 1px solid #333; padding-top: 5px; width: 150px; } /* Increase margin */
            .student-id-info { display: flex; flex-wrap: wrap; }
            .student-id-info .form-group { flex: 1 1 100%; display: flex; justify-content: space-between; }
            .student-id-info .form-group span { flex: 1; }
            .student-id-info .form-group input { flex: 2; }
            .advance-payment { display: flex; justify-content: flex-end; }
            .advance-payment span { margin-right: 10px; font-weight: bold; padding: 3px; border-radius: 5px; text-align: center; } /* Increase margin */
            .installment-schedule .form-group span, .fee-info .form-group span { text-align: center; }
            .student-id-info .form-group span:nth-child(1) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(2) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(3) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(4) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(5) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(6) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(7) { background-color: #EAECEE; }
            .student-id-info .form-group span:nth-child(8) { background-color: #EAECEE; }
            .fee-info .form-group span.fee-label { background-color: #007BFF !important; color: white; }
            .advance-payment span { background-color: #EAECEE; }

            @page {
                size: A4;
                margin: 0;
            }
            header, footer {
                display: none;
            }
        }
    `;
    document.head.appendChild(printStyles);

    window.print();

    document.body.removeChild(printArea);
    document.head.removeChild(printStyles);
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
    newRegistrationButton.id = 'new-registration-button';
    newRegistrationButton.textContent = 'New Registration';
    buttonContainer.appendChild(newRegistrationButton);
    const renewRegistrationButton = document.createElement('button');
    renewRegistrationButton.textContent = 'Renew Registration';
    buttonContainer.appendChild(renewRegistrationButton);
    const transferRegistrationButton = document.createElement('button');
    transferRegistrationButton.textContent = 'Transfer Registration';
    buttonContainer.appendChild(transferRegistrationButton);

// Function to open a modal
const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('disable-pointer-events'); // Disable pointer events on background

        // Disable pointer events on sticky elements
        document.getElementById('button-container').style.pointerEvents = 'none';
        document.querySelectorAll('table thead th').forEach(th => th.style.pointerEvents = 'none');

        // Clear the search box and student information table when the search modal is opened
        if (modalId === 'search-modal') {
            const searchBox = document.getElementById('search-tezkere');
            if (searchBox) {
                searchBox.value = '';
            }
            const studentInfoTable = document.getElementById('student-info-table');
            if (studentInfoTable) {
                studentInfoTable.remove();
            }
            const applyButton = document.getElementById('apply-button');
            if (applyButton) {
                applyButton.remove();
            }
        }

        // Regenerate the entry form when the entry modal is opened
        if (modalId === 'entry-modal') {
            const entryFormContainer = document.getElementsByClassName('modal-content')[0];
            const installmentFormsContainer = document.getElementById('installment-forms-container');
            if (installmentFormsContainer) {
                installmentFormsContainer.innerHTML = ''; // Clear existing installment forms
            }
            generateinstalmentform();
        }

        // Prevent modal from closing when clicking on the background
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                event.stopPropagation();
            }
        });
    } else {
        console.error(`Modal with id ${modalId} not found.`);
    }
};

    // Event listener for the "update-entry" button
    document.getElementById('update-entry').addEventListener('click', () => {
        console.log('updatedStudentData before:', updatedStudentData);
        const installmentData = captureInstallmentData();
        Object.assign(updatedStudentData, installmentData);
        console.log(installmentData);
        console.log(updatedStudentData);
        debugger;
        saveEditedData(currentStudentId, updatedStudentData);
    });

    // Function to close a modal and optionally refresh the page
    const closeModal = (modalId, refresh = false) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('disable-pointer-events'); // Enable pointer events on background

            // Enable pointer events on sticky elements
            document.getElementById('button-container').style.pointerEvents = 'auto';
            document.querySelectorAll('table thead th').forEach(th => th.style.pointerEvents = 'auto');

            // Refresh the page if needed
            if (refresh) {
                window.location.reload();
            }
        } else {
            console.error(`Modal with id ${modalId} not found.`);
        }


        
    };

    

    transferRegistrationButton.addEventListener('click', () => {
        currentAction = 'transfer'; // Set current action to transfer
        openModal('search-modal');
        toggleButtons(false);

    });

    renewRegistrationButton.addEventListener('click', () => {
        currentAction = 'renew'; // Set current action to renew
        openModal('search-modal');
        toggleButtons(false);
        
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
            closeModal('entry-modal')
            closeModal('modal-content')
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

        // Remove previous cancel button
        const previousCancelButton = document.getElementById('cancel-button');
        if (previousCancelButton) {
            previousCancelButton.remove();
        }

        let url = `/api/students?studenttezkereNo=${encodeURIComponent(studenttezkereNo)}`;

        if (currentAction === 'renew') {
            url += `&schoolName=${encodeURIComponent(schoolName)}`;
        }
        fetch(url)
        .then(response => handleResponse(response))
        .then(data => {
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

                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.id = 'cancel-button';
                document.getElementById('search-modal').querySelector('.modal-content').appendChild(cancelButton);

                applyButton.addEventListener('click', () => {
                // Clear only the user-editable form fields
                document.querySelectorAll('#entry-form input:not([data-locked]), #entry-form select:not([data-locked])').forEach(input => {
                    input.value = '';
                });

                // Generate the form fields
                generateTableForm(tableHeaders);
                    fetch('data/data.json') // Ensure the path is correct
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Extract the indexesforinformationpass values
                            const indexes = data.inputs;
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

                cancelButton.addEventListener('click', () => {
                    closeModal('search-modal');
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

    // Event listener for the "newRegistrationButton"
    newRegistrationButton.addEventListener('click', () => {
        // Clear only the user-editable form fields
        document.querySelectorAll('#entry-form input:not([data-locked]), #entry-form select:not([data-locked])').forEach(input => {
            input.value = '';
        });

        // Generate the form fields
        generateTableForm(tableHeaders);

        openModal('entry-modal');
        toggleButtons(false);
    });

    // Event listener for the "cancel-entry" button
    document.getElementById('cancel-entry').addEventListener('click', () => {
        closeModal('entry-modal'); 
    });

    // Event listener for the "close-button"
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeModal('entry-modal'); // Pass true to refresh the page
        });
    }


    // Event listener for window click to close modal
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('entry-modal');
        if (event.target === modal) {
            closeModal('entry-modal');
        }
    });

    document.getElementById('entry-form').addEventListener('submit', (event) => {
        event.preventDefault();
        addEntry(username, selectedYear);
        closeModal('entry-modal');
        debugger;
    });

    
    // Event listener for the "add-entry" button
    document.getElementById('add-entry').addEventListener('click', () => {
        if (installmentCount.value === '') {
            alert('Please pick a number of installments.');
        } else {
        addEntry(username, selectedYear);
        closeModal('entry-modal', false); // Pass true to refresh the page
        }
    });

    // Event listener for the "update-entry" button
    document.getElementById('update-entry').addEventListener('click', () => {
        if (installmentCount.value === '') {
            alert('Please pick a number of installments.');
        } else {
        saveEditedData(currentStudentId, updatedStudentData);
        closeModal('entry-modal', false); // Pass true to refresh the page
        }
    });    
    
    // Event listener for the "preview-entry" button
    document.getElementById('preview-entry').addEventListener('click', () => {
    //logic later it is to print pre-registeration form
    });   




    // Event listener for the "back-button"
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




    document.querySelector('.okay')?.addEventListener('click', closeModal);
    document.getElementById('filter-input')?.addEventListener('input', function() {
        const filterValue = this.value.toLowerCase();
        document.querySelectorAll('#student-list tr').forEach(row => {
            const match = Array.from(row.querySelectorAll('td')).some(cell => cell.textContent.toLowerCase().includes(filterValue));
            row.style.display = match ? '' : 'none';
        });
    });
});

