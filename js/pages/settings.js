/**
 * Settings Page Module
 */
const Settings = {
    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadSettings();
    },

    bindEvents() {
        on('saveApiSettings', 'click', () => this.saveApiUrl());
        on('refreshSystemInfo', 'click', () => this.loadSystemInfo());
        on('refreshDBStats', 'click', () => this.loadDbStats());
        on('addCompanyBtn', 'click', () => this.addCompany());
        on('clearCompanyDataBtn', 'click', () => this.clearCompanyData());
        on('clearAllDBBtn', 'click', () => this.clearAllDB());
    },

    loadSettings() {
        // Load API URL
        const urlInput = $('apiBaseUrl');
        if (urlInput) urlInput.value = api.baseUrl;

        // Load system info
        this.loadSystemInfo();
        this.loadDbStats();
        this.loadIndustries();
        this.loadCompanies();
    },

    saveApiUrl() {
        const urlInput = $('apiBaseUrl');
        if (!urlInput) return;
        const url = urlInput.value.trim();
        if (!url) { showToast('Please enter a URL', 'warning'); return; }
        if (!isValidUrl(url)) { showToast('Please enter a valid URL', 'warning'); return; }

        api.baseUrl = url;
        localStorage.setItem('apiBaseUrl', url);
        showToast('API URL saved. Refreshing...', 'success');
        setTimeout(() => window.location.reload(), 1000);
    },

    async loadSystemInfo() {
        const container = $('systemInfo');
        if (!container) return;

        try {
            const health = await api.getHealthReady();
            container.innerHTML = `
                <div class="settings-info-grid">
                    <div class="info-row"><span class="info-label">API Status</span><span class="status-badge ${health.status === 'healthy' ? 'active' : 'expired'}">${capitalize(health.status || 'Unknown')}</span></div>
                    <div class="info-row"><span class="info-label">Database</span><span class="status-badge ${health.database === 'healthy' || health.database === 'connected' ? 'active' : 'expired'}">${capitalize(health.database || 'Unknown')}</span></div>
                    <div class="info-row"><span class="info-label">Storage</span><span class="status-badge ${health.storage === 'healthy' || health.storage === 'connected' ? 'active' : 'expired'}">${capitalize(health.storage || 'Unknown')}</span></div>
                    <div class="info-row"><span class="info-label">ChromaDB</span><span class="status-badge ${(health.chromadb || health.chroma) === 'healthy' ? 'active' : 'expired'}">${capitalize(health.chromadb || health.chroma || 'Unknown')}</span></div>
                    ${health.version ? `<div class="info-row"><span class="info-label">Version</span><span>${escapeHtml(health.version)}</span></div>` : ''}
                    ${health.uptime ? `<div class="info-row"><span class="info-label">Uptime</span><span>${health.uptime}</span></div>` : ''}
                </div>
            `;
        } catch {
            container.innerHTML = '<p class="empty-state">Unable to connect to server</p>';
        }
    },

    async loadDbStats() {
        const container = $('dbStatsDisplay');
        if (!container) return;

        try {
            const stats = await api.getDbStats();
            container.innerHTML = `
                <div class="settings-info-grid">
                    <div class="info-row"><span class="info-label">Total Documents</span><span>${formatNumber(stats.total_documents || 0)}</span></div>
                    <div class="info-row"><span class="info-label">Total Projects</span><span>${formatNumber(stats.total_projects || 0)}</span></div>
                    <div class="info-row"><span class="info-label">Total Categories</span><span>${formatNumber(stats.total_categories || 0)}</span></div>
                    ${stats.storage_used ? `<div class="info-row"><span class="info-label">Storage Used</span><span>${stats.storage_used}</span></div>` : ''}
                    ${stats.db_size ? `<div class="info-row"><span class="info-label">DB Size</span><span>${stats.db_size}</span></div>` : ''}
                </div>
            `;
        } catch {
            container.innerHTML = '<p class="empty-state">Unable to load database stats</p>';
        }
    },

    async loadIndustries() {
        const container = $('industriesDisplay');
        if (!container) return;

        try {
            const result = await api.getIndustries();
            const industries = Array.isArray(result) ? result : (result.industries || []);
            if (!industries.length) {
                container.innerHTML = '<p class="empty-state">No industries configured</p>';
                return;
            }
            container.innerHTML = `
                <div class="tags-list">
                    ${industries.map(ind => {
                        const name = typeof ind === 'string' ? ind : (ind.name || '');
                        return `<span class="tag">${escapeHtml(snakeToTitle(name))}</span>`;
                    }).join('')}
                </div>
            `;
        } catch {
            container.innerHTML = '<p class="empty-state">Unable to load industries</p>';
        }
    },

    async loadCompanies() {
        const container = $('companiesList');
        if (!container) return;

        try {
            const result = await api.getCompanies();
            const companies = result.companies || [];
            if (!companies.length) {
                container.innerHTML = '<p class="empty-state">No companies found</p>';
                return;
            }
            container.innerHTML = `
                <div class="company-list">
                    ${companies.map(c => `
                        <div class="company-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:var(--border-radius-sm);margin-bottom:8px;">
                            <div>
                                <strong>${escapeHtml(c.name)}</strong>
                                ${c.description ? `<br><small style="color:var(--gray-500);">${escapeHtml(c.description)}</small>` : ''}
                                ${c.id === 'default' ? '<br><span class="status-badge active" style="font-size:0.7rem;">Default</span>' : ''}
                            </div>
                            <div style="display:flex;gap:6px;">
                                ${c.id !== 'default' ? `
                                    <button class="btn btn-sm btn-danger" onclick="Settings.deleteCompany('${c.id}')" title="Delete Company">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch {
            container.innerHTML = '<p class="empty-state">Unable to load companies</p>';
        }
    },

    async addCompany() {
        const nameInput = $('newCompanyName');
        const descInput = $('newCompanyDesc');
        if (!nameInput) return;

        const name = nameInput.value.trim();
        if (!name) {
            showToast('Please enter a company name', 'warning');
            return;
        }

        try {
            showLoading('Creating company...');
            await api.createCompany({
                name: name,
                description: descInput ? descInput.value.trim() : ''
            });
            hideLoading();
            showToast('Company created successfully', 'success');
            nameInput.value = '';
            if (descInput) descInput.value = '';
            this.loadCompanies();
            // Refresh company selector in header
            if (typeof App !== 'undefined') App.loadCompanySelector();
        } catch (err) {
            hideLoading();
            showToast('Failed to create company: ' + (err.message || ''), 'error');
        }
    },

    async deleteCompany(companyId) {
        if (!confirm('Are you sure you want to delete this company? All its data will be permanently removed.')) return;
        try {
            showLoading('Deleting company...');
            await api.deleteCompany(companyId);
            hideLoading();
            showToast('Company deleted', 'success');
            this.loadCompanies();
            if (typeof App !== 'undefined') App.loadCompanySelector();
        } catch (err) {
            hideLoading();
            showToast('Failed to delete company: ' + (err.message || ''), 'error');
        }
    },

    async clearCompanyData() {
        const companyId = api.currentCompanyId;
        if (!confirm(`Clear ALL documents and projects for the current company? This cannot be undone.`)) return;
        try {
            showLoading('Clearing company data...');
            const result = await api.clearCompanyData(companyId);
            hideLoading();
            showToast(`Cleared: ${result.documents_deleted || 0} documents, ${result.projects_deleted || 0} projects`, 'success');
            this.loadDbStats();
        } catch (err) {
            hideLoading();
            showToast('Failed to clear data: ' + (err.message || ''), 'error');
        }
    },

    async clearAllDB() {
        if (!confirm('WARNING: This will delete ALL data from the entire database. This cannot be undone. Are you absolutely sure?')) return;
        try {
            showLoading('Clearing all database data...');
            const result = await api.clearAllDB();
            hideLoading();
            const d = result.deleted || {};
            showToast(`Cleared: ${d.documents || 0} docs, ${d.projects || 0} projects, ${d.folders || 0} folders`, 'success');
            this.loadDbStats();
        } catch (err) {
            hideLoading();
            showToast('Failed to clear database: ' + (err.message || ''), 'error');
        }
    }
};
