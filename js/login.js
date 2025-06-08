// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const togglePassword = document.getElementById('togglePassword');
const loadingSpinner = document.getElementById('loadingSpinner');
const rememberMe = document.getElementById('rememberMe');

// Regex para validação de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Carregar email salvo
const savedEmail = localStorage.getItem('rememberedEmail');
if (savedEmail) {
    emailInput.value = savedEmail;
    rememberMe.checked = true;
}

// Toggle password visibility
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

// Validação em tempo real
emailInput.addEventListener('input', () => {
    const isValid = emailRegex.test(emailInput.value);
    emailError.textContent = isValid ? '' : 'Email inválido';
    emailError.style.display = isValid ? 'none' : 'block';
});

passwordInput.addEventListener('input', () => {
    const isValid = passwordInput.value.length >= 6;
    passwordError.textContent = isValid ? '' : 'Senha deve ter pelo menos 6 caracteres';
    passwordError.style.display = isValid ? 'none' : 'block';
});

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Função para decodificar o token JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
    }
}

// Função para obter o papel do usuário do token
function getUserRole(token) {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.roles || !decoded.roles.length) {
        return null;
    }
    
    // Pegar o primeiro papel da lista de roles
    const role = decoded.roles[0];
    return role.replace('ROLE_', '');
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validação
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Email inválido';
        emailError.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        passwordError.textContent = 'Senha deve ter pelo menos 6 caracteres';
        passwordError.style.display = 'block';
        return;
    }

    // Show loading
    loadingSpinner.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro na autenticação');
        }

        if (!data.token) {
            throw new Error('Token não encontrado na resposta');
        }

        // Salvar o token no localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAuthenticated', 'true');

        // Obter e salvar o papel do usuário
        const role = getUserRole(data.token);
        if (role) {
            localStorage.setItem('userRole', role);
            const dashboardUrls = {
                'ADMIN': '/pages/dashboard-admin.html',
                'RECEPTIONIST': '/pages/dashboard-reception.html',
                'GUEST': '/pages/dashboard-guest.html'
            };

            const dashboardUrl = dashboardUrls[role] || '/pages/dashboard-guest.html';
            window.location.href = dashboardUrl;
        } else {
            throw new Error('Papel do usuário não encontrado');
        }

        // Salvar o nome do usuário no localStorage
        if (data.name) {
            localStorage.setItem('userName', data.name);
        }

        // Gerenciar "lembrar-me"
        if (rememberMe.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showToast('Login realizado com sucesso!');

    } catch (error) {
        showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
    }
});