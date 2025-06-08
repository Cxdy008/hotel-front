// Função para decodificar o token JWT sem verificação de assinatura
function decodeJWT(token) {
    try {
        if (!token) {
            console.error('Token não fornecido para decodificação');
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('Token JWT inválido: formato incorreto');
            return null;
        }

        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Erro ao decodificar token:', error);
        return null;
    }
}

// Função para extrair a role principal do array de roles
function getPrimaryRole(roles) {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        console.error('Roles inválidas:', roles);
        return null;
    }
    return roles[0].replace('ROLE_', '');
}

// Classe principal de autenticação
class Auth {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.decodedToken = null;
        
        if (this.token) {
            try {
                this.decodedToken = this.decodeToken(this.token);
            } catch (e) {
                console.error('Erro ao decodificar token:', e);
                this.clearAuth();
            }
        }

        // Verificar autenticação em páginas protegidas
        this.checkProtectedRoute();
    }

    decodeToken(token) {
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        try {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Erro ao processar token:', e);
            return null;
        }
    }

    isAuthenticated() {
        if (!this.token || !this.decodedToken) return false;

        const expirationTime = this.decodedToken.exp * 1000;
        if (Date.now() >= expirationTime) {
            this.clearAuth();
            return false;
        }

        return true;
    }

    getRole() {
        return this.decodedToken?.roles?.[0]?.replace('ROLE_', '') || null;
    }

    getName() {
        return this.decodedToken?.name || this.getEmail()?.split('@')[0] || null;
    }

    getEmail() {
        return this.decodedToken?.sub || null;
    }

    clearAuth() {
        this.token = null;
        this.decodedToken = null;
        localStorage.removeItem('authToken');
    }

    logout() {
        this.clearAuth();
        window.location.href = '/pages/login-page.html';
    }

    setToken(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded) return false;

            this.token = token;
            this.decodedToken = decoded;
            localStorage.setItem('authToken', token);

            const role = this.getRole();
            if (role) {
                if (window.router) {
                    window.router.navigate(`dashboard-${role.toLowerCase()}`);
                } else {
                    window.location.href = `/pages/dashboard-${role.toLowerCase()}.html`;
                }
            }
            return true;
        } catch (e) {
            console.error('Erro ao configurar token:', e);
            return false;
        }
    }

    getDashboardUrl() {
        const role = this.getRole();
        return role ? `/pages/dashboard-${role.toLowerCase()}.html` : null;
    }

    checkProtectedRoute() {
        const currentRoute = window.router?.getCurrentRoute();
        if (!currentRoute) return;

        // Se está em uma página de dashboard
        if (currentRoute.startsWith('dashboard-')) {
            if (!this.isAuthenticated()) {
                // Redirecionar para login se não estiver autenticado
                if (window.router) {
                    window.router.navigate('login');
                } else {
                    window.location.href = '/pages/login-page.html';
                }
            }
        }
        // Se está na página de login e já está autenticado
        else if (currentRoute === 'login' && this.isAuthenticated()) {
            const role = this.getRole();
            if (role) {
                if (window.router) {
                    window.router.navigate(`dashboard-${role.toLowerCase()}`);
                } else {
                    window.location.href = `/pages/dashboard-${role.toLowerCase()}.html`;
                }
            }
        }
    }
}

// Criar instância global
window.auth = new Auth();
console.log('Auth inicializado:', window.auth); // Debug 