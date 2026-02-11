/**
 * Documents Page Module
 */
const Documents = {
    allDocuments: [],
    filteredDocuments: [],
    currentPage: 1,
    pageSize: 20,
    currentFilter: 'all',

    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadData();
    },

    bindEvents() {
        // Filter tabs
        $$$('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                $$$('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter || 'all';
                this.currentPage = 1;
                this.applyFilter();
            });
        });

        // Search within documents — use global search on docs page
        // No dedicated docSearch in HTML

        // Export button
        on('exportDocuments', 'click', () => this.exportDocuments());

        // Refresh button
        on('refreshDocuments', 'click', () => this.loadData());
    },

    async loadData() {
        try {
            const result = await api.getDocuments();
            this.allDocuments = Array.isArray(result) ? result : (result.documents || []);
            this.applyFilter();
            this.updateDocCount();
        } catch (err) {
            console.error('Documents load error:', err);
            showToast('Failed to load documents', 'error');
        }
    },

    updateDocCount() {
        const count = $('documentsCount');
        if (count) count.textContent = this.allDocuments.length;
    },

    applyFilter() {
        let docs = [...this.allDocuments];
        const searchQuery = ''; // Could wire into global search later

        // Filter by category tab
        if (this.currentFilter !== 'all') {
            docs = docs.filter(d => (d.category || '').toLowerCase() === this.currentFilter.toLowerCase());
        }

        // Filter by search text
        if (searchQuery) {
            docs = docs.filter(d =>
                (d.filename || '').toLowerCase().includes(searchQuery) ||
                (d.category || '').toLowerCase().includes(searchQuery) ||
                (d.project || '').toLowerCase().includes(searchQuery) ||
                (d.industry || '').toLowerCase().includes(searchQuery)
            );
        }

        this.filteredDocuments = docs;
        this.renderTable();
        this.renderPagination();
    },

    renderTable() {
        const tbody = $('documentsTableBody');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.pageSize;
        const pageData = this.filteredDocuments.slice(start, start + this.pageSize);

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No documents found</td></tr>';
            return;
        }

        tbody.innerHTML = pageData.map(doc => {
            const expiryDate = doc.expiry_date || doc.metadata?.expiry_date || null;
            const days = expiryDate ? daysUntil(expiryDate) : null;
            return `<tr>
                <td>
                    <div class="doc-name">
                        <i class="fas ${this.getFileIcon(doc.filename || '')}"></i>
                        ${escapeHtml(truncate(doc.filename || doc.title || 'Untitled', 35))}
                    </div>
                </td>
                <td><span class="status-badge">${escapeHtml(snakeToTitle(doc.category || 'N/A'))}</span></td>
                <td>${escapeHtml(doc.project || doc.metadata?.project || 'N/A')}</td>
                <td>${escapeHtml(snakeToTitle(doc.industry || doc.metadata?.industry_type || 'N/A'))}</td>
                <td>${formatDateReadable(doc.upload_date || doc.created_at || doc.metadata?.upload_date)}</td>
                <td>${(doc.expiry_date || doc.metadata?.expiry_date) ? `<span class="status-badge ${getExpiryStatusClass(days)}">${formatDateReadable(doc.expiry_date || doc.metadata?.expiry_date)}</span>` : 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn-icon" title="View Details" onclick="Documents.viewDocument('${doc.id || doc.document_id || ''}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Download" onclick="Documents.downloadDocument('${doc.id || doc.document_id || ''}', '${escapeHtml(doc.filename || '')}')"><i class="fas fa-download"></i></button>
                    <button class="btn-icon danger" title="Delete" onclick="Documents.confirmDelete('${doc.id || doc.document_id || ''}', '${escapeHtml(doc.filename || '')}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    renderPagination() {
        const container = $('docsPagination');
        if (!container) return;
        const totalPages = Math.ceil(this.filteredDocuments.length / this.pageSize);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        let html = '';
        html += `<button class="btn btn-sm" ${this.currentPage === 1 ? 'disabled' : ''} onclick="Documents.goToPage(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                html += `<button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : ''}" onclick="Documents.goToPage(${i})">${i}</button>`;
            } else if (Math.abs(i - this.currentPage) === 3) {
                html += '<span>...</span>';
            }
        }
        html += `<button class="btn btn-sm" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="Documents.goToPage(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    },

    getFileIcon(filename) {
        const ext = (filename || '').split('.').pop().toLowerCase();
        const icons = { pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word', xls: 'fa-file-excel', xlsx: 'fa-file-excel', png: 'fa-file-image', jpg: 'fa-file-image', txt: 'fa-file-lines', csv: 'fa-file-csv' };
        return icons[ext] || 'fa-file';
    },

    async viewDocument(docId) {
        if (!docId) return;
        try {
            const doc = this.allDocuments.find(d => (d.id || d.document_id) === docId) || await api.getDocument(docId);
            const body = $('docDetailBody');
            if (body) {
                body.innerHTML = `
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">Filename</span><span class="detail-value">${escapeHtml(doc.filename || '')}</span></div>
                        <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">${escapeHtml(snakeToTitle(doc.category || 'N/A'))}</span></div>
                        <div class="detail-item"><span class="detail-label">Industry</span><span class="detail-value">${escapeHtml(snakeToTitle(doc.industry || doc.metadata?.industry_type || 'N/A'))}</span></div>
                        <div class="detail-item"><span class="detail-label">Project</span><span class="detail-value">${escapeHtml(doc.project || doc.metadata?.project || 'N/A')}</span></div>
                        <div class="detail-item"><span class="detail-label">Upload Date</span><span class="detail-value">${formatDateReadable(doc.upload_date || doc.created_at || doc.metadata?.upload_date)}</span></div>
                        <div class="detail-item"><span class="detail-label">Expiry Date</span><span class="detail-value">${(doc.expiry_date || doc.metadata?.expiry_date) ? formatDateReadable(doc.expiry_date || doc.metadata?.expiry_date) : 'N/A'}</span></div>
                        ${doc.summary ? `<div class="detail-item full-width"><span class="detail-label">AI Summary</span><span class="detail-value">${escapeHtml(doc.summary)}</span></div>` : ''}
                        ${doc.s3_url ? `<div class="detail-item full-width"><span class="detail-label">Storage URL</span><span class="detail-value"><a href="${doc.s3_url}" target="_blank">Open in S3</a></span></div>` : ''}
                    </div>
                `;
            }
            openModal('docDetailModal');
        } catch (err) {
            showToast('Failed to load document details', 'error');
        }
    },

    async downloadDocument(docId, filename) {
        try {
            const url = api.getDocumentDownloadUrl(docId);
            window.open(url, '_blank');
        } catch (err) {
            showToast('Download failed: ' + (err.message || ''), 'error');
        }
    },

    confirmDelete(docId, filename) {
        const body = $('confirmModalBody');
        const confirmBtn = $('confirmModalAction');
        if (body) body.innerHTML = `Are you sure you want to delete <strong>${escapeHtml(filename)}</strong>? This action cannot be undone.`;
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                closeModal('confirmModal');
                try {
                    await api.deleteDocument(docId);
                    showToast('Document deleted successfully', 'success');
                    this.loadData();
                } catch (err) {
                    showToast('Delete failed: ' + (err.message || ''), 'error');
                }
            };
        }
        openModal('confirmModal');
    },

    exportDocuments() {
        if (!this.filteredDocuments.length) { showToast('No documents to export', 'warning'); return; }
        const data = this.filteredDocuments.map(d => ({
            Filename: d.filename || '',
            Category: d.category || '',
            Project: d.project || '',
            Industry: d.industry || '',
            'Upload Date': d.upload_date || d.created_at || '',
            'Expiry Date': d.expiry_date || ''
        }));
        exportToCSV(data, 'documents_export.csv');
    }
};
