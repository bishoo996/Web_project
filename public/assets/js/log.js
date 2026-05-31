console.log("Login system loaded");

// Simple validations
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const egPhoneRegex = /^(?:\+20|0)?1[0125]\d{8}$/; // Egyptian mobile: 010,011,012,015 (+20 optional)

function validateLogin(email, password) {
    if (!email || !password) return false;
    return true;
}

function validateSignupData(data) {
    if (!data.firstName || !data.lastName) return { ok: false, msg: 'Name required' };
    if (!emailRegex.test(data.email)) return { ok: false, msg: 'Invalid email' };
    if (!egPhoneRegex.test(data.phoneNumber)) return { ok: false, msg: 'Enter a valid Egyptian phone number' };
    if (!data.password || data.password.length < 6) return { ok: false, msg: 'Password must be >= 6 chars' };
    return { ok: true };
}

const EYE_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function makeToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.innerHTML = EYE_OPEN;
    btn.addEventListener('click', () => {
        const pwd = document.getElementById(inputId);
        if (!pwd) return;
        if (pwd.type === 'password') { pwd.type = 'text'; btn.innerHTML = EYE_CLOSED; }
        else { pwd.type = 'password'; btn.innerHTML = EYE_OPEN; }
    });
}

makeToggle('toggleLoginPassword', 'loginPassword');
makeToggle('togglePassword', 'password');

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errDiv = document.getElementById('loginError');
        const identifier = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (errDiv) errDiv.style.display = 'none';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            if (res.ok) {
                window.location.href = '/index.html';
            } else {
                const msg = await res.text();
                if (errDiv) { errDiv.style.display = 'block'; errDiv.textContent = msg; }
            }
        } catch {
            if (errDiv) { errDiv.style.display = 'block'; errDiv.textContent = 'Network error. Please try again.'; }
        }
    });
}

// Signup form handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            password: document.getElementById('password').value
        };

        const errDiv = document.getElementById('signupError');
        const valid = validateSignupData(data);
        if (!valid.ok) {
            e.preventDefault();
            if (errDiv) { errDiv.style.display = 'block'; errDiv.textContent = valid.msg; }
            return false;
        }

        // allow normal submit to the server
        return true;
    });
}
