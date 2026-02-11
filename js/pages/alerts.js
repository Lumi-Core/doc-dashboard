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
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No alerts at this time</td></tr>';
            return;
        }

        tbody.innerHTML = this.alertsData.map((alert, i) => {
            const docId = alert.document_id || alert.id || '';
            return `
            <tr>
                <td><i class="fas ${getFileIconClass(alert.filename || '')}" style="margin-right:6px;color:var(--gray-500);"></i>${escapeHtml(truncate(alert.filename || alert.document_id || alert.document || 'Untitled', 35))}</td>
                <td>${escapeHtml(snakeToTitle(alert.alert_type || alert.category || alert.type || 'N/A'))}</td>
                <td>${formatDateReadable(alert.expiry_date || alert.created_at || alert.date)}</td>
                <td>${alert.days_until !== undefined ? alert.days_until + ' days' : (alert.expiry_date ? daysUntil(alert.expiry_date) + ' days' : 'N/A')}</td>
                <td><span class="status-badge ${getExpiryStatusClass(alert.days_until ?? daysUntil(alert.expiry_date))}">${alert.severity || alert.status || getExpiryStatusLabel(alert.days_until ?? daysUntil(alert.expiry_date))}</span></td>
                <td>
                    <button class="btn-icon-sm" onclick="Alerts.previewAlert(${i})" title="Preview"><i class="fas fa-eye"></i></button>
                    ${docId ? `<button class="btn-icon-sm" onclick="Alerts.downloadAlert('${docId}')" title="Download"><i class="fas fa-download"></i></button>` : ''}
                </td>
            </tr>
        `;
        }).join('');
    },

    previewAlert(index) {
        const alert = this.alertsData[index];
        if (alert) {
            // Convert alert to doc-like object for preview
            const doc = {
                id: alert.document_id || alert.id,
                filename: alert.filename || alert.document,
                category: alert.category || alert.alert_type,
                expiry_date: alert.expiry_date,
                ...alert
            };
            showDocumentPreview(doc, { showContent: false });
        }
    },

    downloadAlert(docId) {
        if (docId) {
            const url = api.getDocumentDownloadUrl(docId);
            window.open(url, '_blank');
        }
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
            const result = await api.sendTestEmail();
            hideLoading();
            showToast(result.message || 'Test email sent!', 'success');
        } catch (err) {
            hideLoading();
            showToast('Test email failed: ' + (err.message || ''), 'error');
        }
    }
};
