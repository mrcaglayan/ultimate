// Fetch the year and school name from the URL
const urlParams = new URLSearchParams(window.location.search);
const year = parseInt(urlParams.get('year'), 10);
const schoolName = urlParams.get('school');

let rawSchools = [];
let schoolBasedOnYearAndSchoolName = {};

// Fetch data from the server
fetch(`/api/schools`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // Assign the fetched schools to the variable
    rawSchools = data;
    // Filter schools based on the selected year and school name
    const filteredSchools = rawSchools.filter(school => school.year === year && school.name === schoolName);
    // If there's exactly one matching school, assign it to the object
    if (filteredSchools.length === 1) {
      schoolBasedOnYearAndSchoolName = filteredSchools[0];
    } else {
      console.error('Error: Multiple or no schools found for the given year and name.');
    }
    console.log(`School based on year and name: ${JSON.stringify(schoolBasedOnYearAndSchoolName)}`);
  })
  .catch(error => console.error('Error fetching data:', error));

export { schoolBasedOnYearAndSchoolName };