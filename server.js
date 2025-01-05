import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public', 'styles', and 'src' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve data.json as a static file
app.use('/data', express.static(__dirname));

// Serve the root directory as static files
app.use(express.static(__dirname));

const dataFilePath = path.join(__dirname, 'data.json');
let data = {
    users: [],
    tables: {},
    schools: [],
    students: [],
    allDiscountOptions: [],
    inputs: []
};

// Load data from JSON file
function loadData() {
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath);
        data = JSON.parse(fileData);
    }
}

// Save data to JSON file
function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

loadData();

//to delete  instalments
app.put('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        // Remove existing installment data
        for (let i = 1; i <= 12; i++) {
            delete data.students[studentIndex][`${i}st Installment Date`];
            delete data.students[studentIndex][`${i}st Installment Amount`];
            delete data.students[studentIndex][`${i}nd Installment Date`];
            delete data.students[studentIndex][`${i}nd Installment Amount`];
            delete data.students[studentIndex][`${i}rd Installment Date`];
            delete data.students[studentIndex][`${i}rd Installment Amount`];
            delete data.students[studentIndex][`${i}th Installment Date`];
            delete data.students[studentIndex][`${i}th Installment Amount`];
        }

        // Update student data with new installment data
        data.students[studentIndex] = { ...data.students[studentIndex], ...req.body };
        saveData();
        res.json(data.students[studentIndex]);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

app.get('/api/allDiscountOptions', (req, res) => {
    const discountValues = data.allDiscountOptions.map(item => ({
        option: item.option,
        discountRate: item.discountRate
    }));
    res.json(discountValues);
});

app.post('/api/allDiscountOptions', (req, res) => {
    console.log('Received request to save discount:', req.body); // Debugging log
    req.body.forEach(discount => {
        const { option, discountRate } = discount;
        // Check if the option already exists
        const existingOption = data.allDiscountOptions.find(item => item.option === option);
        if (existingOption) {
            // Update the discount rate if the option exists
            existingOption.discountRate = discountRate;
            console.log('Updated discount:', { option, discountRate }); // Debugging log
        } else {
            // Add the new option with its discount rate
            data.allDiscountOptions.push({ option, discountRate });
            console.log('Saved discount:', { option, discountRate }); // Debugging log
        }
    });
    saveData();
    res.status(200).json({ message: 'allDiscountOptions values saved successfully' });
});

app.post('/api/users', (req, res) => {
    const user = req.body;
    data.users.push(user);
    saveData();
    res.status(201).json(user);
});

app.get('/api/users', (req, res) => {
    res.json(data.users);
});

app.delete('/api/users/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (index >= 0 && index < data.users.length) {
        const user = data.users.splice(index, 1)[0];
        saveData();
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.post('/api/schools', (req, res) => {
    const school = req.body;
    data.schools.push(school);
    saveData();
    res.status(201).json(school);
});

// Endpoint to get all tables
app.get('/api/tables', (req, res) => {
    console.log('Received request for all tables'); // Debugging log
    // Reload data from JSON file to ensure it's up-to-date
    loadData();
    console.log('Current tables data:', JSON.stringify(data.tables, null, 2)); // Log the current tables data
    if (Object.keys(data.tables).length > 0) {
        res.json(data.tables);
    } else {
        console.log('No tables found'); // Debugging log
        res.status(404).json({ error: 'No tables found' });
    }
});

app.get('/api/schools', (req, res) => {
    res.json(data.schools);
});

app.put('/api/schools/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`PUT request for index: ${index}`); // Log the index
    if (index >= 0 && index < data.schools.length) {
        data.schools[index] = req.body;
        saveData();
        res.json(data.schools[index]);
    } else {
        res.status(404).json({ error: 'School not found' });
    }
});

app.delete('/api/schools/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`DELETE request for index: ${index}`); // Log the index
    if (index >= 0 && index < data.schools.length) {
        const school = data.schools.splice(index, 1)[0];
        saveData();
        res.json(school);
    } else {
        res.status(404).json({ error: 'School not found' });
    }
});

app.post('/api/students', (req, res) => {
    const student = req.body;
    data.students.push(student); // Add student to data.json
    saveData();
    res.status(201).json(student);
});

//fetch student and search student id
app.get('/api/students', (req, res) => {
    const { studenttezkereNo, username, year } = req.query;

    let filteredStudents = data.students;

    if (studenttezkereNo) {
        filteredStudents = filteredStudents.filter(student => student["Student Tezkere No"] === studenttezkereNo);
    } else if (username && year) {
        filteredStudents = filteredStudents.filter(student => student.username === username && student.selectedYear === year);
    }

    res.json(filteredStudents);
});

app.put('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        data.students[studentIndex] = { ...data.students[studentIndex], ...req.body };
        saveData();
        res.json(data.students[studentIndex]);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// Endpoint to delete a student
app.delete('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        const deletedStudent = data.students.splice(studentIndex, 1)[0];
        saveData(); // Save the updated data
        res.json(deletedStudent);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// Endpoint to get allDiscountOptions data
app.get('/api/allDiscountOptions', (req, res) => {
    if (data.allDiscountOptions) {
        res.json(data.allDiscountOptions);
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
});

// Endpoint to fetch tables
app.get('/fetch-tables', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data:', err);
            return res.status(500).send('Error reading data');
        }
        const jsonData = JSON.parse(data);
        res.json({ tables: jsonData.tables });
    });
});

// Endpoint to save tables
app.post('/save-tables', (req, res) => {
    const newTables = req.body;
    // Read the existing data.json file
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data:', err);
            return res.status(500).send('Error reading data');
        }
        // Parse the existing data
        let jsonData = JSON.parse(data);
        // Update the tables object
        jsonData.tables = newTables;
        // Write the updated data back to data.json
        fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error('Error saving data:', err);
                return res.status(500).send('Error saving data');
            }
            res.send('Data saved successfully');
        });
    });
});

// Endpoint to handle POST request for inputs
app.post('/api/inputs', (req, res) => {
    const inputs = req.body.inputs;
    console.log('Received inputs:', inputs);

    // Ensure inputs array exists in data
    if (!Array.isArray(data.inputs)) {
        data.inputs = [];
    }

    // Update inputs array
    data.inputs = inputs;

    // Save updated data
    try {
        saveData();
    } catch (error) {
        console.error('Error saving data:', error);
        return res.status(500).json({ error: 'Failed to save data' });
    }

    res.json({ message: 'Inputs received and saved', inputs });
});

app.get('/api/inputs', (req, res) => {
    console.log('GET request received for /api/inputs');
    res.json({ numbers: data.inputs });
});

// Serve the favicon.ico file
app.get('/favicon.ico', (req, res) => {
    res.sendFile(dataFilePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;