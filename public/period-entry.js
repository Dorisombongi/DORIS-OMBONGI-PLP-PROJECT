document.addEventListener('DOMContentLoaded', function () {
    // Initialize Flatpickr
    flatpickr("#startDate", { dateFormat: "Y-m-d", allowInput: true });
    flatpickr("#endDate", { dateFormat: "Y-m-d", allowInput: true });

    const form = document.getElementById('periodForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        

        // Fetch user ID from local storage
        const userId = localStorage.getItem('userId'); // Assuming user ID is stored here

        // Check if user ID is found
        if (!userId) {
            alert('User ID not found. Please log in.');
            return;
        }

        fetch('http://localhost:3000/api/period-entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, startDate, endDate })
        })
        .then(response => {
            if (response.ok) {
                alert('Period entry saved successfully!');
                form.reset();
            } else {
                alert('Error saving period entry.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
