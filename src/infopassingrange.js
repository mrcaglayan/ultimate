document.getElementById('submitInputs').addEventListener('click', function() {
    const inputs = [];
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById('input' + i).value;
        if (input) {
            inputs.push(Number(input));
        }
    }

    // Log the data being sent
    console.log('Sending inputs:', inputs);

    // Send the inputs to the server
    fetch('/api/inputs', { // Ensure this URL matches your server URL and port
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        console.log('Received response:', data);

        // Fetch the numbers from data.json and display them
        return fetch('/api/inputs');
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        const numberList = document.getElementById('numberList');
        numberList.innerHTML = '';
        data.numbers.forEach(num => {
            const listItem = document.createElement('li');
            listItem.textContent = num;
            numberList.appendChild(listItem);
        });
        console.log('Fetched data:', data);
    }).catch(error => {
        console.error('Error:', error);
    });
});

// Fetch the numbers from data.json and display them on page load
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/inputs')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const numberList = document.getElementById('numberList');
            numberList.innerHTML = '';
            data.numbers.forEach(num => {
                const listItem = document.createElement('li');
                listItem.textContent = num;
                numberList.appendChild(listItem);
            });
            console.log('Fetched data:', data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});