// DOM Elements
const usernameInput = document.querySelector('input[type="text"]');
const passwordInput = document.querySelector('input[type="password"]');
const createBtn = document.querySelector('.btn-prm');

const errorBox = document.querySelector('#error-fh');
const errorBody = document.querySelector('#error-body');
const successBox = document.querySelector('#success-fh');
const successBody = document.querySelector('#success-body');
const loadingBox = document.querySelector('#content-still-loading');

// Helper: Hash password using SHA-256 (Native Web Crypto API)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper UI Functions
function showLoading() {
    errorBox.classList.add('dn');
    successBox.classList.add('dn');
    loadingBox.classList.remove('dn');
}

function hideLoading() {
    loadingBox.classList.add('dn');
}

function showError(message) {
    errorBody.textContent = message;
    errorBox.classList.remove('dn');
    successBox.classList.add('dn');
}

function showSuccess(message) {
    successBody.textContent = message;
    successBox.classList.remove('dn');
    errorBox.classList.add('dn');
}

// Main Event Listener
createBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const rawPassword = passwordInput.value;

    if (!username || !rawPassword) {
        showError("Please provide both a username and a password.");
        return;
    }

    showLoading();

    try {
        // Hash the password client-side as per the security hint
        const hashedPassword = await hashPassword(rawPassword);

        const payload = {
            username: username,
            password: hashedPassword
        };

        // Use the postData wrapper from common.js
        const response = await postData('/auth/users', payload);

        hideLoading();

        if (!response) {
            showError("Network Error: Could not reach the server to create the account.");
            return;
        }

        if (!response.result || !response.result.success) {
            showError(`Failed to create user: ${response.result ? response.result.message : "Unknown API Error"}`);
            return;
        }

        // Show success and clear the form
        showSuccess(`User "${username}" was created successfully. You will be redirected to the User Management in 3 seconds...`);
        usernameInput.value = '';
        passwordInput.value = '';

        // Optional: Redirect back to user list after a delay
        setTimeout(() => {
            window.location.href = '/users.html'; // Adjust to your actual listing page URL
        }, 3000);

    } catch (error) {
        hideLoading();
        showError(`An unexpected error occurred: ${error.message}`);
    }
});