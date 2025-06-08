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
const sidebar = document.querySelector('.reception-sidebar');
const navItems = document.querySelectorAll('.reception-nav-item');
const pages = document.querySelectorAll('.reception-page');
const pageTitle = document.getElementById('pageTitle');
const receptionistName = document.getElementById('receptionistName');
const receptionistEmail = document.getElementById('receptionistEmail');
const receptionLogoutBtn = document.getElementById('receptionLogoutBtn');
const currentDate = document.getElementById('currentDate');
const reservationsList = document.querySelector('.reservations-list');
const occupationCalendar = document.getElementById('occupationCalendar');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    if (!token || !isReceptionist()) {
        window.location.href = '/pages/login-page.html';
        return;
    }

    // Carregar dados do recepcionista
    loadReceptionistData();

    // Inicializar calendário
    initializeCalendar();

    // Carregar dados iniciais
    await loadDailyReservations();
    updateCurrentDate();
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

// Formulários
document.getElementById('manualReservationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createReservation(e.target);
});

document.getElementById('guestRegistrationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await registerGuest(e.target);
});

// Logout handler
receptionLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('receptionistEmail');
    window.location.href = '/pages/login-page.html';
});

// Funções de verificação e carregamento
function isReceptionist() {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'RECEPTIONIST';
}

function loadReceptionistData() {
    const emailFromStorage = localStorage.getItem('receptionistEmail');
    const nameFromStorage = localStorage.getItem('receptionistName');
    
    if (emailFromStorage) {
        receptionistEmail.textContent = emailFromStorage;
    }
    if (nameFromStorage) {
        receptionistName.textContent = nameFromStorage;
    }
}

// Função para carregar reservas do dia
async function loadDailyReservations() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reserves/status/PENDING`, { headers });
        const reservations = await response.json();
        updateReservationsList(reservations);
    } catch (error) {
        showToast('Erro ao carregar reservas do dia', 'error');
    }
}

function updateReservationsList(reservations) {
    reservationsList.innerHTML = reservations.map(reservation => `
        <div class="reservation-card ${reservation.status.toLowerCase()}">
            <div class="reservation-header">
                <h4>Reserva #${reservation.id}</h4>
                <span class="status-badge">${reservation.status}</span>
            </div>
            <div class="reservation-details">
                <p><i class="fas fa-user"></i> ${reservation.guestName}</p>
                <p><i class="fas fa-bed"></i> Quarto ${reservation.roomNumber}</p>
                <p><i class="fas fa-clock"></i> Check-in: ${formatDate(reservation.checkIn)}</p>
            </div>
            <div class="reservation-actions">
                ${getReservationActions(reservation.status)}
            </div>
        </div>
    `).join('');

    // Adicionar event listeners para ações
    addReservationActionListeners();
}

function getReservationActions(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return `
                <button class="action-btn check-in" data-action="check-in">
                    <i class="fas fa-check"></i> Check-in
                </button>
            `;
        case 'active':
            return `
                <button class="action-btn check-out" data-action="check-out">
                    <i class="fas fa-sign-out-alt"></i> Check-out
                </button>
            `;
        default:
            return '';
    }
}

function addReservationActionListeners() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = e.target.closest('.action-btn').dataset.action;
            const reservationId = e.target.closest('.reservation-card').dataset.id;
            
            switch (action) {
                case 'check-in':
                    await performCheckIn(reservationId);
                    break;
                case 'check-out':
                    await performCheckOut(reservationId);
                    break;
            }
        });
    });
}

// Funções de ação
async function createReservation(form) {
    try {
        const formData = new FormData(form);
        const data = {
            guestId: formData.get('guestId'),
            roomId: formData.get('roomId'),
            checkIn: formData.get('checkIn'),
            checkOut: formData.get('checkOut')
        };

        const response = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao criar reserva');

        showToast('Reserva criada com sucesso!');
        form.reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function registerGuest(form) {
    try {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            document: formData.get('document'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        const response = await fetch(`${API_BASE_URL}/guests`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Erro ao cadastrar hóspede');

        showToast('Hóspede cadastrado com sucesso!');
        form.reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function performCheckIn(reservationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/check-in`, {
            method: 'PUT',
            headers
        });

        if (!response.ok) throw new Error('Erro ao realizar check-in');

        showToast('Check-in realizado com sucesso!');
        await loadDailyReservations();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function performCheckOut(reservationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/check-out`, {
            method: 'PUT',
            headers
        });

        if (!response.ok) throw new Error('Erro ao realizar check-out');

        showToast('Check-out realizado com sucesso!');
        await loadDailyReservations();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Funções do calendário
function initializeCalendar() {
    const calendar = new FullCalendar.Calendar(occupationCalendar, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events: fetchCalendarEvents,
        eventClick: handleEventClick,
        eventContent: renderEventContent
    });

    calendar.render();
}

// Função para atualizar status do quarto
async function updateRoomStatus(roomNumber, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomNumber}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status do quarto');

        showToast('Status do quarto atualizado com sucesso!');
        await loadRoomStatistics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Função para colocar quarto em manutenção
async function setRoomMaintenance(roomNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomNumber}/maintenance`, {
            method: 'POST',
            headers
        });

        if (!response.ok) throw new Error('Erro ao colocar quarto em manutenção');

        showToast('Quarto colocado em manutenção com sucesso!');
        await loadRoomStatistics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Função para liberar quarto
async function releaseRoom(roomNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomNumber}/release`, {
            method: 'POST',
            headers
        });

        if (!response.ok) throw new Error('Erro ao liberar quarto');

        showToast('Quarto liberado com sucesso!');
        await loadRoomStatistics();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Função para carregar estatísticas dos quartos
async function loadRoomStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/statistics`, { headers });
        const statistics = await response.json();
        updateRoomStatistics(statistics);
    } catch (error) {
        showToast('Erro ao carregar estatísticas', 'error');
    }
}

// Função para carregar eventos do calendário
async function fetchCalendarEvents(info, successCallback, failureCallback) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/reserves/status/CONFIRMED`,
            { headers }
        );
        const events = await response.json();
        successCallback(events);
    } catch (error) {
        failureCallback(error);
    }
}

function renderEventContent(eventInfo) {
    return {
        html: `
            <div class="calendar-event ${eventInfo.event.extendedProps.status}">
                <div class="event-time">${eventInfo.timeText}</div>
                <div class="event-title">${eventInfo.event.title}</div>
            </div>
        `
    };
}

function handleEventClick(info) {
    // Implementar visualização detalhada da reserva
}

// Funções utilitárias
function updateCurrentDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = new Date().toLocaleDateString('pt-BR', options);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `reception-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.getElementById('receptionToastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 