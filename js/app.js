// T21 Directory - Main Application
// Modular, clean architecture with externalized data

// ============== STATE ==============
let state = {
    currentPage: 'home',
    currentDetailId: null,
    currentDetailType: null,
    currentResourceTab: 'financial',
    sidebarCollapsed: true,
    resourcesVisible: 10,
    therapyVisible: 10,
    inspirationVisible: 12,
    searchQuery: '',
    filters: {
        subcategory: [],
        jurisdiction: [],
        income: [],
        age: []
    },
    therapyFilters: {
        serviceType: [],
        telehealth: [],
        jurisdiction: []
    },
    inspirationFilters: {
        field: [],
        country: []
    }
};

// ============== DATA ==============
let financialData = [];
let therapyData = [];
let inspirationData = [];

// Load data from JSON files
async function loadData() {
    try {
        const [fin, ther, insp] = await Promise.all([
            fetch('data/financial.json').then(r => r.json()),
            fetch('data/therapy.json').then(r => r.json()),
            fetch('data/inspiration.json').then(r => r.json())
        ]);
        financialData = fin;
        therapyData = ther;
        inspirationData = insp;
        console.log(`Loaded: ${financialData.length} financial, ${therapyData.length} therapy, ${inspirationData.length} inspiration`);
        render();
    } catch (err) {
        console.error('Error loading data:', err);
        document.getElementById('app').innerHTML = '<div class="loading">Error loading data. Please refresh.</div>';
    }
}

// ============== HELPERS ==============
const normalizeField = (field) => {
    const map = {
        'Performing Arts / Theater': 'Performing Arts',
        'Entrepreneurship / Business': 'Entrepreneur',
        'Athletics / Sports': 'Athlete',
        'Arts / Visual Arts': 'Artist',
    };
    return map[field] || field;
};

const getFieldColor = (field) => {
    const colors = {
        'Performing Arts': { bg: '#f3e8ff', text: '#7c3aed' },
        'Entrepreneur': { bg: '#d1fae5', text: '#059669' },
        'Athlete': { bg: '#ffedd5', text: '#ea580c' },
        'Artist': { bg: '#e0e7ff', text: '#4f46e5' },
        'Modeling': { bg: '#fce7f3', text: '#db2777' },
    };
    return colors[normalizeField(field)] || { bg: '#f3f4f6', text: '#374151' };
};

const formatAmount = (min, max) => {
    if (!max && !min) return 'FREE';
    if (max === 0) return 'FREE';
    if (min === max) return `$${Number(max).toLocaleString()}`;
    if (!min || min === 0) return `Up to $${Number(max).toLocaleString()}`;
    return `$${Number(min).toLocaleString()}\u2013$${Number(max).toLocaleString()}`;
};

// Dynamic value badge based on resource type
const getValueBadge = (r) => {
    const category = r.program_category || r.subcategories || '';
    const awardMin = r.award_amount_min;
    const awardMax = r.award_amount_max;
    
    if (category.includes('Government Benefits')) {
        let value = 'Varies';
        if (awardMax) {
            value = `$${Number(awardMax).toLocaleString()}/mo`;
        }
        return { label: 'Benefit', value, color: 'blue' };
    } else if (category.includes('Savings')) {
        return { 
            label: 'Limit', 
            value: awardMax ? `$${Number(awardMax).toLocaleString()}` : 'Varies',
            color: 'blue'
        };
    } else if (category.includes('Insurance') || category.includes('Health')) {
        return { label: 'Coverage', value: 'Comprehensive', color: 'purple' };
    } else if (category.includes('Grant') || category.includes('Scholarship')) {
        return { 
            label: 'Award', 
            value: formatAmount(awardMin, awardMax),
            color: 'green'
        };
    } else {
        if (awardMax) {
            return { label: 'Award', value: formatAmount(awardMin, awardMax), color: 'green' };
        }
        return { label: 'Resource', value: 'Free', color: 'gray' };
    }
};

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '?';

// ============== NAVIGATION ==============
window.navigate = (page, type = null, id = null) => {
    state.currentPage = page;
    state.currentDetailType = type;
    state.currentDetailId = id;
    render();
    window.scrollTo(0, 0);
};

window.switchResourceTab = (tab) => {
    state.currentResourceTab = tab;
    render();
};

window.toggleMenu = () => {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('active');
};

window.closeMenu = () => {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.remove('active');
};

window.toggleSidebar = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    render();
};

window.expandSidebar = () => {
    state.sidebarCollapsed = false;
    render();
};

// ============== FILTERS ==============
window.toggleFilter = (category, value) => {
    const idx = state.filters[category].indexOf(value);
    if (idx > -1) {
        state.filters[category].splice(idx, 1);
    } else {
        state.filters[category].push(value);
    }
    render();
};

window.toggleTherapyFilter = (category, value) => {
    const idx = state.therapyFilters[category].indexOf(value);
    if (idx > -1) {
        state.therapyFilters[category].splice(idx, 1);
    } else {
        state.therapyFilters[category].push(value);
    }
    render();
};

