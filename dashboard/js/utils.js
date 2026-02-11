/**
 * Utility Functions Module
 * Same pattern as Social Media Agent dashboard
 */

// =========================================================================
// DATE UTILITIES
// =========================================================================
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatDateReadable(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(datetime) {
    if (!datetime) return 'N/A';
    const d = new Date(datetime);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getToday() { return formatDate(new Date()); }

function timeAgo(datetime) {
    if (!datetime) return 'N/A';
    const seconds = Math.floor((new Date() - new Date(datetime)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDateReadable(datetime);
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const now = new Date(); now.setHours(0,0,0,0);
    const target = new Date(dateStr); target.setHours(0,0,0,0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// =========================================================================
// NUMBER UTILITIES
// =========================================================================
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatNumberShort(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// =========================================================================
// STRING UTILITIES
// =========================================================================
function truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function snakeToTitle(text) {
    if (!text) return '';
    return text.split('_').map(word => capitalize(word)).join(' ');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =========================================================================
// STATUS UTILITIES
// =========================================================================
function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (['active', 'completed', 'success', 'healthy', 'processed'].includes(s)) return 'active';
    if (['pending', 'awaiting', 'review'].includes(s)) return 'pending';
    if (['processing', 'running', 'in-progress'].includes(s)) return 'processing';
    if (['expired', 'overdue', 'failed', 'error'].includes(s)) return 'expired';
    return '';
}

function getExpiryStatusClass(daysLeft) {
    if (daysLeft === null) return '';
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'expired';
    if (daysLeft <= 30) return 'pending';
    return 'active';
}

function getExpiryStatusLabel(daysLeft) {
    if (daysLeft === null) return 'No Expiry';
    if (daysLeft < 0) return 'OVERDUE';
    if (daysLeft === 0) return 'TODAY';
    if (daysLeft <= 7) return 'URGENT';
    if (daysLeft <= 30) return 'WARNING';
    return 'OK';
}

// =========================================================================
// DOM UTILITIES
// =========================================================================
function $(id) { return document.getElementById(id); }
function $$(selector) { return document.querySelector(selector); }
function $$$(selector) { return document.querySelectorAll(selector); }

function on(element, event, handler) {
    if (typeof element === 'string') element = $(element);
    if (element) element.addEventListener(event, handler);
}

function show(element) {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.remove('hidden');
}

function hide(element) {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.add('hidden');
}

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================
function showToast(message, type = 'info', title = null, duration = 5000) {
    const container = $('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type]}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =========================================================================
// MODAL UTILITIES
// =========================================================================
function openModal(modalId) {
    const modal = $(modalId);
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(modalId) {
    const modal = $(modalId);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function closeAllModals() {
    $$$('.modal.active').forEach(modal => modal.classList.remove('active'));
    document.body.style.overflow = '';
}

// =========================================================================
// LOADING UTILITIES
// =========================================================================
function showLoading(message = 'Loading...') {
    const overlay = $('loadingOverlay');
    if (overlay) { overlay.querySelector('p').textContent = message; overlay.classList.remove('hidden'); }
}

function hideLoading() {
    const overlay = $('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// =========================================================================
// FORM UTILITIES
// =========================================================================
function getFormData(formId) {
    const form = $(formId);
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (value !== '') data[key] = value;
    }
    return data;
}

function resetForm(formId) {
    const form = $(formId);
    if (form) form.reset();
}

// =========================================================================
// VALIDATION
// =========================================================================
function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
}

// =========================================================================
// EXPORT
// =========================================================================
function exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) { showToast('No data to export', 'warning'); return; }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header] ?? '';
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"')))
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                return cell;
            }).join(',')
        )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`Exported ${data.length} rows to ${filename}`, 'success');
}

// =========================================================================
// DEBOUNCE
// =========================================================================
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
