
let tablesgottenfromdatajson = [];
let listofdiscounts = []; // New variable to store the list of discounts
let allDiscountOptions = []; // New array to store all discount options with rates

// Fetch existing discount rates and tables data from the server
Promise.all([
    fetch('/api/allDiscountOptions').then(response => response.json()),
    fetch('/api/tables').then(response => response.json())
])
    .then(([discountData, tablesData]) => {
        allDiscountOptions = discountData.filter(item => item !== null); // Filter out null values
        console.log('Existing discount options:', allDiscountOptions);

        if (tablesData && typeof tablesData === 'object') {
            // Merge tables from different years into a single array
            for (const year in tablesData) {
                if (Array.isArray(tablesData[year])) {
                    tablesgottenfromdatajson = tablesgottenfromdatajson.concat(tablesData[year]);
                }
            }
            console.log('Fetched tables data:', tablesgottenfromdatajson);
            displayTables(tablesgottenfromdatajson);
        } else {
            console.error('No tables found in the response');
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

// Function to display tables
function displayTables(tables) {
    const tablesContainer = document.getElementById('tables-container'); // Assuming there's a container with this ID in your HTML
    tablesContainer.innerHTML = ''; // Clear any existing content

    const uniqueHeaders = new Set();

    if (tables && tables.length > 0) {
        tables.forEach(table => {
            console.log('Processing table:', table); // Debugging log
            // Each table object itself represents a header
            const header = table;
            console.log('Processing header:', header); // Debugging log
            if (header.headername.toLowerCase().includes('discount') && !uniqueHeaders.has(header.headername)) {
                uniqueHeaders.add(header.headername);
                const optionsList = document.createElement('ul');
                header.options.forEach(option => {
                    const optionItem = document.createElement('li');
                    optionItem.innerHTML = `${option}`;
                    optionsList.appendChild(optionItem);

                    // Create input field and button for user to enter discount rate
                    const inputField = document.createElement('input');
                    inputField.type = 'number';
                    inputField.placeholder = 'Enter discount rate';
                    inputField.id = `rate-${option}`;

                    const submitButton = document.createElement('button');
                    submitButton.innerHTML = 'Submit';
                    submitButton.onclick = () => {
                        const discountRate = parseFloat(document.getElementById(`rate-${option}`).value);
                        if (!isNaN(discountRate)) {
                            // Check if the option already exists in allDiscountOptions
                            const existingOption = allDiscountOptions.find(item => item.option === option);
                            if (existingOption) {
                                // Update the discount rate if the option exists
                                existingOption.discountRate = discountRate;
                            } else {
                                // Add the new option with its discount rate
                                allDiscountOptions.push({ option, discountRate });
                            }
                            // Update the displayed discount rate
                            document.getElementById(`current-rate-${option}`).innerText = `Current rate: ${discountRate}`;
                            console.log(allDiscountOptions); // Log the combined list of discount options with rates for debugging
                        } else {
                            alert('Please enter a valid number for the discount rate.');
                        }
                    };

                    // Create a span to display the current discount rate
                    const currentRateSpan = document.createElement('span');
                    currentRateSpan.id = `current-rate-${option}`;
                    const existingOption = allDiscountOptions.find(item => item.option === option);
                    currentRateSpan.innerText = existingOption ? `Current rate: ${existingOption.discountRate}` : 'Current rate: N/A';

                    optionItem.appendChild(inputField);
                    optionItem.appendChild(submitButton);
                    optionItem.appendChild(currentRateSpan);
                });
                tablesContainer.appendChild(optionsList);

                // Store the list of discounts in listofdiscounts
                listofdiscounts.push({
                    header: header.headername,
                    options: header.options
                });
            }
        });
        console.log('List of discounts:', listofdiscounts); // Log the list of discounts for debugging
    } else {
        tablesContainer.innerHTML = '<p>No tables available</p>';
    }

    // Add a button to send the data to the server
    const sendButton = document.createElement('button');
    sendButton.innerHTML = 'Send Discounts to Server';
    sendButton.onclick = sendDiscountsToServer;
    tablesContainer.appendChild(sendButton);
}

// Function to send the discount options to the server
function sendDiscountsToServer() {
    fetch('/api/allDiscountOptions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(allDiscountOptions)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Discounts sent to the server successfully!');
    })
    .catch(error => {
        console.error('Error sending discounts:', error);
        alert('Failed to send discounts to the server.');
    });
}

// Add this code at the end of your JavaScript file or inside a DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    const navigateButton = document.getElementById('back-to-admin-from-value-page');
    navigateButton.addEventListener('click', function() {
        window.location.href = 'admin.html';
    });
});