/**
 * Dashboard Page Module
 */
const Dashboard = {
    init() {},

    onPageActive() {
        this.loadData();
    },

    async loadData() {
        try {
            const [health, stats, expiry, categories] = await Promise.allSettled([
                api.getHealthReady(),
                api.getDbStats(),
                api.getExpiryTable(),
                api.getCategories()
            ]);

            this.renderStats(stats.value, expiry.value, categories.value);
            this.renderHealth(health.value);
            this.renderExpiringDocs(expiry.value);
            this.renderCategoryBreakdown(categories.value);
        } catch (err) {
            console.error('Dashboard load error:', err);
            showToast('Failed to load dashboard data', 'error');
        }
    },

    renderStats(stats, expiry, categories) {
        const totalDocs = stats?.total_documents ?? 0;
        const totalCategories = categories?.length ?? 0;
        const expiringDocs = expiry?.filter(d => {
            const days = daysUntil(d.expiry_date);
            return days !== null && days >= 0 && days <= 30;
        })?.length ?? 0;
        const totalProjects = stats?.total_projects ?? 0;

        const el = (id, val) => { const e = $(id); if (e) e.textContent = formatNumber(val); };
        el('stat-total-docs', totalDocs);
        el('stat-categories', totalCategories);
        el('stat-expiring', expiringDocs);
        el('stat-projects', totalProjects);
    },

    renderHealth(health) {
        const grid = $('healthGrid');
        if (!grid) return;
        if (!health) {
            grid.innerHTML = '<p class="empty-state">Unable to load health data</p>';
            return;
        }
        const services = [
            { name: 'API Server', status: health.status || 'unknown', icon: 'fa-server' },
            { name: 'Database', status: health.database || 'unknown', icon: 'fa-database' },
            { name: 'Storage (S3)', status: health.storage || 'unknown', icon: 'fa-cloud' },
            { name: 'ChromaDB', status: health.chromadb || health.chroma || 'unknown', icon: 'fa-brain' }
        ];
        grid.innerHTML = services.map(svc => `
            <div class="health-card ${svc.status === 'healthy' || svc.status === 'connected' ? 'healthy' : 'unhealthy'}">
                <i class="fas ${svc.icon}"></i>
                <span class="health-name">${svc.name}</span>
                <span class="status-badge ${getStatusClass(svc.status)}">${capitalize(svc.status)}</span>
            </div>
        `).join('');
    },

    renderExpiringDocs(expiry) {
        const container = $('expiringDocsPreview');
        if (!container) return;
        if (!expiry || expiry.length === 0) {
            container.innerHTML = '<p class="empty-state">No documents with expiry dates</p>';
            return;
        }
        const sorted = [...expiry].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)).slice(0, 5);
        container.innerHTML = `
            <table class="data-table">
                <thead><tr><th>Document</th><th>Expiry Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${sorted.map(doc => {
                        const days = daysUntil(doc.expiry_date);
                        return `<tr>
                            <td>${escapeHtml(truncate(doc.filename || doc.title || 'Untitled', 40))}</td>
                            <td>${formatDateReadable(doc.expiry_date)}</td>
                            <td><span class="status-badge ${getExpiryStatusClass(days)}">${getExpiryStatusLabel(days)}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    renderCategoryBreakdown(categories) {
        const container = $('categoryBreakdown');
        if (!container) return;
        if (!categories || categories.length === 0) {
            container.innerHTML = '<p class="empty-state">No categories found</p>';
            return;
        }
        const colors = ['#dc2626', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        container.innerHTML = categories.slice(0, 8).map((cat, i) => {
            const name = typeof cat === 'string' ? cat : (cat.category || cat.name || 'Unknown');
            const count = typeof cat === 'object' ? (cat.count || 0) : '';
            return `
                <div class="category-item">
                    <span class="category-dot" style="background: ${colors[i % colors.length]}"></span>
                    <span class="category-name">${escapeHtml(snakeToTitle(name))}</span>
                    ${count ? `<span class="category-count">${count}</span>` : ''}
                </div>
            `;
        }).join('');
    }
};
