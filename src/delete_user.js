document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'admin.html';
});

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
    users.forEach((user, index) => {
        const userItem = document.createElement('li');
        userItem.textContent = `Username: ${user.username}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            deleteUser(index);
        });
        userItem.appendChild(deleteButton);
        userList.appendChild(userItem);
    });
}

function deleteUser(index) {
    fetch(`/api/users/${index}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(`User ${data.username} deleted`);
        fetchUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete user');
    });
}

// Fetch users when the page loads
document.addEventListener('DOMContentLoaded', fetchUsers);