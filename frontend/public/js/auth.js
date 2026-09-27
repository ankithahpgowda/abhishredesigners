function switchTab(tab) {
    document.getElementById('section-login').classList.add('hidden');
    document.getElementById('section-register').classList.add('hidden');
    document.getElementById('section-otp').classList.add('hidden');
    
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');

    document.getElementById('section-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

function showOTPSection(phone, purpose) {
    document.getElementById('section-login').classList.add('hidden');
    document.getElementById('section-register').classList.add('hidden');
    document.getElementById('section-otp').classList.remove('hidden');
    document.getElementById('otpPhone').value = phone;
    document.getElementById('otpPurpose').value = purpose;
}

// Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('regError');

    if (password !== confirm) {
        errorEl.textContent = "Passwords do not match!";
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
            errorEl.textContent = data.error;
        } else {
            alert(data.message);
            showOTPSection(phone, 'register');
        }
    } catch (err) {
        errorEl.textContent = "Server error. Try again.";
    }
});

// Login Password
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
            if (data.require_otp) {
                showOTPSection(phone, 'register'); // send them to verify
            } else {
                errorEl.textContent = data.error;
            }
        } else {
            localStorage.setItem('auth_token', data.token);
            window.location.href = '/dashboard.html';
        }
    } catch (err) {
        errorEl.textContent = "Server error.";
    }
});

// Login OTP Request
async function requestLoginOTP() {
    const phone = document.getElementById('loginPhone').value;
    const errorEl = document.getElementById('loginError');

    if (!phone) {
        errorEl.textContent = "Please enter mobile number first.";
        return;
    }

    try {
        const res = await fetch('/api/auth/request-otp-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error;
        } else {
            alert("OTP sent to " + phone + " (Check terminal console)");
            showOTPSection(phone, 'login');
        }
    } catch (err) {
        errorEl.textContent = "Server error.";
    }
}

// OTP Verification
document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('otpPhone').value;
    const purpose = document.getElementById('otpPurpose').value;
    const otp = document.getElementById('otpInput').value;
    const errorEl = document.getElementById('otpError');

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, purpose })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error;
        } else {
            localStorage.setItem('auth_token', data.token);
            window.location.href = '/dashboard.html';
        }
    } catch (err) {
        errorEl.textContent = "Server error.";
    }
});
