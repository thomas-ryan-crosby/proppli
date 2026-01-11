// Global state
let selectedPropertyId = localStorage.getItem('selectedPropertyId') || '';
let currentView = 'active'; // 'active' or 'completed'
let currentPage = localStorage.getItem('currentPage') || 'maintenance'; // 'maintenance', 'properties', 'tenants'
let editingTicketId = null;
let editingPropertyId = null;
let beforePhotoFile = null;
let afterPhotoFile = null;
let beforePhotoUrl = null;
let afterPhotoUrl = null;
let completionAfterPhotoFile = null;

// Initialize app
function startApp() {
    console.log('📄 Starting app initialization...');
    
    // Wait a bit for config script to load if it hasn't already
    const checkFirebase = () => {
        if (typeof firebase === 'undefined') {
            console.warn('⏳ Waiting for Firebase SDK...');
            setTimeout(checkFirebase, 100);
            return;
        }
        
        if (typeof db === 'undefined') {
            console.warn('⏳ Waiting for Firebase db initialization...');
            setTimeout(checkFirebase, 100);
            return;
        }
        
        console.log('✅ Firebase initialized successfully');
        console.log('🚀 Initializing app...');
        initializeApp();
    };
    
    // Start checking
    checkFirebase();
}

// Check if DOM is already loaded, if so run immediately, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    // DOM is already loaded, run immediately
    startApp();
}

function initializeApp() {
    setupEventListeners();
    setupNavigation();
    loadProperties();
    loadTickets();
    showPage(currentPage);
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = e.target.getAttribute('data-page');
            switchPage(page);
        });
    });
}

function switchPage(page) {
    currentPage = page;
    localStorage.setItem('currentPage', page);
    showPage(page);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
}

function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        pageElement.style.display = 'block';
    }
    
    // Update nav link active state to match the page
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // Load page-specific data
    if (page === 'properties') {
        loadProperties();
    } else if (page === 'tenants') {
        loadTenants();
    } else if (page === 'maintenance') {
        loadTickets();
    }
}

