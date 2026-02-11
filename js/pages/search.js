/**
 * Search Page Module
 */
const Search = {
    init() {
        this.bindEvents();
    },

    onPageActive() {},

    bindEvents() {
        on('searchBtn', 'click', () => this.doSearch());
        on('askBtn', 'click', () => this.doAsk());

        const searchInput = $('searchQuery');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.doSearch();
            });
        }

        const askInput = $('askQuery');
        if (askInput) {
            askInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.doAsk();
            });
        }
    },

    async doSearch(externalQuery) {
        const input = $('searchQuery');
        const query = externalQuery || (input ? input.value.trim() : '');
        if (!query) { showToast('Please enter a search query', 'warning'); return; }
        if (input && externalQuery) input.value = externalQuery;

        const container = $('searchResults');
        if (container) container.innerHTML = '<div class="loading-inline"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

        try {
            const result = await api.search(query);
            this.renderSearchResults(result);
        } catch (err) {
            if (container) container.innerHTML = '';
            showToast('Search failed: ' + (err.message || ''), 'error');
        }
    },

    searchResults: [], // Store for preview access

    renderSearchResults(result) {
        const container = $('searchResults');
        if (!container) return;

        const results = result?.results || result?.documents || [];
        this.searchResults = results; // Store for preview
        
        if (!results.length) {
            container.innerHTML = '<p class="empty-state">No results found. Try a different query.</p>';
            return;
        }

        container.innerHTML = results.map((doc, i) => {
            const category = doc.category || doc.document_type || doc.metadata?.category || '';
            const project = doc.project || doc.metadata?.project || '';
            const industry = doc.industry || doc.metadata?.industry_type || '';
            const snippet = doc.text_snippet || doc.snippet || doc.content || doc.text || '';
            const docId = doc.id || doc.document_id || doc.metadata?.document_id || '';
            return `
            <div class="search-result-card">
                <div class="search-result-header">
                    <span class="search-result-rank">#${i + 1}</span>
                    <h4><i class="fas ${getFileIconClass(doc.filename || '')}" style="margin-right:6px;color:var(--gray-500);"></i>${escapeHtml(doc.filename || doc.title || 'Untitled')}</h4>
                    ${doc.score ? `<span class="search-score">${(doc.score * 100).toFixed(1)}% match</span>` : ''}
                </div>
                <div class="search-result-meta">
                    ${category ? `<span class="status-badge">${escapeHtml(snakeToTitle(category))}</span>` : ''}
                    ${project ? `<span class="meta-tag"><i class="fas fa-project-diagram"></i> ${escapeHtml(project)}</span>` : ''}
                    ${industry ? `<span class="meta-tag"><i class="fas fa-industry"></i> ${escapeHtml(snakeToTitle(industry))}</span>` : ''}
                    ${doc.folder_path ? `<span class="meta-tag"><i class="fas fa-folder"></i> ${escapeHtml(doc.folder_path)}</span>` : ''}
                </div>
                ${snippet ? `<p class="search-snippet">${escapeHtml(truncate(snippet, 200))}</p>` : ''}
                <div class="search-result-actions">
                    <button class="btn btn-sm" onclick="Search.previewResult(${i})" title="Preview with metadata">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    ${docId ? `<button class="btn btn-sm btn-success" onclick="Search.downloadResult('${docId}')" title="Download file">
                        <i class="fas fa-download"></i> Download
                    </button>` : ''}
                </div>
            </div>
        `;
        }).join('');
    },

    previewResult(index) {
        const doc = this.searchResults[index];
        if (doc) {
            showDocumentPreview(doc, { showContent: true, showScore: true, contentLabel: 'Matched Content Chunk' });
        }
    },

    downloadResult(docId) {
        if (docId) {
            const url = api.getDocumentDownloadUrl(docId);
            window.open(url, '_blank');
        }
    },

    async doAsk() {
        const input = $('askQuery');
        const query = input ? input.value.trim() : '';
        if (!query) { showToast('Please enter a question', 'warning'); return; }

        const container = $('askResult');
        if (container) container.innerHTML = '<div class="loading-inline"><i class="fas fa-spinner fa-spin"></i> AI is thinking...</div>';

        try {
            const result = await api.ask(query);
            this.renderAiAnswer(result);
        } catch (err) {
            if (container) container.innerHTML = '';
            showToast('AI query failed: ' + (err.message || ''), 'error');
        }
    },

    renderAiAnswer(result) {
        const container = $('askResult');
        if (!container) return;

        const answer = result?.answer || result?.response || 'No answer available.';
        const sources = result?.sources || result?.documents || [];

        this.askSources = sources; // Store for preview
        container.innerHTML = `
            <div class="ai-answer-box">
                <div class="ai-answer-header">
                    <i class="fas fa-robot"></i> AI Answer
                </div>
                <div class="ai-answer-content">${escapeHtml(answer)}</div>
                ${sources.length ? `
                    <div class="ai-sources">
                        <strong><i class="fas fa-book"></i> Sources (${sources.length}):</strong>
                        <ul>${sources.map((s, i) => {
                            const docId = s.document_id || s.id || '';
                            return `<li class="source-item">
                                <i class="fas ${getFileIconClass(s.filename || '')}" style="margin-right:6px;"></i>
                                ${escapeHtml(s.filename || s.title || 'Document')}
                                <span class="source-actions">
                                    <button class="btn-icon-sm" onclick="Search.previewSource(${i})" title="Preview"><i class="fas fa-eye"></i></button>
                                    ${docId ? `<button class="btn-icon-sm" onclick="Search.downloadResult('${docId}')" title="Download"><i class="fas fa-download"></i></button>` : ''}
                                </span>
                            </li>`;
                        }).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;
    },

    askSources: [], // Store AI sources for preview

    previewSource(index) {
        const source = this.askSources[index];
        if (source) {
            showDocumentPreview(source, { showContent: true, contentLabel: 'Source Content Snippet' });
        }
    }
};