window.toggleInspirationFilter = (category, value) => {
    const idx = state.inspirationFilters[category].indexOf(value);
    if (idx > -1) {
        state.inspirationFilters[category].splice(idx, 1);
    } else {
        state.inspirationFilters[category].push(value);
    }
    render();
};

window.resetFilters = () => {
    state.filters = { subcategory: [], jurisdiction: [], income: [], age: [] };
    render();
};

window.resetTherapyFilters = () => {
    state.therapyFilters = { serviceType: [], telehealth: [], jurisdiction: [] };
    render();
};

window.resetInspirationFilters = () => {
    state.inspirationFilters = { field: [], country: [] };
    render();
};

window.handleSearch = (value) => {
    state.searchQuery = value.toLowerCase();
    render();
};

const hasActiveFilters = () => Object.values(state.filters).some(arr => arr.length > 0);
const hasActiveTherapyFilters = () => Object.values(state.therapyFilters).some(arr => arr.length > 0);
const hasActiveInspirationFilters = () => Object.values(state.inspirationFilters).some(arr => arr.length > 0);

// ============== LOAD MORE ==============
window.loadMoreResources = () => {
    state.resourcesVisible += 10;
    render();
};

window.loadMoreTherapy = () => {
    state.therapyVisible += 10;
    render();
};

window.loadMoreInspiration = () => {
    state.inspirationVisible += 12;
    render();
};

// ============== FILTERED DATA ==============
const getFilteredFinancial = () => {
    let results = [...financialData];
    
    // Search
    if (state.searchQuery) {
        results = results.filter(r => 
            (r.program_name || '').toLowerCase().includes(state.searchQuery) ||
            (r.program_description || '').toLowerCase().includes(state.searchQuery) ||
            (r.program_category || '').toLowerCase().includes(state.searchQuery)
        );
    }
    
    // Category filter
    if (state.filters.subcategory.length) {
        results = results.filter(r => state.filters.subcategory.some(f => (r.program_category || '').includes(f)));
    }
    
    // Jurisdiction filter
    if (state.filters.jurisdiction.length) {
        results = results.filter(r => state.filters.jurisdiction.includes(r.geographic_coverage));
    }
    
    // Income filter
    if (state.filters.income.includes('no')) {
        results = results.filter(r => !r.income_limit || r.income_limit === 'None');
    }
    
    // Age filter
    if (state.filters.age.length) {
        results = results.filter(r => {
            const ageMin = r.age_range_min || 0;
            const ageMax = r.age_range_max || 99;
            return state.filters.age.some(range => {
                if (range === '0-3') return ageMin <= 3 && ageMax >= 0;
                if (range === '3-5') return ageMin <= 5 && ageMax >= 3;
                if (range === '5-18') return ageMin <= 18 && ageMax >= 5;
                if (range === '18+') return ageMax >= 18;
                return false;
            });
        });
    }
    
    return results;
};

const getFilteredTherapy = () => {
    let results = [...therapyData];
    
    // Search
    if (state.searchQuery) {
        results = results.filter(r => 
            (r.resource_name || '').toLowerCase().includes(state.searchQuery) ||
            (r.short_description || '').toLowerCase().includes(state.searchQuery) ||
            (r.subcategories || '').toLowerCase().includes(state.searchQuery)
        );
    }
    
    // Service type filter
    if (state.therapyFilters.serviceType.length) {
        results = results.filter(r => 
            state.therapyFilters.serviceType.some(s => (r.subcategories || '').includes(s))
        );
    }
    
    // Telehealth filter
    if (state.therapyFilters.telehealth.length) {
        results = results.filter(r => {
            const th = (r.telehealth_available || '').toLowerCase();
            return state.therapyFilters.telehealth.some(f => {
                if (f === 'Yes') return th === 'yes' || th.includes('yes');
                if (f === 'No') return th === 'no' || th.includes('no');
                return true;
            });
        });
    }
    
    // Jurisdiction filter
    if (state.therapyFilters.jurisdiction.length) {
        results = results.filter(r => state.therapyFilters.jurisdiction.includes(r.jurisdiction_level));
    }
    
    return results;
};

const getFilteredInspiration = () => {
    let results = [...inspirationData];
    
    // Field filter
    if (state.inspirationFilters.field.length) {
        results = results.filter(p => {
            const normalizedField = normalizeField(p.primary_field);
            return state.inspirationFilters.field.includes(normalizedField);
        });
    }
    
    // Country filter
    if (state.inspirationFilters.country.length) {
        results = results.filter(p => {
            const country = (p.location_country || 'USA') === 'USA' ? 'United States' : p.location_country;
            return state.inspirationFilters.country.includes(country);
        });
    }
    
    return results;
};

// ============== RENDER COMPONENTS ==============

