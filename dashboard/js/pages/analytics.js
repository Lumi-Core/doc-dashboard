/**
 * Analytics Insights Page Module
 */
const Analytics = {
    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadData();
    },

    bindEvents() {
        on('refreshAnalytics', 'click', () => this.loadData());
    },

    async loadData() {
        try {
            const companyId = api.currentCompanyId !== 'default' ? api.currentCompanyId : null;
            const [analytics, connStats] = await Promise.allSettled([
                api.getAnalytics(companyId),
                api.getConnectionStats()
            ]);

            if (analytics.status === 'fulfilled') {
                this.renderStats(analytics.value);
                this.renderCategoryChart(analytics.value.by_category || []);
                this.renderTypeBreakdown(analytics.value.by_type || []);
                this.renderUploadTrend(analytics.value.upload_trend || []);
            }
            if (connStats.status === 'fulfilled') {
                this.renderConnectionStats(connStats.value);
            }
        } catch (err) {
            console.error('Analytics load error:', err);
            showToast('Failed to load analytics', 'error');
        }
    },

    renderStats(data) {
        const el = (id, val) => { const e = $(id); if (e) e.textContent = formatNumber(val); };
        el('analytics-total', data.total_documents || 0);
        el('analytics-indexed', data.indexed_documents || 0);
        el('analytics-review', data.needs_review || 0);
        el('analytics-expired', data.expired_documents || 0);
        el('analytics-expiring30', data.expiring_30_days || 0);
    },

    renderUploadTrend(trend) {
        const container = $('uploadTrendChart');
        if (!container) return;
        if (!trend || !trend.length) {
            container.innerHTML = '<p class="empty-state">No upload data for the last 30 days</p>';
            return;
        }

        const maxCount = Math.max(...trend.map(t => t.count), 1);
        const barWidth = Math.max(12, Math.floor((container.offsetWidth - 40) / trend.length) - 4);

        container.innerHTML = `
            <div class="trend-chart">
                <div class="trend-bars" style="display:flex;align-items:flex-end;gap:3px;height:160px;padding:0 10px;">
                    ${trend.map(t => {
                        const height = Math.max(4, (t.count / maxCount) * 140);
                        const date = new Date(t.date);
                        const label = date.getDate();
                        return `<div class="trend-bar-wrapper" style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;">
                            <span style="font-size:0.7rem;color:var(--gray-500);margin-bottom:4px;">${t.count}</span>
                            <div class="trend-bar" style="width:${barWidth}px;max-width:100%;height:${height}px;background:var(--primary);border-radius:4px 4px 0 0;transition:height 0.3s;" title="${t.date}: ${t.count} uploads"></div>
                            <span style="font-size:0.65rem;color:var(--gray-400);margin-top:4px;">${label}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderCategoryChart(categories) {
        const container = $('categoryChart');
        if (!container) return;
        if (!categories || !categories.length) {
            container.innerHTML = '<p class="empty-state">No category data available</p>';
            return;
        }

        const colors = ['#dc2626', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
        const total = categories.reduce((s, c) => s + c.count, 0);

        container.innerHTML = categories.slice(0, 8).map((cat, i) => {
            const pct = total > 0 ? ((cat.count / total) * 100).toFixed(1) : 0;
            return `
                <div style="margin-bottom: 14px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-weight:500;color:var(--gray-700);font-size:0.9rem;">${escapeHtml(snakeToTitle(cat.name))}</span>
                        <span style="font-weight:600;color:var(--gray-800);font-size:0.85rem;">${cat.count} (${pct}%)</span>
                    </div>
                    <div style="width:100%;height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:${colors[i % colors.length]};border-radius:4px;transition:width 0.5s;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTypeBreakdown(types) {
        const container = $('typeBreakdown');
        if (!container) return;
        if (!types || !types.length) {
            container.innerHTML = '<p class="empty-state">No document type data available</p>';
            return;
        }

        const colors = ['#dc2626', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
        container.innerHTML = `
            <div class="tags-list" style="gap: 10px;">
                ${types.slice(0, 15).map((t, i) => `
                    <span class="tag" style="background:${colors[i % colors.length]}22;color:${colors[i % colors.length]};border:1px solid ${colors[i % colors.length]}44;padding:8px 16px;">
                        ${escapeHtml(snakeToTitle(t.name))} <strong>(${t.count})</strong>
                    </span>
                `).join('')}
            </div>
        `;
    },

    renderConnectionStats(stats) {
        const container = $('connectionStats');
        if (!container) return;
        if (!stats) {
            container.innerHTML = '<p class="empty-state">Unable to load connection stats</p>';
            return;
        }
        container.innerHTML = `
            <div class="settings-info-grid">
                <div class="info-row"><span class="info-label">Total Connects</span><span>${stats.total_connects || 0}</span></div>
                <div class="info-row"><span class="info-label">Failed Connects</span><span style="color:${stats.failed_connects > 0 ? 'var(--danger)' : 'inherit'}">${stats.failed_connects || 0}</span></div>
                <div class="info-row"><span class="info-label">Pool Size</span><span>${stats.pool_size || 0}</span></div>
                <div class="info-row"><span class="info-label">Pool Free</span><span>${stats.pool_free || 0}</span></div>
                <div class="info-row"><span class="info-label">Last Health Check</span><span>${stats.last_health_check ? formatDateTime(stats.last_health_check) : 'N/A'}</span></div>
            </div>
        `;
    }
};