// Event Listeners
function setupEventListeners() {
    // Property management (on Properties page)
    const closePropertyModalBtn = document.getElementById('closePropertyModal');
    const addPropertyBtn = document.getElementById('addPropertyBtn');
    const propertyForm = document.getElementById('propertyForm');
    const cancelPropertyFormBtn = document.getElementById('cancelPropertyForm');
    const propertySelect = document.getElementById('propertySelect');
    
    if (closePropertyModalBtn) closePropertyModalBtn.addEventListener('click', closePropertyModal);
    if (addPropertyBtn) addPropertyBtn.addEventListener('click', showAddPropertyForm);
    if (propertyForm) propertyForm.addEventListener('submit', handlePropertySubmit);
    if (cancelPropertyFormBtn) cancelPropertyFormBtn.addEventListener('click', hidePropertyForm);
    if (propertySelect) propertySelect.addEventListener('change', handlePropertySelect);
    
    // Back to properties button
    const backToPropertiesBtn = document.getElementById('backToPropertiesBtn');
    if (backToPropertiesBtn) {
        backToPropertiesBtn.addEventListener('click', function() {
            const propertiesList = document.querySelector('.properties-page-content .section');
            const propertyDetailView = document.getElementById('propertyDetailView');
            
            if (propertiesList) propertiesList.style.display = 'block';
            if (propertyDetailView) propertyDetailView.style.display = 'none';
        });
    }
    
    // Property type change handler for conditional fields
    const propertyTypeSelect = document.getElementById('propertyType');
    if (propertyTypeSelect) propertyTypeSelect.addEventListener('change', updatePropertyTypeFields);
    
    // Property edit modal
    const closePropertyEditModalBtn = document.getElementById('closePropertyEditModal');
    const propertyEditForm = document.getElementById('propertyEditForm');
    const cancelPropertyEditFormBtn = document.getElementById('cancelPropertyEditForm');
    
    if (closePropertyEditModalBtn) closePropertyEditModalBtn.addEventListener('click', closePropertyEditModal);
    if (propertyEditForm) propertyEditForm.addEventListener('submit', handlePropertyEditSubmit);
    if (cancelPropertyEditFormBtn) cancelPropertyEditFormBtn.addEventListener('click', closePropertyEditModal);

    // Ticket management
    const createTicketBtn = document.getElementById('createTicketBtn');
    const closeTicketModalBtn = document.getElementById('closeTicketModal');
    const ticketForm = document.getElementById('ticketForm');
    const cancelTicketFormBtn = document.getElementById('cancelTicketForm');
    const ticketStatus = document.getElementById('ticketStatus');
    
    if (createTicketBtn) createTicketBtn.addEventListener('click', openTicketModal);
    if (closeTicketModalBtn) closeTicketModalBtn.addEventListener('click', closeTicketModal);
    if (ticketForm) ticketForm.addEventListener('submit', handleTicketSubmit);
    if (cancelTicketFormBtn) cancelTicketFormBtn.addEventListener('click', closeTicketModal);
    if (ticketStatus) ticketStatus.addEventListener('change', handleStatusChange);
    
    // Billing type toggle
    const billingTypeHourly = document.getElementById('billingTypeHourly');
    const billingTypeFlat = document.getElementById('billingTypeFlat');
    const billingRateLabel = document.getElementById('billingRateLabel');
    const billingRateInput = document.getElementById('billingRate');
    
    if (billingTypeHourly && billingTypeFlat && billingRateLabel) {
        billingTypeHourly.addEventListener('change', updateBillingRateLabel);
        billingTypeFlat.addEventListener('change', updateBillingRateLabel);
    }
    
    function updateBillingRateLabel() {
        if (billingTypeHourly && billingTypeFlat && billingRateLabel && billingRateInput) {
            if (billingTypeHourly.checked) {
                billingRateLabel.textContent = 'Billing Rate ($/hour)';
                billingRateInput.placeholder = 'e.g., 75.00';
            } else if (billingTypeFlat.checked) {
                billingRateLabel.textContent = 'Flat Rate Amount ($)';
                billingRateInput.placeholder = 'e.g., 500.00';
            }
        }
    }
    
    // File upload handlers
    const beforePhoto = document.getElementById('beforePhoto');
    const afterPhoto = document.getElementById('afterPhoto');
    const removeBeforePhotoBtn = document.getElementById('removeBeforePhoto');
    const removeAfterPhotoBtn = document.getElementById('removeAfterPhoto');
    
    if (beforePhoto) beforePhoto.addEventListener('change', (e) => handleFileSelect(e, 'before'));
    if (afterPhoto) afterPhoto.addEventListener('change', (e) => handleFileSelect(e, 'after'));
    if (removeBeforePhotoBtn) removeBeforePhotoBtn.addEventListener('click', () => removeFile('before'));
    if (removeAfterPhotoBtn) removeAfterPhotoBtn.addEventListener('click', () => removeFile('after'));
    
    // Completion modal file handlers (check if elements exist)
    const completionAfterPhoto = document.getElementById('completionAfterPhoto');
    const removeCompletionAfterPhoto = document.getElementById('removeCompletionAfterPhoto');
    if (completionAfterPhoto) {
        completionAfterPhoto.addEventListener('change', (e) => handleCompletionFileSelect(e));
    }
    if (removeCompletionAfterPhoto) {
        removeCompletionAfterPhoto.addEventListener('click', () => removeCompletionFile());
    }

    // View toggles
    const viewActiveBtn = document.getElementById('viewActiveBtn');
    const viewCompletedBtn = document.getElementById('viewCompletedBtn');
    const toggleMetricsBtn = document.getElementById('toggleMetricsBtn');
    
    if (viewActiveBtn) viewActiveBtn.addEventListener('click', () => switchView('active'));
    if (viewCompletedBtn) viewCompletedBtn.addEventListener('click', () => switchView('completed'));
    if (toggleMetricsBtn) toggleMetricsBtn.addEventListener('click', toggleMetrics);

    // Completion modal
    const closeCompletionModalBtn = document.getElementById('closeCompletionModal');
    const completionForm = document.getElementById('completionForm');
    const cancelCompletionFormBtn = document.getElementById('cancelCompletionForm');
    
    if (closeCompletionModalBtn) closeCompletionModalBtn.addEventListener('click', closeCompletionModal);
    if (completionForm) completionForm.addEventListener('submit', handleTicketCompletion);
    if (cancelCompletionFormBtn) cancelCompletionFormBtn.addEventListener('click', closeCompletionModal);

    // Delete ticket modal event listeners
    const deleteTicketForm = document.getElementById('deleteTicketForm');
    if (deleteTicketForm) deleteTicketForm.addEventListener('submit', handleDeleteTicket);
    const cancelDeleteTicketFormBtn = document.getElementById('cancelDeleteTicketForm');
    if (cancelDeleteTicketFormBtn) cancelDeleteTicketFormBtn.addEventListener('click', closeDeleteTicketModal);
    const closeDeleteTicketModalBtn = document.getElementById('closeDeleteTicketModal');
    if (closeDeleteTicketModalBtn) closeDeleteTicketModalBtn.addEventListener('click', closeDeleteTicketModal);

    // View toggles - add deleted view
    const viewDeletedBtn = document.getElementById('viewDeletedBtn');
    if (viewDeletedBtn) viewDeletedBtn.addEventListener('click', () => switchView('deleted'));

    // Building management
    const addBuildingBtn = document.getElementById('addBuildingBtn');
    const buildingForm = document.getElementById('buildingForm');
    const closeBuildingModalBtn = document.getElementById('closeBuildingModal');
    const cancelBuildingFormBtn = document.getElementById('cancelBuildingForm');
    
    if (addBuildingBtn) {
        addBuildingBtn.addEventListener('click', () => {
            // Get propertyId from the current detail view or data attribute
            let propertyId = currentPropertyIdForDetail;
            
            // Fallback: try to get from property detail view data attribute
            if (!propertyId) {
                const propertyDetailView = document.getElementById('propertyDetailView');
                if (propertyDetailView) {
                    propertyId = propertyDetailView.getAttribute('data-property-id');
                }
            }
            
            if (propertyId) {
                window.addBuilding(propertyId);
            } else {
                alert('Error: Property context is missing. Please go back to properties and try again.');
                console.error('Cannot add building: currentPropertyIdForDetail is', currentPropertyIdForDetail);
            }
        });
    }
    if (buildingForm) buildingForm.addEventListener('submit', handleBuildingSubmit);
    if (closeBuildingModalBtn) closeBuildingModalBtn.addEventListener('click', closeBuildingModal);
    if (cancelBuildingFormBtn) cancelBuildingFormBtn.addEventListener('click', closeBuildingModal);
    
    // Tab switching removed - now using single table view
    
    // Unit management
    const addUnitBtn = document.getElementById('addUnitBtn');
    const unitForm = document.getElementById('unitForm');
    const closeUnitModalBtn = document.getElementById('closeUnitModal');
    const cancelUnitFormBtn = document.getElementById('cancelUnitForm');
    
    if (addUnitBtn) {
        addUnitBtn.addEventListener('click', () => {
            let propertyId = currentPropertyIdForDetail;
            if (!propertyId) {
                const propertyDetailView = document.getElementById('propertyDetailView');
                if (propertyDetailView) {
                    propertyId = propertyDetailView.getAttribute('data-property-id');
                }
            }
            if (propertyId) {
                window.addUnit(propertyId);
            } else {
                alert('Error: Property context is missing. Please go back to properties and try again.');
            }
        });
    }
    if (unitForm) unitForm.addEventListener('submit', handleUnitSubmit);
    if (closeUnitModalBtn) closeUnitModalBtn.addEventListener('click', closeUnitModal);
    if (cancelUnitFormBtn) cancelUnitFormBtn.addEventListener('click', closeUnitModal);
    
    // Tenant management
    const addTenantBtn = document.getElementById('addTenantBtn');
    const tenantForm = document.getElementById('tenantForm');
    const closeTenantModalBtn = document.getElementById('closeTenantModal');
    const cancelTenantFormBtn = document.getElementById('cancelTenantForm');
    const tenantTypeSelect = document.getElementById('tenantType');
    const closeSendEmailModalBtn = document.getElementById('closeSendEmailModal');
    
    if (closeSendEmailModalBtn) {
        closeSendEmailModalBtn.addEventListener('click', closeSendEmailModal);
    }
    
    if (addTenantBtn) {
        addTenantBtn.addEventListener('click', () => {
            showAddTenantForm();
        });
    }
    
    // Tenant view toggle
    const viewCardsBtn = document.getElementById('viewCardsBtn');
    const viewTableBtn = document.getElementById('viewTableBtn');
    const tenantPropertyFilter = document.getElementById('tenantPropertyFilter');
    
    // Table view is now default - view toggle removed
    // currentTenantView is initialized to 'table' at declaration (line 3282)
    const tableViewOptions = document.getElementById('tableViewOptions');
    if (tableViewOptions) tableViewOptions.style.display = 'flex';
    
    if (tenantPropertyFilter) {
        tenantPropertyFilter.addEventListener('change', function() {
            selectedPropertyForTenants = this.value || null;
            localStorage.setItem('selectedPropertyForTenants', selectedPropertyForTenants || '');
            // Reload tenants with filter
            db.collection('tenants').get().then((snapshot) => {
                const tenants = {};
                snapshot.forEach((doc) => {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                });
                renderTenantsList(tenants);
            });
        });
    }
    
    // Load properties for filter on tenants page
    if (document.getElementById('tenantsPage')) {
        loadPropertiesForTenantFilter();
    }
    if (tenantForm) tenantForm.addEventListener('submit', handleTenantSubmit);
    if (closeTenantModalBtn) closeTenantModalBtn.addEventListener('click', closeTenantModal);
    if (cancelTenantFormBtn) cancelTenantFormBtn.addEventListener('click', closeTenantModal);
    if (tenantTypeSelect) {
        tenantTypeSelect.addEventListener('change', updateTenantTypeFields);
    }
    
    // Unit assignment save button
    const saveTenantOccupancyBtn = document.getElementById('saveTenantOccupancyBtn');
    if (saveTenantOccupancyBtn) {
        saveTenantOccupancyBtn.addEventListener('click', handleTenantOccupancySave);
    }
    
    // Tenant detail view
    const backToTenantsBtn = document.getElementById('backToTenantsBtn');
    if (backToTenantsBtn) {
        backToTenantsBtn.addEventListener('click', () => {
            window.backToTenants();
        });
    }
    
    // Contact management
    const addContactBtn = document.getElementById('addContactBtn');
    const contactForm = document.getElementById('contactForm');
    const closeContactModalBtn = document.getElementById('closeContactModal');
    const cancelContactFormBtn = document.getElementById('cancelContactForm');
    
    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            let tenantId = currentTenantIdForDetail;
            if (!tenantId) {
                const tenantDetailView = document.getElementById('tenantDetailView');
                if (tenantDetailView) {
                    tenantId = tenantDetailView.getAttribute('data-tenant-id');
                }
            }
            if (tenantId) {
                window.addContact(tenantId);
            } else {
                alert('Error: Tenant context is missing.');
            }
        });
    }
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
    if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeContactModal);
    if (cancelContactFormBtn) cancelContactFormBtn.addEventListener('click', closeContactModal);
    
    // Occupancy management
    const addOccupancyBtn = document.getElementById('addOccupancyBtn');
    const occupancyForm = document.getElementById('occupancyForm');
    const closeOccupancyModalBtn = document.getElementById('closeOccupancyModal');
    const cancelOccupancyFormBtn = document.getElementById('cancelOccupancyForm');
    
    if (addOccupancyBtn) {
        addOccupancyBtn.addEventListener('click', () => {
            let tenantId = currentTenantIdForDetail;
            if (!tenantId) {
                const tenantDetailView = document.getElementById('tenantDetailView');
                if (tenantDetailView) {
                    tenantId = tenantDetailView.getAttribute('data-tenant-id');
                }
            }
            if (tenantId) {
                window.addOccupancy(tenantId);
            } else {
                alert('Error: Tenant context is missing.');
            }
        });
    }
    if (occupancyForm) occupancyForm.addEventListener('submit', handleOccupancySubmit);
    if (closeOccupancyModalBtn) closeOccupancyModalBtn.addEventListener('click', closeOccupancyModal);
    if (cancelOccupancyFormBtn) cancelOccupancyFormBtn.addEventListener('click', closeOccupancyModal);
    
    // Tab switching for tenant detail view
    const tenantTabButtons = document.querySelectorAll('#tenantDetailView .tab-btn');
    tenantTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and tab contents in tenant detail view
            document.querySelectorAll('#tenantDetailView .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#tenantDetailView .tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding tab content
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
    
    // Also close building modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            const buildingModal = document.getElementById('buildingModal');
            if (buildingModal && e.target === buildingModal) {
                closeBuildingModal();
            }
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closePropertyModal();
            closeTicketModal();
            closeCompletionModal();
            closeDeleteTicketModal();
            closeBuildingModal();
            closeUnitModal();
            closeTenantModal();
            closeContactModal();
            closeOccupancyModal();
        }
    });
}

