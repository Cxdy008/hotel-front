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

        // Redirecionar para o dashboard
        window.location.href = '/pages/dashboard-guest.html';

        showToast('Login realizado com sucesso!');

    } catch (error) {
        showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
    }
});