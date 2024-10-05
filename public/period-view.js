
async function fetchPeriodEntries() {
    const userId = localStorage.getItem('userId'); 
    if (!userId) {
        console.error('User ID not found in local storage');
        return;
    }

    try {
        const response = await fetch(`/api/period-entries/${userId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const entries = await response.json();
        const periodDatesTable = document.getElementById('periodDatesTable');

        // Clear previous entries
        periodDatesTable.innerHTML = '';

        // Variables to track maximum cycle length and the latest start date
        let maxCycleLength = 0;
        let latestStartDate = null;

        // Track the previous start date for cycle length calculation
        let previousStartDate = null;

        entries.forEach(entry => {
            const row = document.createElement('tr');
            
            // Calculate cycle length if there's a previous start date
            let cycleLength = '';
            if (previousStartDate) {
                const currentStartDate = new Date(entry.startDate);
                const differenceInTime = currentStartDate - previousStartDate;
                const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
                cycleLength = Math.abs(differenceInDays); // Convert to absolute value

                // Update the maximum cycle length
                maxCycleLength = Math.max(maxCycleLength, cycleLength);
            }

            // Update the previous start date for the next iteration
            previousStartDate = new Date(entry.startDate);

            // Update latest start date
            if (!latestStartDate || new Date(entry.startDate) > latestStartDate) {
                latestStartDate = new Date(entry.startDate);
            }

            // Calculate period length
            const periodStartDate = new Date(entry.startDate);
            const periodEndDate = new Date(entry.endDate);
            const periodLength = Math.ceil((periodEndDate - periodStartDate) / (1000 * 3600 * 24) + 1);

            // Create a bar for cycle length with a label
            const barWidth = cycleLength ? `${Math.max(cycleLength * 3, 10)}px` : '0'; // Adjusted factor for smaller width
            const cycleBar = 
                `<div style="width:${barWidth}; background-color: #f51196; height: 15px; position: relative; text-align: center; color: white;">
                    ${cycleLength || 0} 
                </div>`;

            row.innerHTML = `
                <td><input type="checkbox" class="select-entry" data-id="${entry.id}"></td>
                <td>${formatDate(entry.startDate)}</td>
                <td>${formatDate(entry.endDate)}</td>
                <td>
                    <div style="width: 100%; background-color: #e0e0e0; border-radius: 5px; overflow: hidden;">
                        ${cycleBar}
                    </div>
                </td>
                <td>${periodLength}</td> <!-- New Period Length Column -->
            `;
            periodDatesTable.appendChild(row);
        });

        // Store the maximum cycle length and the latest start date in local storage
        if (maxCycleLength > 0 && latestStartDate) {
            localStorage.setItem('maxCycleLength', maxCycleLength);
            localStorage.setItem('latestStartDate', latestStartDate.toISOString().split('T')[0]); // Store in YYYY-MM-DD format
        }

    } catch (error) {
        console.error('Error fetching period entries:', error);
    }
}



function attachDeleteEvent() {
    const deleteButton = document.getElementById('deleteSelected');
    deleteButton.addEventListener('click', async () => {
        const selectedIds = Array.from(document.querySelectorAll('.select-entry:checked')).map(checkbox => checkbox.getAttribute('data-id'));

        if (selectedIds.length === 0) {
            alert('Please select at least one entry to delete.');
            return;
        }

        const confirmDelete = confirm('Are you sure you want to delete the selected entries?');
        if (!confirmDelete) return;

        const userId = localStorage.getItem('userId'); // Get userId from local storage

        for (const id of selectedIds) {
            try {
                const result = await deletePeriodEntry(id, userId);
                console.log(result.message); // Log the success message
                alert(`Entry ${id} deleted successfully.`); // Show success message to the user
            } catch (error) {
                console.error(`Error deleting entry ${id}:`, error);
                alert(`Failed to delete entry ${id}. Please try again.`);
            }
        }

        // Refresh the list after deletion
        fetchPeriodEntries();
    });
}

async function deletePeriodEntry(id, userId) {
    const response = await fetch(`/api/period-entry/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }) // Pass userId in the request body
    });
    if (!response.ok) {
        throw new Error('Failed to delete entry');
    }
    return { message: 'Entry deleted successfully' }; // Return a success message
}



function formatDate(dateString) {
    const date = new Date(dateString);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Fetch entries on page load and attach delete event
document.addEventListener('DOMContentLoaded', () => {
    fetchPeriodEntries();
    attachDeleteEvent();
});