const renderHeader = () => `
    <header>
        <div class="header-content">
            <a href="#" class="logo" onclick="navigate('home'); return false;">T21</a>
            <nav>
                <a href="#" class="${state.currentPage === 'home' ? 'active' : ''}" onclick="navigate('home'); return false;">Home</a>
                <a href="#" class="${state.currentPage === 'resources' ? 'active' : ''}" onclick="navigate('resources'); return false;">Resources</a>
                <a href="#" class="${state.currentPage === 'inspiration' ? 'active' : ''}" onclick="navigate('inspiration'); return false;">Inspiration</a>
                <a href="#" class="${state.currentPage === 'about' ? 'active' : ''}" onclick="navigate('about'); return false;">About</a>
            </nav>
            <button class="menu-toggle" onclick="toggleMenu()">&#9776;</button>
        </div>
    </header>
    <div class="mobile-menu-overlay" id="mobileMenu">
        <a href="#" onclick="navigate('home'); closeMenu(); return false;">Home</a>
        <a href="#" onclick="navigate('resources'); closeMenu(); return false;">Resources</a>
        <a href="#" onclick="navigate('inspiration'); closeMenu(); return false;">Inspiration</a>
        <a href="#" onclick="navigate('about'); closeMenu(); return false;">About</a>
    </div>
`;

const renderFooter = () => `
    <footer>
        <div class="footer-content">
            <span class="footer-text">&copy; 2026 T21 Directory. All rights reserved.</span>
            <span class="footer-text">Made with &#10084; for the DS community</span>
        </div>
    </footer>
`;

const renderFinancialSidebar = () => `
    <div class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
            <span class="sidebar-title">Filters</span>
            <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&lsaquo;</button>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search resources..." 
                   value="${state.searchQuery}" onkeyup="handleSearch(this.value)">
        </div>
        
        <button class="reset-filters-btn ${hasActiveFilters() ? 'active' : ''}" onclick="resetFilters()">
            ${hasActiveFilters() ? 'Reset Filters' : 'No Filters Applied'}
        </button>
        
        <div class="facet">
            <div class="facet-title">Category</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Category">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.filters.subcategory.includes('Government Benefits') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Government Benefits')"> Government Benefits</label>
            <label class="filter"><input type="checkbox" ${state.filters.subcategory.includes('Savings') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Savings')"> Savings Programs</label>
            <label class="filter"><input type="checkbox" ${state.filters.subcategory.includes('Grant') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Grant')"> Grants</label>
            <label class="filter"><input type="checkbox" ${state.filters.subcategory.includes('Scholarship') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Scholarship')"> Scholarships</label>
            <label class="filter"><input type="checkbox" ${state.filters.subcategory.includes('Insurance') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Insurance')"> Health Insurance</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Age Range</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Age Range">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.filters.age.includes('0-3') ? 'checked' : ''} onchange="toggleFilter('age', '0-3')"> Birth&ndash;3</label>
            <label class="filter"><input type="checkbox" ${state.filters.age.includes('3-5') ? 'checked' : ''} onchange="toggleFilter('age', '3-5')"> 3&ndash;5 Years</label>
            <label class="filter"><input type="checkbox" ${state.filters.age.includes('5-18') ? 'checked' : ''} onchange="toggleFilter('age', '5-18')"> 5&ndash;18 Years</label>
            <label class="filter"><input type="checkbox" ${state.filters.age.includes('18+') ? 'checked' : ''} onchange="toggleFilter('age', '18+')"> 18+ Adults</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Coverage</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Coverage">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.filters.jurisdiction.includes('National') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'National')"> National</label>
            <label class="filter"><input type="checkbox" ${state.filters.jurisdiction.includes('Multi-State') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'Multi-State')"> Multi-State</label>
            <label class="filter"><input type="checkbox" ${state.filters.jurisdiction.includes('State') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'State')"> State</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Income Limits</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Income">
                <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.filters.income.includes('no') ? 'checked' : ''} onchange="toggleFilter('income', 'no')"> No Income Limits</label>
        </div>
    </div>
`;

const renderTherapySidebar = () => `
    <div class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
            <span class="sidebar-title">Filters</span>
            <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&lsaquo;</button>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search services..." 
                   value="${state.searchQuery}" onkeyup="handleSearch(this.value)">
        </div>
        
        <button class="reset-filters-btn ${hasActiveTherapyFilters() ? 'active' : ''}" onclick="resetTherapyFilters()">
            ${hasActiveTherapyFilters() ? 'Reset Filters' : 'No Filters Applied'}
        </button>
        
        <div class="facet">
            <div class="facet-title">Service Type</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Service Type">
                <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.serviceType.includes('DS Specialty Clinics') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'DS Specialty Clinics')"> DS Specialty Clinics</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.serviceType.includes('Speech') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Speech')"> Speech Therapy</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.serviceType.includes('Physical') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Physical')"> Physical Therapy</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.serviceType.includes('Occupational') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Occupational')"> Occupational Therapy</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.serviceType.includes('Telehealth') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Telehealth')"> Telehealth Services</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Telehealth</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Telehealth">
                <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.telehealth.includes('Yes') ? 'checked' : ''} onchange="toggleTherapyFilter('telehealth', 'Yes')"> Available</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Coverage</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Coverage">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.jurisdiction.includes('National') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'National')"> National</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.jurisdiction.includes('Regional') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'Regional')"> Regional</label>
            <label class="filter"><input type="checkbox" ${state.therapyFilters.jurisdiction.includes('State') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'State')"> State</label>
        </div>
    </div>
`;

