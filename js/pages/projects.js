/**
 * Projects Page Module
 */
const Projects = {
    allProjects: [],

    init() {
        this.bindEvents();
    },

    onPageActive() {
        this.loadData();
        this.populateIndustryDropdown();
    },

    bindEvents() {
        on('createProjectBtn', 'click', () => openModal('projectModal'));
        on('saveProject', 'click', () => this.createProject());
        on('closeProjectModal', 'click', () => closeModal('projectModal'));
        on('cancelProjectModal', 'click', () => closeModal('projectModal'));
        on('refreshProjects', 'click', () => this.loadData());
    },

    async loadData() {
        try {
            const result = await api.getProjects();
            this.allProjects = Array.isArray(result) ? result : (result.projects || []);
            this.renderProjects();
        } catch (err) {
            console.error('Projects load error:', err);
            showToast('Failed to load projects', 'error');
        }
    },

    renderProjects() {
        const grid = $('projectsGrid');
        if (!grid) return;

        if (!this.allProjects.length) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-folder-plus" style="font-size:3rem;margin-bottom:1rem;color:var(--gray-400);"></i><p>No projects yet. Create your first project!</p></div>';
            return;
        }

        grid.innerHTML = this.allProjects.map(project => {
            const name = typeof project === 'string' ? project : (project.name || project.project_name || '');
            const docCount = typeof project === 'object' ? (project.document_count || project.doc_count || 0) : '';
            const created = typeof project === 'object' ? (project.created_at || '') : '';

            return `
                <div class="project-card">
                    <div class="project-card-header">
                        <h3><i class="fas fa-folder"></i> ${escapeHtml(name)}</h3>
                        <button class="btn-icon danger" title="Delete Project" onclick="Projects.confirmDelete('${escapeHtml(name)}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="project-card-body">
                        ${docCount !== '' ? `<div class="project-stat"><i class="fas fa-file-alt"></i> ${docCount} documents</div>` : ''}
                        ${created ? `<div class="project-stat"><i class="fas fa-calendar"></i> Created ${formatDateReadable(created)}</div>` : ''}
                    </div>
                    <div class="project-card-footer">
                        <button class="btn btn-sm" onclick="Projects.viewProjectDocs('${escapeHtml(name)}')">
                            <i class="fas fa-eye"></i> View Documents
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    async createProject() {
        const form = $('projectForm');
        if (!form) return;
        const nameInput = form.querySelector('input[name="name"]');
        const industryInput = $('projectIndustrySelect');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) { showToast('Please enter a project name', 'warning'); return; }
        const industry = industryInput ? industryInput.value : '';

        try {
            const projectData = {
                name: name,
                industry_type: industry,
                company_id: api.currentCompanyId || 'default'
            };
            await api.createProject(projectData);
            showToast(`Project "${name}" created successfully`, 'success');
            closeModal('projectModal');
            if (form) form.reset();
            this.loadData();
        } catch (err) {
            showToast('Failed to create project: ' + (err.message || ''), 'error');
        }
    },

    confirmDelete(projectName) {
        const body = $('confirmModalBody');
        const confirmBtn = $('confirmModalAction');
        if (body) body.innerHTML = `Are you sure you want to delete project <strong>${escapeHtml(projectName)}</strong>?`;
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                closeModal('confirmModal');
                try {
                    await api.deleteProject(projectName);
                    showToast(`Project "${projectName}" deleted`, 'success');
                    this.loadData();
                } catch (err) {
                    showToast('Delete failed: ' + (err.message || ''), 'error');
                }
            };
        }
        openModal('confirmModal');
    },

    viewProjectDocs(projectName) {
        // Navigate to documents page and filter by project
        App.navigateTo('documents');
    },

    async populateIndustryDropdown() {
        try {
            const result = await api.getIndustries();
            const industries = Array.isArray(result) ? result : (result.industries || []);
            const select = $('projectIndustrySelect');
            if (!select) return;
            select.innerHTML = '<option value="">Select Industry...</option>' +
                industries.map(ind => {
                    const name = typeof ind === 'string' ? ind : (ind.name || '');
                    return `<option value="${escapeHtml(name)}">${escapeHtml(snakeToTitle(name))}</option>`;
                }).join('');
        } catch (err) {
            console.error('Failed to load industries for dropdown:', err);
        }
    }
};
