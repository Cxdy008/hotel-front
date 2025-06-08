// Configuração da API
const API_BASE_URL = 'http://localhost:8080';

// Função para obter o token atualizado
function getAuthToken() {
    const token = localStorage.getItem('authToken'); // Mudando de 'token' para 'authToken' para manter consistência
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

// Elementos do DOM
const sidebarToggle = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.guest-sidebar');
const navItems = document.querySelectorAll('.guest-nav-item');
const pages = document.querySelectorAll('.guest-page');
const pageTitle = document.getElementById('pageTitle');
const guestName = document.getElementById('guestName');
const guestEmail = document.getElementById('guestEmail');
const guestLogoutBtn = document.getElementById('guestLogoutBtn');

// Elementos de formulário
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const reservationStatusFilter = document.getElementById('reservationStatusFilter');
const reservationSortFilter = document.getElementById('reservationSortFilter');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const roomTypeFilter = document.getElementById('roomTypeFilter');

let selectedRoomNumber = null;
const submitContainer = document.querySelector('.reservation-submit-container');
const submitButton = document.querySelector('.submit-reservation-btn');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/pages/login-page.html';
        return;
    }

    // Carregar dados do usuário do token
    loadUserDataFromToken();

    // Carregar dados da página inicial (Minhas Reservas)
    loadPageData('my-reservations');

    // Adicionar listeners para os campos de data
    if (checkInDate) {
        checkInDate.addEventListener('change', validateDates);
    }
    if (checkOutDate) {
        checkOutDate.addEventListener('change', validateDates);
    }
});

// Event Listeners
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// Add hover functionality for collapsed sidebar
sidebar.addEventListener('mouseenter', () => {
    if (sidebar.classList.contains('collapsed')) {
        sidebar.style.width = 'var(--guest-sidebar-width)';
        document.querySelectorAll('.guest-sidebar-header h1, .guest-details, .guest-nav-item span, .guest-logout-btn span').forEach(el => {
            el.style.display = 'block';
        });
    }
});

sidebar.addEventListener('mouseleave', () => {
    if (sidebar.classList.contains('collapsed')) {
        sidebar.style.width = 'var(--guest-sidebar-collapsed)';
        document.querySelectorAll('.guest-sidebar-header h1, .guest-details, .guest-nav-item span, .guest-logout-btn span').forEach(el => {
            el.style.display = 'none';
        });
    }
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // Atualizar navegação
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Atualizar página
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

// Filtros de reserva
reservationStatusFilter?.addEventListener('change', () => {
    loadReservations();
});

reservationSortFilter?.addEventListener('change', () => {
    loadReservations();
});

// Busca de quartos
checkInDate?.addEventListener('change', validateDates);
checkOutDate?.addEventListener('change', validateDates);
document.querySelector('.search-btn')?.addEventListener('click', searchAvailableRooms);

// Remover o evento de change do roomTypeFilter
roomTypeFilter?.removeEventListener('change', searchAvailableRooms);

// Formulários
profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateProfile(e.target);
});

passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await updatePassword(e.target);
});

// Logout handler
guestLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('guestEmail');
    window.location.href = '/pages/login-page.html';
});