// Property Management
function loadProperties() {
    db.collection('properties').onSnapshot((snapshot) => {
        const properties = {};
        snapshot.docs.forEach(doc => {
            properties[doc.id] = { id: doc.id, ...doc.data() };
        });

        const select = document.getElementById('propertySelect');
        const ticketPropertySelect = document.getElementById('ticketProperty');
        
        // Clear existing options (except first)
        select.innerHTML = '<option value="">Select a property...</option>';
        ticketPropertySelect.innerHTML = '<option value="">Select a property...</option>';

        Object.keys(properties).forEach(id => {
            const property = properties[id];
            const option = new Option(property.name, id);
            const ticketOption = new Option(property.name, id);
            select.appendChild(option);
            ticketPropertySelect.appendChild(ticketOption);
        });
        
        // Add change listener to ticket property select to show/hide commercial fields
        ticketPropertySelect.addEventListener('change', function(e) {
            updateCommercialFieldsVisibility(e.target.value);
        });

        // Restore selected property
        if (selectedPropertyId && properties[selectedPropertyId]) {
            select.value = selectedPropertyId;
        } else if (Object.keys(properties).length === 1) {
            // Auto-select if only one property
            selectedPropertyId = Object.keys(properties)[0];
            select.value = selectedPropertyId;
            localStorage.setItem('selectedPropertyId', selectedPropertyId);
        }

        // Show helpful message if no properties exist
        if (Object.keys(properties).length === 0) {
            const select = document.getElementById('propertySelect');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No properties - Click "Add Property" to get started!';
            option.disabled = true;
            option.selected = true;
            select.appendChild(option);
        }

        renderPropertiesList(properties);
        loadTickets();
    });
}

