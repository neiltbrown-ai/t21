// T21 Directory - Main Application
// Restored to match original layout with therapy additions

// ============== SUPABASE CONFIG ==============
const SUPABASE_URL = 'https://qistidaxuevycutiegsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc3RpZGF4dWV2eWN1dGllZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTM5NTAsImV4cCI6MjA4NTI4OTk1MH0.6U6g4gsabRGxvcPAaO1so5cZgS38GqGhKfHmq6E9dSA';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============== DATA ==============
let resourcesData = [];
let therapyData = [];
let inspirationData = [];

// ============== STATE ==============
let currentPage = 'home';
let currentDetailId = null;
let currentDetailType = null;
let currentResourceTab = 'financial';
let sidebarCollapsed = true;
let resourcesVisible = 10;
let therapyVisible = 10;
let inspirationVisible = 12;
let searchQuery = '';

let filters = {
    subcategory: [],
    lifecycle: [],
    jurisdiction: [],
    income: [],
    age: []
};

let therapyFilters = {
    serviceType: [],
    telehealth: [],
    jurisdiction: []
};

let inspirationFilters = {
    field: [],
    country: []
};

// ============== DATA LOADING ==============
// Map Supabase column names to expected app field names
const mapFinancialResource = (row) => ({
    ...row,
    program_id: row.program_id || row.id,
    program_name: row.program_name || row.name,
    program_category: row.program_category || row.category,
    program_description: row.program_description || row.description,
    'key_features_&_benefits': row['key_features_&_benefits'] || row.key_features_benefits || row.key_features,
    'real-world_context': row['real-world_context'] || row.real_world_context
});

async function loadData() {
    try {
        const [finRes, therRes, inspRes] = await Promise.all([
            supabaseClient.from('financial_resources').select('*'),
            supabaseClient.from('therapy_services').select('*'),
            supabaseClient.from('inspiration_profiles').select('*')
        ]);

        if (finRes.error) throw finRes.error;
        if (therRes.error) throw therRes.error;
        if (inspRes.error) throw inspRes.error;

        // Log first row to debug column names
        if (finRes.data.length > 0) {
            console.log('Financial columns:', Object.keys(finRes.data[0]));
        }

        resourcesData = finRes.data.map(mapFinancialResource);
        therapyData = therRes.data;
        inspirationData = inspRes.data;
        console.log(`Loaded: ${resourcesData.length} financial, ${therapyData.length} therapy, ${inspirationData.length} inspiration`);
        render();
    } catch (err) {
        console.error('Error loading data:', err);
        document.getElementById('app').innerHTML = '<div style="padding: 2rem; text-align: center;">Error loading data. Please refresh.</div>';
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
        'Advocacy': { bg: '#dbeafe', text: '#1d4ed8' },
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

// Dynamic value badge based on resource type (from ds_directory_ui_logic.md)
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
window.navigate = function(page, type = null, id = null) {
    currentPage = page;
    currentDetailType = type;
    currentDetailId = id;
    render();
    window.scrollTo(0, 0);
}

window.switchResourceTab = function(tab) {
    currentResourceTab = tab;
    render();
}

window.toggleMenu = function() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('open');
        document.getElementById('menuToggle').classList.toggle('active');
    }
}

window.closeMenu = function() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.remove('open');
        document.getElementById('menuToggle').classList.remove('active');
    }
}

window.toggleSidebar = function() {
    sidebarCollapsed = !sidebarCollapsed;
    render();
}

window.expandSidebar = function() {
    sidebarCollapsed = false;
    render();
}

// ============== FILTERS ==============
window.toggleFilter = function(category, value) {
    const idx = filters[category].indexOf(value);
    if (idx > -1) {
        filters[category].splice(idx, 1);
    } else {
        filters[category].push(value);
    }
    render();
}

window.toggleTherapyFilter = function(category, value) {
    const idx = therapyFilters[category].indexOf(value);
    if (idx > -1) {
        therapyFilters[category].splice(idx, 1);
    } else {
        therapyFilters[category].push(value);
    }
    render();
}

window.toggleInspirationFilter = function(category, value) {
    const idx = inspirationFilters[category].indexOf(value);
    if (idx > -1) {
        inspirationFilters[category].splice(idx, 1);
    } else {
        inspirationFilters[category].push(value);
    }
    render();
}

window.resetFilters = function() {
    filters = { subcategory: [], lifecycle: [], jurisdiction: [], income: [], age: [] };
    render();
}

window.resetTherapyFilters = function() {
    therapyFilters = { serviceType: [], telehealth: [], jurisdiction: [] };
    render();
}

window.resetInspirationFilters = function() {
    inspirationFilters = { field: [], country: [] };
    render();
}

// Search is triggered by pressing Enter in the search input
// No automatic updates during typing to avoid focus issues
window.handleSearch = function(value) {
    searchQuery = value.toLowerCase();
    render();
}

const hasActiveFilters = () => Object.values(filters).some(arr => arr.length > 0);
const hasActiveTherapyFilters = () => Object.values(therapyFilters).some(arr => arr.length > 0);
const hasActiveInspirationFilters = () => Object.values(inspirationFilters).some(arr => arr.length > 0);

// ============== LOAD MORE ==============
window.loadMoreResources = function() {
    resourcesVisible += 10;
    render();
}

