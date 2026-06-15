function generateNewUserEntry(userId, username, createdAt) {
    const dateStr = new Date(createdAt).toLocaleString();
    
    return `
        <tr class="user-row" data-id="${userId}" data-username="${username}" style="cursor: pointer;">
            <td>${userId}</td>
            <td><strong>${username}</strong></td>
            <td class="ls-muted">${dateStr}</td>
           
        </tr>
    `;
}
async function renderUsers() {
    // Show loading state
    document.querySelector('#content-still-loading').classList.remove('dn');
    document.querySelector('#error-fh').classList.add('dn');

    // Updated path to /auth/users
    const data = await fetchData('/auth/users');

    if (!data) {
        showError("Network Error: Could not reach the server to fetch users.");
        return;
    }

    if (!data.result || !data.result.success) {
        showError(`API Error: ${data.result ? data.result.message : "Failed to load users."}`);
        return;
    }

    // FIXED: The users array is at the root of 'data', not inside 'data.result'
    const users = data.users || []; 
    let tableContent = "";

    if (users.length === 0) {
        tableContent = `<tr><td colspan="4" class="ls-muted">No users found.</td></tr>`;
    } else {
        users.forEach(user => {
            tableContent += generateNewUserEntry(user.id, user.username, user.created_at);
        });
    }

    document.querySelector('#user-list-append').innerHTML = tableContent;
    document.querySelector('#content-still-loading').classList.add('dn');

    document.querySelectorAll('.user-row').forEach((elem) => {
        elem.addEventListener('click', () => {
            const userId = elem.dataset.id;
            const username = elem.dataset.username;

            if (userId === '1') {
                alert("Action Forbidden: The primary admin account (ID 1) cannot be deleted.");
                return;
            }

            const userConfirmed = confirm(`Are you sure you want to delete the user "${username}" (ID: ${userId})?`);
            if (userConfirmed) {
                deleteUser(userId);
            }
        });
    });
}

async function deleteUser(userId) {
    document.querySelector('#content-still-loading').classList.remove('dn');
    document.querySelector('#error-fh').classList.add('dn');

    // Updated path to /auth/users
    const data = await deleteData(`/auth/users/${userId}`);

    if (!data) {
        showError("Network Error: Could not reach the server to delete the user.");
        return;
    }

    if (!data.result || !data.result.success) {
        showError(`Delete failed: ${data.result ? data.result.message : "Unknown API error"}`);
        return;
    }

    document.querySelector('#success-body').textContent = data.result.message;
    document.querySelector('#success-fh').classList.remove('dn');
    
    setTimeout(() => {
        document.querySelector('#success-fh').classList.add('dn');
        renderUsers();
    }, 3000);
}

// Helper function to handle error UI
function showError(message) {
    document.querySelector('#error-body').textContent = message;
    document.querySelector('#error-fh').classList.remove('dn');
    document.querySelector('#content-still-loading').classList.add('dn');
}

// Initialize on load
renderUsers();