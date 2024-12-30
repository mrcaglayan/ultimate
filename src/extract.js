document.getElementById('extractButton').addEventListener('click', function() {
    fetch('/data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched data:', data);

            // Extract the completeentrydb array
            const completeEntryDb = data.completeentrydb;
            console.log('Extracted completeentrydb:', completeEntryDb);

            // Ensure completeEntryDb is an array
            if (!Array.isArray(completeEntryDb)) {
                throw new Error('completeentrydb is not an array');
            }

            // Reorder the keys of each object to place Instalments at the end
            const modifiedEntryDb = completeEntryDb.map(entry => {
                const reorderedEntry = {};
                Object.keys(entry).forEach(key => {
                    if (key !== 'Instalments') {
                        reorderedEntry[key] = entry[key];
                    }
                });

                // Flatten the Instalments object and add its key-value pairs
                if (entry.Instalments && typeof entry.Instalments === 'object') {
                    console.log('Instalments:', entry.Instalments);
                    Object.keys(entry.Instalments).forEach(instalmentKey => {
                        const instalment = entry.Instalments[instalmentKey];
                        if (typeof instalment === 'object') {
                            Object.keys(instalment).forEach(subKey => {
                                reorderedEntry[`Instalments_${instalmentKey}_${subKey}`] = instalment[subKey];
                            });
                        } else {
                            reorderedEntry[`Instalments_${instalmentKey}`] = instalment;
                        }
                    });
                }

                console.log('Reordered entry:', reorderedEntry);
                return reorderedEntry;
            });

            // Log headers after reordering
            const modifiedHeaders = Object.keys(modifiedEntryDb[0]);
            console.log('Headers after reordering:', modifiedHeaders);

            // Convert modifiedEntryDb to worksheet
            const worksheet = XLSX.utils.json_to_sheet(modifiedEntryDb);

            // Create a new workbook and append the worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Complete Entry DB");

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Save the file using FileSaver.js
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(blob, 'completeentrydb.xlsx');
        })
        .catch(error => console.error('Error fetching data:', error));
});