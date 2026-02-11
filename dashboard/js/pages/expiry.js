/**
 * Expiry Page Module
 */
const Expiry = {
    expiryData: [],

    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadData();
    },

    bindEvents() {
        on('exportExpiry', 'click', () => this.exportExpiry());
        on('refreshExpiry', 'click', () => this.loadData());
        on('sendAlertsBtn', 'click', () => this.sendAlerts());
    },

    async loadData() {
        try {
            const result = await api.getExpiryTable();
            this.expiryData = Array.isArray(result) ? result : (result.documents || result.data || []);
            this.renderStats();
            this.renderTable();
        } catch (err) {
            console.error('Expiry load error:', err);
            showToast('Failed to load expiry data', 'error');
        }
    },

    renderStats() {
        const overdue = this.expiryData.filter(d => daysUntil(d.expiry_date) < 0).length;
        const within7 = this.expiryData.filter(d => { const days = daysUntil(d.expiry_date); return days >= 0 && days <= 7; }).length;
        const within30 = this.expiryData.filter(d => { const days = daysUntil(d.expiry_date); return days >= 0 && days <= 30; }).length;
        const total = this.expiryData.length;

        const el = (id, val) => { const e = $(id); if (e) e.textContent = formatNumber(val); };
        el('expiry-overdue', overdue);
        el('expiry-7days', within7);
        el('expiry-30days', within30);
        el('expiry-total', total);
    },

    renderTable() {
        const tbody = $('expiryTableBody');
        if (!tbody) return;

        if (!this.expiryData.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No documents with expiry dates found</td></tr>';
            return;
        }

        const sorted = [...this.expiryData].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        tbody.innerHTML = sorted.map(doc => {
            const days = daysUntil(doc.expiry_date);
            return `<tr>
                <td>${escapeHtml(truncate(doc.filename || doc.title || 'Untitled', 40))}</td>
                <td>${escapeHtml(snakeToTitle(doc.category || 'N/A'))}</td>
                <td>${escapeHtml(doc.project || 'N/A')}</td>
                <td>${formatDateReadable(doc.expiry_date)}</td>
                <td>${days !== null ? (days < 0 ? `${Math.abs(days)} days ago` : `${days} days`) : 'N/A'}</td>
                <td><span class="status-badge ${getExpiryStatusClass(days)}">${getExpiryStatusLabel(days)}</span></td>
            </tr>`;
        }).join('');
    },

    exportExpiry() {
        if (!this.expiryData.length) { showToast('No data to export', 'warning'); return; }
        const data = this.expiryData.map(d => ({
            Filename: d.filename || '',
            Category: d.category || '',
            Project: d.project || '',
            'Expiry Date': d.expiry_date || '',
            'Days Until': daysUntil(d.expiry_date) ?? '',
            Status: getExpiryStatusLabel(daysUntil(d.expiry_date))
        }));
        exportToCSV(data, 'expiry_report.csv');
    },

    async sendAlerts() {
        showLoading('Sending expiry alerts...');
        try {
            const result = await api.processAlerts();
            hideLoading();
            showToast(result.message || 'Alerts sent successfully', 'success');
        } catch (err) {
            hideLoading();
            showToast('Failed to send alerts: ' + (err.message || ''), 'error');
        }
    }
};