const renderInspirationSidebar = () => `
    <div class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
            <span class="sidebar-title">Filters</span>
            <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&lsaquo;</button>
        </div>
        
        <button class="reset-filters-btn ${hasActiveInspirationFilters() ? 'active' : ''}" onclick="resetInspirationFilters()">
            ${hasActiveInspirationFilters() ? 'Reset Filters' : 'No Filters Applied'}
        </button>
        
        <div class="facet">
            <div class="facet-title">Field</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Field">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.field.includes('Artist') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Artist')"> Artist</label>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.field.includes('Athlete') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Athlete')"> Athlete</label>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.field.includes('Entrepreneur') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Entrepreneur')"> Entrepreneur</label>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.field.includes('Modeling') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Modeling')"> Modeling</label>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.field.includes('Performing Arts') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Performing Arts')"> Performing Arts</label>
        </div>
        
        <div class="facet">
            <div class="facet-title">Country</div>
            <button class="facet-icon" onclick="expandSidebar()" title="Country">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </button>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.country.includes('United States') ? 'checked' : ''} onchange="toggleInspirationFilter('country', 'United States')"> United States</label>
            <label class="filter"><input type="checkbox" ${state.inspirationFilters.country.includes('Australia') ? 'checked' : ''} onchange="toggleInspirationFilter('country', 'Australia')"> Australia</label>
        </div>
    </div>
`;

// ============== PAGE RENDERS ==============

const renderHomePage = () => `
    <div class="home-hero">
        <div class="home-hero-content">
            <h1>Resources for the Down Syndrome Community</h1>
            <p>A comprehensive directory of financial resources, healthcare services, and inspiring individuals. Built by the community, for the community.</p>
            <div class="home-hero-buttons">
                <a href="#" class="btn btn-primary" onclick="navigate('resources'); return false;">Browse Resources &rarr;</a>
                <a href="#" class="btn btn-secondary-light" onclick="navigate('inspiration'); return false;">Meet Inspiring Individuals &rarr;</a>
            </div>
        </div>
    </div>
    
    <div class="home-stats">
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-primary);">
                <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-value">${financialData.length}</div>
            <div class="stat-label">Financial Resources</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-therapy);">
                <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <div class="stat-value">${therapyData.length}</div>
            <div class="stat-label">Healthcare Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-secondary);">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
            <div class="stat-value">${inspirationData.length}</div>
            <div class="stat-label">Inspiring Individuals</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-tertiary);">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>
            </div>
            <div class="stat-value">50</div>
            <div class="stat-label">States Covered</div>
        </div>
    </div>
    
    <div class="home-section">
        <div class="home-section-header">
            <h2>Explore the Directory</h2>
            <p>Find the support you need, from financial assistance to inspiring role models.</p>
        </div>
        <div class="home-cards">
            <a href="#" class="home-card" onclick="navigate('resources'); return false;">
                <div class="home-card-icon" style="background: var(--color-primary);">
                    <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <h3>Financial Resources</h3>
                <p>Discover ${financialData.length}+ grants, benefits, scholarships, and support programs for the Down syndrome community.</p>
                <div class="home-card-tags">
                    <span class="home-card-tag">Government Benefits</span>
                    <span class="home-card-tag">Grants</span>
                    <span class="home-card-tag">Scholarships</span>
                </div>
                <span class="home-card-link">Browse Resources &rarr;</span>
            </a>
            <a href="#" class="home-card" onclick="switchResourceTab('therapy'); navigate('resources'); return false;">
                <div class="home-card-icon" style="background: var(--color-therapy);">
                    <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <h3>Healthcare &amp; Therapy</h3>
                <p>Find ${therapyData.length}+ specialized clinics, therapy services, and healthcare providers experienced with Down syndrome.</p>
                <div class="home-card-tags">
                    <span class="home-card-tag">DS Clinics</span>
                    <span class="home-card-tag">Speech Therapy</span>
                    <span class="home-card-tag">Telehealth</span>
                </div>
                <span class="home-card-link">Find Services &rarr;</span>
            </a>
            <a href="#" class="home-card" onclick="navigate('inspiration'); return false;">
                <div class="home-card-icon" style="background: var(--color-secondary);">
                    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <h3>Inspiring Individuals</h3>
                <p>Meet ${inspirationData.length}+ role models making an impact &mdash; athletes, artists, entrepreneurs, advocates, and creators.</p>
                <div class="home-card-tags">
                    <span class="home-card-tag">Athletes</span>
                    <span class="home-card-tag">Artists</span>
                    <span class="home-card-tag">Entrepreneurs</span>
                </div>
                <span class="home-card-link">Meet Inspiring Individuals &rarr;</span>
            </a>
        </div>
    </div>
    ${renderFooter()}
`;

