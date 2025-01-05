document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'admin.html';
});

document.getElementById('add-school').addEventListener('click', function() {
    console.log('Add School button clicked'); // Debugging log
    addSchool();
});

document.getElementById('region').addEventListener('change', function() {
    const region = this.value;
    const year = parseInt(document.getElementById('year').value.trim(), 10);
    if (region && year) {
        setDates(year, region);
    }
});

document.getElementById('year').addEventListener('input', function() {
    const year = parseInt(this.value.trim(), 10);
    const region = document.getElementById('region').value;
    if (region && year) {
        setDates(year, region);
    }
});

function setDates(year, region) {
    if (region === 'North') {
        document.getElementById('academic-year-start').value = `${year}-02-01`;
        document.getElementById('academic-year-end').value = `${year}-12-31`;
        document.getElementById('semester-start').value = `${year}-07-01`;
        document.getElementById('semester-end').value = `${year}-08-31`;
    } else if (region === 'South') {
        document.getElementById('academic-year-start').value = `${year}-09-01`;
        document.getElementById('academic-year-end').value = `${year + 1}-06-30`;
        document.getElementById('semester-start').value = `${year + 1}-01-01`;
        document.getElementById('semester-end').value = `${year + 1}-01-31`;
    }
    lockDateFields();
}

function lockDateFields() {
    document.getElementById('academic-year-start').disabled = true;
    document.getElementById('academic-year-end').disabled = true;
    document.getElementById('semester-start').disabled = true;
    document.getElementById('semester-end').disabled = true;
}

function addSchool() {
    const year = document.getElementById('year').value.trim();
    const schoolcode = document.getElementById('school-coder').value.trim();
    const schoolName = document.getElementById('school-name').value.trim();
    const tuitionFee = document.getElementById('tuition-fee').value.trim();
    const lunchFee = document.getElementById('lunch-fee').value.trim();
    const cloth = document.getElementById('cloth').value.trim();
    const books = document.getElementById('books').value.trim();
    const dormitory = document.getElementById('dormitory').value.trim();
    const academicYearStart = document.getElementById('academic-year-start').value.trim();
    const academicYearEnd = document.getElementById('academic-year-end').value.trim();
    const semesterStart = document.getElementById('semester-start').value.trim();
    const semesterEnd = document.getElementById('semester-end').value.trim();

    console.log('Year:', year); // Debugging log
    console.log('School Name:', schoolName); // Debugging log
    console.log('Tuition Fee:', tuitionFee); // Debugging log
    console.log('Lunch Fee:', lunchFee); // Debugging log
    console.log('Cloth:', cloth); // Debugging log
    console.log('Books:', books); // Debugging log
    console.log('Dormitory:', dormitory); // Debugging log
    console.log('Academic Year Start:', academicYearStart); // Debugging log
    console.log('Academic Year End:', academicYearEnd); // Debugging log
    console.log('Semester Start:', semesterStart); // Debugging log
    console.log('Semester End:', semesterEnd); // Debugging log

    if (year && schoolName && tuitionFee && lunchFee && cloth && books && dormitory && academicYearStart && academicYearEnd && semesterStart && semesterEnd) {
        const school = {
            year: parseInt(year),
            name: schoolName,
            schoolcode: schoolcode,
            tuitionFee: parseFloat(tuitionFee),
            lunchFee: parseFloat(lunchFee),
            cloth: parseFloat(cloth),
            books: parseFloat(books),
            dormitory: parseFloat(dormitory),
            academicYearStart: new Date(academicYearStart),
            academicYearEnd: new Date(academicYearEnd),
            semesterStart: new Date(semesterStart),
            semesterEnd: new Date(semesterEnd)
        };

        fetch('/api/schools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(school)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('School added:', data); // Debugging log
            fetchSchools(); // Fetch and display the updated list of schools
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add school');
        });
    } else {
        alert('Please fill in all fields');
    }
}

