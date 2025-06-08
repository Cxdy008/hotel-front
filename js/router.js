// Router class for handling client-side navigation
class Router {
    constructor() {
        this.routes = {
            'login': '/pages/login-page.html',
            'signup': '/pages/signup-page.html',
            'dashboard-admin': '/pages/dashboard-admin.html',
            'dashboard-reception': '/pages/dashboard-reception.html',
            'dashboard-guest': '/pages/dashboard-guest.html'
        };

        // Lidar com cliques em links de navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                this.navigate(link.dataset.route);
            }
        });
    }

    // Navigate to a route
    navigate(route) {
        const path = this.routes[route];
        if (path) {
            window.location.href = path;
        } else {
            console.error('Rota não encontrada:', route);
        }
    }

    // Get current route
    getCurrentRoute() {
        const path = window.location.pathname;
        for (const [route, routePath] of Object.entries(this.routes)) {
            if (path.endsWith(routePath)) {
                return route;
            }
        }
        return null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    // Get user role
    getUserRole() {
        return localStorage.getItem('userRole');
    }

    // Protect routes that require authentication
    protectRoute() {
        const currentRoute = this.getCurrentRoute();
        const isAuthenticated = this.isAuthenticated();
        const userRole = this.getUserRole();

        // If trying to access dashboard without authentication
        if (currentRoute?.includes('dashboard') && !isAuthenticated) {
            this.navigate('login');
            return;
        }

        // If trying to access wrong dashboard type
        if (isAuthenticated && currentRoute?.includes('dashboard')) {
            const correctDashboard = `${userRole.toLowerCase()}-dashboard`;
            if (currentRoute !== correctDashboard) {
                this.navigate(correctDashboard);
            }
        }

        // Redirect authenticated users from login/signup to their dashboard
        if (isAuthenticated && (currentRoute === 'login' || currentRoute === 'signup')) {
            const dashboardRoute = `${userRole.toLowerCase()}-dashboard`;
            this.navigate(dashboardRoute);
        }

        // Landing page is accessible to everyone, no redirection needed
    }
}

// Create router instance and attach to window
window.router = new Router();

// Protect route on page load
document.addEventListener('DOMContentLoaded', () => {
    window.router.protectRoute();
}); 