const renderResourcesPage = () => {
    const isTherapy = state.currentResourceTab === 'therapy';
    const filteredFinancial = getFilteredFinancial();
    const filteredTherapy = getFilteredTherapy();
    const visibleFinancial = filteredFinancial.slice(0, state.resourcesVisible);
    const visibleTherapy = filteredTherapy.slice(0, state.therapyVisible);
    const hasMoreFinancial = filteredFinancial.length > state.resourcesVisible;
    const hasMoreTherapy = filteredTherapy.length > state.therapyVisible;
    
    return `
        <div class="main-wrapper">
            ${isTherapy ? renderTherapySidebar() : renderFinancialSidebar()}
            <div class="content">
                <div class="page-header">
                    <h1 class="page-title">Resources Directory</h1>
                    <p class="page-subtitle">Comprehensive support resources for the Down syndrome community.</p>
                </div>
                
                <div class="sub-tabs">
                    <button class="sub-tab ${state.currentResourceTab === 'financial' ? 'active' : ''}" onclick="switchResourceTab('financial')">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Financial &amp; Benefits
                        <span class="tab-count">${financialData.length}</span>
                    </button>
                    <button class="sub-tab ${state.currentResourceTab === 'therapy' ? 'active' : ''}" onclick="switchResourceTab('therapy')">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                        Healthcare &amp; Therapy
                        <span class="tab-count">${therapyData.length}</span>
                    </button>
                </div>
                
                ${isTherapy ? `
                    <div class="results-header">
                        <span class="results-count">Showing ${visibleTherapy.length} of ${filteredTherapy.length} services</span>
                        <div class="sort-controls">
                            <label>Sort by:</label>
                            <select><option>Relevance</option><option>Name (A-Z)</option></select>
                        </div>
                    </div>
                    
                    ${visibleTherapy.map(r => renderTherapyCard(r)).join('')}
                    
                    ${hasMoreTherapy ? `<button class="load-more-btn" onclick="loadMoreTherapy()">Load More (${filteredTherapy.length - state.therapyVisible} remaining)</button>` : ''}
                ` : `
                    <div class="results-header">
                        <span class="results-count">Showing ${visibleFinancial.length} of ${filteredFinancial.length} resources</span>
                        <div class="sort-controls">
                            <label>Sort by:</label>
                            <select><option>Relevance</option><option>Amount (High to Low)</option><option>Name (A-Z)</option></select>
                        </div>
                    </div>
                    
                    ${visibleFinancial.map(r => renderFinancialCard(r)).join('')}
                    
                    ${hasMoreFinancial ? `<button class="load-more-btn" onclick="loadMoreResources()">Load More (${filteredFinancial.length - state.resourcesVisible} remaining)</button>` : ''}
                `}
            </div>
        </div>
    `;
};

const renderFinancialCard = (r) => {
    const badge = getValueBadge(r);
    const valueClass = badge.value.length > 10 ? 'small' : '';
    return `
        <div class="card" onclick="navigate('detail', 'financial', '${r.program_id}')">
            <div class="card-image">Financial</div>
            <div class="card-body">
                <div class="card-title">${r.program_name || ''}</div>
                <div class="card-org">${r.organization_type || ''}</div>
                <div class="card-desc">${(r.program_description || '').substring(0, 150)}...</div>
                <div class="card-tags">
                    <span class="card-tag">${r.program_category || ''}</span>
                    <span class="card-tag">${r.geographic_coverage || ''}</span>
                    ${!r.income_limit || r.income_limit === 'None' ? '<span class="card-tag highlight">No Income Limits</span>' : ''}
                </div>
            </div>
            <div class="card-value">
                <span class="card-value-label">${badge.label}</span>
                <span class="card-value-amount ${valueClass}">${badge.value}</span>
            </div>
        </div>
    `;
};

const renderTherapyCard = (r) => {
    const services = (r.subcategories || '').split(';').slice(0, 2).map(s => s.trim());
    const isTelehealth = (r.telehealth_available || '').toLowerCase().includes('yes');
    const isFree = (r.cost_type || '').toLowerCase() === 'free';
    const isExpert = (r.ds_experience_level || '').includes('Expert');
    
    return `
        <div class="card" onclick="navigate('detail', 'therapy', '${r.resource_id}')">
            <div class="card-image therapy">Healthcare</div>
            <div class="card-body">
                <div class="card-title">${r.resource_name || ''}</div>
                <div class="card-org">${r.organization_name || ''} &middot; ${r.organization_type || ''}</div>
                <div class="card-desc">${r.short_description || ''}</div>
                <div class="card-tags">
                    ${services.map(s => `<span class="card-tag therapy">${s}</span>`).join('')}
                    <span class="card-tag">${r.jurisdiction_level || 'National'}</span>
                </div>
            </div>
            <div class="card-badges">
                ${isTelehealth ? '<span class="info-badge telehealth">&#128249; Telehealth</span>' : ''}
                ${isFree ? '<span class="info-badge free">&#10003; Free</span>' : ''}
                ${isExpert ? '<span class="info-badge expert">&#9733; DS Expert</span>' : ''}
            </div>
        </div>
    `;
};

