document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('create-user').addEventListener('click', function() {
        window.location.href = 'create_user.html';
    });

    document.getElementById('delete-user').addEventListener('click', function() {
        window.location.href = 'delete_user.html';
    });

    document.getElementById('create-table').addEventListener('click', function() {
        window.location.href = 'create_table.html';
    });

    document.getElementById('create-schools').addEventListener('click', function() {
        window.location.href = 'create_schools.html';
    });

    document.getElementById('reset-server').addEventListener('click', function() {
        resetServer();
    });

    document.getElementById('discount-value').addEventListener('click', function() {
        window.location.href = 'vauleassingments.html';
    });
    
    document.getElementById('info-passing').addEventListener('click', function() {
        window.location.href = 'infopassingrange.html';
    });

    document.getElementById('back-to-home').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

<<<<<<< HEAD
    document.getElementById('extract-data').addEventListener('click', function() {
        window.location.href = 'extractpage.html';
    });

=======
>>>>>>> 12e26cfac549ca3779477a53566193ec449ba1cf

    function resetServer() {
        fetch('/api/tables', {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to reset server');
        });
    }
});