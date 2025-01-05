let studentsInfoWithoutFee = [];
let allDiscountOptionsforFee = [];

// Fetch the completeentrydb list from the server and store it in studentsInfoWithoutFee variable
fetch('/api/students')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            studentsInfoWithoutFee = data; // Store the fetched data in the variable
            console.log('Fetched Data:', studentsInfoWithoutFee); // Log the fetched data to the console
        } else {
            console.error('No data found in the response');
        }
    })
    .catch(error => console.error('Error fetching data:', error));

// Fetch the allDiscountOptions list from the server and store it in allDiscountOptionsforFee variable    
fetch('/api/allDiscountOptions')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            allDiscountOptionsforFee = data; // Store the fetched data in the variable
            console.log('Fetched Discount Options:', allDiscountOptionsforFee); // Log the fetched data to the console
        } else {
            console.error('No data found in the response');
        }
    })
    .catch(error => console.error('Error fetching discount options:', error));

function calculateSchoolDays(startDate, endDate) {
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
    let schoolDays = 0;
    for (let day = 0; day < totalDays; day++) {
        const currentDay = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        if (currentDay.getDay() !== 5) {
            schoolDays++;
        }
    }
    return schoolDays;
}

function calculateProratedFee(student) {
    const academicYearStart = new Date(student.academicYearStart);
    const academicYearEnd = new Date(student.academicYearEnd);
    const registrationDate = new Date(student["Registeration Date"]);

    const totalSchoolDays = calculateSchoolDays(academicYearStart, academicYearEnd);
    const dailyTuitionFee = student.tuitionFee / totalSchoolDays;

    const remainingSchoolDays = calculateSchoolDays(registrationDate, academicYearEnd);
    const proratedTuitionFee = dailyTuitionFee * remainingSchoolDays;

    return proratedTuitionFee;
}

function convertToNumber(value) {
    if (typeof value === 'string') {
        return parseFloat(value) || 0;
    }
    return value;
}

export function applyDiscounts(proratedFee, student) {
    const discountOptions = Object.keys(student).filter(key => key.includes('Discount')).map(key => student[key].trim());
    let finalTuitionFee = proratedFee;

    console.log('Applying discounts for student:', student["Student's Name"]);
    console.log('Initial prorated fee:', proratedFee);
    console.log('Discount options:', discountOptions);

    discountOptions.forEach(discountOption => {
        const discount = allDiscountOptionsforFee.find(d => d.option.trim() === discountOption);
        if (discount) {
            console.log(`Applying discount: ${discount.option} with rate: ${discount.discountRate}`);
            finalTuitionFee *= discount.discountRate; // Apply the discount rate sequentially
            console.log('Updated final tuition fee:', finalTuitionFee);
        } else {
            console.log(`Discount option not found: ${discountOption}`);
        }
    });

    const totalDiscountAmount = proratedFee - finalTuitionFee;
    const totalDiscountRate = ((proratedFee - finalTuitionFee) / proratedFee) * 100;

    return {
        finalTuitionFee: Number(finalTuitionFee.toFixed(2)),
        totalDiscountRate: totalDiscountRate.toFixed(2),
        totalDiscountAmount: totalDiscountAmount.toFixed(2)
    };
}

function calculateFees() {
    const invoicedStudentList = studentsInfoWithoutFee.map(student => {
        const proratedFee = calculateProratedFee(student);
        const { finalTuitionFee, totalDiscountRate, totalDiscountAmount } = applyDiscounts(proratedFee, student);
        
        console.log('Student:', student); // Log the entire student object
        const lunchFee = convertToNumber(student.lunchFee);
        const clothesFee = convertToNumber(student.cloth);
        const booksFee = convertToNumber(student.books);
        const dormitoryFee = convertToNumber(student.dormitory);

        // Log the converted values
        console.log('Lunch Fee:', lunchFee);
        console.log('Clothes Fee:', clothesFee);
        console.log('Books Fee:', booksFee);
        console.log('Dormitory Fee:', dormitoryFee);
        
        const totalFeeToBePaid = finalTuitionFee + lunchFee + clothesFee + booksFee + dormitoryFee;

        return {
            ...student,
            finalTuitionFee: finalTuitionFee.toFixed(2) + ' AFN',
            totalDiscountRate: totalDiscountRate + '%',
            totalDiscountAmount: totalDiscountAmount + ' AFN',
            totalFeeToBePaid: totalFeeToBePaid.toFixed(2) + ' AFN'
        };
    });
    console.log('Invoiced Student List:', invoicedStudentList);
    return invoicedStudentList;
}

export { allDiscountOptionsforFee }; // Export the discount options for testing purposes
// Export the calculateFees function for use in other modules
export { calculateFees };

// Add a button to trigger the logging of the data to the console
const logButton = document.createElement('button');
logButton.textContent = 'Log Students Info';
logButton.onclick = calculateFees;
document.body.appendChild(logButton);

