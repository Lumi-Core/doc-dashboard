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

// =========================================================================
// DOCUMENT PREVIEW
// =========================================================================
/**
 * Show document preview modal with metadata and content
 * @param {Object} doc - Document object
 * @param {Object} options - Options: showContent, showScore, contentLabel
 */
function showDocumentPreview(doc, options = {}) {
    const { showContent = true, showScore = false, contentLabel = 'Content Preview' } = options;
    const modal = $('docPreviewModal');
    const body = $('docPreviewBody');
    const title = $('docPreviewTitle');
    const downloadBtn = $('docPreviewDownloadBtn');
    const openBtn = $('docPreviewOpenBtn');
    
    if (!modal || !body) return;
    
    // Extract document info
    const docId = doc.id || doc.document_id || doc.metadata?.document_id || '';
    const filename = doc.filename || doc.file_name || doc.title || doc.metadata?.file_name || 'Untitled';
    const category = doc.category || doc.document_type || doc.metadata?.category || '';
    const docType = doc.document_type || doc.metadata?.document_type || '';
    const project = doc.project || doc.metadata?.project || '';
    const industry = doc.industry || doc.metadata?.industry_type || '';
    const folderPath = doc.folder_path || doc.suggested_folder_path || doc.metadata?.suggested_folder_path || '';
    const uploadDate = doc.upload_date || doc.created_at || doc.metadata?.upload_date || '';
    const expiryDate = doc.expiry_date || doc.metadata?.expiry_date || '';
    const summary = doc.summary || doc.metadata?.summary || '';
    const score = doc.score;
    const content = doc.text || doc.text_snippet || doc.snippet || doc.content || '';
    const s3Url = doc.s3_url || doc.storage_url || doc.metadata?.s3_url || '';
    
    // Set title
    if (title) title.innerHTML = `<i class="fas fa-file-alt"></i> ${escapeHtml(filename)}`;
    
    // Build metadata HTML
    let metaHtml = '<div class="preview-metadata">';
    metaHtml += '<h4><i class="fas fa-info-circle"></i> Document Metadata</h4>';
    metaHtml += '<div class="preview-meta-grid">';
    
    if (docId) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Document ID</span><span class="meta-value mono">${escapeHtml(truncate(docId, 36))}</span></div>`;
    if (filename) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Filename</span><span class="meta-value">${escapeHtml(filename)}</span></div>`;
    if (category) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Category</span><span class="meta-value"><span class="status-badge">${escapeHtml(snakeToTitle(category))}</span></span></div>`;
    if (docType && docType !== category) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Document Type</span><span class="meta-value">${escapeHtml(snakeToTitle(docType))}</span></div>`;
    if (project) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Project</span><span class="meta-value"><i class="fas fa-project-diagram"></i> ${escapeHtml(project)}</span></div>`;
    if (industry) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Industry</span><span class="meta-value"><i class="fas fa-industry"></i> ${escapeHtml(snakeToTitle(industry))}</span></div>`;
    if (folderPath) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Folder Path</span><span class="meta-value"><i class="fas fa-folder"></i> ${escapeHtml(folderPath)}</span></div>`;
    if (uploadDate) metaHtml += `<div class="preview-meta-item"><span class="meta-label">Upload Date</span><span class="meta-value"><i class="fas fa-calendar"></i> ${formatDateReadable(uploadDate)}</span></div>`;
    if (expiryDate) {
        const days = daysUntil(expiryDate);
        metaHtml += `<div class="preview-meta-item"><span class="meta-label">Expiry Date</span><span class="meta-value"><span class="status-badge ${getExpiryStatusClass(days)}">${formatDateReadable(expiryDate)}</span></span></div>`;
    }
    if (showScore && score !== undefined && score !== null) {
        metaHtml += `<div class="preview-meta-item"><span class="meta-label">Match Score</span><span class="meta-value"><span class="score-badge">${(score * 100).toFixed(1)}%</span></span></div>`;
    }
    
    metaHtml += '</div></div>';
    
    // Build summary section
    let summaryHtml = '';
    if (summary) {
        summaryHtml = `
            <div class="preview-section">
                <h4><i class="fas fa-robot"></i> AI Summary</h4>
                <div class="preview-summary">${escapeHtml(summary)}</div>
            </div>
        `;
    }
    
    // Build content section
    let contentHtml = '';
    if (showContent && content) {
        contentHtml = `
            <div class="preview-section">
                <h4><i class="fas fa-align-left"></i> ${escapeHtml(contentLabel)}</h4>
                <div class="preview-content">${escapeHtml(content)}</div>
            </div>
        `;
    }
    
    // Build raw metadata (collapsible)
    let rawMetaHtml = '';
    if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        rawMetaHtml = `
            <div class="preview-section">
                <details class="raw-metadata">
                    <summary><i class="fas fa-code"></i> Raw Chunk Metadata</summary>
                    <pre>${escapeHtml(JSON.stringify(doc.metadata, null, 2))}</pre>
                </details>
            </div>
        `;
    }
    
    body.innerHTML = metaHtml + summaryHtml + contentHtml + rawMetaHtml;
    
    // Set up download button
    if (downloadBtn) {
        if (docId) {
            downloadBtn.style.display = '';
            downloadBtn.onclick = () => {
                const url = api.getDocumentDownloadUrl(docId);
                window.open(url, '_blank');
            };
        } else {
            downloadBtn.style.display = 'none';
        }
    }
    
    // Set up open button
    if (openBtn) {
        if (s3Url) {
            openBtn.style.display = '';
            openBtn.href = s3Url;
        } else {
            openBtn.style.display = 'none';
        }
    }
    
    openModal('docPreviewModal');
}

/**
 * Get file icon class based on filename extension
 */
function getFileIconClass(filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const icons = { 
        pdf: 'fa-file-pdf', 
        doc: 'fa-file-word', 
        docx: 'fa-file-word', 
        xls: 'fa-file-excel', 
        xlsx: 'fa-file-excel', 
        png: 'fa-file-image', 
        jpg: 'fa-file-image', 
        jpeg: 'fa-file-image',
        txt: 'fa-file-lines', 
        csv: 'fa-file-csv',
        json: 'fa-file-code',
        html: 'fa-file-code',
        xml: 'fa-file-code'
    };
    return icons[ext] || 'fa-file';
}
