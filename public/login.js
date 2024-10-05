

document.querySelector('.auth-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        if (data.message === 'Login successful.') {
            // Store user data
            localStorage.setItem('username', username);
            localStorage.setItem('userId', data.userId);
            
            // Fetch days until next period after login
            fetchDaysUntilNextPeriod();

            // Redirect to period-view.html
            window.location.href = 'index.html';
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Login failed!');
    });
});

// Fetch days until next period
function fetchDaysUntilNextPeriod() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('User ID not found in local storage');
        return;
    }

    fetch('http://localhost:3000/get-period-data?userId=' + userId)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const daysUntilNextPeriod = calculateDaysUntilNextPeriod(data);
        localStorage.setItem('daysUntilNextPeriod', daysUntilNextPeriod);
    })
    .catch(error => {
        console.error('Error fetching period data:', error);
    });
}

// Placeholder for calculateDaysUntilNextPeriod function
function calculateDaysUntilNextPeriod(data) {
    // Implement your logic to calculate days until next period
    // Example logic (modify as needed):
    return data.daysUntilNextPeriod || 0; // Adjust according to your data structure
}