function renderPropertiesList(properties) {
    const list = document.getElementById('propertiesList');
    if (!list) return;
    
    list.innerHTML = '';

    if (Object.keys(properties).length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px; grid-column: 1 / -1;">No properties yet. Create one above!</p>';
        return;
    }

    Object.keys(properties).forEach(id => {
        const property = properties[id];
        const item = document.createElement('div');
        item.className = 'property-item';
        const statusBadge = property.status ? `<span class="status-badge status-${property.status.toLowerCase().replace(' ', '-')}">${property.status}</span>` : '';
        item.innerHTML = `
            <div class="property-info">
                <h4>${escapeHtml(property.name)} ${statusBadge}</h4>
                <p><strong>Type:</strong> ${property.propertyType === 'commercial' ? 'Commercial' : property.propertyType === 'hoa' ? 'HOA' : property.propertyType === 'residential' ? 'Residential' : 'Not Set'}</p>
                ${property.address ? `<p>📍 ${escapeHtml(property.address)}</p>` : ''}
                ${property.squareFootage ? `<p><strong>Square Footage:</strong> ${property.squareFootage.toLocaleString()} sq ft</p>` : ''}
                ${property.numberOfUnits ? `<p><strong>Units/Spaces:</strong> ${property.numberOfUnits}</p>` : ''}
                ${property.description ? `<p style="margin-top: 10px; color: #666;">${escapeHtml(property.description)}</p>` : ''}
            </div>
            <div class="property-item-actions">
                <button class="btn-primary btn-small" onclick="viewPropertyDetail('${id}')">View Details</button>
                <button class="btn-secondary btn-small" onclick="editProperty('${id}')">Edit</button>
                <button class="btn-danger btn-small" onclick="deleteProperty('${id}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// View property detail (for buildings and units)
window.viewPropertyDetail = function(propertyId) {
    // Set the current property ID first
    currentPropertyIdForDetail = propertyId;
    
    // Hide properties list, show detail view
    const propertiesList = document.querySelector('.properties-page-content .section');
    const propertyDetailView = document.getElementById('propertyDetailView');
    
    if (propertiesList) propertiesList.style.display = 'none';
    if (propertyDetailView) {
        propertyDetailView.style.display = 'block';
        
        // Store propertyId in a data attribute for reference
        propertyDetailView.setAttribute('data-property-id', propertyId);
        
        // Load property name
        db.collection('properties').doc(propertyId).get().then((doc) => {
            const property = doc.data();
            if (property) {
                const nameElement = document.getElementById('propertyDetailName');
                if (nameElement) nameElement.textContent = property.name;
            }
        });
        
        // Load buildings and units in table format
        loadBuildingsAndUnitsTable(propertyId);
    }
};

window.backToProperties = function() {
    const propertiesList = document.querySelector('.properties-page-content .section');
    const propertyDetailView = document.getElementById('propertyDetailView');
    
    if (propertiesList) propertiesList.style.display = 'block';
    if (propertyDetailView) propertyDetailView.style.display = 'none';
};

// Building Management
let currentPropertyIdForDetail = null;
let editingBuildingId = null;

async function loadBuildingsAndUnitsTable(propertyId) {
    currentPropertyIdForDetail = propertyId;
    const tableContainer = document.getElementById('buildingsUnitsTable');
    if (!tableContainer) return;
    
    try {
        // Load buildings and units in parallel
        const [buildingsSnapshot, unitsSnapshot] = await Promise.all([
            db.collection('buildings').where('propertyId', '==', propertyId).get(),
            db.collection('units').where('propertyId', '==', propertyId).get()
        ]);
        
        const buildings = {};
        buildingsSnapshot.forEach((doc) => {
            buildings[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const units = {};
        unitsSnapshot.forEach((doc) => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        renderBuildingsAndUnitsTable(buildings, units, propertyId);
    } catch (error) {
        console.error('Error loading buildings and units:', error);
        tableContainer.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading data. Please try again.</p>';
    }
}

function renderBuildingsAndUnitsTable(buildings, units, propertyId) {
    const tableContainer = document.getElementById('buildingsUnitsTable');
    if (!tableContainer) return;
    
    // Group units by building
    const unitsByBuilding = {};
    const unitsWithoutBuilding = [];
    
    Object.keys(units).forEach(id => {
        const unit = units[id];
        // A unit is orphaned if:
        // 1. It has no buildingId, OR
        // 2. It has a buildingId but that building doesn't exist in the buildings collection
        if (unit.buildingId && buildings[unit.buildingId]) {
            // Unit has a valid building - add to building group
            if (!unitsByBuilding[unit.buildingId]) {
                unitsByBuilding[unit.buildingId] = [];
            }
            unitsByBuilding[unit.buildingId].push({ id, ...unit });
        } else {
            // Unit is orphaned - no buildingId or building doesn't exist
            unitsWithoutBuilding.push({ id, ...unit });
        }
    });
    
    // Debug logging
    console.log('Orphaned units count:', unitsWithoutBuilding.length);
    if (unitsWithoutBuilding.length > 0) {
        console.log('Orphaned units:', unitsWithoutBuilding.map(u => ({ id: u.id, unitNumber: u.unitNumber, buildingId: u.buildingId })));
    }
    
    // Sort buildings by name (numeric-aware)
    const sortedBuildings = Object.keys(buildings).map(id => ({ id, ...buildings[id] })).sort((a, b) => {
        const aName = a.buildingName || '';
        const bName = b.buildingName || '';
        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    // Sort units within each building by unit number (numeric-aware)
    Object.keys(unitsByBuilding).forEach(buildingId => {
        unitsByBuilding[buildingId].sort((a, b) => {
            const aNum = a.unitNumber || '';
            const bNum = b.unitNumber || '';
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });
    });
    
    // Sort property-level units
    unitsWithoutBuilding.sort((a, b) => {
        const aNum = a.unitNumber || '';
        const bNum = b.unitNumber || '';
        return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    let html = '';
    
    // Render buildings with their units - each building gets its own section
    sortedBuildings.forEach(({ id: buildingId, ...building }) => {
        const buildingUnits = unitsByBuilding[buildingId] || [];
        
        html += `
            <div class="building-group" style="margin-bottom: 30px; border-left: 3px solid #2563eb; padding: 0; background: #f8fafc; border-radius: 6px; overflow: hidden;">
                <div class="building-group-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 15px; font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1rem;">${escapeHtml(building.buildingName || 'N/A')}</span>
                        ${building.buildingAddress ? `<span style="font-size: 0.8rem; font-weight: 400; opacity: 0.9;">${escapeHtml(building.buildingAddress)}</span>` : ''}
                        ${building.numberOfFloors ? `<span style="font-size: 0.75rem; font-weight: 400; opacity: 0.8; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${building.numberOfFloors} Floor${building.numberOfFloors !== 1 ? 's' : ''}</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn-secondary btn-small" onclick="editBuilding('${buildingId}')" style="padding: 4px 8px; font-size: 0.75rem; min-height: 24px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">Edit</button>
                        <button class="btn-danger btn-small" onclick="deleteBuilding('${buildingId}')" style="padding: 4px 8px; font-size: 0.75rem; min-height: 24px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">Delete</button>
                    </div>
                </div>
                <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table class="buildings-units-table" style="width: 100%; min-width: 1000px; border-collapse: collapse; background: white; font-size: 0.875rem;">
                        <thead>
                            <tr style="background: #e0e7ff; color: #1e40af;">
                                <th style="padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 100px;">Unit #</th>
                                <th style="padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 100px;">Type</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 100px;">Status</th>
                                <th style="padding: 12px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 110px;">Sq Ft</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 70px;">Floor</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 80px;">Bed</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 80px;">Bath</th>
                                <th style="padding: 12px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 110px;">Expected Monthly Rent</th>
                                <th style="padding: 12px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 100px;">Price Per Foot</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #3b82f6; white-space: nowrap; width: 120px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (buildingUnits.length === 0) {
            html += `
                            <tr>
                                <td colspan="10" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic; font-size: 0.85rem;">No units</td>
                            </tr>
            `;
        } else {
            buildingUnits.forEach((unit) => {
                // Unit columns
                const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}" style="font-size: 0.75rem; padding: 3px 8px;">${unit.status}</span>` : '<span style="color: #94a3b8;">—</span>';
                const monthlyRentFormatted = unit.monthlyRent ? `$${unit.monthlyRent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '<span style="color: #94a3b8;">—</span>';
                
                // Calculate price per foot (monthly and annual)
                let pricePerFootFormatted = '<span style="color: #94a3b8;">—</span>';
                if (unit.monthlyRent && unit.squareFootage && unit.squareFootage > 0) {
                    const monthlyPPF = unit.monthlyRent / unit.squareFootage;
                    const annualPPF = monthlyPPF * 12;
                    pricePerFootFormatted = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                            <span style="color: #7c3aed; font-weight: 500; font-variant-numeric: tabular-nums;">$${monthlyPPF.toFixed(2)}/mo</span>
                            <span style="color: #a78bfa; font-weight: 400; font-size: 0.75rem; font-variant-numeric: tabular-nums;">$${annualPPF.toFixed(2)}/yr</span>
                        </div>
                    `;
                }
                
                html += `
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 12px 10px; font-weight: 600; color: #1e293b;">${escapeHtml(unit.unitNumber || 'N/A')}</td>
                                <td style="padding: 12px 10px; color: #475569;">${unit.unitType || '<span style="color: #94a3b8;">—</span>'}</td>
                                <td style="padding: 12px 10px; text-align: center;">${statusBadge}</td>
                                <td style="padding: 12px 10px; text-align: right; color: #475569; font-variant-numeric: tabular-nums;">${unit.squareFootage ? unit.squareFootage.toLocaleString() : '<span style="color: #94a3b8;">—</span>'}</td>
                                <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.floorNumber ? unit.floorNumber : '<span style="color: #94a3b8;">—</span>'}</td>
                                <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.numberOfBedrooms ? unit.numberOfBedrooms : '<span style="color: #94a3b8;">—</span>'}</td>
                                <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.numberOfBathrooms ? unit.numberOfBathrooms : '<span style="color: #94a3b8;">—</span>'}</td>
                                <td style="padding: 12px 10px; text-align: right; color: #059669; font-weight: 600; font-variant-numeric: tabular-nums;">${monthlyRentFormatted}</td>
                                <td style="padding: 12px 10px; text-align: right; font-variant-numeric: tabular-nums;">${pricePerFootFormatted}</td>
                                <td style="padding: 12px 10px; text-align: center;">
                                    <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                                        <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')" style="padding: 3px 6px; font-size: 0.7rem; min-height: 22px;" title="Edit Unit">✏️</button>
                                        <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')" style="padding: 3px 6px; font-size: 0.7rem; min-height: 22px;" title="Delete Unit">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                `;
            });
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    // Always show orphaned units section (even if empty)
    html += `
        <div style="margin-top: 30px; border-left: 3px solid #f59e0b; padding: 15px; background: #fffbeb; border-radius: 6px;">
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #d97706;">
                    ⚠️ Orphaned Units${unitsWithoutBuilding.length > 0 ? ` (${unitsWithoutBuilding.length})` : ''}
                </h4>
                <p style="margin: 5px 0 0 0; font-size: 0.75rem; color: #666;">Units without associated buildings</p>
            </div>
    `;
    
    if (unitsWithoutBuilding.length > 0) {
        html += `
            <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="buildings-units-table" style="width: 100%; min-width: 1000px; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 0.875rem;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                            <th style="padding: 14px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 100px;">Unit #</th>
                            <th style="padding: 14px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 100px;">Type</th>
                            <th style="padding: 14px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 100px;">Status</th>
                            <th style="padding: 14px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 110px;">Sq Ft</th>
                            <th style="padding: 14px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 70px;">Floor</th>
                            <th style="padding: 14px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 80px;">Bed</th>
                            <th style="padding: 14px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 80px;">Bath</th>
                            <th style="padding: 14px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 110px;">Expected Monthly Rent</th>
                            <th style="padding: 14px 10px; text-align: right; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 100px;">Price Per Foot</th>
                            <th style="padding: 14px 10px; text-align: center; font-weight: 600; border-bottom: 2px solid #b45309; white-space: nowrap; width: 120px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        unitsWithoutBuilding.forEach((unit) => {
            const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}" style="font-size: 0.75rem; padding: 3px 8px;">${unit.status}</span>` : '<span style="color: #94a3b8;">—</span>';
            const monthlyRentFormatted = unit.monthlyRent ? `$${unit.monthlyRent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '<span style="color: #94a3b8;">—</span>';
            
            // Calculate price per foot (monthly and annual)
            let pricePerFootFormatted = '<span style="color: #94a3b8;">—</span>';
            if (unit.monthlyRent && unit.squareFootage && unit.squareFootage > 0) {
                const monthlyPPF = unit.monthlyRent / unit.squareFootage;
                const annualPPF = monthlyPPF * 12;
                pricePerFootFormatted = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                        <span style="color: #7c3aed; font-weight: 500; font-variant-numeric: tabular-nums;">$${monthlyPPF.toFixed(2)}/mo</span>
                        <span style="color: #a78bfa; font-weight: 400; font-size: 0.75rem; font-variant-numeric: tabular-nums;">$${annualPPF.toFixed(2)}/yr</span>
                    </div>
                `;
            }
            
            html += `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 10px; font-weight: 600; color: #1e293b;">${escapeHtml(unit.unitNumber || 'N/A')}</td>
                            <td style="padding: 12px 10px; color: #475569;">${unit.unitType || '<span style="color: #94a3b8;">—</span>'}</td>
                            <td style="padding: 12px 10px; text-align: center;">${statusBadge}</td>
                            <td style="padding: 12px 10px; text-align: right; color: #475569; font-variant-numeric: tabular-nums;">${unit.squareFootage ? unit.squareFootage.toLocaleString() : '<span style="color: #94a3b8;">—</span>'}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.floorNumber ? unit.floorNumber : '<span style="color: #94a3b8;">—</span>'}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.numberOfBedrooms ? unit.numberOfBedrooms : '<span style="color: #94a3b8;">—</span>'}</td>
                            <td style="padding: 12px 10px; text-align: center; color: #475569;">${unit.numberOfBathrooms ? unit.numberOfBathrooms : '<span style="color: #94a3b8;">—</span>'}</td>
                            <td style="padding: 12px 10px; text-align: right; color: #059669; font-weight: 600; font-variant-numeric: tabular-nums;">${monthlyRentFormatted}</td>
                            <td style="padding: 12px 10px; text-align: right; font-variant-numeric: tabular-nums;">${pricePerFootFormatted}</td>
                            <td style="padding: 12px 10px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
                                    <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')" style="padding: 3px 6px; font-size: 0.7rem; min-height: 22px;" title="Edit Unit">✏️</button>
                                    <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')" style="padding: 3px 6px; font-size: 0.7rem; min-height: 22px;" title="Delete Unit">🗑️</button>
                                </div>
                            </td>
                        </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `
            <div style="padding: 20px; text-align: center; color: #999;">
                No orphaned units found.
            </div>
        `;
    }
    
    html += `
        </div>
    `;
    
    if (sortedBuildings.length === 0 && unitsWithoutBuilding.length === 0) {
        html = '<p style="color: #999; text-align: center; padding: 40px;">No buildings or units yet. Add one to get started!</p>';
    }
    
    tableContainer.innerHTML = html;
}

function loadBuildings(propertyId) {
    currentPropertyIdForDetail = propertyId;
    const buildingsList = document.getElementById('buildingsList');
    if (!buildingsList) return;
    
    db.collection('buildings')
        .where('propertyId', '==', propertyId)
        .get()
        .then((querySnapshot) => {
            const buildings = {};
            querySnapshot.forEach((doc) => {
                buildings[doc.id] = { id: doc.id, ...doc.data() };
            });
            renderBuildingsList(buildings);
        })
        .catch((error) => {
            console.error('Error loading buildings:', error);
            buildingsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading buildings. Please try again.</p>';
        });
}

function renderBuildingsList(buildings) {
    const buildingsList = document.getElementById('buildingsList');
    if (!buildingsList) return;
    
    buildingsList.innerHTML = '';

    if (Object.keys(buildings).length === 0) {
        buildingsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px; grid-column: 1 / -1;">No buildings yet. Add one to get started.</p>';
        return;
    }

    // Sort buildings by building name (numeric-aware)
    const sortedBuildings = Object.keys(buildings).map(id => ({ id, ...buildings[id] })).sort((a, b) => {
        const aName = a.buildingName || '';
        const bName = b.buildingName || '';
        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });

    sortedBuildings.forEach(({ id, ...building }) => {
        const item = document.createElement('div');
        item.className = 'building-item';
        item.innerHTML = `
            <div class="building-info">
                <h4>${escapeHtml(building.buildingName)}</h4>
                ${building.buildingAddress ? `<p>📍 ${escapeHtml(building.buildingAddress)}</p>` : ''}
                ${building.numberOfFloors ? `<p><strong>Floors:</strong> ${building.numberOfFloors}</p>` : ''}
                ${building.numberOfUnits ? `<p><strong>Units:</strong> ${building.numberOfUnits}</p>` : ''}
            </div>
            <div class="building-item-actions">
                <button class="btn-secondary btn-small" onclick="editBuilding('${id}')">Edit</button>
                <button class="btn-danger btn-small" onclick="deleteBuilding('${id}')">Delete</button>
            </div>
        `;
        buildingsList.appendChild(item);
    });
}

window.addBuilding = function(propertyId) {
    currentPropertyIdForDetail = propertyId;
    editingBuildingId = null;
    document.getElementById('buildingModalTitle').textContent = 'Add Building';
    document.getElementById('buildingId').value = '';
    document.getElementById('buildingPropertyId').value = propertyId;
    document.getElementById('buildingForm').reset();
    
    // Reset button state
    const submitBtn = document.querySelector('#buildingForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Building';
        submitBtn.classList.remove('saving');
    }
    
    document.getElementById('buildingModal').classList.add('show');
    setTimeout(() => {
        document.getElementById('buildingName').focus();
    }, 100);
};

window.editBuilding = function(buildingId) {
    db.collection('buildings').doc(buildingId).get().then((doc) => {
        const building = doc.data();
        if (building) {
            editingBuildingId = buildingId;
            document.getElementById('buildingModalTitle').textContent = 'Edit Building';
            document.getElementById('buildingId').value = buildingId;
            document.getElementById('buildingPropertyId').value = building.propertyId;
            document.getElementById('buildingName').value = building.buildingName || '';
            document.getElementById('buildingAddress').value = building.buildingAddress || '';
            document.getElementById('buildingNumberOfFloors').value = building.numberOfFloors || '';
            document.getElementById('buildingNumberOfUnits').value = building.numberOfUnits || '';
            
            // Reset button state
            const submitBtn = document.querySelector('#buildingForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Building';
                submitBtn.classList.remove('saving');
            }
            
            document.getElementById('buildingModal').classList.add('show');
            setTimeout(() => {
                document.getElementById('buildingName').focus();
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading building:', error);
        alert('Error loading building: ' + error.message);
    });
};

window.deleteBuilding = function(buildingId) {
    if (!confirm('Are you sure you want to delete this building? This action cannot be undone.')) {
        return;
    }
    
    db.collection('buildings').doc(buildingId).delete()
        .then(() => {
            console.log('Building deleted successfully');
            if (currentPropertyIdForDetail) {
                loadBuildingsAndUnitsTable(currentPropertyIdForDetail);
            }
        })
        .catch((error) => {
            console.error('Error deleting building:', error);
            alert('Error deleting building: ' + error.message);
        });
};

function handleBuildingSubmit(e) {
    e.preventDefault();
    
    // Get submit button early for state management
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Helper function to reset button state
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Building';
            submitBtn.classList.remove('saving');
        }
    };
    
    const id = document.getElementById('buildingId').value;
    const propertyId = document.getElementById('buildingPropertyId').value;
    const buildingName = document.getElementById('buildingName').value.trim();
    const buildingAddress = document.getElementById('buildingAddress').value.trim();
    const numberOfFloors = parseInt(document.getElementById('buildingNumberOfFloors').value) || null;
    const numberOfUnits = parseInt(document.getElementById('buildingNumberOfUnits').value) || null;

    // Validation - ensure button is enabled if validation fails
    if (!buildingName) {
        alert('Building name/number is required');
        resetButtonState();
        return;
    }
    
    if (!propertyId) {
        alert('Property ID is missing');
        resetButtonState();
        return;
    }

    // Disable submit button (only after validation passes)
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    // Set a timeout safety mechanism (30 seconds)
    const timeoutId = setTimeout(() => {
        console.error('Building save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);

    const buildingData = {
        propertyId: propertyId,
        buildingName: buildingName,
        buildingAddress: buildingAddress || null,
        numberOfFloors: numberOfFloors,
        numberOfUnits: numberOfUnits,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (id && editingBuildingId) {
        // Update existing
        db.collection('buildings').doc(id).get().then((doc) => {
            const existing = doc.data();
            buildingData.createdAt = existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('buildings').doc(id).update(buildingData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Building updated successfully');
            resetButtonState();
            closeBuildingModal();
            if (currentPropertyIdForDetail) {
                loadBuildingsAndUnitsTable(currentPropertyIdForDetail);
            }
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating building:', error);
            alert('Error saving building: ' + error.message);
            resetButtonState();
        });
    } else {
        // Create new
        buildingData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('buildings').add(buildingData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Building created successfully with ID:', docRef.id);
                resetButtonState();
                closeBuildingModal();
                if (currentPropertyIdForDetail) {
                    loadBuildings(currentPropertyIdForDetail);
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating building:', error);
                alert('Error saving building: ' + error.message);
                resetButtonState();
            });
    }
}

function closeBuildingModal() {
    const modal = document.getElementById('buildingModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('buildingForm').reset();
    document.getElementById('buildingId').value = '';
    document.getElementById('buildingPropertyId').value = '';
    editingBuildingId = null;
    
    // Reset button state
    const submitBtn = document.querySelector('#buildingForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Building';
        submitBtn.classList.remove('saving');
    }
}

// Unit Management
let editingUnitId = null;

function loadUnits(propertyId) {
    const unitsList = document.getElementById('unitsList');
    if (!unitsList) return;
    
    db.collection('units')
        .where('propertyId', '==', propertyId)
        .get()
        .then((querySnapshot) => {
            const units = {};
            querySnapshot.forEach((doc) => {
                units[doc.id] = { id: doc.id, ...doc.data() };
            });
            renderUnitsList(units, propertyId);
        })
        .catch((error) => {
            console.error('Error loading units:', error);
            unitsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading units. Please try again.</p>';
        });
}

function renderUnitsList(units, propertyId) {
    const unitsList = document.getElementById('unitsList');
    if (!unitsList) return;
    
    unitsList.innerHTML = '';

    if (Object.keys(units).length === 0) {
        unitsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No units yet. Add one to get started.</p>';
        return;
    }

    // First, load buildings to group units by building
    db.collection('buildings')
        .where('propertyId', '==', propertyId)
        .get()
        .then((buildingsSnapshot) => {
            const buildingsMap = {};
            buildingsSnapshot.forEach((doc) => {
                buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
            });
            
            // Group units by building
            const unitsByBuilding = {};
            const unitsWithoutBuilding = [];
            
            Object.keys(units).forEach(id => {
                const unit = units[id];
                if (unit.buildingId && buildingsMap[unit.buildingId]) {
                    if (!unitsByBuilding[unit.buildingId]) {
                        unitsByBuilding[unit.buildingId] = [];
                    }
                    unitsByBuilding[unit.buildingId].push({ id, ...unit });
                } else {
                    unitsWithoutBuilding.push({ id, ...unit });
                }
            });
            
            // Sort buildings by building name (numeric-aware)
            const sortedBuildings = Object.keys(buildingsMap).map(id => ({ id, ...buildingsMap[id] })).sort((a, b) => {
                const aName = a.buildingName || '';
                const bName = b.buildingName || '';
                return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
            });
            
            // Render units grouped by building
            sortedBuildings.forEach(({ id: buildingId, ...building }) => {
                const buildingUnits = unitsByBuilding[buildingId] || [];
                
                const buildingSection = document.createElement('div');
                buildingSection.className = 'building-units-section';
                buildingSection.innerHTML = `
                    <div class="building-units-header">
                        <div>
                            <h4>${escapeHtml(building.buildingName)}</h4>
                            ${building.buildingAddress ? `<p style="color: #666; font-size: 0.9rem; margin: 5px 0 0 0;">📍 ${escapeHtml(building.buildingAddress)}</p>` : ''}
                            ${buildingUnits.length > 0 ? `<p style="color: #999; font-size: 0.85rem; margin: 5px 0 0 0;">${buildingUnits.length} unit${buildingUnits.length !== 1 ? 's' : ''}</p>` : ''}
                        </div>
                        <button class="btn-primary btn-small" onclick="addUnitToBuilding('${propertyId}', '${buildingId}')">+ Add Unit</button>
                    </div>
                    <div class="building-units-list" id="units-building-${buildingId}"></div>
                `;
                unitsList.appendChild(buildingSection);
                
                const buildingUnitsList = document.getElementById(`units-building-${buildingId}`);
                if (buildingUnits.length === 0) {
                    buildingUnitsList.innerHTML = '<p style="color: #999; font-size: 14px; padding: 10px;">No units in this building.</p>';
                } else {
                    // Sort units by unit number (numeric-aware)
                    const sortedUnits = buildingUnits.sort((a, b) => {
                        const aNum = a.unitNumber || '';
                        const bNum = b.unitNumber || '';
                        return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
                    });
                    
                    sortedUnits.forEach(unit => {
                        const item = document.createElement('div');
                        item.className = 'unit-item';
                        const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}">${unit.status}</span>` : '';
                        item.innerHTML = `
                            <div class="unit-info">
                                <h4>${escapeHtml(unit.unitNumber)} ${statusBadge}</h4>
                                <p><strong>Type:</strong> ${unit.unitType || 'Not Set'}</p>
                                ${unit.squareFootage ? `<p><strong>Square Footage:</strong> ${unit.squareFootage.toLocaleString()} sq ft</p>` : ''}
                                ${unit.floorNumber ? `<p><strong>Floor:</strong> ${unit.floorNumber}</p>` : ''}
                                ${unit.numberOfBedrooms ? `<p><strong>Bedrooms:</strong> ${unit.numberOfBedrooms}</p>` : ''}
                                ${unit.numberOfBathrooms ? `<p><strong>Bathrooms:</strong> ${unit.numberOfBathrooms}</p>` : ''}
                                ${unit.monthlyRent ? `<p><strong>Monthly Rent:</strong> $${unit.monthlyRent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>` : ''}
                            </div>
                            <div class="unit-item-actions">
                                <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                                <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                            </div>
                        `;
                        buildingUnitsList.appendChild(item);
                    });
                }
            });
            
            // Render units without a building (property-level units)
            if (unitsWithoutBuilding.length > 0) {
                // Sort property-level units by unit number (numeric-aware)
                const sortedPropertyLevelUnits = unitsWithoutBuilding.sort((a, b) => {
                    const aNum = a.unitNumber || '';
                    const bNum = b.unitNumber || '';
                    return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                const propertyLevelSection = document.createElement('div');
                propertyLevelSection.className = 'building-units-section';
                propertyLevelSection.innerHTML = `
                    <div class="building-units-header">
                        <h4>Property-Level Units</h4>
                        <button class="btn-primary btn-small" onclick="addUnit('${propertyId}')">+ Add Unit</button>
                    </div>
                    <div class="building-units-list" id="units-property-level"></div>
                `;
                unitsList.appendChild(propertyLevelSection);
                
                const propertyLevelList = document.getElementById('units-property-level');
                sortedPropertyLevelUnits.forEach(unit => {
                    const item = document.createElement('div');
                    item.className = 'unit-item';
                    const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}">${unit.status}</span>` : '';
                    item.innerHTML = `
                        <div class="unit-info">
                            <h4>${escapeHtml(unit.unitNumber)} ${statusBadge}</h4>
                            <p><strong>Type:</strong> ${unit.unitType || 'Not Set'}</p>
                            ${unit.squareFootage ? `<p><strong>Square Footage:</strong> ${unit.squareFootage.toLocaleString()} sq ft</p>` : ''}
                            ${unit.floorNumber ? `<p><strong>Floor:</strong> ${unit.floorNumber}</p>` : ''}
                            ${unit.numberOfBedrooms ? `<p><strong>Bedrooms:</strong> ${unit.numberOfBedrooms}</p>` : ''}
                            ${unit.numberOfBathrooms ? `<p><strong>Bathrooms:</strong> ${unit.numberOfBathrooms}</p>` : ''}
                            ${unit.monthlyRent ? `<p><strong>Monthly Rent:</strong> $${unit.monthlyRent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>` : ''}
                        </div>
                        <div class="unit-item-actions">
                            <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                            <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                        </div>
                    `;
                    propertyLevelList.appendChild(item);
                });
            }
        })
        .catch((error) => {
            console.error('Error loading buildings for unit grouping:', error);
            // Fallback to flat list if building loading fails
            Object.keys(units).forEach(id => {
                const unit = units[id];
                const item = document.createElement('div');
                item.className = 'unit-item';
                const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}">${unit.status}</span>` : '';
                item.innerHTML = `
                    <div class="unit-info">
                        <h4>${escapeHtml(unit.unitNumber)} ${statusBadge}</h4>
                        <p><strong>Type:</strong> ${unit.unitType || 'Not Set'}</p>
                        ${unit.squareFootage ? `<p><strong>Square Footage:</strong> ${unit.squareFootage.toLocaleString()} sq ft</p>` : ''}
                        ${unit.floorNumber ? `<p><strong>Floor:</strong> ${unit.floorNumber}</p>` : ''}
                        ${unit.numberOfBedrooms ? `<p><strong>Bedrooms:</strong> ${unit.numberOfBedrooms}</p>` : ''}
                        ${unit.numberOfBathrooms ? `<p><strong>Bathrooms:</strong> ${unit.numberOfBathrooms}</p>` : ''}
                        ${unit.monthlyRent ? `<p><strong>Monthly Rent:</strong> $${unit.monthlyRent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>` : ''}
                    </div>
                    <div class="unit-item-actions">
                        <button class="btn-secondary btn-small" onclick="editUnit('${id}')">Edit</button>
                        <button class="btn-danger btn-small" onclick="deleteUnit('${id}')">Delete</button>
                    </div>
                `;
                unitsList.appendChild(item);
            });
        });
}

