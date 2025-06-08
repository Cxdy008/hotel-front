// Configuração da API
const API_BASE_URL = 'http://localhost:8080';
const token = localStorage.getItem('token');

// Headers padrão para requisições autenticadas
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

// Elementos do DOM
const sidebarToggle = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.admin-sidebar');
const navItems = document.querySelectorAll('.admin-nav-item');
const pages = document.querySelectorAll('.admin-page');
const pageTitle = document.getElementById('adminPageTitle');
const adminEmail = document.getElementById('adminEmail');
const adminName = document.getElementById('adminName');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Configuração dos gráficos
const chartConfigs = {
    systemActivity: {
        type: 'line',
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    },
    userDistribution: {
        type: 'doughnut',
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação de admin
    if (!token || !isAdmin()) {
        window.location.href = '/pages/login-page.html';
        return;
    }

    // Carregar dados do admin
    loadAdminData();

    // Inicializar gráficos
    initializeAdminCharts();

    // Carregar dados iniciais
    await loadSystemStats();
    await loadUserStats();
    await loadActivityLogs();
});

// Event Listeners
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // Atualizar navegação
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Atualizar página e título
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === targetPage) {
                page.classList.add('active');
                pageTitle.textContent = item.querySelector('span').textContent;
            }
        });

        // Carregar dados específicos da página
        loadPageData(targetPage);
    });
});

// Logout handler
adminLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminEmail');
    window.location.href = '/pages/login-page.html';
});

// Funções de verificação e carregamento
function isAdmin() {
    // Implementar lógica de verificação de admin
    const userRole = localStorage.getItem('userRole');
    return userRole === 'ADMIN';
}

function loadAdminData() {
    const adminEmailFromStorage = localStorage.getItem('adminEmail');
    const adminNameFromStorage = localStorage.getItem('adminName');
    
    if (adminEmailFromStorage) {
        adminEmail.textContent = adminEmailFromStorage;
    }
    if (adminNameFromStorage) {
        adminName.textContent = adminNameFromStorage;
    }
}

async function loadSystemStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/stats`, { headers });
        const data = await response.json();

        // Atualizar cards estatísticos
        updateSystemStats(data);

        // Atualizar gráfico de atividade do sistema
        updateSystemActivityChart(data.activityData);
    } catch (error) {
        showAdminToast('Erro ao carregar estatísticas do sistema', 'error');
    }
}

async function loadUserStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/stats`, { headers });
        const data = await response.json();

        // Atualizar gráfico de distribuição de usuários
        updateUserDistributionChart(data);
    } catch (error) {
        showAdminToast('Erro ao carregar estatísticas de usuários', 'error');
    }
}

async function loadActivityLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/activity-logs`, { headers });
        const logs = await response.json();

        // Atualizar lista de atividades recentes
        updateActivityList(logs);
    } catch (error) {
        showAdminToast('Erro ao carregar logs de atividade', 'error');
    }
}

async function loadPageData(page) {
    switch (page) {
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

// Funções de atualização de UI
function updateSystemStats(data) {
    // Atualizar cards estatísticos com dados do sistema
    document.querySelector('.admin-stat-card:nth-child(1) .stat-info p').textContent = 
        data.totalUsers;
    document.querySelector('.admin-stat-card:nth-child(2) .stat-info p').textContent = 
        data.securityLevel;
    document.querySelector('.admin-stat-card:nth-child(3) .stat-info p').textContent = 
        data.systemStatus;
    document.querySelector('.admin-stat-card:nth-child(4) .stat-info p').textContent = 
        data.uptime;
}

function updateActivityList(logs) {
    const activityList = document.querySelector('.activity-list');
    
    activityList.innerHTML = logs.map(log => `
        <div class="activity-item">
            <i class="fas ${getActivityIcon(log.type)}"></i>
            <div class="activity-details">
                <p>${log.description}</p>
                <span>${formatTimestamp(log.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// Inicialização e atualização de gráficos
function initializeAdminCharts() {
    // Gráfico de atividade do sistema
    const systemActivityCtx = document.getElementById('systemActivityChart').getContext('2d');
    window.systemActivityChart = new Chart(systemActivityCtx, {
        ...chartConfigs.systemActivity,
        data: {
            labels: [],
            datasets: [{
                label: 'Atividade do Sistema',
                data: [],
                borderColor: '#3498db',
                tension: 0.4
            }]
        }
    });

    // Gráfico de distribuição de usuários
    const userDistributionCtx = document.getElementById('userDistributionChart').getContext('2d');
    window.userDistributionChart = new Chart(userDistributionCtx, {
        ...chartConfigs.userDistribution,
        data: {
            labels: ['Administradores', 'Gerentes', 'Recepcionistas', 'Outros'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c']
            }]
        }
    });
}

function updateSystemActivityChart(data) {
    window.systemActivityChart.data.labels = data.map(item => item.time);
    window.systemActivityChart.data.datasets[0].data = data.map(item => item.value);
    window.systemActivityChart.update();
}

function updateUserDistributionChart(data) {
    window.userDistributionChart.data.datasets[0].data = [
        data.admins,
        data.managers,
        data.receptionists,
        data.others
    ];
    window.userDistributionChart.update();
}

// Funções utilitárias
function getActivityIcon(type) {
    const icons = {
        'user': 'fa-user',
        'security': 'fa-shield-alt',
        'system': 'fa-server',
        'error': 'fa-exclamation-triangle',
        'success': 'fa-check-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} minutos`;
    if (diffMinutes < 1440) return `Há ${Math.floor(diffMinutes / 60)} horas`;
    return date.toLocaleDateString();
}

// Toast notifications
function showAdminToast(message, type = 'success') {
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

// Funções de carregamento de dados específicos
async function loadUserManagementData() {
    // Implementar carregamento de dados de gestão de usuários
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