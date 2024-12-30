document.addEventListener('DOMContentLoaded', function() {
    const schoolSelect = document.getElementById('school');
    const schoolGroup = document.getElementById('school-group');
    const yearSelect = document.createElement('select');
    yearSelect.id = 'year';
    yearSelect.name = 'year';
    yearSelect.required = true;
    const yearLabel = document.createElement('label');
    yearLabel.setAttribute('for', 'year');
    yearLabel.textContent = 'Select Year:';
    schoolGroup.appendChild(yearLabel);
    schoolGroup.appendChild(yearSelect);

    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');

    function toggleLoginButtons() {
        const adminLoginButton = document.getElementById('admin-login');
        const userLoginButton = document.getElementById('user-login');
        if (userType === 'user') {
            adminLoginButton.style.display = 'none';
            userLoginButton.style.display = 'block';
            schoolGroup.style.display = 'block';
        } else if (userType === 'admin') {
            adminLoginButton.style.display = 'block';
            userLoginButton.style.display = 'none';
            schoolGroup.style.display = 'none';
        } else {
            adminLoginButton.style.display = 'block';
            userLoginButton.style.display = 'block';
            schoolGroup.style.display = 'none';
        }
    }

    toggleLoginButtons();

    if (userType === 'user') {
        // Fetch the list of schools and populate the dropdown
        fetch('/api/schools')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const uniqueSchools = [...new Set(data.map(school => school.name))]; // Ensure unique school names
                uniqueSchools.forEach(schoolName => {
                    const option = document.createElement('option');
                    option.value = schoolName;
                    option.textContent = schoolName;
                    schoolSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch schools');
            });

        schoolSelect.addEventListener('change', function() {
            const selectedSchool = schoolSelect.value;
            yearSelect.innerHTML = ''; // Clear previous options
            fetch('/api/tables')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    const years = Object.keys(data);
                    years.forEach(year => {
                        const option = document.createElement('option');
                        option.value = year;
                        option.textContent = year;
                        yearSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to fetch years');
                });
        });
    }

    document.getElementById('admin-login').addEventListener('click', function() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username && password) {
            if (username === 'admin' && password === 'admin') {
                window.location.href = 'admin.html';
            } else {
                alert('Invalid admin credentials');
            }
        } else {
            alert('Please fill in both username and password');
        }
    });

    document.getElementById('user-login').addEventListener('click', function() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const school = document.getElementById('school').value;
        const year = document.getElementById('year').value;

        if (username && password && school && year) {
            fetch('/api/users')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(users => {
                    const user = users.find(u => u.username === username && u.password === password && u.schoolName === school);
                    if (user) {
                        window.location.href = `user.html?school=${encodeURIComponent(school)}&year=${encodeURIComponent(year)}&username=${encodeURIComponent(username)}`;
                    } else {
                        alert('Invalid user credentials');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to fetch users');
                });
        } else {
            alert('Please fill in all fields');
        }
    });

    document.getElementById('back-to-home').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
});