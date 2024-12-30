import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public', 'styles', and 'src' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/src', express.static(path.join(__dirname, 'src')));

const dataFilePath = path.join(__dirname, 'data.json');
let data = {
    users: [],
    tables: {},
    schools: [],
    students: [],
    completeentrydb: [], // Add completeentrydb array
    allDiscountOptions: [], // Add allDiscountOptions array
};

// Load data from JSON file
// Load data from JSON file
function loadData() {
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath);
        data = JSON.parse(fileData);
    }
}

// Save data to JSON file
// Save data to JSON file
function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}


loadData();

app.get('/api/completeentrydb', (req, res) => {
    const studenttezkereNo = req.query.studenttezkereNo;
    const schoolName = req.query.schoolName;

    let filteredStudents = data.completeentrydb;

    if (studenttezkereNo) {
        filteredStudents = filteredStudents.filter(student => student["Student Tezkere No"] === studenttezkereNo);
    }

    if (schoolName) {
        filteredStudents = filteredStudents.filter(student => student.name === schoolName);
    }

    console.log('Filtered students:', filteredStudents); // Debugging log
    res.json(filteredStudents);
});

app.get('/api/completeentrydb-ID', (req, res) => {
    const studenttezkereNo = req.query.studenttezkereNo;
    let filteredStudents = data.completeentrydb;

    if (studenttezkereNo) {
        filteredStudents = filteredStudents.filter(student => student["Student Tezkere No"] === studenttezkereNo);
    }

    console.log('Filtered students2:', filteredStudents); // Debugging log
    res.json(filteredStudents);
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

app.get('/api/students', (req, res) => {
    const username = req.query.username;
    const selectedYear = req.query.year; // Ensure the parameter name matches the query parameter
    const filteredStudents = data.students.filter(student => student.username === username && student.selectedYear === selectedYear);
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

app.delete('/api/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id, 10); // Convert studentId to a number
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex !== -1) {
        const student = data.students.splice(studentIndex, 1)[0];
        // Remove the corresponding entry from completeentrydb
        data.completeentrydb = data.completeentrydb.filter(entry => entry.studentId !== studentId);
        saveData();
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// New endpoint to save complete entry
app.post('/api/completeentrydb', (req, res) => {
    const completeEntry = req.body;
    data.completeentrydb.push(completeEntry);
    saveData();
    res.status(201).json(completeEntry);
});

app.put('/api/completeentrydb/:id', (req, res) => {
    const entryId = parseInt(req.params.id, 10); // Convert entryId to a number
    const entryIndex = data.completeentrydb.findIndex(entry => entry.id === entryId);
    if (entryIndex !== -1) {
        data.completeentrydb[entryIndex] = { ...data.completeentrydb[entryIndex], ...req.body };
        saveData();
        res.json(data.completeentrydb[entryIndex]);
    } else {
        res.status(404).json({ error: 'Complete entry not found' });
    }
});

app.put('/api/completeentrydb/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    if (index >= 0 && index < data.completeentrydb.length) {
        data.completeentrydb[index] = req.body;
        saveData();
        res.json(data.completeentrydb[index]);
    } else {
        res.status(404).json({ error: 'Complete entry not found' });
    }
});

// New endpoint to delete complete entry
app.delete('/api/completeentrydb/:id', (req, res) => {
    const entryId = parseInt(req.params.id, 10); // Convert entryId to a number
    const entryIndex = data.completeentrydb.findIndex(entry => entry.id === entryId);
    if (entryIndex !== -1) {
        const entry = data.completeentrydb.splice(entryIndex, 1)[0];
        saveData();
        res.json(entry);
    } else {
        res.status(404).json({ error: 'Complete entry not found' });
    }
});

// Endpoint to get completeentrydb data
app.get('/api/completeentrydb', (req, res) => {
    if (data.completeentrydb) {
        res.json(data.completeentrydb);
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
});

// Endpoint to get allDiscountOptions data
// Endpoint to get allDiscountOptions data
app.get('/api/allDiscountOptions', (req, res) => {
    if (data.allDiscountOptions) {
        res.json(data.allDiscountOptions);
    } else {
        res.status(404).json({ error: 'Data not found' });
    }
});

app.post('/save-tables', (req, res) => {
    const newTables = req.body;
    // Read the existing data.json file
    fs.readFile(join(__dirname, 'data.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }
        // Parse the existing data
        let jsonData = JSON.parse(data);
        // Update the tables object
        jsonData.tables = newTables;
        // Write the updated data back to data.json
        fs.writeFile(join(__dirname, 'data.json'), JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving data');
            }
            res.send('Data saved successfully');
        });
    });
});

app.get('/fetch-tables', (req, res) => {
    fs.readFile(join(__dirname, 'data.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }
        const jsonData = JSON.parse(data);
        res.json({ tables: jsonData.tables });
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
    res.sendFile(join(__dirname, 'favicon.ico'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});