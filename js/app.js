/**
 * App Module — Main application controller
 * Same pattern as Social Media Agent dashboard
 */

const App = {
    currentPage: 'dashboard',
    healthInterval: null,
    pages: {},

    init() {
        this.pages = {
            dashboard: typeof Dashboard !== 'undefined' ? Dashboard : null,
            upload: typeof Upload !== 'undefined' ? Upload : null,
            documents: typeof Documents !== 'undefined' ? Documents : null,
            search: typeof Search !== 'undefined' ? Search : null,
            projects: typeof Projects !== 'undefined' ? Projects : null,
            expiry: typeof Expiry !== 'undefined' ? Expiry : null,
            alerts: typeof Alerts !== 'undefined' ? Alerts : null,
            analytics: typeof Analytics !== 'undefined' ? Analytics : null,
            settings: typeof Settings !== 'undefined' ? Settings : null
        };

        // Init all page modules
        Object.values(this.pages).forEach(page => {
            if (page && typeof page.init === 'function') page.init();
        });

        this.bindEvents();
        this.handleHashChange();
        this.startHealthMonitor();
        this.loadCompanySelector();
    },

    bindEvents() {
        // Sidebar navigation
        $$$('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = item.dataset.page;
                if (page) {
                    this.navigateTo(page);
                    // Close mobile sidebar after navigation
                    if (window.innerWidth <= 768) {
                        this.closeMobileSidebar();
                    }
                }
            });
        });

        // Header refresh button
        on('refreshBtn', 'click', () => this.refreshCurrentPage());

        // Header search
        const headerSearch = $('globalSearch');
        if (headerSearch) {
            headerSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = headerSearch.value.trim();
                    if (query) {
                        this.navigateTo('search');
                        if (this.pages.search && typeof this.pages.search.doSearch === 'function') {
                            setTimeout(() => this.pages.search.doSearch(query), 200);
                        }
                    }
                }
            });
        }

        // Hash change
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Close modals on backdrop click
        $$$('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal.id);
            });
        });

        // Close modals on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllModals();
        });

        // Confirm modal close buttons
        on('closeConfirmModal', 'click', () => closeModal('confirmModal'));
        on('cancelConfirm', 'click', () => closeModal('confirmModal'));

        // Doc detail modal close
        on('closeDocDetailModal', 'click', () => closeModal('docDetailModal'));

        // Dashboard quick actions
        on('sendExpiryAlertsBtn', 'click', async () => {
            showLoading('Sending expiry alerts...');
            try {
                const result = await api.processAlerts();
                hideLoading();
                showToast(result.message || 'Alerts processed', 'success');
            } catch (err) { hideLoading(); showToast('Failed: ' + (err.message || ''), 'error'); }
        });
        on('refreshHealthBtn', 'click', () => {
            if (this.pages.dashboard && typeof this.pages.dashboard.loadData === 'function') this.pages.dashboard.loadData();
        });

        // Mobile sidebar toggle
        const mobileToggle = $('mobileMenuBtn');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // Sidebar overlay closes sidebar
        on('sidebarOverlay', 'click', () => {
            this.closeMobileSidebar();
        });
    },

    navigateTo(page) {
        window.location.hash = page;
    },

    handleHashChange() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        this.activatePage(hash);
    },

    activatePage(page) {
        // Update sidebar active state
        $$$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Show/hide pages
        $$$('.page').forEach(p => {
            const isTarget = p.id === 'page-' + page;
            p.classList.toggle('active', isTarget);
            p.classList.toggle('hidden', !isTarget);
        });

        // Update header title
        const pageTitles = {
            dashboard: 'Dashboard',
            upload: 'Upload Documents',
            documents: 'Documents',
            search: 'Search & Ask AI',
            projects: 'Projects',
            expiry: 'Document Expiry',
            alerts: 'Alerts & Notifications',
            analytics: 'Analytics Insights',
            settings: 'Settings'
        };
        const headerTitle = $('pageTitle');
        if (headerTitle) headerTitle.textContent = pageTitles[page] || capitalize(page);
        const breadcrumb = $('breadcrumb');
        if (breadcrumb) breadcrumb.textContent = 'Home / ' + (pageTitles[page] || capitalize(page));

        this.currentPage = page;

        // Notify page module
        const pageModule = this.pages[page];
        if (pageModule && typeof pageModule.onPageActive === 'function') {
            pageModule.onPageActive();
        }

        // Close mobile sidebar after navigation
        const sidebar = $$('.sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
    },

    refreshCurrentPage() {
        const pageModule = this.pages[this.currentPage];
        if (pageModule) {
            if (typeof pageModule.loadData === 'function') pageModule.loadData();
            else if (typeof pageModule.onPageActive === 'function') pageModule.onPageActive();
        }
        showToast('Page refreshed', 'info');
    },

    startHealthMonitor() {
        const check = async () => {
            const indicator = $('healthIndicator');
            const statusText = indicator?.querySelector('.status-text');
            const statusDot = indicator?.querySelector('.status-dot');
            
            try {
                const health = await api.getHealth();
                if (indicator && statusText) {
                    indicator.classList.remove('healthy', 'unhealthy', 'checking');
                    if (health && health.status === 'healthy') {
                        indicator.classList.add('healthy');
                        statusText.textContent = 'Connected';
                    } else {
                        indicator.classList.add('unhealthy');
                        statusText.textContent = 'Offline';
                    }
                }
            } catch (err) {
                console.error('Health check failed:', err);
                if (indicator && statusText) {
                    indicator.classList.remove('healthy', 'checking');
                    indicator.classList.add('unhealthy');
                    statusText.textContent = 'Disconnected';
                }
            }
        };
        check();
        this.healthInterval = setInterval(check, 30000);
    },

    toggleMobileSidebar() {
        const sidebar = $$('.sidebar');
        if (sidebar) {
            const isOpen = sidebar.classList.contains('mobile-open');
            sidebar.classList.toggle('mobile-open');
            isOpen ? hide('sidebarOverlay') : show('sidebarOverlay');
        }
    },

    closeMobileSidebar() {
        const sidebar = $$('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            hide('sidebarOverlay');
        }
    },

    async loadCompanySelector() {
        const select = $('companySelect');
        if (!select) return;
        try {
            const result = await api.getCompanies();
            const companies = result.companies || [];
            select.innerHTML = companies.map(c =>
                `<option value="${escapeHtml(c.id)}" ${c.id === api.currentCompanyId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');
            // Bind change event
            select.addEventListener('change', (e) => {
                api.setCompany(e.target.value);
                showToast('Company switched to ' + select.options[select.selectedIndex].text, 'info');
                this.refreshCurrentPage();
            });
        } catch (err) {
            // Fallback if API not available
            select.innerHTML = '<option value="default">Default Company</option>';
        }
    }
};

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
