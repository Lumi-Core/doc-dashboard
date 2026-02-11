/**
 * Alerts Page Module
 */
const Alerts = {
    alertsData: [],

    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadData();
    },

    bindEvents() {
        on('processAlertsBtn', 'click', () => this.processAlerts());
        on('sendTestEmailBtn', 'click', () => this.testEmail());
        on('refreshAlerts', 'click', () => this.loadData());
    },

    async loadData() {
        try {
            const [alerts, emailStatus] = await Promise.allSettled([
                api.getAlerts(),
                api.getEmailStatus()
            ]);

            if (alerts.status === 'fulfilled') {
                this.alertsData = Array.isArray(alerts.value) ? alerts.value : (alerts.value.alerts || alerts.value.data || []);
                this.renderAlerts();
            }

            if (emailStatus.status === 'fulfilled') {
                this.renderEmailStatus(emailStatus.value);
            }
        } catch (err) {
            console.error('Alerts load error:', err);
            showToast('Failed to load alerts', 'error');
        }
    },

    renderAlerts() {
        const tbody = $('alertsTableBody');
        const count = $('alertsCount');
        if (count) count.textContent = this.alertsData.length;
        if (!tbody) return;

        if (!this.alertsData.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No alerts at this time</td></tr>';
            return;
        }

        tbody.innerHTML = this.alertsData.map(alert => `
            <tr>
                <td>${escapeHtml(truncate(alert.filename || alert.document || 'Untitled', 40))}</td>
                <td>${escapeHtml(snakeToTitle(alert.category || alert.type || 'N/A'))}</td>
                <td>${formatDateReadable(alert.expiry_date || alert.date)}</td>
                <td>${alert.days_until !== undefined ? alert.days_until + ' days' : (alert.expiry_date ? daysUntil(alert.expiry_date) + ' days' : 'N/A')}</td>
                <td><span class="status-badge ${getExpiryStatusClass(alert.days_until ?? daysUntil(alert.expiry_date))}">${alert.severity || getExpiryStatusLabel(alert.days_until ?? daysUntil(alert.expiry_date))}</span></td>
            </tr>
        `).join('');
    },

    renderEmailStatus(status) {
        const container = $('emailStatusDisplay');
        if (!container) return;

        if (!status) {
            container.innerHTML = '<span class="status-badge expired">Not Configured</span>';
            return;
        }

        const isAuth = status.authenticated || status.configured || false;
        container.innerHTML = `
            <div class="email-status-card">
                <div class="email-status-row">
                    <span>Status:</span>
                    <span class="status-badge ${isAuth ? 'active' : 'expired'}">${isAuth ? 'Authenticated' : 'Not Authenticated'}</span>
                </div>
                ${status.email ? `<div class="email-status-row"><span>Email:</span><span>${escapeHtml(status.email)}</span></div>` : ''}
                ${status.last_sent ? `<div class="email-status-row"><span>Last Sent:</span><span>${formatDateTime(status.last_sent)}</span></div>` : ''}
            </div>
        `;
    },

    async processAlerts() {
        showLoading('Processing alerts and sending notifications...');
        try {
            const result = await api.processAlerts();
            hideLoading();
            showToast(result.message || 'Alerts processed successfully', 'success');
            this.loadData();
        } catch (err) {
            hideLoading();
            showToast('Failed to process alerts: ' + (err.message || ''), 'error');
        }
    },

    async testEmail() {
        showLoading('Sending test email...');
        try {
            const result = await api.testEmail();
            hideLoading();
            showToast(result.message || 'Test email sent!', 'success');
        } catch (err) {
            hideLoading();
            showToast('Test email failed: ' + (err.message || ''), 'error');
        }
    }
};