// Funções de carregamento de dados
async function loadReservations() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reserves/my-reserves`, { headers: getAuthHeaders() });
        const reservations = await response.json();
        updateReservationsList(reservations);
    } catch (error) {
        showToast('Erro ao carregar reservas', 'error');
    }
}

function updateReservationsList(reservations) {
    const reservationsList = document.querySelector('.reservations-list');
    if (!reservationsList) return;

    reservationsList.innerHTML = reservations.map(reservation => `
        <div class="reservation-card ${reservation.status.toLowerCase()}">
            <div class="reservation-header">
                <h4>Reserva #${reservation.id}</h4>
                <span class="status-badge">${getStatusText(reservation.status)}</span>
            </div>
            <div class="reservation-details">
                <div class="detail-row">
                    <i class="fas fa-bed"></i>
                    <div>
                        <h5>Quarto ${reservation.roomNumber}</h5>
                        <p>${reservation.roomType}</p>
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <p>Check-in: ${formatDate(reservation.checkIn)}</p>
                        <p>Check-out: ${formatDate(reservation.checkOut)}</p>
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-money-bill-wave"></i>
                    <div>
                        <p>Total: AOA ${reservation.totalPrice.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            ${reservation.status === 'PENDING' ? `
                <div class="reservation-actions">
                    <button class="cancel-btn" onclick="cancelReservation(${reservation.id})">
                        Cancelar Reserva
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Função para verificar se todos os campos necessários estão preenchidos
function checkFormValidity() {
    const checkIn = checkInDate.value;
    const checkOut = checkOutDate.value;
    const roomType = roomTypeFilter.value;
    
    // Habilita o botão de busca apenas se as datas e tipo de quarto estiverem selecionados
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.disabled = !checkIn || !checkOut || roomType === 'all';

    // Habilita o botão de confirmação apenas se tudo estiver selecionado
    submitButton.disabled = !checkIn || !checkOut || roomType === 'all' || !selectedRoomNumber;
}

// Função para configurar as restrições de data
function setupDateConstraints() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Formatar as datas para o formato YYYY-MM-DD
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Configurar data mínima para check-in
    if (checkInDate) {
        checkInDate.min = todayStr;
        checkInDate.addEventListener('change', () => {
            if (checkOutDate) {
                // Configurar data mínima para check-out baseado no check-in
                const selectedCheckIn = new Date(checkInDate.value);
                const minCheckOut = new Date(selectedCheckIn);
                minCheckOut.setDate(minCheckOut.getDate() + 1);
                checkOutDate.min = minCheckOut.toISOString().split('T')[0];

                // Se a data de check-out for anterior ou igual à nova data mínima, limpar o campo
                if (checkOutDate.value && new Date(checkOutDate.value) <= selectedCheckIn) {
                    checkOutDate.value = '';
                    showToast('A data de check-out deve ser posterior à data de check-in', 'error');
                }
            }
        });
    }

    // Configurar data mínima inicial para check-out
    if (checkOutDate) {
        checkOutDate.min = tomorrowStr;
    }
}

// Função para validar as datas
function validateDates() {
    if (!checkInDate || !checkOutDate) return false;

    const start = new Date(checkInDate.value);
    const end = new Date(checkOutDate.value);

    if (end <= start) {
        showToast('A data de check-out deve ser posterior à data de check-in', 'error');
        checkOutDate.value = '';
        return false;
    }

    return true;
}

// Atualizar a função de busca de quartos
async function searchAvailableRooms() {
    if (!checkInDate.value || !checkOutDate.value) {
        showToast('Por favor, selecione as datas de check-in e check-out', 'error');
        return;
    }

    if (!validateDates()) {
        return;
    }

    selectedRoomNumber = null;
    submitContainer.style.display = 'none';
    submitButton.disabled = true;
    
    const roomsList = document.querySelector('.available-rooms');
    const roomType = roomTypeFilter.value;
    
    try {
        const token = getAuthToken();
        if (!token) return;

        // Mostrar estado de carregamento
        roomsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Buscando quartos...</p></div>';

        // Definir o endpoint baseado na seleção do tipo de quarto
        const endpoint = roomType === 'all' 
            ? `${API_BASE_URL}/api/rooms/available`
            : `${API_BASE_URL}/api/rooms/type/${roomType}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/pages/login-page.html';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao buscar quartos');
        }

        const rooms = await response.json();
        
        if (!Array.isArray(rooms)) {
            throw new Error('Formato de resposta inválido');
        }

        if (rooms.length === 0) {
            roomsList.innerHTML = `
                <div class="no-rooms-message">
                    <i class="fas fa-info-circle"></i>
                    <p>Nenhum quarto ${roomType === 'all' ? 'disponível' : `do tipo ${roomType} disponível`} para as datas selecionadas.</p>
                </div>
            `;
            return;
        }

        updateAvailableRoomsList(rooms);
    } catch (error) {
        console.error('Erro ao buscar quartos:', error);
        roomsList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao buscar quartos. Tente novamente.</p>
                <small>${error.message}</small>
            </div>
        `;
        showToast('Erro ao buscar quartos', 'error');
    }
}

function updateAvailableRoomsList(rooms) {
    const roomsList = document.querySelector('.available-rooms');
    if (!roomsList) return;

    if (!Array.isArray(rooms) || rooms.length === 0) {
        roomsList.innerHTML = `
            <div class="no-rooms-message">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum quarto encontrado para este tipo.</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = rooms.map(room => `
        <div class="room-card ${room.status.toLowerCase()}" data-room-number="${room.roomNumber}">
            ${room.status === 'DISPOSED' ? `
                <input type="checkbox" class="select-room" id="room-${room.roomNumber}">
            ` : ''}
            <div class="room-info">
                <h4>Quarto ${room.roomNumber}</h4>
                <div class="room-type">
                    <i class="fas fa-bed"></i>
                    <span>${room.roomType}</span>
                </div>
                <div class="room-status">
                    <span class="status-badge">${getStatusText(room.status)}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Adicionar listeners para seleção de quarto
    const disposedRooms = roomsList.querySelectorAll('.room-card.disposed');
    disposedRooms.forEach(card => {
        const checkbox = card.querySelector('.select-room');
        if (checkbox) {
            checkbox.addEventListener('change', () => handleRoomSelection(card));
        }
    });
}

// Função para lidar com a seleção de quartos
function handleRoomSelection(card) {
    const checkbox = card.querySelector('.select-room');
    const roomNumber = card.dataset.roomNumber;
    
    // Desmarcar outros quartos
    document.querySelectorAll('.select-room').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });

    if (checkbox.checked) {
        selectedRoomNumber = roomNumber;
        submitContainer.style.display = 'block';
        submitButton.disabled = false;
    } else {
        selectedRoomNumber = null;
        submitContainer.style.display = 'none';
        submitButton.disabled = true;
    }
}

// Adicionar listeners para os campos do formulário
roomTypeFilter?.addEventListener('change', checkFormValidity);

// Função para criar uma nova reserva
async function createReservation() {
    if (!selectedRoomNumber) {
        showToast('Por favor, selecione um quarto', 'error');
        return;
    }

    if (!checkInDate.value || !checkOutDate.value) {
        showToast('Por favor, selecione as datas de check-in e check-out', 'error');
        return;
    }

    if (!validateDates()) {
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Processando...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/reserves`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                roomNumber: parseInt(selectedRoomNumber),
                checkIn: checkInDate.value,
                checkOut: checkOutDate.value
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao criar reserva');
        }

        showToast('Reserva criada com sucesso!', 'success');
        
        // Redirecionar para a página de reservas após 2 segundos
        setTimeout(() => {
            document.querySelector('[data-page="my-reservations"]').click();
        }, 2000);

    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        showToast(error.message || 'Erro ao criar reserva', 'error');
        
        // Resetar estado do botão
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar Reserva';
        
        // Desmarcar o checkbox em caso de erro
        const checkbox = document.querySelector(`#room-${selectedRoomNumber}`);
        if (checkbox) checkbox.checked = false;
        selectedRoomNumber = null;
        submitContainer.style.display = 'none';
    }
}

