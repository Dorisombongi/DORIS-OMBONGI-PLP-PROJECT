document.addEventListener("DOMContentLoaded", function () {
    const calendarBody = document.getElementById('calendar-body');
    const monthYear = document.getElementById('monthYear');

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    async function fetchPeriodEntries(userId) {
        try {
            const response = await fetch(`/api/period-entries/${userId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const periodEntries = await response.json();
            return periodEntries;
        } catch (error) {
            console.error('Error fetching period entries:', error);
            return [];
        }
    }

    function generateCalendar(month, year, periodEntries) {
        calendarBody.innerHTML = ""; // Clear previous dates
        monthYear.innerHTML = `${months[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = 32 - new Date(year, month, 32).getDate();

        let date = 1;

        for (let i = 0; i < 6; i++) {
            let row = document.createElement("tr");

            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    let cell = document.createElement("td");
                    row.appendChild(cell);
                } else if (date > daysInMonth) {
                    break;
                } else {
                    let cell = document.createElement("td");
                    cell.textContent = date;

                    // Check if the current date is today
                    if (
                        date === currentDate.getDate() && 
                        year === currentDate.getFullYear() &&
                        month === currentDate.getMonth()
                    ) {
                        cell.classList.add("today"); // Highlight today's date
                    }

                    // Check if the date falls within the period entries
                    const cellDate = new Date(year, month, date);
                    periodEntries.forEach(period => {
                        const startDate = new Date(period.startDate);
                        const endDate = new Date(period.endDate);
                        if (startDate <= cellDate && cellDate <= endDate) {
                            cell.classList.add("period"); // Highlight period dates
                        }

                        // Check for ovulation date (14 days before next start date)
                        const ovulationDate = new Date(startDate);
                        ovulationDate.setDate(startDate.getDate() - 14);
                        if (cellDate.toDateString() === ovulationDate.toDateString()) {
                            cell.classList.add("ovulation"); // Highlight ovulation date
                            cell.textContent += ' 🌸'; // Add flower symbol
                        }

                        const daysUntilNextPeriod = calculateDaysUntilNextPeriod();
                        const nextOvulationDate = new Date();
                        nextOvulationDate.setDate(nextOvulationDate.getDate() + daysUntilNextPeriod - 14);

                        if (cellDate.toDateString() === nextOvulationDate.toDateString()) {
                        cell.classList.add("ovulation"); // Highlight ovulation date
                        if (!cell.textContent.includes('🌸')) { // Check if flower already exists
                        cell.textContent += ' 🌸'; 
                        }
                       }

                       // Calculate fertile days: 5 days before ovulation up to 1 day after
                    for (let i = -5; i <= 1; i++) {
                        const fertileDate = new Date(ovulationDate);
                        fertileDate.setDate(ovulationDate.getDate() + i);
                        if (cellDate.toDateString() === fertileDate.toDateString()) {
                            cell.classList.add("fertile"); // Highlight fertile date
                            if (!cell.textContent.includes('🌼')) { // Check if flower already exists
                                cell.textContent += ' 🌼'; // Add flower symbol for fertile days
                            }
                        }
                    }

                    // Include next ovulation date in fertile days
                    for (let i = -5; i <= 1; i++) {
                        const nextFertileDate = new Date(nextOvulationDate);
                        nextFertileDate.setDate(nextOvulationDate.getDate() + i);
                        if (cellDate.toDateString() === nextFertileDate.toDateString()) {
                            cell.classList.add("fertile"); // Highlight fertile date
                            if (!cell.textContent.includes('🌼')) { // Check if sun symbol already exists
                                cell.textContent += '🌼'; // Add sun symbol for fertile days
                            }
                        }
                    }

                    });

                    row.appendChild(cell);
                    date++;
                }
            }

            calendarBody.appendChild(row);
        }
    }

    document.getElementById('prevMonth').addEventListener('click', function () {
        currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
        currentYear = (currentMonth === 11) ? currentYear - 1 : currentYear;
        loadCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
        currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
        currentYear = (currentMonth === 0) ? currentYear + 1 : currentYear;
        loadCalendar();
    });

    async function loadCalendar() {
        const userId = localStorage.getItem('userId');
        const periodEntries = await fetchPeriodEntries(userId);
        generateCalendar(currentMonth, currentYear, periodEntries);
        
    }

    loadCalendar();
});



function calculateDaysUntilNextPeriod() {
    const maxCycleLength = parseInt(localStorage.getItem('maxCycleLength'), 10);
    const latestStartDate = new Date(localStorage.getItem('latestStartDate'));

    if (!maxCycleLength || !latestStartDate) {
        console.error('Max cycle length or latest start date not found in local storage.');
        return 0;
    }

    const today = new Date();

    // Calculate the next period date
    const nextPeriodDate = new Date(latestStartDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + maxCycleLength);

    // Calculate the difference in days
    const diffTime = nextPeriodDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    return diffDays;
}

document.addEventListener('DOMContentLoaded', () => {
    const daysUntilNextPeriod = calculateDaysUntilNextPeriod();
    const daysUntilPeriodText = document.getElementById('daysUntilPeriodText');
    const isLoggedIn = !!localStorage.getItem('username'); // Check if user is logged in

    // Update the text based on the days until the next period
    if (!isLoggedIn) {
        daysUntilPeriodText.textContent = '0 DAYS LEFT'; // When logged out
    } else {
        if (daysUntilNextPeriod === 0) {
            daysUntilPeriodText.textContent = 'Period should come today!';
        } else if (daysUntilNextPeriod === -1) {
            daysUntilPeriodText.textContent = '1 DAY LATE';
        } else if (daysUntilNextPeriod < -1) {
            daysUntilPeriodText.textContent = `${Math.abs(daysUntilNextPeriod)} DAYS LATE`;
        } else {
            daysUntilPeriodText.textContent = `${daysUntilNextPeriod} DAYS LEFT`;
        }
    }

    document.getElementById('daysUntilPeriodCount').textContent = daysUntilNextPeriod;

});

function getGreeting() {
    const now = new Date();
    const hours = now.getHours();

    if (hours < 12) {
        return 'Good Morning';
    } else if (hours < 18) {
        return 'Good Afternoon';
    } else {
        return 'Good Evening';
    }
}

const username = localStorage.getItem('username');
const greeting = getGreeting();

if (username) {
    document.getElementById('welcomeMessage').textContent = `${greeting}, ${username}`;
} else {
    document.getElementById('welcomeMessage').textContent = `${greeting}, Guest`;
}

document.getElementById('loginButton').addEventListener('click', function () {
    if (isLoggedIn) {
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('firstStartDate');
        localStorage.removeItem('latestStartDate');
        localStorage.removeItem('maxCycleLength');

        window.location.href = 'index.html';
    }
});

const isLoggedIn = !!username;

function updateAuthButtons() {
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');

    if (isLoggedIn) {
        loginButton.textContent = 'LOGOUT';
        loginButton.href = '#';
        registerButton.textContent = 'ONE LOVE';
        registerButton.href = 'love.html';
    } else {
        loginButton.textContent = 'LOGIN';
        loginButton.href = 'login.html';
        registerButton.textContent = 'REGISTER';
        registerButton.href = 'register.html';
    }
}

updateAuthButtons();