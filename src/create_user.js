document.getElementById('save-user').addEventListener('click', function() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const schoolName = document.getElementById('school-dropdown').value;

    if (username && password && schoolName) {
        const user = { username, password, schoolName };
        saveUser(user);
    } else {
        alert('Please enter username, password, and select a school');
    }
});

document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'admin.html';
});

function saveUser(user) {
    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(response => response.json())
    .then(data => {
        alert(`User ${data.username} saved`);
        fetchUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to save user');
    });
}

function fetchUsers() {
    fetch('/api/users')
    .then(response => response.json())
    .then(data => {
        users = data;
        displayUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to fetch users');
    });
}

function displayUsers() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.textContent = `Username: ${user.username}, Password: ${user.password}, School: ${user.schoolName}`;
        userList.appendChild(userItem);
    });
}

function fetchSchools() {
    fetch('/api/schools')
    .then(response => response.json())
    .then(data => {
        const schoolDropdown = document.getElementById('school-dropdown');
        schoolDropdown.innerHTML = ''; // Clear any existing options
        data.forEach(school => {
            const option = document.createElement('option');
            option.value = school.name;
            option.textContent = school.name;
            schoolDropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to fetch schools');
    });
}

// Fetch users and schools when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchUsers();
    fetchSchools();
});