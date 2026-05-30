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

// Toggle password visibility
const toggle = document.getElementById('togglePassword');
if (toggle) {
    toggle.addEventListener('click', () => {
        const pwd = document.getElementById('password');
        if (!pwd) return;
        if (pwd.type === 'password') { pwd.type = 'text'; toggle.textContent = '🙈'; }
        else { pwd.type = 'password'; toggle.textContent = '👁️'; }
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