function loadBuildingsForUnitSelect(propertyId) {
    const buildingSelect = document.getElementById('unitBuildingId');
    if (!buildingSelect) return Promise.resolve();
    
    // Clear existing options except first
    buildingSelect.innerHTML = '<option value="">No Building (Property Level)</option>';
    
    return db.collection('buildings')
        .where('propertyId', '==', propertyId)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const building = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = building.buildingName || 'Unnamed Building';
                buildingSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading buildings for unit select:', error);
        });
}

window.addUnit = function(propertyId, buildingId = null) {
    currentPropertyIdForDetail = propertyId;
    editingUnitId = null;
    document.getElementById('unitModalTitle').textContent = 'Add Unit/Space';
    document.getElementById('unitId').value = '';
    document.getElementById('unitPropertyId').value = propertyId;
    document.getElementById('unitForm').reset();
    
    // Reset button state
    const submitBtn = document.querySelector('#unitForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Unit';
        submitBtn.classList.remove('saving');
    }
    
    // Load buildings for the select dropdown
    loadBuildingsForUnitSelect(propertyId).then(() => {
        if (buildingId) {
            document.getElementById('unitBuildingId').value = buildingId;
        }
        document.getElementById('unitModal').classList.add('show');
        setTimeout(() => {
            document.getElementById('unitNumber').focus();
        }, 100);
    });
};

