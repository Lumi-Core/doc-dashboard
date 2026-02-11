/**
 * API Service Module
 * Handles all API communications with the Document Management Agent backend
 */

class ApiService {
    constructor() {
        // Auto-detect API URL based on hosting context
        const saved = localStorage.getItem('apiBaseUrl');
        if (saved) {
            this.baseUrl = saved;
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Local development — backend on same host, port 8001 or 8000
            this.baseUrl = window.location.port === '8000'
                ? window.location.origin  // served by FastAPI on 8000
                : 'http://127.0.0.1:8001';
        } else if (window.location.hostname.includes('github.io')) {
            // GitHub Pages — always use Railway backend
            this.baseUrl = 'https://docagent-production.up.railway.app';
        } else {
            // Railway or other hosting — API is same origin
            this.baseUrl = window.location.origin;
        }
        this.currentCompanyId = localStorage.getItem('currentCompanyId') || 'default';
    }

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
        localStorage.setItem('apiBaseUrl', this.baseUrl);
    }

    setCompany(companyId) {
        this.currentCompanyId = companyId;
        localStorage.setItem('currentCompanyId', companyId);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Company-Id': this.currentCompanyId
        };
    }

    async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') throw new Error('Request timeout');
            throw error;
        }
    }

    async get(endpoint) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'GET', headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE', headers: this.getHeaders(),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }

    /**
     * Upload a file with multipart/form-data
     */
    async uploadFile(file, projectId = '', industryType = '') {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) formData.append('project_id', projectId);
        if (industryType) formData.append('industry_type', industryType);
        if (this.currentCompanyId) formData.append('company_id', this.currentCompanyId);

        const response = await this.fetchWithTimeout(`${this.baseUrl}/upload`, {
            method: 'POST',
            body: formData,
        }, 120000); // 2 min for large files

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
        return await response.json();
    }

    // =========================================================================
    // HEALTH
    // =========================================================================
    async getHealth()      { return this.get('/health'); }
    async getHealthReady() { return this.get('/health/ready'); }
    async getHealthLive()  { return this.get('/health/live'); }

    // =========================================================================
    // DOCUMENTS
    // =========================================================================
    async getDocuments()            { return this.get('/documents'); }
    async getDocument(id)           { return this.get(`/documents/${id}`); }
    async getDocumentStatus(id)     { return this.get(`/documents/${id}/status`); }
    async deleteDocument(id)        { return this.delete(`/documents/${id}`); }
    async getDocumentDownloadUrl(id){ return `${this.baseUrl}/documents/${id}/download`; }

    // =========================================================================
    // SEARCH & ASK
    // =========================================================================
    async search(query, nResults = 10) {
        return this.post('/search', { query, n_results: nResults });
    }

    async ask(question) {
        return this.post('/ask', { question });
    }

    // =========================================================================
    // CATEGORIES & TAXONOMY
    // =========================================================================
    async getCategories()            { return this.get('/categories'); }
    async getDocumentTypes(category) { return this.get(`/document-types/${category}`); }

    // =========================================================================
    // PROJECTS
    // =========================================================================
    async getProjects()             { 
        const params = this.currentCompanyId ? `?company_id=${this.currentCompanyId}` : '';
        return this.get(`/projects${params}`); 
    }
    async getProject(id)            { return this.get(`/projects/${id}`); }
    async createProject(data)       { return this.post('/projects', data); }
    async deleteProject(id)         { return this.delete(`/projects/${id}`); }
    async getProjectFolders(id)     { return this.get(`/projects/${id}/folders`); }
    async getProjectDocuments(id)   { return this.get(`/projects/${id}/documents`); }
    async getProjectDocumentsFlat(id){ return this.get(`/projects/${id}/documents/flat`); }
    async getReviewQueue(id)        { return this.get(`/projects/${id}/review-queue`); }

    // =========================================================================
    // INDUSTRIES
    // =========================================================================
    async getIndustries()               { return this.get('/industries'); }
    async getIndustryFolders(type)      { return this.get(`/industries/${type}/folders`); }
    async createIndustry(data)          { return this.post('/industries', data); }

    // =========================================================================
    // STATISTICS
    // =========================================================================
    async getStats()   { return this.get('/stats'); }
    async getDBStats() { return this.get('/db/stats'); }
    async getDbStats() { return this.getDBStats(); }

    // =========================================================================
    // EXPIRY & ALERTS
    // =========================================================================
    async getExpiryTable()      { return this.get('/db/expiry-table'); }
    async getExpiringDocuments() { return this.get('/documents/expiring'); }
    async getAlerts()           { return this.get('/db/alerts'); }
    async processAlerts()       { return this.post('/db/process-alerts'); }

    // =========================================================================
    // EMAIL
    // =========================================================================
    async getEmailStatus()      { return this.get('/email/status'); }
    async sendTestEmail()       { return this.post('/email/test'); }
    async sendExpiryAlerts()    { return this.post('/email/send-expiry-alerts'); }

    // =========================================================================
    // STORAGE & DB
    // =========================================================================
    async getStorageFiles() { return this.get('/storage/files'); }
    async getDBDocuments()  { return this.get('/db/documents'); }
    async getDBReviews()    { return this.get('/db/reviews'); }
    async syncStorage()     { return this.post('/sync'); }
    async cleanup()         { return this.post('/cleanup'); }
    async clearAllDB()      { return this.post('/db/clear-all'); }

    // =========================================================================
    // COMPANIES
    // =========================================================================
    async getCompanies()              { return this.get('/companies'); }
    async getCompany(id)              { return this.get(`/companies/${id}`); }
    async createCompany(data)         { return this.post('/companies', data); }
    async updateCompany(id, data)     { return this.put(`/companies/${id}`, data); }
    async deleteCompany(id)           { return this.delete(`/companies/${id}`); }
    async clearCompanyData(id)        { return this.post(`/companies/${id}/clear`); }

    // =========================================================================
    // ANALYTICS
    // =========================================================================
    async getAnalytics(companyId = null) {
        const params = companyId ? `?company_id=${companyId}` : '';
        return this.get(`/analytics${params}`);
    }
    async getConnectionStats()  { return this.get('/analytics/connection-stats'); }
}

// Create global API instance
const api = new ApiService();
