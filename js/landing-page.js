// Função para mudar o estilo do header ao rolar a página
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Elementos do DOM
const authButtons = document.querySelector('.auth-buttons');
const reserveButtons = document.querySelectorAll('[data-route="signup"]');
const allRouteButtons = document.querySelectorAll('[data-route]');

// Função para adicionar event listeners de navegação
function setupNavigationListeners() {
    allRouteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const route = button.getAttribute('data-route');
            if (window.router) {
                window.router.navigate(route);
            } else {
                console.error('Router não encontrado');
            }
        });
    });
}

// Função para atualizar os botões baseado no estado de autenticação
function updateAuthButtons() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (isAuthenticated && userRole) {
        // Atualiza os botões de autenticação
        authButtons.innerHTML = `
            <div class="user-menu">
                <button class="btn btn-user">
                    <i class="fas fa-user"></i>
                    <span>${userName || 'Usuário'}</span>
                </button>
                <div class="user-dropdown">
                    <a href="#" class="dashboard-link">
                        <i class="fas fa-tachometer-alt"></i>
                        Dashboard
                    </a>
                    <a href="#" class="logout-link">
                        <i class="fas fa-sign-out-alt"></i>
                        Sair
                    </a>
                </div>
            </div>
        `;

        // Atualiza os botões de reserva
        reserveButtons.forEach(button => {
            button.textContent = 'Fazer Reserva';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');
        });

        // Adiciona event listeners para os novos botões
        const dashboardLink = document.querySelector('.dashboard-link');
        const logoutLink = document.querySelector('.logout-link');
        const userButton = document.querySelector('.btn-user');

        // Toggle do menu dropdown
        userButton?.addEventListener('click', () => {
            document.querySelector('.user-dropdown').classList.toggle('active');
        });

        // Navegação para o dashboard
        dashboardLink?.addEventListener('click', (e) => {
            e.preventDefault();
            const role = localStorage.getItem('userRole');
            if (role) {
                const dashboardUrls = {
                    'ADMIN': '/pages/dashboard-admin.html',
                    'RECEPTIONIST': '/pages/dashboard-reception.html',
                    'GUEST': '/pages/dashboard-guest.html'
                };
                window.location.href = dashboardUrls[role] || '/pages/dashboard-guest.html';
            }
        });

        // Logout
        logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            // Limpa os dados de autenticação
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            
            // Recarrega a página
            window.location.reload();
        });

        // Atualiza o comportamento dos botões de reserva
        reserveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const role = localStorage.getItem('userRole');
                if (role) {
                    const dashboardUrls = {
                        'ADMIN': '/pages/dashboard-admin.html',
                        'RECEPTIONIST': '/pages/dashboard-reception.html',
                        'GUEST': '/pages/dashboard-guest.html'
                    };
                    window.location.href = dashboardUrls[role] || '/pages/dashboard-guest.html';
                }
            });
        });
    } else {
        // Configurar os event listeners para os botões quando não autenticado
        setupNavigationListeners();
    }
}

// Adiciona CSS dinâmico para o menu do usuário
const style = document.createElement('style');
style.textContent = `
    .user-menu {
        position: relative;
        display: inline-block;
    }

    .btn-user {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #c8a97e;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .btn-user:hover {
        background-color: #b69468;
    }

    .user-dropdown {
        display: none;
        position: absolute;
        right: 0;
        top: 100%;
        background-color: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-radius: 4px;
        min-width: 200px;
        z-index: 1000;
    }

    .user-dropdown.active {
        display: block;
    }

    .user-dropdown a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        color: #333;
        text-decoration: none;
        transition: background-color 0.3s;
    }

    .user-dropdown a:hover {
        background-color: #f5f5f5;
    }

    .user-dropdown i {
        width: 20px;
    }
`;
document.head.appendChild(style);

// Atualiza os botões quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o router está disponível antes de inicializar
    if (window.router) {
        updateAuthButtons();
    } else {
        // Se o router ainda não estiver disponível, espera um pouco e tenta novamente
        setTimeout(updateAuthButtons, 100);
    }
});

// Fecha o dropdown quando clicar fora dele
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.querySelector('.user-dropdown')?.classList.remove('active');
    }
}); 