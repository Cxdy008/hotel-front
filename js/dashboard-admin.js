// Configuração da API
const API_BASE_URL = 'http://localhost:8080';

// Elementos do DOM
const sidebarToggle = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.admin-sidebar');
const navItems = document.querySelectorAll('.admin-nav-item');
const pages = document.querySelectorAll('.admin-page');
const pageTitle = document.getElementById('adminPageTitle');
const adminName = document.getElementById('adminName');
const adminEmail = document.getElementById('adminEmail');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/pages/login-page.html';
        return;
    }

    // Carregar dados do usuário do token
    loadUserDataFromToken();

    // Inicializar gráficos com dados reais
    await loadOverviewData();
});

// Event Listeners
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Add hover functionality for collapsed sidebar
sidebar.addEventListener('mouseenter', () => {
    if (sidebar.classList.contains('collapsed')) {
        sidebar.style.width = 'var(--admin-sidebar-width)';
        document.querySelectorAll('.admin-sidebar-header h1, .admin-details, .admin-nav-item span, .admin-logout-btn span').forEach(el => {
            el.style.display = 'block';
        });
    }
});

sidebar.addEventListener('mouseleave', () => {
    if (sidebar.classList.contains('collapsed')) {
        sidebar.style.width = 'var(--admin-sidebar-collapsed)';
        document.querySelectorAll('.admin-sidebar-header h1, .admin-details, .admin-nav-item span, .admin-logout-btn span').forEach(el => {
            el.style.display = 'none';
        });
    }
});

// Navegação da Sidebar
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // Atualizar navegação
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Atualizar página
        pages.forEach(page => {
            if (page.id === targetPage) {
                page.style.display = 'block';
                pageTitle.textContent = item.querySelector('span').textContent;
            } else {
                page.style.display = 'none';
            }
        });

        // Carregar dados específicos da página
        loadPageData(targetPage);
    });
});

// Logout handler
adminLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/pages/login-page.html';
});

// Função para obter o token
function getAuthToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/pages/login-page.html';
        return null;
    }
    return token;
}

// Headers padrão para requisições autenticadas
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Função para carregar dados do usuário do token
function loadUserDataFromToken() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Token inválido');
        }

        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Token inválido');
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Atualizar o email do token
        adminEmail.textContent = payload.sub || 'Email não disponível';
        
        // Pegar o nome do localStorage
        const userName = localStorage.getItem('userName');
        adminName.textContent = userName || 'Administrador';
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        adminEmail.textContent = 'Email não disponível';
        adminName.textContent = 'Administrador';
    }
}

// Função para carregar dados específicos de cada página
async function loadPageData(pageName) {
    switch (pageName) {
        case 'admin-overview':
            await loadOverviewData();
            break;
        case 'user-management':
            await loadUserManagementData();
            break;
        case 'system-settings':
            await loadSystemSettings();
            break;
        case 'security':
            await loadSecurityData();
            break;
        case 'logs':
            await loadSystemLogs();
            break;
    }
}

// Funções de carregamento de dados específicos
async function loadOverviewData() {
    try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            throw new Error('Email do usuário não encontrado');
        }

        const response = await fetch(`${API_BASE_URL}/api/guests`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Authenticated-Email': userEmail,
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Não autorizado. Por favor, faça login novamente.');
            }
            throw new Error('Falha ao carregar dados dos usuários');
        }

        const users = await response.json();
        
        // Contagem de usuários por papel
        const userCounts = {
            admin: 0,
            reception: 0,
            guest: 0
        };

        users.forEach(user => {
            user.authorities.forEach(auth => {
                if (auth.authority === 'ROLE_ADMIN') userCounts.admin++;
                if (auth.authority === 'ROLE_RECEPTION') userCounts.reception++;
                if (auth.authority === 'ROLE_GUEST') userCounts.guest++;
            });
        });

        // Se os gráficos ainda não foram inicializados, inicialize-os
        if (!window.userDistributionChart) {
            initializeCharts(userCounts);
        } else {
            // Caso contrário, apenas atualize os dados
            window.userDistributionChart.data.datasets[0].data = [
                userCounts.admin,
                userCounts.reception,
                userCounts.guest
            ];
            window.userDistributionChart.update();
        }

        // Atualizar os cards de estatísticas
        document.querySelector('.admin-stats-grid').innerHTML = `
            <div class="admin-stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>Total de Usuários</h3>
                    <p>${users.length}</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="stat-info">
                    <h3>Administradores</h3>
                    <p>${userCounts.admin}</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">
                    <i class="fas fa-concierge-bell"></i>
                </div>
                <div class="stat-info">
                    <h3>Recepcionistas</h3>
                    <p>${userCounts.reception}</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">
                    <i class="fas fa-bed"></i>
                </div>
                <div class="stat-info">
                    <h3>Hóspedes</h3>
                    <p>${userCounts.guest}</p>
                </div>
            </div>
        `;

        // Atualizar atividades recentes
        const recentUsers = users.slice(-3).reverse();
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activityList.innerHTML = recentUsers.map(user => `
                <div class="activity-item">
                    <i class="fas fa-user-plus"></i>
                    <div class="activity-details">
                        <p>Novo usuário: ${user.name}</p>
                        <span>Email: ${user.email}</span>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Erro ao carregar dados da visão geral:', error);
        showToast(error.message || 'Erro ao carregar dados da visão geral', 'error');
        
        // Se houver erro de autorização, redirecionar para o login
        if (error.message.includes('Não autorizado')) {
            localStorage.clear();
            window.location.href = '/pages/login-page.html';
        }
    }
}

async function loadUserManagementData() {
    // Implementar carregamento de dados de usuários
}

async function loadSystemSettings() {
    // Implementar carregamento de configurações do sistema
}

async function loadSecurityData() {
    // Implementar carregamento de dados de segurança
}

async function loadSystemLogs() {
    // Implementar carregamento de logs do sistema
}

// Funções para os gráficos
function initializeCharts(userCounts) {
    // Gráfico de Atividade do Sistema
    const systemActivityCtx = document.getElementById('systemActivityChart').getContext('2d');
    window.systemActivityChart = new Chart(systemActivityCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Atividade do Sistema',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: '#7c3aed',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(124, 58, 237, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        maxTicksLimit: 5
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Gráfico de Distribuição de Usuários
    const userDistributionCtx = document.getElementById('userDistributionChart').getContext('2d');
    window.userDistributionChart = new Chart(userDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Administradores', 'Recepcionistas', 'Hóspedes'],
            datasets: [{
                data: [
                    userCounts.admin,
                    userCounts.reception,
                    userCounts.guest
                ],
                backgroundColor: [
                    '#7c3aed',
                    '#6d28d9',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function updateSystemActivityChart() {
    // Atualizar dados do gráfico de atividade
    if (window.systemActivityChart) {
        // Aqui você pode adicionar dados reais
        window.systemActivityChart.update();
    }
}

function updateUserDistributionChart() {
    // Atualizar dados do gráfico de distribuição
    if (window.userDistributionChart) {
        // Aqui você pode adicionar dados reais
        window.userDistributionChart.update();
    }
}

// Atualizar gráficos quando a janela for redimensionada
window.addEventListener('resize', () => {
    if (window.systemActivityChart) {
        window.systemActivityChart.resize();
    }
    if (window.userDistributionChart) {
        window.userDistributionChart.resize();
    }
});

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('adminToastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 