window.addUnitToBuilding = function(propertyId, buildingId) {
    addUnit(propertyId, buildingId);
};

window.editUnit = function(unitId) {
    db.collection('units').doc(unitId).get().then((doc) => {
        const unit = doc.data();
        if (unit) {
            editingUnitId = unitId;
            document.getElementById('unitModalTitle').textContent = 'Edit Unit/Space';
            document.getElementById('unitId').value = unitId;
            document.getElementById('unitPropertyId').value = unit.propertyId;
            document.getElementById('unitNumber').value = unit.unitNumber || '';
            document.getElementById('unitType').value = unit.unitType || '';
            document.getElementById('unitSquareFootage').value = unit.squareFootage || '';
            document.getElementById('unitFloorNumber').value = unit.floorNumber || '';
            document.getElementById('unitNumberOfBedrooms').value = unit.numberOfBedrooms || '';
            document.getElementById('unitNumberOfBathrooms').value = unit.numberOfBathrooms || '';
            document.getElementById('unitStatus').value = unit.status || 'Vacant';
            document.getElementById('unitMonthlyRent').value = unit.monthlyRent || '';
            
            // Reset button state
            const submitBtn = document.querySelector('#unitForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Unit';
                submitBtn.classList.remove('saving');
            }
            
            // Load buildings and set selected building
            loadBuildingsForUnitSelect(unit.propertyId).then(() => {
                if (unit.buildingId) {
                    document.getElementById('unitBuildingId').value = unit.buildingId;
                }
                document.getElementById('unitModal').classList.add('show');
                setTimeout(() => {
                    document.getElementById('unitNumber').focus();
                }, 100);
            });
        }
    }).catch((error) => {
        console.error('Error loading unit:', error);
        alert('Error loading unit: ' + error.message);
    });
};

window.deleteUnit = function(unitId) {
    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
        return;
    }
    
    db.collection('units').doc(unitId).delete()
        .then(() => {
            console.log('Unit deleted successfully');
            if (currentPropertyIdForDetail) {