function fetchSchools() {
    fetch('/api/schools')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const schoolListContainer = document.getElementById('school-list-container');
        schoolListContainer.innerHTML = ''; // Clear any existing list

        const ul = document.createElement('ul');
        data.forEach((school, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${school.year} - ${school.name} - Tuition Fee: ${school.tuitionFee}, Lunch Fee: ${school.lunchFee}, Cloth: ${school.cloth}, Books: ${school.books}, Dormitory: ${school.dormitory}</span>
                <button class="edit-button" onclick="editSchool(${index})">Edit</button>
                <button onclick="deleteSchool(${index})">Delete</button>
            `;
            ul.appendChild(li);
        });

        schoolListContainer.appendChild(ul);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to fetch schools');
    });
}

function editSchool(index) {
    fetch('/api/schools')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const school = data[index];
        const schoolListContainer = document.getElementById('school-list-container');
        const li = schoolListContainer.querySelectorAll('li')[index];

        const academicYearStart = school.academicYearStart ? new Date(school.academicYearStart).toISOString().split('T')[0] : '';
        const academicYearEnd = school.academicYearEnd ? new Date(school.academicYearEnd).toISOString().split('T')[0] : '';
        const semesterStart = school.semesterStart ? new Date(school.semesterStart).toISOString().split('T')[0] : '';
        const semesterEnd = school.semesterEnd ? new Date(school.semesterEnd).toISOString().split('T')[0] : '';

        li.innerHTML = `
            <input type="number" value="${school.year}" id="edit-year-${index}">
            <input type="text" value="${school.name}" id="edit-school-name-${index}">
            <input type="number" value="${school.tuitionFee}" id="edit-tuition-fee-${index}">
            <input type="number" value="${school.lunchFee}" id="edit-lunch-fee-${index}">
            <input type="number" value="${school.cloth}" id="edit-cloth-${index}">
            <input type="number" value="${school.books}" id="edit-books-${index}">
            <input type="number" value="${school.dormitory}" id="edit-dormitory-${index}">
            <input type="date" value="${academicYearStart}" id="edit-academic-year-start-${index}">
            <input type="date" value="${academicYearEnd}" id="edit-academic-year-end-${index}">
            <input type="date" value="${semesterStart}" id="edit-semester-start-${index}">
            <input type="date" value="${semesterEnd}" id="edit-semester-end-${index}">
            <button onclick="saveSchool(${index})">Save</button>
            <button onclick="cancelEdit(${index})">Cancel</button>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to fetch school data for editing');
    });
}

function saveSchool(index) {
    const year = document.getElementById(`edit-year-${index}`).value.trim();
    const schoolName = document.getElementById(`edit-school-name-${index}`).value.trim();
    const tuitionFee = document.getElementById(`edit-tuition-fee-${index}`).value.trim();
    const lunchFee = document.getElementById(`edit-lunch-fee-${index}`).value.trim();
    const cloth = document.getElementById(`edit-cloth-${index}`).value.trim();
    const books = document.getElementById(`edit-books-${index}`).value.trim();
    const dormitory = document.getElementById(`edit-dormitory-${index}`).value.trim();
    const academicYearStart = document.getElementById(`edit-academic-year-start-${index}`).value.trim();
    const academicYearEnd = document.getElementById(`edit-academic-year-end-${index}`).value.trim();
    const semesterStart = document.getElementById(`edit-semester-start-${index}`).value.trim();
    const semesterEnd = document.getElementById(`edit-semester-end-${index}`).value.trim();

    if (year && schoolName && tuitionFee && lunchFee && cloth && books && dormitory && academicYearStart && academicYearEnd && semesterStart && semesterEnd) {
        const school = {
            year: parseInt(year),
            name: schoolName,
            tuitionFee: parseFloat(tuitionFee),
            lunchFee: parseFloat(lunchFee),
            cloth: parseFloat(cloth),
            books: parseFloat(books),
            dormitory: parseFloat(dormitory),
            academicYearStart: new Date(academicYearStart),
            academicYearEnd: new Date(academicYearEnd),
            semesterStart: new Date(semesterStart),
            semesterEnd: new Date(semesterEnd)
        };

        console.log('Saving school:', school); // Log the school data being saved

        fetch(`/api/schools/${index}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(school)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('School updated:', data);
            fetchSchools(); // Fetch and display the updated list of schools
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update school');
        });
    } else {
        alert('Please fill in all fields');
    }
}

function cancelEdit(index) {
    fetchSchools(); // Re-fetch and display the list of schools to cancel the edit
}

function deleteSchool(index) {
    fetch(`/api/schools/${index}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('School deleted:', data);
        fetchSchools(); // Fetch and display the updated list of schools
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete school');
    });
}

// Fetch and display the list of schools when the page loads
document.addEventListener('DOMContentLoaded', fetchSchools);