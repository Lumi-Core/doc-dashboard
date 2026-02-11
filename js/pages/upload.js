/**
 * Upload Page Module
 */
const Upload = {
    selectedFile: null,

    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.populateDropdowns();
    },

    bindEvents() {
        // File drop zone
        const dropZone = $('uploadArea');
        const fileInput = $('uploadFileInput');

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) this.handleFile(e.target.files[0]);
            });
        }

        // Upload form submit
        const form = $('uploadForm');
        if (form) {
            form.addEventListener('submit', (e) => { e.preventDefault(); this.uploadFile(); });
        }

        // Create project button
        on('createProjectBtn', 'click', () => this.showCreateProjectModal());

        // Create industry button
        on('createIndustryBtn', 'click', () => this.showCreateIndustryModal());

        // Create project form submit
        const projectForm = $('createProjectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createProject();
            });
        }

        // Create industry form submit
        const industryForm = $('createIndustryForm');
        if (industryForm) {
            industryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createIndustry();
            });
        }
    },

    handleFile(file) {
        this.selectedFile = file;
        const info = $('uploadPreview');
        if (info) {
            info.innerHTML = `
                <div class="file-preview">
                    <i class="fas ${this.getFileIcon(file.name)}"></i>
                    <div>
                        <strong>${escapeHtml(file.name)}</strong>
                        <small>${formatFileSize(file.size)}</small>
                    </div>
                </div>
            `;
            show(info);
        }
    },

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = { pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word', xls: 'fa-file-excel', xlsx: 'fa-file-excel', png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image', txt: 'fa-file-lines', csv: 'fa-file-csv' };
        return icons[ext] || 'fa-file';
    },

    async populateDropdowns() {
        try {
            const [projects, industries] = await Promise.allSettled([
                api.getProjects(),
                api.getIndustries()
            ]);

            const projectSelect = $('uploadProjectSelect');
            if (projectSelect && projects.value) {
                const projectList = Array.isArray(projects.value) ? projects.value : (projects.value.projects || []);
                projectSelect.innerHTML = '<option value="">-- Select Project --</option>' +
                    projectList.map(p => {
                        const name = typeof p === 'string' ? p : (p.name || p.project_name || '');
                        return `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
                    }).join('');
            }

            const industrySelect = $('uploadIndustrySelect');
            if (industrySelect && industries.value) {
                const industryList = Array.isArray(industries.value) ? industries.value : (industries.value.industries || []);
                industrySelect.innerHTML = '<option value="">-- Auto Detect --</option>' +
                    industryList.map(ind => {
                        const name = typeof ind === 'string' ? ind : (ind.name || '');
                        return `<option value="${escapeHtml(name)}">${escapeHtml(snakeToTitle(name))}</option>`;
                    }).join('');
            }
        } catch (err) {
            console.error('Populate dropdowns error:', err);
        }
    },

    async uploadFile() {
        if (!this.selectedFile) {
            showToast('Please select a file first', 'warning');
            return;
        }

        const project = $('uploadProjectSelect')?.value || '';
        const industry = $('uploadIndustrySelect')?.value || '';

        showLoading('Uploading and processing document...');
        try {
            const result = await api.uploadFile(this.selectedFile, project, industry);
            hideLoading();
            showToast('Document uploaded and processed successfully!', 'success');
            this.showUploadResult(result);
            this.clearForm();
        } catch (err) {
            hideLoading();
            showToast('Upload failed: ' + (err.message || 'Unknown error'), 'error');
        }
    },

    showUploadResult(result) {
        const card = $('uploadResultCard');
        const container = $('uploadResult');
        if (!container) return;
        if (card) card.classList.remove('hidden');
        container.innerHTML = `
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-check-circle" style="color: #10b981;"></i> Upload Successful</h3></div>
                <div class="card-body">
                    <div class="result-grid">
                        <div class="result-item"><span class="result-label">Filename</span><span class="result-value">${escapeHtml(result.filename || result.original_filename || '')}</span></div>
                        <div class="result-item"><span class="result-label">Category</span><span class="result-value">${escapeHtml(result.category || 'N/A')}</span></div>
                        <div class="result-item"><span class="result-label">Industry</span><span class="result-value">${escapeHtml(result.industry || 'N/A')}</span></div>
                        <div class="result-item"><span class="result-label">Project</span><span class="result-value">${escapeHtml(result.project || 'N/A')}</span></div>
                        ${result.expiry_date ? `<div class="result-item"><span class="result-label">Expiry Date</span><span class="result-value">${formatDateReadable(result.expiry_date)}</span></div>` : ''}
                        ${result.summary ? `<div class="result-item full-width"><span class="result-label">AI Summary</span><span class="result-value">${escapeHtml(result.summary)}</span></div>` : ''}
                    </div>
                </div>
            </div>
        `;
        show(container);
    },

    clearForm() {
        this.selectedFile = null;
        const fileInput = $('uploadFileInput');
        if (fileInput) fileInput.value = '';
        hide('uploadPreview');
        hide('uploadResultCard');
        const form = $('uploadForm');
        if (form) form.reset();
    },

    showCreateProjectModal() {
        // Populate industry dropdown in modal
        this.populateProjectIndustryDropdown();
        openModal('createProjectModal');
    },

    showCreateIndustryModal() {
        openModal('createIndustryModal');
    },

    async populateProjectIndustryDropdown() {
        try {
            const result = await api.getIndustries();
            const select = $('newProjectIndustry');
            if (select && result.industries) {
                select.innerHTML = '<option value="">-- Select Industry --</option>' +
                    result.industries.map(ind => {
                        const id = typeof ind === 'string' ? ind : (ind.id || ind.name || '');
                        const name = typeof ind === 'string' ? snakeToTitle(ind) : (ind.name || snakeToTitle(ind.id || ''));
                        return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
                    }).join('');
            }
        } catch (err) {
            console.error('Failed to load industries for project modal:', err);
        }
    },

    async createProject() {
        const name = $('newProjectName')?.value.trim();
        const description = $('newProjectDescription')?.value.trim();
        const industry = $('newProjectIndustry')?.value;

        if (!name) {
            showToast('Please enter a project name', 'warning');
            return;
        }

        if (!industry) {
            showToast('Please select an industry type', 'warning');
            return;
        }

        showLoading('Creating project...');
        try {
            const result = await api.createProject({
                name: name,
                description: description,
                industry_type: industry,
                company_id: api.currentCompanyId
            });

            hideLoading();
            closeModal('createProjectModal');
            showToast('Project created successfully!', 'success');

            // Clear form
            const form = $('createProjectForm');
            if (form) form.reset();

            // Refresh dropdowns
            await this.populateDropdowns();

            // Auto-select the new project
            const projectSelect = $('uploadProjectSelect');
            if (projectSelect && result.name) {
                projectSelect.value = result.name;
            }
        } catch (err) {
            hideLoading();
            showToast('Failed to create project: ' + (err.message || 'Unknown error'), 'error');
        }
    },

    async createIndustry() {
        const name = $('newIndustryName')?.value.trim();
        const description = $('newIndustryDescription')?.value.trim();

        if (!name) {
            showToast('Please enter an industry name', 'warning');
            return;
        }

        showLoading('Adding custom industry...');
        try {
            const result = await api.createIndustry({
                name: name,
                description: description,
                company_id: api.currentCompanyId
            });

            hideLoading();
            closeModal('createIndustryModal');
            showToast('Industry added successfully!', 'success');

            // Clear form
            const form = $('createIndustryForm');
            if (form) form.reset();

            // Refresh dropdowns
            await this.populateDropdowns();

            // Auto-select the new industry
            const industrySelect = $('uploadIndustrySelect');
            if (industrySelect && result.name) {
                industrySelect.value = result.name;
            }
        } catch (err) {
            hideLoading();
            showToast('Failed to add industry: ' + (err.message || 'Unknown error'), 'error');
        }
    }
};