window.loadMoreTherapy = function() {
    therapyVisible += 10;
    render();
}

window.loadMoreInspiration = function() {
    inspirationVisible += 12;
    render();
}

// ============== FILTERED DATA ==============
const getFilteredResources = () => {
    let results = [...resourcesData];
    
    if (searchQuery) {
        results = results.filter(r => 
            (r.program_name || '').toLowerCase().includes(searchQuery) ||
            (r.program_description || '').toLowerCase().includes(searchQuery) ||
            (r.program_category || '').toLowerCase().includes(searchQuery)
        );
    }
    
    if (filters.subcategory.length) {
        results = results.filter(r => filters.subcategory.some(f => (r.program_category || '').includes(f)));
    }
    
    if (filters.jurisdiction.length) {
        results = results.filter(r => filters.jurisdiction.includes(r.geographic_coverage));
    }
    
    if (filters.income.includes('no')) {
        results = results.filter(r => !r.income_limit || r.income_limit === 'None' || r.income_limit.toLowerCase().includes('none'));
    }
    
    if (filters.age.length) {
        results = results.filter(r => {
            const ageMin = r.age_range_min || 0;
            const ageMax = r.age_range_max || 99;
            return filters.age.some(range => {
                if (range === '0-3') return ageMin <= 3;
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
    
    if (searchQuery) {
        results = results.filter(r => 
            (r.resource_name || '').toLowerCase().includes(searchQuery) ||
            (r.short_description || '').toLowerCase().includes(searchQuery) ||
            (r.subcategories || '').toLowerCase().includes(searchQuery)
        );
    }
    
    if (therapyFilters.serviceType.length) {
        results = results.filter(r => 
            therapyFilters.serviceType.some(s => (r.subcategories || '').includes(s))
        );
    }
    
    if (therapyFilters.telehealth.length && therapyFilters.telehealth.includes('Yes')) {
        results = results.filter(r => {
            const th = (r.telehealth_available || '').toLowerCase();
            return th === 'yes' || th.includes('yes');
        });
    }
    
    if (therapyFilters.jurisdiction.length) {
        results = results.filter(r => therapyFilters.jurisdiction.includes(r.jurisdiction_level));
    }
    
    return results;
};

const getFilteredInspiration = () => {
    let results = [...inspirationData];
    
    if (inspirationFilters.field.length) {
        results = results.filter(p => {
            const normalizedField = normalizeField(p.primary_field);
            return inspirationFilters.field.includes(normalizedField);
        });
    }
    
    if (inspirationFilters.country.length) {
        results = results.filter(p => {
            const country = (p.location_country || 'USA');
            const normalized = country === 'USA' ? 'United States' : country;
            return inspirationFilters.country.includes(normalized);
        });
    }
    
    return results;
};

// ============== RENDER: SIDEBAR ==============
const renderSidebar = (type) => {
    if (type === 'therapy') {
        return `
            <div class="sidebar ${sidebarCollapsed ? 'collapsed' : ''}">
                <div class="sidebar-header">
                    <span class="sidebar-title">Filters</span>
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&#8249;</button>
                </div>

                <div class="search-box" id="search-box-container">
                    <!-- Search input inserted here by JavaScript -->
                </div>

                <button class="reset-filters-btn ${hasActiveTherapyFilters() ? 'active' : ''}" onclick="resetTherapyFilters()">
                    ${hasActiveTherapyFilters() ? 'Reset Filters' : 'No Filters Applied'}
                </button>
                
                <div class="facet">
                    <div class="facet-title">Service Type</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Service Type">
                        <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${therapyFilters.serviceType.includes('DS Specialty Clinics') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'DS Specialty Clinics')"> DS Specialty Clinics</label>
                    <label class="filter"><input type="checkbox" ${therapyFilters.serviceType.includes('Speech') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Speech')"> Speech Therapy</label>
                    <label class="filter"><input type="checkbox" ${therapyFilters.serviceType.includes('Physical') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Physical')"> Physical Therapy</label>
                    <label class="filter"><input type="checkbox" ${therapyFilters.serviceType.includes('Occupational') ? 'checked' : ''} onchange="toggleTherapyFilter('serviceType', 'Occupational')"> Occupational Therapy</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Telehealth</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Telehealth">
                        <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${therapyFilters.telehealth.includes('Yes') ? 'checked' : ''} onchange="toggleTherapyFilter('telehealth', 'Yes')"> Available</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Coverage</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Coverage">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${therapyFilters.jurisdiction.includes('National') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'National')"> National</label>
                    <label class="filter"><input type="checkbox" ${therapyFilters.jurisdiction.includes('Regional') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'Regional')"> Regional</label>
                    <label class="filter"><input type="checkbox" ${therapyFilters.jurisdiction.includes('State') ? 'checked' : ''} onchange="toggleTherapyFilter('jurisdiction', 'State')"> State</label>
                </div>
            </div>
        `;
    } else if (type === 'inspiration') {
        return `
            <div class="sidebar ${sidebarCollapsed ? 'collapsed' : ''}">
                <div class="sidebar-header">
                    <span class="sidebar-title">Filters</span>
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&#8249;</button>
                </div>
                
                <button class="reset-filters-btn ${hasActiveInspirationFilters() ? 'active' : ''}" onclick="resetInspirationFilters()">
                    ${hasActiveInspirationFilters() ? 'Reset Filters' : 'No Filters Applied'}
                </button>
                
                <div class="facet">
                    <div class="facet-title">Field</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Field">
                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.field.includes('Artist') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Artist')"> Artist</label>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.field.includes('Athlete') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Athlete')"> Athlete</label>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.field.includes('Entrepreneur') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Entrepreneur')"> Entrepreneur</label>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.field.includes('Modeling') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Modeling')"> Modeling</label>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.field.includes('Performing Arts') ? 'checked' : ''} onchange="toggleInspirationFilter('field', 'Performing Arts')"> Performing Arts</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Country</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Country">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.country.includes('Australia') ? 'checked' : ''} onchange="toggleInspirationFilter('country', 'Australia')"> Australia</label>
                    <label class="filter"><input type="checkbox" ${inspirationFilters.country.includes('United States') ? 'checked' : ''} onchange="toggleInspirationFilter('country', 'United States')"> United States</label>
                </div>
            </div>
        `;
    } else {
        // Financial resources sidebar
        return `
            <div class="sidebar ${sidebarCollapsed ? 'collapsed' : ''}">
                <div class="sidebar-header">
                    <span class="sidebar-title">Filters</span>
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()">&#8249;</button>
                </div>

                <div class="search-box" id="search-box-container">
                    <!-- Search input inserted here by JavaScript -->
                </div>

                <button class="reset-filters-btn ${hasActiveFilters() ? 'active' : ''}" onclick="resetFilters()">
                    ${hasActiveFilters() ? 'Reset Filters' : 'No Filters Applied'}
                </button>
                
                <div class="facet">
                    <div class="facet-title">Category</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Category">
                        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${filters.subcategory.includes('Government Benefits') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Government Benefits')"> Government Benefits</label>
                    <label class="filter"><input type="checkbox" ${filters.subcategory.includes('Savings') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Savings')"> Savings Programs</label>
                    <label class="filter"><input type="checkbox" ${filters.subcategory.includes('Grant') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Grant')"> Grants</label>
                    <label class="filter"><input type="checkbox" ${filters.subcategory.includes('Scholarship') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Scholarship')"> Scholarships</label>
                    <label class="filter"><input type="checkbox" ${filters.subcategory.includes('Insurance') ? 'checked' : ''} onchange="toggleFilter('subcategory', 'Insurance')"> Health Insurance</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Age Range</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Age">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${filters.age.includes('0-3') ? 'checked' : ''} onchange="toggleFilter('age', '0-3')"> Birth&#8211;3</label>
                    <label class="filter"><input type="checkbox" ${filters.age.includes('3-5') ? 'checked' : ''} onchange="toggleFilter('age', '3-5')"> 3&#8211;5 Years</label>
                    <label class="filter"><input type="checkbox" ${filters.age.includes('5-18') ? 'checked' : ''} onchange="toggleFilter('age', '5-18')"> 5&#8211;18 Years</label>
                    <label class="filter"><input type="checkbox" ${filters.age.includes('18+') ? 'checked' : ''} onchange="toggleFilter('age', '18+')"> 18+ Adults</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Coverage</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Coverage">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${filters.jurisdiction.includes('National') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'National')"> National</label>
                    <label class="filter"><input type="checkbox" ${filters.jurisdiction.includes('Multi-State') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'Multi-State')"> Multi-State</label>
                    <label class="filter"><input type="checkbox" ${filters.jurisdiction.includes('State') ? 'checked' : ''} onchange="toggleFilter('jurisdiction', 'State')"> State</label>
                </div>
                
                <div class="facet">
                    <div class="facet-title">Income Limits</div>
                    <button class="facet-icon" onclick="expandSidebar()" title="Income">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </button>
                    <label class="filter"><input type="checkbox" ${filters.income.includes('no') ? 'checked' : ''} onchange="toggleFilter('income', 'no')"> No Income Limits</label>
                </div>
            </div>
        `;
    }
};

const renderFooter = () => `
    <footer>
        <div class="footer-content">
            <span class="footer-text">&#169; 2026 T21 Directory. All rights reserved.</span>
            <span class="footer-text">Made with &#10084;&#65039; for the DS community</span>
        </div>
    </footer>
`;

// ============== RENDER: HOME PAGE ==============
const renderHomePage = () => `
    <div class="home-hero">
        <div class="home-hero-content">
            <h1>Resources for the Down Syndrome Community</h1>
            <p>A comprehensive directory of financial resources, healthcare services, and inspiring individuals. Built by the community, for the community.</p>
            <div class="home-hero-buttons">
                <a href="#" class="btn btn-primary" onclick="navigate('resources'); return false;">Browse Resources &#8594;</a>
                <a href="#" class="btn btn-secondary-light" onclick="navigate('inspiration'); return false;">Meet Inspiring Individuals &#8594;</a>
            </div>
        </div>
    </div>
    
    <div class="home-stats">
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-primary);">
                <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-value">${resourcesData.length}</div>
            <div class="stat-label">Financial Resources</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: #8b5cf6;">
                <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <div class="stat-value">${therapyData.length}</div>
            <div class="stat-label">Healthcare Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-secondary);">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="stat-value">${inspirationData.length}</div>
            <div class="stat-label">Inspiring Individuals</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: var(--color-tertiary);">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div class="stat-value">50</div>
            <div class="stat-label">States Covered</div>
        </div>
    </div>
    
    <div class="home-section">
        <div class="home-section-header">
            <h2>Explore the Directory</h2>
            <p>Find the support you need, from financial assistance to healthcare to inspiring role models.</p>
        </div>
        <div class="home-cards three-col">
            <a href="#" class="home-card blue" onclick="navigate('resources'); return false;">
                <div class="home-card-content">
                    <div class="home-card-icon" style="background: var(--color-primary);">
                        <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h3>Financial Resources</h3>
                    <p>Discover ${resourcesData.length}+ grants, benefits, scholarships, and support programs.</p>
                    <div class="home-card-tags">
                        <span class="home-card-tag">Government Benefits</span>
                        <span class="home-card-tag">Grants</span>
                        <span class="home-card-tag">Scholarships</span>
                    </div>
                    <span class="home-card-link">Browse Resources &#8594;</span>
                </div>
            </a>
            <a href="#" class="home-card purple" onclick="switchResourceTab('therapy'); navigate('resources'); return false;">
                <div class="home-card-content">
                    <div class="home-card-icon" style="background: #8b5cf6;">
                        <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    </div>
                    <h3>Healthcare &amp; Therapy</h3>
                    <p>Find ${therapyData.length}+ specialized clinics, therapy services, and providers.</p>
                    <div class="home-card-tags">
                        <span class="home-card-tag">DS Clinics</span>
                        <span class="home-card-tag">Speech Therapy</span>
                        <span class="home-card-tag">Telehealth</span>
                    </div>
                    <span class="home-card-link">Find Services &#8594;</span>
                </div>
            </a>
            <a href="#" class="home-card teal" onclick="navigate('inspiration'); return false;">
                <div class="home-card-content">
                    <div class="home-card-icon" style="background: var(--color-secondary);">
                        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h3>Inspiring Individuals</h3>
                    <p>Meet ${inspirationData.length}+ role models &#8212; athletes, artists, entrepreneurs, advocates.</p>
                    <div class="home-card-tags">
                        <span class="home-card-tag">Athletes</span>
                        <span class="home-card-tag">Artists</span>
                        <span class="home-card-tag">Entrepreneurs</span>
                    </div>
                    <span class="home-card-link">Meet Inspiring Individuals &#8594;</span>
                </div>
            </a>
        </div>
    </div>
    ${renderFooter()}
`;

// ============== RENDER: RESOURCES RESULTS (for search without losing focus) ==============
const renderResourcesResults = () => {
    const isTherapy = currentResourceTab === 'therapy';
    const filteredFinancial = getFilteredResources();
    const filteredTherapy = getFilteredTherapy();
    const visibleFinancial = filteredFinancial.slice(0, resourcesVisible);
    const visibleTherapy = filteredTherapy.slice(0, therapyVisible);
    const hasMoreFinancial = filteredFinancial.length > resourcesVisible;
    const hasMoreTherapy = filteredTherapy.length > therapyVisible;

    if (isTherapy) {
        return `
            <div class="results-header">
                <span class="results-count">Showing ${visibleTherapy.length} of ${filteredTherapy.length} services</span>
                <div class="sort-controls">
                    <label>Sort by:</label>
                    <select><option>Relevance</option><option>Name (A-Z)</option></select>
                </div>
            </div>

            ${visibleTherapy.map(r => {
                const services = (r.subcategories || '').split(';').slice(0, 2).map(s => s.trim());
                const isTelehealth = (r.telehealth_available || '').toLowerCase().includes('yes');
                const isFree = (r.cost_type || '').toLowerCase() === 'free';
                const isExpert = (r.ds_experience_level || '').includes('Expert');

                return `
                    <div class="card" onclick="navigate('detail', 'therapy', '${r.resource_id}')">
                        <div class="card-image therapy">Healthcare</div>
                        <div class="card-body">
                            <div class="card-title">${r.resource_name || ''}</div>
                            <div class="card-org">${r.organization_name || ''}</div>
                            <div class="card-desc">${r.short_description || ''}</div>
                            <div class="card-tags">
                                ${services.map(s => `<span class="card-tag therapy">${s}</span>`).join('')}
                                <span class="card-tag">${r.jurisdiction_level || 'National'}</span>
                            </div>
                        </div>
                        <div class="card-badges">
                            ${isTelehealth ? '<span class="info-badge telehealth">Telehealth</span>' : ''}
                            ${isFree ? '<span class="info-badge free">Free</span>' : ''}
                            ${isExpert ? '<span class="info-badge expert">DS Expert</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('')}

            ${hasMoreTherapy ? `<button class="load-more-btn" onclick="loadMoreTherapy()">LOAD MORE (${filteredTherapy.length - therapyVisible} remaining)</button>` : ''}
        `;
    } else {
        return `
            <div class="results-header">
                <span class="results-count">Showing ${visibleFinancial.length} of ${filteredFinancial.length} resources</span>
                <div class="sort-controls">
                    <label>Sort by:</label>
                    <select><option>Relevance</option><option>Amount (High to Low)</option><option>Name (A-Z)</option></select>
                </div>
            </div>

            ${visibleFinancial.map(r => {
                const badge = getValueBadge(r);
                return `
                    <div class="card" onclick="navigate('detail', 'financial', '${r.program_id}')">
                        <div class="card-image">Financial</div>
                        <div class="card-body">
                            <div class="card-title">${r.program_name || ''}</div>
                            <div class="card-org">${r.organization_type || ''}</div>
                            <div class="card-desc">${(r.program_description || '').substring(0, 150)}${(r.program_description || '').length > 150 ? '...' : ''}</div>
                            <div class="card-tags">
                                <span class="card-tag">${r.program_category || ''}</span>
                                <span class="card-tag">${r.geographic_coverage || ''}</span>
                                ${r.income_limit === 'None' || !r.income_limit ? '<span class="card-tag highlight">No Income Limits</span>' : ''}
                            </div>
                        </div>
                        <div class="card-amount">
                            <span class="card-amount-label">${badge.label}</span>
                            <span class="card-amount-value">${badge.value}</span>
                        </div>
                    </div>
                `;
            }).join('')}

            ${hasMoreFinancial ? `<button class="load-more-btn" onclick="loadMoreResources()">LOAD MORE (${filteredFinancial.length - resourcesVisible} remaining)</button>` : ''}
        `;
    }
};

// ============== RENDER: RESOURCES PAGE ==============
const renderResourcesPage = () => {
    const isTherapy = currentResourceTab === 'therapy';

    return `
        <div class="main-wrapper">
            ${renderSidebar(isTherapy ? 'therapy' : 'resources')}
            <div class="content">
                <div class="page-header">
                    <h1 class="page-title">Resources Directory</h1>
                    <p class="page-subtitle">Comprehensive support resources for the Down syndrome community.</p>
                </div>

                <div class="sub-tabs">
                    <button class="sub-tab ${currentResourceTab === 'financial' ? 'active' : ''}" onclick="switchResourceTab('financial')">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Financial &amp; Benefits
                        <span class="tab-count">${resourcesData.length}</span>
                    </button>
                    <button class="sub-tab ${currentResourceTab === 'therapy' ? 'active' : ''}" onclick="switchResourceTab('therapy')">
                        <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        Healthcare &amp; Therapy
                        <span class="tab-count">${therapyData.length}</span>
                    </button>
                </div>

                <div id="search-results-container">
                    ${renderResourcesResults()}
                </div>
            </div>
        </div>
    `;
};

// ============== RENDER: INSPIRATION PAGE ==============
const renderInspirationPage = () => {
    const filtered = getFilteredInspiration();
    const visible = filtered.slice(0, inspirationVisible);
    const hasMore = filtered.length > inspirationVisible;
    
    return `
        <div class="main-wrapper">
            ${renderSidebar('inspiration')}
            <div class="content">
                <div class="page-header">
                    <h1 class="page-title">Inspiring Individuals</h1>
                    <p class="page-subtitle">Meet role models making an impact &#8212; athletes, artists, entrepreneurs, advocates, and more.</p>
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
                                    <div class="inspiration-card-header-text">
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
                
                ${hasMore ? `<button class="load-more-btn" onclick="loadMoreInspiration()">LOAD MORE (${filtered.length - inspirationVisible} remaining)</button>` : ''}
            </div>
        </div>
    `;
};

// ============== RENDER: DETAIL PAGES ==============
const renderFinancialDetail = () => {
    const r = resourcesData.find(res => res.program_id === currentDetailId);
    if (!r) return '<div class="detail-page"><div class="detail-content">Resource not found</div></div>';
    
    const badge = getValueBadge(r);
    const ageMin = r.age_range_min || 0;
    const ageMax = r.age_range_max || 99;
    const ageRange = `${ageMin === 0 ? 'Birth' : ageMin} \u2013 ${ageMax >= 99 ? 'All ages' : ageMax + ' years'}`;
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="navigate('resources'); return false;">&#8592; Back to Resources</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-image-banner">
                    ${r.image_url ? `<img src="${r.image_url}" alt="${r.program_name}">` : ''}
                </div>
                
                <h1 class="detail-title">${r.program_name}</h1>
                <p class="detail-org">${r.organization_type || ''}</p>
                
                <div class="detail-amount-box">
                    <div class="detail-amount-label">${badge.label}</div>
                    <div class="detail-amount-value">${badge.value}</div>
                    ${r.annual_cap ? `<div style="font-size: 0.85rem; color: var(--color-gray-text); margin-top: 0.25rem;">Up to $${Number(r.annual_cap).toLocaleString()}/year</div>` : ''}
                </div>
                
                <div class="detail-tags">
                    <span class="detail-tag">${r.program_category || ''}</span>
                    <span class="detail-tag">${r.geographic_coverage || ''}</span>
                    ${!r.income_limit || r.income_limit === 'None' ? '<span class="detail-tag green">No Income Limits</span>' : ''}
                </div>
                
                <div class="detail-description">
                    ${(r.program_description || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                <div class="detail-actions">
                    ${r.website ? `<a href="${r.website.startsWith('http') ? r.website : 'https://' + r.website}" target="_blank" class="btn btn-primary">Visit Website &#8594;</a>` : ''}
                    ${r.phone ? `<a href="tel:${r.phone.replace(/[^0-9]/g, '')}" class="btn btn-secondary">&#128222; ${r.phone}</a>` : ''}
                </div>
                
                ${r['key_features_&_benefits'] ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Key Features &amp; Benefits</h2>
                        <div class="detail-description">
                            <p style="white-space: pre-line;">${r['key_features_&_benefits']}</p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-section">
                    <h2 class="detail-section-title">Eligibility &amp; Details</h2>
                    <div class="detail-grid">
                        <div class="detail-grid-item">
                            <label>Age Range</label>
                            <span>${ageRange}</span>
                        </div>
                        <div class="detail-grid-item">
                            <label>Application Deadline</label>
                            <span>${r.application_deadline || 'Rolling'}</span>
                        </div>
                        <div class="detail-grid-item">
                            <label>Income Limits</label>
                            <span>${!r.income_limit || r.income_limit === 'None' ? 'None' : (r.income_limit_details || r.income_limit || 'See details')}</span>
                        </div>
                        ${r.processing_time ? `
                            <div class="detail-grid-item">
                                <label>Processing Time</label>
                                <span>${r.processing_time}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${r.diagnosis_required ? `
                        <div class="detail-info-item">
                            <label>Diagnosis Required</label>
                            <span>${r.diagnosis_required}</span>
                        </div>
                    ` : ''}
                    
                    ${r.covered_expenses ? `
                        <div class="detail-info-item">
                            <label>Covered Expenses</label>
                            <span>${r.covered_expenses}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${r['real-world_context'] ? `
                    <div class="detail-note-card">
                        <h3>&#128161; Important Notes</h3>
                        ${r['real-world_context'].split('\n\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

const renderTherapyDetail = () => {
    const r = therapyData.find(res => res.resource_id === currentDetailId);
    if (!r) return '<div class="detail-page"><div class="detail-content">Resource not found</div></div>';
    
    const services = (r.subcategories || '').split(';').map(s => s.trim()).filter(Boolean);
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="switchResourceTab('therapy'); navigate('resources'); return false;">&#8592; Back to Healthcare &amp; Therapy</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="detail-image-banner" style="background: linear-gradient(135deg, #8B5CF6 0%, #c4b5fd 100%);">
                    ${r.image_url ? `<img src="${r.image_url}" alt="${r.resource_name}">` : ''}
                </div>
                
                <h1 class="detail-title">${r.resource_name}</h1>
                <p class="detail-org">${r.organization_name || ''} &#8226; ${r.organization_type || ''}</p>
                
                <div class="detail-tags">
                    ${services.slice(0, 3).map(s => `<span class="detail-tag therapy">${s}</span>`).join('')}
                    <span class="detail-tag">${r.jurisdiction_level || 'National'}</span>
                </div>
                
                <div class="detail-description">
                    <p>${r.short_description || ''}</p>
                    ${(r.full_description || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                
                <div class="detail-actions">
                    ${r.website ? `<a href="${r.website.startsWith('http') ? r.website : 'https://' + r.website}" target="_blank" class="btn btn-primary">Visit Website &#8594;</a>` : ''}
                    ${r.phone ? `<a href="tel:${r.phone.replace(/[^0-9]/g, '')}" class="btn btn-secondary">&#128222; ${r.phone}</a>` : ''}
                </div>
                
                ${r.key_features ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Key Features</h2>
                        <div class="detail-description">
                            <p style="white-space: pre-line;">${r.key_features}</p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-section">
                    <h2 class="detail-section-title">Service Details</h2>
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
                            <label>Medicaid Accepted</label>
                            <span>${r.medicaid_accepted || 'Contact provider'}</span>
                        </div>
                        <div class="detail-grid-item">
                            <label>Coverage Area</label>
                            <span>${r.jurisdiction_level || 'National'}</span>
                        </div>
                        ${r.states_available ? `
                            <div class="detail-grid-item">
                                <label>States Served</label>
                                <span>${r.states_available}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${r.practical_notes ? `
                    <div class="detail-note-card">
                        <h3>&#128161; Important Notes</h3>
                        ${r.practical_notes.split('\n\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

const renderInspirationDetail = () => {
    const p = inspirationData.find(prof => prof.profile_id === currentDetailId);
    if (!p) return '<div class="detail-page"><div class="detail-content">Profile not found</div></div>';
    
    const fieldColor = getFieldColor(p.primary_field);
    const displayName = p.known_as___stage_name || p.full_name;
    const location = [p.location_city, p.location_state, p.location_country].filter(Boolean).join(', ');
    
    return `
        <div class="detail-page">
            <div class="detail-back-bar">
                <div class="detail-back-bar-content">
                    <a href="#" class="back-link" onclick="navigate('inspiration'); return false;">&#8592; Back to Inspiration</a>
                </div>
            </div>
            <div class="detail-content">
                <div class="inspiration-detail-header">
                    <div class="inspiration-detail-banner"></div>
                    <div class="inspiration-detail-profile">
                        <div class="inspiration-detail-avatar">${getInitials(p.full_name)}</div>
                        <h1 class="inspiration-detail-name">${displayName}</h1>
                        ${p.full_name !== displayName ? `<p class="inspiration-detail-subname">${p.full_name}</p>` : ''}
                        <div class="inspiration-detail-meta">
                            <span>&#128205; ${location}</span>
                            ${p.active_since ? `<span>&#128197; Active since ${p.active_since}</span>` : ''}
                        </div>
                        <div class="inspiration-detail-links">
                            ${p.website ? `<a href="${p.website.startsWith('http') ? p.website : 'https://' + p.website}" target="_blank" class="social-link">&#127760; Website</a>` : ''}
                            ${p.instagram ? `<a href="${p.instagram.startsWith('http') ? p.instagram : 'https://instagram.com/' + p.instagram}" target="_blank" class="social-link">&#128247; Instagram</a>` : ''}
                            ${p.tiktok ? `<a href="${p.tiktok.startsWith('http') ? p.tiktok : 'https://tiktok.com/@' + p.tiktok}" target="_blank" class="social-link">TikTok</a>` : ''}
                            ${p.youtube ? `<a href="${p.youtube}" target="_blank" class="social-link">&#9658; YouTube</a>` : ''}
                        </div>
                        <div class="inspiration-detail-badges">
                            <span class="inspiration-badge" style="background: ${fieldColor.bg}; color: ${fieldColor.text};">${normalizeField(p.primary_field)}</span>
                            ${p.secondary_fields ? `<span class="inspiration-badge" style="background: #f3f4f6; color: #374151;">${p.secondary_fields}</span>` : ''}
                            ${p.speaking_available === 'Yes' ? `<span class="inspiration-badge" style="background: #dbeafe; color: #1d4ed8;">&#127908; Speaker</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h2 class="detail-section-title">About</h2>
                    <div class="detail-description">
                        <p>${p.short_bio || ''}</p>
                    </div>
                </div>
                
                ${p.specific_achievements || p.key_accomplishments ? `
                    <div class="detail-section">
                        <h2 class="detail-section-title">Achievements</h2>
                        <div class="detail-description">
                            <p>${p.specific_achievements || p.key_accomplishments || ''}</p>
                        </div>
                    </div>
                ` : ''}
                
                ${p.notable_quotes ? `
                    <div class="quote-card">
                        <blockquote>"${p.notable_quotes}"</blockquote>
                        <cite>&#8212; ${displayName}</cite>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

// ============== RENDER: ABOUT PAGE ==============
const renderAboutPage = () => `
    <div class="about-page" style="margin-top: 70px;">
        <div class="about-hero">
            <div class="about-hero-content">
                <h1>Building an Operating System for Thriving</h1>
                <p>Every family raising a child with Down syndrome deserves a roadmap &mdash; not just to survive, but to truly thrive.</p>
            </div>
        </div>
        
        <div class="about-content">
            <div class="about-section">
                <h2>The Challenge</h2>
                <p>When you become a parent to a child with Down syndrome, you quickly realize that love isn't enough. You need to become an advocate, a researcher, a benefits specialist, an IEP negotiator, a therapy coordinator, and so much more &mdash; often all before your morning coffee.</p>
                <p>Finding the right therapists. Understanding SSI and Medicaid waivers. Navigating the school system. Discovering inclusive sports programs. Connecting with other families who get it. Each of these is its own full-time job, and there's no single place to find what you need.</p>
                <p>For families who travel frequently, the challenge multiplies. Resources vary by state. Programs have different eligibility requirements. What works in one city may not exist in another.</p>
            </div>
            
            <div class="about-section">
                <h2>The Vision</h2>
                <p>T21 is more than a directory &mdash; it's an operating system for families. A framework for building a wonderful life where your child with Down syndrome can reach their full potential, and your entire family can thrive together.</p>
                <p>We believe that access to information shouldn't depend on how many Facebook groups you've joined, which parent advocates you happen to know, or how many hours you can spend researching. Every family deserves to know about the $50+ billion in annual funding available, the free therapy programs, the inclusive schools, and the inspiring role models who prove what's possible.</p>
                
                <div class="about-pillars">
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-primary);">
                            <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <h3>Financial Foundation</h3>
                        <p>Navigate benefits, grants, and scholarships that can provide hundreds of thousands of dollars in support over your child's lifetime.</p>
                    </div>
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-secondary);">
                            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h3>Community &amp; Inspiration</h3>
                        <p>Connect with role models, advocates, and families who show what's possible and remind us we're not alone on this journey.</p>
                    </div>
                    <div class="about-pillar">
                        <div class="about-pillar-icon" style="background: var(--color-tertiary);">
                            <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                        <h3>Knowledge &amp; Advocacy</h3>
                        <p>Arm yourself with the information you need to advocate effectively &mdash; at school, with healthcare providers, and in your community.</p>
                    </div>
                </div>
            </div>
            
            <div class="about-section about-personal">
                <h2>Our Story</h2>
                <p>T21 was born from our own family's journey. We have two boys &mdash; ages 9 and 6. Our younger son has Down syndrome, and from the moment of his diagnosis, we dove headfirst into learning everything we could to give him the best possible life.</p>
                <p>We've spent countless hours researching therapies, applying for benefits, advocating at our amazing public school, finding inclusive recreational activities, and connecting with other families. It's nearly a full-time job on top of our actual full-time jobs &mdash; and we're lucky to have the time and resources to do it.</p>
                <p>But we kept thinking: what about families who don't have these advantages? What about the single parent working two jobs? The family in a rural area without a local Down syndrome association? The parents who don't know that their child automatically qualifies for SSI, or that early intervention services are free and federally guaranteed?</p>
                <p>We travel frequently as a family, and we've seen firsthand how resources vary dramatically from place to place. We wanted to build the tool we wished existed &mdash; a comprehensive, searchable, always-updated directory that any family could use to find the support they need, wherever they are.</p>
                <p>That's T21. And we're just getting started.</p>
            </div>
            
            <div class="about-section about-cta">
                <h2>Join Us</h2>
                <p>T21 is a community effort. We're building this directory together &mdash; parents, advocates, organizations, and allies who believe every family deserves access to the resources that can change lives.</p>
                <div class="about-cta-buttons">
                    <a href="#" class="btn btn-primary" onclick="navigate('resources'); return false;">Explore Resources &rarr;</a>
                    <button class="btn btn-secondary">Submit a Resource</button>
                    <button class="btn btn-secondary">Get Involved</button>
                </div>
            </div>
        </div>
        ${renderFooter()}
    </div>
`;

// Persistent search input element (never destroyed)
let persistentSearchInput = null;
let searchDebounceTimer = null;

// Create the persistent search input once
const getOrCreateSearchInput = () => {
    if (!persistentSearchInput) {
        persistentSearchInput = document.createElement('input');
        persistentSearchInput.type = 'text';
        persistentSearchInput.id = 'sidebar-search-input';
        persistentSearchInput.className = 'search-input';
        persistentSearchInput.placeholder = 'Search...';
        // Debounced auto-search as user types
        persistentSearchInput.addEventListener('input', (e) => {
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
            }
            const input = e.target;
            searchDebounceTimer = setTimeout(() => {
                const cursorPos = input.selectionStart;
                searchQuery = input.value.toLowerCase();
                const resultsContainer = document.getElementById('search-results-container');
                if (resultsContainer && currentPage === 'resources') {
                    resultsContainer.innerHTML = renderResourcesResults();
                    // Restore focus after DOM update
                    input.focus();
                    input.setSelectionRange(cursorPos, cursorPos);
                }
            }, 300);
        });
    }
    return persistentSearchInput;
};

// ============== MAIN RENDER ==============
const render = () => {
    let content = '';

    if (currentPage === 'detail') {
        if (currentDetailType === 'financial') {
            content = renderFinancialDetail();
        } else if (currentDetailType === 'therapy') {
            content = renderTherapyDetail();
        } else if (currentDetailType === 'inspiration') {
            content = renderInspirationDetail();
        }
    } else if (currentPage === 'resources') {
        content = renderResourcesPage();
    } else if (currentPage === 'inspiration') {
        content = renderInspirationPage();
    } else if (currentPage === 'about') {
        content = renderAboutPage();
    } else {
        content = renderHomePage();
    }
    
    const header = `
        <header>
            <div class="header-content">
                <a href="#" class="logo" onclick="navigate('home'); return false;">T21</a>
                <nav>
                    <a href="#" class="${currentPage === 'home' ? 'active' : ''}" onclick="navigate('home'); return false;">Home</a>
                    <a href="#" class="${currentPage === 'resources' ? 'active' : ''}" onclick="navigate('resources'); return false;">Resources</a>
                    <a href="#" class="${currentPage === 'inspiration' ? 'active' : ''}" onclick="navigate('inspiration'); return false;">Inspiration</a>
                    <a href="#" class="${currentPage === 'about' ? 'active' : ''}" onclick="navigate('about'); return false;">About</a>
                    <a href="#">Contact</a>
                    <a href="#">Give</a>
                </nav>
                <button class="menu-toggle" id="menuToggle" onclick="toggleMenu()">&#9776;</button>
            </div>
        </header>
        <div class="mobile-menu-overlay" id="mobileMenu">
            <a href="#" class="${currentPage === 'home' ? 'active' : ''}" onclick="navigate('home'); closeMenu(); return false;">Home</a>
            <a href="#" class="${currentPage === 'resources' ? 'active' : ''}" onclick="navigate('resources'); closeMenu(); return false;">Resources</a>
            <a href="#" class="${currentPage === 'inspiration' ? 'active' : ''}" onclick="navigate('inspiration'); closeMenu(); return false;">Inspiration</a>
            <a href="#" class="${currentPage === 'about' ? 'active' : ''}" onclick="navigate('about'); closeMenu(); return false;">About</a>
            <a href="#" onclick="closeMenu();">Contact</a>
            <a href="#" onclick="closeMenu();">Give</a>
        </div>
    `;
    
    // Check if search input had focus before render
    const searchHadFocus = persistentSearchInput && document.activeElement === persistentSearchInput;
    const cursorPos = persistentSearchInput ? persistentSearchInput.selectionStart : 0;

    document.getElementById('app').innerHTML = header + (currentPage === 'home' ? `<main style="margin-top: 70px;">${content}</main>` : content);

    // Insert persistent search input into container (if on resources page)
    const searchContainer = document.getElementById('search-box-container');
    if (searchContainer) {
        const input = getOrCreateSearchInput();
        // Update placeholder based on current tab
        input.placeholder = currentResourceTab === 'therapy' ? 'Search services...' : 'Search resources...';
        searchContainer.appendChild(input);

        // Restore focus if it had focus before render
        if (searchHadFocus) {
            input.focus();
            try {
                input.setSelectionRange(cursorPos, cursorPos);
            } catch (e) {}
        }
    }
};

// ============== INITIALIZE ==============
loadData();