const renderInspirationPage = () => {
    const filtered = getFilteredInspiration();
    const visible = filtered.slice(0, state.inspirationVisible);
    const hasMore = filtered.length > state.inspirationVisible;
    
    return `
        <div class="main-wrapper">
            ${renderInspirationSidebar()}
            <div class="content">
                <div class="page-header">
                    <h1 class="page-title">Inspiring Individuals</h1>
                    <p class="page-subtitle">Meet role models making an impact &mdash; athletes, artists, entrepreneurs, advocates, and more.</p>
                </div>
                
                <div class="results-header">
                    <span class="results-count">Showing ${visible.length} of ${filtered.length} individuals</span>
                    <div class="sort-controls">
                        <label>Sort by:</label>
                        <select><option>Name (A-Z)</option><option>Field</option></select>
                    </div>
                </div>
                
                <div class="inspiration-grid">
                    ${visible.map(p => {
                        const fieldColor = getFieldColor(p.primary_field);
                        const location = [p.location_city, p.location_state].filter(Boolean).join(', ');
                        return `
                            <div class="inspiration-card" onclick="navigate('detail', 'inspiration', '${p.profile_id}')">
                                <div class="inspiration-card-header">
                                    <div class="inspiration-avatar">${getInitials(p.full_name)}</div>
                                    <div>
                                        <div class="inspiration-name">${p.known_as___stage_name || p.full_name}</div>
                                        <div class="inspiration-location">${location}</div>
                                    </div>
                                </div>
                                <div class="inspiration-card-body">
                                    <span class="inspiration-field-badge" style="background: ${fieldColor.bg}; color: ${fieldColor.text};">${normalizeField(p.primary_field)}</span>
                                    <p class="inspiration-bio">${p.short_bio || ''}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${hasMore ? `<button class="load-more-btn" onclick="loadMoreInspiration()">Load More (${filtered.length - state.inspirationVisible} remaining)</button>` : ''}
            </div>
        </div>
    `;
};

const renderAboutPage = () => `
    <div class="about-page">
        <div class="about-hero">
            <h1>About T21</h1>
            <p>Building the resource we wished existed when our journey began.</p>
        </div>
        
        <div class="about-content">
            <div class="about-section">
                <h2>Our Mission</h2>
                <p>T21 exists to ensure every family touched by Down syndrome has access to the resources, support, and inspiration they need to thrive &mdash; regardless of where they live, their income level, or their prior knowledge of available benefits.</p>
                
                <div class="about-pillars">
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-primary);">
                            <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <h3>Financial Foundation</h3>
                        <p>Navigate benefits, grants, and scholarships that can provide significant support over your child's lifetime.</p>
                    </div>
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-therapy);">
                            <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        </div>
                        <h3>Healthcare Access</h3>
                        <p>Find DS specialty clinics, therapy services, and healthcare providers who understand your child's unique needs.</p>
                    </div>
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-secondary);">
                            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        </div>
                        <h3>Community &amp; Inspiration</h3>
                        <p>Connect with role models and families who show what's possible and remind us we're not alone.</p>
                    </div>
                </div>
            </div>
            
            <div class="about-section">
                <h2>Our Story</h2>
                <p>T21 was born from our own family's journey. We have two boys &mdash; ages 9 and 6. Our younger son has Down syndrome, and from the moment of his diagnosis, we dove headfirst into learning everything we could to give him the best possible life.</p>
                <p>We've spent countless hours researching therapies, applying for benefits, advocating at school, finding inclusive activities, and connecting with other families. It's nearly a full-time job &mdash; and we're lucky to have the time and resources to do it.</p>
                <p>But we kept thinking: what about families who don't have these advantages? What about the single parent working two jobs? The family in a rural area? The parents who don't know their child automatically qualifies for SSI?</p>
                <p>We wanted to build the tool we wished existed &mdash; a comprehensive, searchable directory that any family could use to find the support they need.</p>
            </div>
            
            <div class="about-cta">
                <h2>Join Us</h2>
                <p>T21 is a community effort. We're building this directory together &mdash; parents, advocates, organizations, and allies.</p>
                <div class="about-cta-buttons">
                    <a href="#" class="btn btn-primary" onclick="navigate('resources'); return false;">Explore Resources &rarr;</a>
                    <button class="btn btn-secondary">Submit a Resource</button>
                </div>
            </div>
        </div>
        ${renderFooter()}
    </div>
