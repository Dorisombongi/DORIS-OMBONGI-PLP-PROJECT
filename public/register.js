
document.querySelector('.auth-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'User registered successfully.') {
            // Optionally redirect or clear the form
            document.querySelector('.auth-form').reset();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Registration failed!');
    });
});