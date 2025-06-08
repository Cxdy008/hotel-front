// Elementos do DOM
const signupForm = document.getElementById('signupForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const documentInput = document.getElementById('document');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsAccept = document.getElementById('termsAccept');

const firstNameError = document.getElementById('firstNameError');
const lastNameError = document.getElementById('lastNameError');
const emailError = document.getElementById('emailError');
const phoneError = document.getElementById('phoneError');
const documentError = document.getElementById('documentError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const termsError = document.getElementById('termsError');

const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const loadingSpinner = document.getElementById('loadingSpinner');

// Elementos de validação de senha
const lengthCheck = document.getElementById('lengthCheck');
const upperCheck = document.getElementById('upperCheck');
const lowerCheck = document.getElementById('lowerCheck');
const numberCheck = document.getElementById('numberCheck');
const specialCheck = document.getElementById('specialCheck');

// Regex patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+244\s?9[1-5]\d\s?\d{3}\s?\d{3}$/;
const documentRegex = /^[A-Za-z0-9]{5,20}$/;
const passwordRegex = {
    length: /.{8,}/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/
};

// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Função para mostrar mensagem de erro
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Função para limpar mensagem de erro
function clearError(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Função para mostrar/esconder loading
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Toggle de visibilidade da senha
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

toggleConfirmPassword.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Validações em tempo real
firstNameInput.addEventListener('input', function() {
    if (this.value.length < 2) {
        showError(firstNameError, 'O nome deve ter pelo menos 2 caracteres');
    } else {
        clearError(firstNameError);
    }
});

lastNameInput.addEventListener('input', function() {
    if (this.value.length < 2) {
        showError(lastNameError, 'O sobrenome deve ter pelo menos 2 caracteres');
    } else {
        clearError(lastNameError);
    }
});

emailInput.addEventListener('input', function() {
    if (!emailRegex.test(this.value)) {
        showError(emailError, 'Por favor, insira um email válido');
    } else {
        clearError(emailError);
    }
});

phoneInput.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, '');
    
    // Remove o código do país se presente
    if (value.startsWith('244')) {
        value = value.substring(3);
    }
    
    // Limita a 9 dígitos (padrão angolano)
    if (value.length > 9) {
        value = value.slice(0, 9);
    }
    
    // Adiciona o código do país e formata
    if (value.length > 0) {
        value = '+244 ' + value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    
    this.value = value;

    // Valida o número
    if (value.length === 0) {
        clearError(phoneError);
    } else if (!phoneRegex.test(value)) {
        showError(phoneError, 'Por favor, insira um número de telefone válido de Angola (começa com 91-95)');
    } else {
        clearError(phoneError);
    }
});

documentInput.addEventListener('input', function() {
    if (!documentRegex.test(this.value)) {
        showError(documentError, 'Por favor, insira um documento válido (5-20 caracteres alfanuméricos)');
    } else {
        clearError(documentError);
    }
});

passwordInput.addEventListener('input', function() {
    const password = this.value;
    
    lengthCheck.classList.toggle('valid', passwordRegex.length.test(password));
    upperCheck.classList.toggle('valid', passwordRegex.upper.test(password));
    lowerCheck.classList.toggle('valid', passwordRegex.lower.test(password));
    numberCheck.classList.toggle('valid', passwordRegex.number.test(password));
    specialCheck.classList.toggle('valid', passwordRegex.special.test(password));

    const isValid = Object.values(passwordRegex).every(regex => regex.test(password));
    if (!isValid) {
        showError(passwordError, 'A senha deve atender a todos os requisitos');
    } else {
        clearError(passwordError);
    }

    if (confirmPasswordInput.value && confirmPasswordInput.value !== password) {
        showError(confirmPasswordError, 'As senhas não coincidem');
    } else {
        clearError(confirmPasswordError);
    }
});

confirmPasswordInput.addEventListener('input', function() {
    if (this.value !== passwordInput.value) {
        showError(confirmPasswordError, 'As senhas não coincidem');
    } else {
        clearError(confirmPasswordError);
    }
});

termsAccept.addEventListener('change', function() {
    if (!this.checked) {
        showError(termsError, 'Você deve aceitar os termos e condições');
    } else {
        clearError(termsError);
    }
});

// Função para registrar usuário na API
async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao registrar usuário');
        }

        const data = await response.json();
        return data; // Retorna { name, token }
    } catch (error) {
        throw error;
    }
}

// Handler do formulário
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Limpar erros anteriores
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => clearError(element));

    // Validação do formulário
    let hasError = false;

    // Validar nome
    if (firstNameInput.value.length < 2) {
        showError(firstNameError, 'O nome deve ter pelo menos 2 caracteres');
        hasError = true;
    }

    // Validar sobrenome
    if (lastNameInput.value.length < 2) {
        showError(lastNameError, 'O sobrenome deve ter pelo menos 2 caracteres');
        hasError = true;
    }

    // Validar email
    if (!emailRegex.test(emailInput.value)) {
        showError(emailError, 'Por favor, insira um email válido');
        hasError = true;
    }

    // Validar telefone
    if (!phoneRegex.test(phoneInput.value)) {
        showError(phoneError, 'Por favor, insira um número de telefone válido de Angola (começa com 91-95)');
        hasError = true;
    }

    // Validar documento
    if (!documentRegex.test(documentInput.value)) {
        showError(documentError, 'Por favor, insira um documento válido');
        hasError = true;
    }

    // Validar senha
    const isPasswordValid = Object.values(passwordRegex).every(regex => regex.test(passwordInput.value));
    if (!isPasswordValid) {
        showError(passwordError, 'A senha deve atender a todos os requisitos');
        hasError = true;
    }

    // Validar confirmação de senha
    if (passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'As senhas não coincidem');
        hasError = true;
    }

    // Validar termos
    if (!termsAccept.checked) {
        showError(termsError, 'Você deve aceitar os termos e condições');
        hasError = true;
    }

    if (hasError) return;

    // Preparar dados do usuário para a API
    const userData = {
        name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`,
        email: emailInput.value.trim(),
        phone: phoneInput.value.replace(/\D/g, ''),
        document: documentInput.value.trim(),
        password: passwordInput.value,
    };

    try {
        showLoading();
        const { name, token } = await register(userData); // Destructure the response
        
        // Armazenar o token e informações do usuário
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', emailInput.value.trim());
        localStorage.setItem('userName', name);
        localStorage.setItem('isAuthenticated', 'true');
        
        showToast('Registro realizado com sucesso!');
        
        // Redirecionar após registro bem-sucedido
        setTimeout(() => {
            window.router.navigate('login');
        }, 1500);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
});