`;

// ============== DETAIL PAGES ==============

const renderFinancialDetail = () => {
    const r = financialData.find(res => res.program_id === state.currentDetailId);
    if (!r) return '<div class="detail-page"><div class="detail-content">Resource not found</div></div>';
    
    const badge = getValueBadge(r);
    const ageRange = r.age_range_min !== undefined ? 
        `${r.age_range_min === 0 ? 'Birth' : r.age_range_min} \u2013 ${r.age_range_max >= 99 ? 'All ages' : r.age_range_max + ' years'}` : 
        'All ages';
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="navigate('resources'); return false;">&larr; Back to Resources</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-header">
                    <div class="detail-header-main">
                        <div class="detail-image">Financial</div>
                        <div>
                            <div class="detail-tags">
                                <span class="detail-tag">${r.program_category || ''}</span>
                                <span class="detail-tag">${r.geographic_coverage || ''}</span>
                                ${!r.income_limit || r.income_limit === 'None' ? '<span class="detail-tag green">No Income Limits</span>' : ''}
                            </div>
                            <h1 class="detail-title">${r.program_name}</h1>
                            <p class="detail-org">${r.organization_type || ''}</p>
                        </div>
                    </div>
                    <div class="detail-header-actions">
                        ${r.website ? `<a href="${r.website.startsWith('http') ? r.website : 'https://' + r.website}" target="_blank" class="btn btn-primary">Visit Website &rarr;</a>` : ''}
                        ${r.phone ? `<a href="tel:${r.phone.replace(/[^0-9]/g, '')}" class="btn btn-secondary">&#128222; ${r.phone}</a>` : ''}
                    </div>
                </div>
                
                <div class="detail-body">
                    <div class="detail-main">
                        <div class="detail-section">
                            <h2>Overview</h2>
                            <div class="detail-text">
                                ${(r.program_description || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                            </div>
                        </div>
                        
                        ${r['key_features_&_benefits'] ? `
                            <div class="detail-section">
                                <h2>Key Features &amp; Benefits</h2>
                                <div class="detail-features">${(r['key_features_&_benefits'] || '').replace(/\\u2022/g, '\u2022')}</div>
                            </div>
                        ` : ''}
                        
                        ${r.application_process ? `
                            <div class="detail-section">
                                <h2>How to Apply</h2>
                                <div class="detail-text">
                                    ${(r.application_process || '').split('\n').map(p => `<p>${p}</p>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${r['real-world_context'] ? `
                            <div class="detail-note-card">
                                <h3>&#128161; Important Notes</h3>
                                ${(r['real-world_context'] || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-sidebar-info">
                        <div class="detail-sidebar-card">
                            <h3>Quick Info</h3>
                            <div class="detail-grid">
                                <div class="detail-grid-item">
                                    <label>${badge.label}</label>
                                    <span>${badge.value}</span>
                                </div>
                                ${r.annual_cap ? `
                                    <div class="detail-grid-item">
                                        <label>Annual Cap</label>
                                        <span>$${Number(r.annual_cap).toLocaleString()}</span>
                                    </div>
                                ` : ''}
                                <div class="detail-grid-item">
                                    <label>Age Range</label>
                                    <span>${ageRange}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Coverage</label>
                                    <span>${r.geographic_coverage || 'National'}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Income Limits</label>
                                    <span>${r.income_limit || 'None'}</span>
                                </div>
                                ${r.application_deadline ? `
                                    <div class="detail-grid-item">
                                        <label>Deadline</label>
                                        <span>${r.application_deadline}</span>
                                    </div>
                                ` : ''}
                                ${r.processing_time ? `
                                    <div class="detail-grid-item">
                                        <label>Processing Time</label>
                                        <span>${r.processing_time}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderTherapyDetail = () => {
    const r = therapyData.find(res => res.resource_id === state.currentDetailId);
    if (!r) return '<div class="detail-page"><div class="detail-content">Resource not found</div></div>';
    
    const services = (r.subcategories || '').split(';').map(s => s.trim()).filter(Boolean);
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="switchResourceTab('therapy'); navigate('resources'); return false;">&larr; Back to Healthcare &amp; Therapy</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-header">
                    <div class="detail-header-main">
                        <div class="detail-image therapy">Healthcare</div>
                        <div>
                            <div class="detail-tags">
                                ${services.slice(0, 2).map(s => `<span class="detail-tag therapy">${s}</span>`).join('')}
                                <span class="detail-tag">${r.jurisdiction_level || 'National'}</span>
                            </div>
                            <h1 class="detail-title">${r.resource_name}</h1>
                            <p class="detail-org">${r.organization_name || ''} &middot; ${r.organization_type || ''}</p>
                        </div>
                    </div>
                    <div class="detail-header-actions">
                        ${r.website ? `<a href="${r.website.startsWith('http') ? r.website : 'https://' + r.website}" target="_blank" class="btn btn-primary">Visit Website &rarr;</a>` : ''}
                        ${r.phone ? `<a href="tel:${r.phone.replace(/[^0-9]/g, '')}" class="btn btn-secondary">&#128222; ${r.phone}</a>` : ''}
                    </div>
                </div>
                
                <div class="detail-body">
                    <div class="detail-main">
                        <div class="detail-section">
                            <h2>Overview</h2>
                            <div class="detail-text">
                                <p>${r.short_description || ''}</p>
                                ${(r.full_description || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                            </div>
                        </div>
                        
                        ${r.key_features ? `
                            <div class="detail-section">
                                <h2>Key Features</h2>
                                <div class="detail-features">${(r.key_features || '').replace(/\\u2022/g, '\u2022')}</div>
                            </div>
                        ` : ''}
                        
                        ${services.length ? `
                            <div class="detail-section">
                                <h2>Services Offered</h2>
                                <div class="card-tags">
                                    ${services.map(s => `<span class="card-tag therapy">${s}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${r.practical_notes ? `
                            <div class="detail-note-card">
                                <h3>&#128161; Important Notes</h3>
                                ${(r.practical_notes || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-sidebar-info">
                        <div class="detail-sidebar-card">
                            <h3>Quick Info</h3>
                            <div class="detail-grid">
                                <div class="detail-grid-item">
                                    <label>DS Experience</label>
                                    <span>${r.ds_experience_level || 'Experienced'}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Cost</label>
                                    <span>${r.cost_type || 'Contact for info'}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Telehealth</label>
                                    <span>${r.telehealth_available || 'Contact provider'}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Medicaid</label>
                                    <span>${r.medicaid_accepted || 'Contact provider'}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Coverage</label>
                                    <span>${r.jurisdiction_level || 'National'}</span>
                                </div>
                                ${r.states_available ? `
                                    <div class="detail-grid-item">
                                        <label>States</label>
                                        <span>${r.states_available}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderInspirationDetail = () => {
    const p = inspirationData.find(prof => prof.profile_id === state.currentDetailId);
    if (!p) return '<div class="detail-page"><div class="detail-content">Profile not found</div></div>';
    
    const fieldColor = getFieldColor(p.primary_field);
    const displayName = p.known_as___stage_name || p.full_name;
    const location = [p.location_city, p.location_state, p.location_country].filter(Boolean).join(', ');
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="navigate('inspiration'); return false;">&larr; Back to Inspiration</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-header">
                    <div class="detail-header-main">
                        <div class="inspiration-avatar" style="width: 80px; height: 80px; font-size: 1.5rem;">${getInitials(p.full_name)}</div>
                        <div>
                            <div class="detail-tags">
                                <span class="detail-tag" style="background: ${fieldColor.bg}; color: ${fieldColor.text};">${normalizeField(p.primary_field)}</span>
                                ${p.secondary_fields ? `<span class="detail-tag">${p.secondary_fields}</span>` : ''}
                            </div>
                            <h1 class="detail-title">${displayName}</h1>
                            <p class="detail-org">${location}</p>
                        </div>
                    </div>
                    <div class="detail-header-actions">
                        ${p.website ? `<a href="${p.website.startsWith('http') ? p.website : 'https://' + p.website}" target="_blank" class="btn btn-primary">Visit Website &rarr;</a>` : ''}
                        ${p.instagram ? `<a href="${p.instagram.startsWith('http') ? p.instagram : 'https://instagram.com/' + p.instagram}" target="_blank" class="btn btn-secondary">Instagram</a>` : ''}
                    </div>
                </div>
                
                <div class="detail-body">
                    <div class="detail-main">
                        <div class="detail-section">
                            <h2>About</h2>
                            <div class="detail-text">
                                <p>${p.short_bio || ''}</p>
                            </div>
                        </div>
                        
                        ${p.specific_achievements || p.key_accomplishments ? `
                            <div class="detail-section">
                                <h2>Achievements</h2>
                                <div class="detail-text">
                                    <p>${p.specific_achievements || p.key_accomplishments || ''}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${p.notable_quotes ? `
                            <div class="detail-note-card" style="background: ${fieldColor.bg}; border-color: ${fieldColor.text}40;">
                                <p style="font-size: 1.25rem; font-style: italic; margin: 0;">"${p.notable_quotes}"</p>
                                <p style="margin-top: 0.75rem; margin-bottom: 0; font-weight: 600;">&mdash; ${displayName}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-sidebar-info">
                        <div class="detail-sidebar-card">
                            <h3>Quick Info</h3>
                            <div class="detail-grid">
                                <div class="detail-grid-item">
                                    <label>Field</label>
                                    <span>${p.primary_field || ''}</span>
                                </div>
                                <div class="detail-grid-item">
                                    <label>Location</label>
                                    <span>${location}</span>
                                </div>
                                ${p.active_since ? `
                                    <div class="detail-grid-item">
                                        <label>Active Since</label>
                                        <span>${p.active_since}</span>
                                    </div>
                                ` : ''}
                                ${p.speaking_available === 'Yes' ? `
                                    <div class="detail-grid-item">
                                        <label>Speaking</label>
                                        <span>Available</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// ============== MAIN RENDER ==============

const render = () => {
    let content = '';
    
    if (state.currentPage === 'detail') {
        if (state.currentDetailType === 'financial') {
            content = renderFinancialDetail();
        } else if (state.currentDetailType === 'therapy') {
            content = renderTherapyDetail();
        } else if (state.currentDetailType === 'inspiration') {
            content = renderInspirationDetail();
        }
    } else if (state.currentPage === 'resources') {
        content = renderResourcesPage();
    } else if (state.currentPage === 'inspiration') {
        content = renderInspirationPage();
    } else if (state.currentPage === 'about') {
        content = renderAboutPage();
    } else {
        content = renderHomePage();
    }
    
    document.getElementById('app').innerHTML = `
        ${renderHeader()}
        ${state.currentPage === 'home' || state.currentPage === 'about' ? `<main style="margin-top: 70px;">${content}</main>` : content}
    `;
};

// ============== INITIALIZE ==============
loadData();