// Adicionar event listener para o botão de submissão
submitButton?.addEventListener('click', createReservation);

async function cancelReservation(reservationId) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/reserves/${reservationId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erro ao cancelar reserva');

        showToast('Reserva cancelada com sucesso!');
        await loadReservations();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updateProfile(form) {
    try {
        const formData = new FormData(form);
        const data = {
            name: formData.get('fullName'),
            email: formData.get('email'),
            document: formData.get('document'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        const response = await fetch(`${API_BASE_URL}/guests/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao atualizar perfil');

        showToast('Perfil atualizado com sucesso!');
        await loadReservations();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updatePassword(form) {
    try {
        const formData = new FormData(form);
        const data = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (data.newPassword !== data.confirmPassword) {
            throw new Error('As senhas não coincidem');
        }

        const response = await fetch(`${API_BASE_URL}/guests/password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao atualizar senha');

        showToast('Senha atualizada com sucesso!');
        form.reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Funções utilitárias
function getStatusText(status) {
    const statusMap = {
        'DISPOSED': 'Disponível',
        'RESERVED': 'Reservado'
    };
    return statusMap[status] || status;
}

function getFeatureIcon(feature) {
    const iconMap = {
        'WiFi': 'fa-wifi',
        'TV': 'fa-tv',
        'Ar Condicionado': 'fa-snowflake',
        'Frigobar': 'fa-cube',
        'Cofre': 'fa-lock'
    };
    return iconMap[feature] || 'fa-check';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Função para carregar dados do usuário do token
function loadUserDataFromToken() {
    try {
        // Decodificar o token JWT
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
        guestEmail.textContent = payload.sub || 'Email não disponível';
        
        // Pegar o nome do localStorage (salvo durante o login)
        const userName = localStorage.getItem('userName');
        guestName.textContent = userName || 'Usuário';
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        guestEmail.textContent = 'Email não disponível';
        guestName.textContent = 'Usuário';
    }
}

// Função para carregar dados específicos de cada página
function loadPageData(pageName) {
    switch (pageName) {
        case 'my-reservations':
            loadReservations();
            break;
        case 'new-reservation':
            // Resetar formulário
            if (checkInDate) checkInDate.value = '';
            if (checkOutDate) checkOutDate.value = '';
            if (roomTypeFilter) roomTypeFilter.value = 'all';
            
            // Limpar lista de quartos e esconder botão de confirmação
            const roomsList = document.querySelector('.available-rooms');
            if (roomsList) {
                roomsList.innerHTML = '';
            }
            if (submitContainer) {
                submitContainer.style.display = 'none';
            }
            
            // Configurar restrições de data
            setupDateConstraints();
            break;
        case 'profile':
            loadUserProfile();
            break;
    }
}

// Função para carregar dados do perfil do usuário
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/guests/profile`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const profileData = await response.json();
            // Preencher formulário com dados do perfil
            document.getElementById('fullName').value = profileData.name || '';
            document.getElementById('email').value = profileData.email || '';
            document.getElementById('document').value = profileData.document || '';
            document.getElementById('phone').value = profileData.phone || '';
            document.getElementById('address').value = profileData.address || '';
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showToast('Erro ao carregar dados do perfil', 'error');
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `guest-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('guestToastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 