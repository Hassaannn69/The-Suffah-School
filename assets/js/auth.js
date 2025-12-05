import { supabase } from './supabase-client.js';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loginBtn = document.getElementById('loginBtn');

// Debugging: Check if Supabase is loaded
console.log('Auth script loaded. Checking Supabase connection...');

// Check if running on file protocol
if (window.location.protocol === 'file:') {
    console.warn('Running on file:// protocol. LocalStorage may not work correctly.');
}

// Check if already logged in
async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error checking session:', error);
            return;
        }

        if (session) {
            console.log('User already logged in. Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        } else {
            console.log('No active session found.');
        }
    } catch (err) {
        console.error('Unexpected error during session check:', err);
    }
}

// Run session check
checkSession();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset UI
    errorMessage.classList.add('hidden');
    loginBtn.disabled = true;
    const originalBtnText = loginBtn.textContent;
    loginBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg> Signing in...`;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        console.log(`Attempting login for: ${email}`);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (data.user) {
            console.log('Login successful:', data.user);

            // Double check session is set before redirecting
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
                console.log('Session verified. Redirecting...');
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Login succeeded but session was not established. Please try again.');
            }
        } else {
            throw new Error('Login failed. Please check your credentials.');
        }

    } catch (error) {
        console.error('Login error:', error);

        // Show user-friendly error
        let msg = error.message;
        if (msg === 'Invalid login credentials') msg = 'Incorrect email or password.';
        if (msg.includes('Failed to fetch')) msg = 'Network error. Please check your internet connection.';

        errorText.textContent = msg;
        errorMessage.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalBtnText;
    }
});
