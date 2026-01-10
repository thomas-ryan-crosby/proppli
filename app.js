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
    
    // Tab switching for property detail view
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and tab contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding tab content
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
    
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
    
    if (viewCardsBtn) {
        viewCardsBtn.addEventListener('click', function() {
            currentTenantView = 'cards';
            viewCardsBtn.classList.add('active');
            viewTableBtn.classList.remove('active');
            // Hide table view options
            const tableViewOptions = document.getElementById('tableViewOptions');
            if (tableViewOptions) tableViewOptions.style.display = 'none';
            // Reload tenants to render in card view
            db.collection('tenants').get().then((snapshot) => {
                const tenants = {};
                snapshot.forEach((doc) => {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                });
                renderTenantsList(tenants);
            });
        });
    }
    
    if (viewTableBtn) {
        viewTableBtn.addEventListener('click', function() {
            currentTenantView = 'table';
            viewTableBtn.classList.add('active');
            viewCardsBtn.classList.remove('active');
            // Show table view options
            const tableViewOptions = document.getElementById('tableViewOptions');
            if (tableViewOptions) tableViewOptions.style.display = 'flex';
            // Reload tenants to render in table view
            db.collection('tenants').get().then((snapshot) => {
                const tenants = {};
                snapshot.forEach((doc) => {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                });
                renderTenantsList(tenants);
            });
        });
    }
    
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
        
        // Load buildings and units
        loadBuildings(propertyId);
        loadUnits(propertyId);
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

    Object.keys(buildings).forEach(id => {
        const building = buildings[id];
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
                loadBuildings(currentPropertyIdForDetail);
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
                loadBuildings(currentPropertyIdForDetail);
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
            
            // Render units grouped by building
            Object.keys(buildingsMap).forEach(buildingId => {
                const building = buildingsMap[buildingId];
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
                    buildingUnits.forEach(unit => {
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
                unitsWithoutBuilding.forEach(unit => {
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
                loadUnits(currentPropertyIdForDetail);
            }
        })
        .catch((error) => {
            console.error('Error deleting unit:', error);
            alert('Error deleting unit: ' + error.message);
        });
};

function handleUnitSubmit(e) {
    e.preventDefault();
    
    // Get submit button early for state management
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Helper function to reset button state
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Unit';
            submitBtn.classList.remove('saving');
        }
    };
    
    const id = document.getElementById('unitId').value;
    const propertyId = document.getElementById('unitPropertyId').value;
    const unitNumber = document.getElementById('unitNumber').value.trim();
    const unitType = document.getElementById('unitType').value;
    const buildingId = document.getElementById('unitBuildingId').value || null;
    const squareFootage = parseFloat(document.getElementById('unitSquareFootage').value) || null;
    const floorNumber = parseInt(document.getElementById('unitFloorNumber').value) || null;
    const numberOfBedrooms = parseInt(document.getElementById('unitNumberOfBedrooms').value) || null;
    const numberOfBathrooms = parseFloat(document.getElementById('unitNumberOfBathrooms').value) || null;
    const status = document.getElementById('unitStatus').value;
    const monthlyRent = parseFloat(document.getElementById('unitMonthlyRent').value) || null;

    // Validation - ensure button is enabled if validation fails
    if (!unitNumber) {
        alert('Unit number/identifier is required');
        resetButtonState();
        return;
    }
    
    if (!unitType) {
        alert('Unit type is required');
        resetButtonState();
        return;
    }
    
    if (!status) {
        alert('Unit status is required');
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
        console.error('Unit save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);

    const unitData = {
        propertyId: propertyId,
        buildingId: buildingId,
        unitNumber: unitNumber,
        unitType: unitType,
        squareFootage: squareFootage,
        floorNumber: floorNumber,
        numberOfBedrooms: numberOfBedrooms,
        numberOfBathrooms: numberOfBathrooms,
        status: status,
        monthlyRent: monthlyRent,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (id && editingUnitId) {
        // Update existing
        db.collection('units').doc(id).get().then((doc) => {
            const existing = doc.data();
            unitData.createdAt = existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('units').doc(id).update(unitData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Unit updated successfully');
            resetButtonState();
            closeUnitModal();
            if (currentPropertyIdForDetail) {
                loadUnits(currentPropertyIdForDetail);
            }
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating unit:', error);
            alert('Error saving unit: ' + error.message);
            resetButtonState();
        });
    } else {
        // Create new
        unitData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('units').add(unitData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Unit created successfully with ID:', docRef.id);
                resetButtonState();
                closeUnitModal();
                if (currentPropertyIdForDetail) {
                    loadUnits(currentPropertyIdForDetail);
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating unit:', error);
                alert('Error saving unit: ' + error.message);
                resetButtonState();
            });
    }
}

function closeUnitModal() {
    const modal = document.getElementById('unitModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('unitForm').reset();
    document.getElementById('unitId').value = '';
    document.getElementById('unitPropertyId').value = '';
    editingUnitId = null;
    
    // Reset button state
    const submitBtn = document.querySelector('#unitForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Unit';
        submitBtn.classList.remove('saving');
    }
}

function openPropertyModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) {
        modal.classList.add('show');
        hidePropertyForm();
    }
}

function showAddPropertyForm() {
    // Open the modal first
    const modal = document.getElementById('propertyModal');
    if (modal) {
        modal.classList.add('show');
    }
    
    // Show and reset the form
    const form = document.getElementById('propertyForm');
    if (form) {
        form.style.display = 'block';
        form.reset();
    }
    
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
    
    // Reset field visibility
    updatePropertyTypeFields();
    
    // Focus on property name input for quick entry
    setTimeout(() => {
        const nameInput = document.getElementById('propertyName');
        if (nameInput) nameInput.focus();
    }, 100);
}

function hidePropertyForm() {
    document.getElementById('propertyForm').style.display = 'none';
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
    // Reset field visibility
    updatePropertyTypeFields();
}

function updatePropertyTypeFields() {
    const propertyType = document.getElementById('propertyType')?.value || '';
    const commercialFields = document.getElementById('commercialPropertyFields');
    const residentialFields = document.getElementById('residentialPropertyFields');
    
    if (commercialFields) {
        commercialFields.style.display = propertyType === 'commercial' ? 'block' : 'none';
    }
    if (residentialFields) {
        residentialFields.style.display = propertyType === 'residential' ? 'block' : 'none';
    }
}

function closePropertyModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) {
        modal.classList.remove('show');
    }
    const form = document.getElementById('propertyForm');
    if (form) {
        form.style.display = 'none';
        form.reset();
    }
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
    // Reset field visibility
    updatePropertyTypeFields();
}

function handlePropertySubmit(e) {
    e.preventDefault();
    console.log('Property form submitted');
    
    // Get submit button early for state management
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingModal = document.getElementById('loadingModal');
    
    // Helper function to reset button state
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Property';
            submitBtn.classList.remove('saving');
        }
        if (loadingModal) {
            loadingModal.classList.remove('show');
        }
    };
    
    const id = document.getElementById('propertyId').value;
    const name = document.getElementById('propertyName').value.trim();
    const address = document.getElementById('propertyAddress').value.trim();
    const propertyType = document.getElementById('propertyType').value;
    const status = document.getElementById('propertyStatus').value;
    const squareFootage = parseFloat(document.getElementById('propertySquareFootage').value) || null;
    const yearBuilt = parseInt(document.getElementById('propertyYearBuilt').value) || null;
    const numberOfUnits = parseInt(document.getElementById('propertyNumberOfUnits').value) || null;
    const lotSize = parseFloat(document.getElementById('propertyLotSize').value) || null;
    const numberOfFloors = parseInt(document.getElementById('propertyNumberOfFloors').value) || null;
    const parkingSpaces = parseInt(document.getElementById('propertyParkingSpaces').value) || null;
    const taxId = document.getElementById('propertyTaxId').value.trim() || null;
    const ownerName = document.getElementById('propertyOwnerName').value.trim() || null;
    const ownerContact = document.getElementById('propertyOwnerContact').value.trim() || null;
    const description = document.getElementById('propertyDescription').value.trim() || null;
    
    // Commercial specific fields
    const buildingNumber = document.getElementById('propertyBuildingNumber')?.value.trim() || null;
    const numberOfBuildings = parseInt(document.getElementById('propertyNumberOfBuildings')?.value) || null;
    const totalLeasableSqFt = parseFloat(document.getElementById('propertyTotalLeasableSqFt')?.value) || null;
    const commonAreaSqFt = parseFloat(document.getElementById('propertyCommonAreaSqFt')?.value) || null;
    
    // Residential specific fields
    const numberOfBedrooms = parseInt(document.getElementById('propertyNumberOfBedrooms')?.value) || null;
    const numberOfBathrooms = parseFloat(document.getElementById('propertyNumberOfBathrooms')?.value) || null;
    const propertySubtype = document.getElementById('propertySubtype')?.value || null;

    console.log('Form data:', { id, name, address, propertyType, status, squareFootage, yearBuilt, numberOfUnits });

    // Validation - ensure button is enabled if validation fails
    if (!name) {
        alert('Property name is required');
        resetButtonState();
        return;
    }
    
    if (!propertyType) {
        alert('Property type is required');
        resetButtonState();
        return;
    }
    
    if (!status) {
        alert('Property status is required');
        resetButtonState();
        return;
    }
    
    // Validation based on property type
    if (propertyType === 'hoa') {
        // HOA: Only require number of units, not square footage or year built
        if (!numberOfUnits || numberOfUnits < 0) {
            alert('Number of units is required and must be 0 or greater');
            resetButtonState();
            return;
        }
    } else {
        // Commercial and Residential: Require square footage, year built, and units
        if (!squareFootage || squareFootage <= 0) {
            alert('Square footage is required and must be greater than 0');
            resetButtonState();
            return;
        }
        
        if (!yearBuilt || yearBuilt < 1800 || yearBuilt > 2100) {
            alert('Year built is required and must be a valid year');
            resetButtonState();
            return;
        }
        
        if (!numberOfUnits || numberOfUnits < 0) {
            alert('Number of units/spaces is required and must be 0 or greater');
            resetButtonState();
            return;
        }
    }

    // Disable submit button and show loading modal (only after validation passes)
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    // Show loading modal
    if (loadingModal) {
        const loadingModalTitle = document.getElementById('loadingModalTitle');
        const loadingModalMessage = document.getElementById('loadingModalMessage');
        if (loadingModalTitle) loadingModalTitle.textContent = 'Saving Property...';
        if (loadingModalMessage) loadingModalMessage.textContent = 'Please wait while we save your property';
        loadingModal.classList.add('show');
    }
    
    // Set a timeout safety mechanism (30 seconds)
    const timeoutId = setTimeout(() => {
        console.error('Property save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);

    if (id && editingPropertyId) {
        // Update existing - preserve createdAt
        db.collection('properties').doc(id).get().then((doc) => {
            const existing = doc.data();
            const propertyData = {
                name,
                address: address || null,
                propertyType: propertyType,
                status: status,
                squareFootage: propertyType === 'hoa' ? null : squareFootage, // HOA doesn't need square footage
                yearBuilt: propertyType === 'hoa' ? null : yearBuilt, // HOA doesn't need year built
                numberOfUnits: numberOfUnits,
                lotSize: lotSize,
                numberOfFloors: numberOfFloors,
                parkingSpaces: parkingSpaces,
                taxId: taxId,
                ownerName: ownerName,
                ownerContact: ownerContact,
                description: description,
                createdAt: existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add commercial-specific fields if property type is commercial
            if (propertyType === 'commercial') {
                propertyData.buildingNumber = buildingNumber;
                propertyData.numberOfBuildings = numberOfBuildings;
                propertyData.totalLeasableSqFt = totalLeasableSqFt;
                propertyData.commonAreaSqFt = commonAreaSqFt;
                // Clear residential fields
                propertyData.numberOfBedrooms = null;
                propertyData.numberOfBathrooms = null;
                propertyData.propertySubtype = null;
            } else if (propertyType === 'residential') {
                // Add residential-specific fields
                propertyData.numberOfBedrooms = numberOfBedrooms;
                propertyData.numberOfBathrooms = numberOfBathrooms;
                propertyData.propertySubtype = propertySubtype;
                // Clear commercial fields
                propertyData.buildingNumber = null;
                propertyData.numberOfBuildings = null;
                propertyData.totalLeasableSqFt = null;
                propertyData.commonAreaSqFt = null;
            } else {
                // HOA - clear both commercial and residential specific fields
                propertyData.buildingNumber = null;
                propertyData.numberOfBuildings = null;
                propertyData.totalLeasableSqFt = null;
                propertyData.commonAreaSqFt = null;
                propertyData.numberOfBedrooms = null;
                propertyData.numberOfBathrooms = null;
                propertyData.propertySubtype = null;
            }
            
            return db.collection('properties').doc(id).update(propertyData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Property updated successfully');
            // Hide loading modal and reset button
            resetButtonState();
            // Close modal and reset form
            closePropertyModal();
            // Reload properties list
            loadProperties();
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating property:', error);
            alert('Error saving property: ' + error.message);
            // Re-enable submit button on error
            resetButtonState();
        });
    } else {
        // Create new
        const propertyData = {
            name,
            address: address || null,
            propertyType: propertyType,
            status: status,
            squareFootage: propertyType === 'hoa' ? null : squareFootage, // HOA doesn't need square footage
            yearBuilt: propertyType === 'hoa' ? null : yearBuilt, // HOA doesn't need year built
            numberOfUnits: numberOfUnits,
            lotSize: lotSize,
            numberOfFloors: numberOfFloors,
            parkingSpaces: parkingSpaces,
            taxId: taxId,
            ownerName: ownerName,
            ownerContact: ownerContact,
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add commercial-specific fields if property type is commercial
        if (propertyType === 'commercial') {
            propertyData.buildingNumber = buildingNumber;
            propertyData.numberOfBuildings = numberOfBuildings;
            propertyData.totalLeasableSqFt = totalLeasableSqFt;
            propertyData.commonAreaSqFt = commonAreaSqFt;
        } else if (propertyType === 'residential') {
            // Add residential-specific fields
            propertyData.numberOfBedrooms = numberOfBedrooms;
            propertyData.numberOfBathrooms = numberOfBathrooms;
            propertyData.propertySubtype = propertySubtype;
        }
        db.collection('properties').add(propertyData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Property created successfully with ID:', docRef.id);
                // Hide loading modal and reset button
                resetButtonState();
                // Close modal and reset form
                closePropertyModal();
                // Reload properties list
                loadProperties();
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating property:', error);
                alert('Error saving property: ' + error.message);
                // Re-enable submit button on error
                resetButtonState();
            });
    }
}

// Make functions globally accessible for onclick handlers
window.editProperty = function(id) {
    db.collection('properties').doc(id).get().then((doc) => {
        const property = doc.data();
        if (property) {
            // Check if edit modal exists, if not use the main modal
            const editModal = document.getElementById('propertyEditModal');
            if (editModal) {
                // Open edit modal and populate form
                editModal.classList.add('show');
                document.getElementById('propertyEditId').value = id;
                document.getElementById('propertyEditName').value = property.name || '';
                document.getElementById('propertyEditAddress').value = property.address || '';
                document.getElementById('propertyEditType').value = property.propertyType || '';
                document.getElementById('propertyEditDescription').value = property.description || '';
                // Focus on property name input
                setTimeout(() => {
                    document.getElementById('propertyEditName').focus();
                }, 100);
            } else {
                // Fallback: use main property modal and show form
                editingPropertyId = id;
                document.getElementById('propertyModal').classList.add('show');
                document.getElementById('propertyId').value = id;
                document.getElementById('propertyName').value = property.name || '';
                document.getElementById('propertyAddress').value = property.address || '';
                document.getElementById('propertyType').value = property.propertyType || '';
                document.getElementById('propertyStatus').value = property.status || 'Active';
                document.getElementById('propertySquareFootage').value = property.squareFootage || '';
                document.getElementById('propertyYearBuilt').value = property.yearBuilt || '';
                document.getElementById('propertyNumberOfUnits').value = property.numberOfUnits || '';
                document.getElementById('propertyLotSize').value = property.lotSize || '';
                document.getElementById('propertyNumberOfFloors').value = property.numberOfFloors || '';
                document.getElementById('propertyParkingSpaces').value = property.parkingSpaces || '';
                document.getElementById('propertyTaxId').value = property.taxId || '';
                document.getElementById('propertyOwnerName').value = property.ownerName || '';
                document.getElementById('propertyOwnerContact').value = property.ownerContact || '';
                document.getElementById('propertyDescription').value = property.description || '';
                
                // Commercial fields
                if (property.buildingNumber) document.getElementById('propertyBuildingNumber').value = property.buildingNumber;
                if (property.numberOfBuildings) document.getElementById('propertyNumberOfBuildings').value = property.numberOfBuildings;
                if (property.totalLeasableSqFt) document.getElementById('propertyTotalLeasableSqFt').value = property.totalLeasableSqFt;
                if (property.commonAreaSqFt) document.getElementById('propertyCommonAreaSqFt').value = property.commonAreaSqFt;
                
                // Residential fields
                if (property.numberOfBedrooms) document.getElementById('propertyNumberOfBedrooms').value = property.numberOfBedrooms;
                if (property.numberOfBathrooms) document.getElementById('propertyNumberOfBathrooms').value = property.numberOfBathrooms;
                if (property.propertySubtype) document.getElementById('propertySubtype').value = property.propertySubtype;
                
                // Update field visibility based on property type
                updatePropertyTypeFields();
                
                document.getElementById('propertyForm').style.display = 'block';
                // Focus on property name input
                setTimeout(() => {
                    document.getElementById('propertyName').focus();
                }, 100);
            }
        }
    }).catch((error) => {
        console.error('Error loading property:', error);
        alert('Error loading property: ' + error.message);
    });
};

function closePropertyEditModal() {
    const editModal = document.getElementById('propertyEditModal');
    if (editModal) {
        editModal.classList.remove('show');
        const editForm = document.getElementById('propertyEditForm');
        if (editForm) {
            editForm.reset();
        }
        const editId = document.getElementById('propertyEditId');
        if (editId) {
            editId.value = '';
        }
    }
}

function handlePropertyEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('propertyEditId').value;
    const name = document.getElementById('propertyEditName').value.trim();
    const address = document.getElementById('propertyEditAddress').value.trim();
    const propertyType = document.getElementById('propertyEditType').value;
    const description = document.getElementById('propertyEditDescription').value.trim();

    if (!name) {
        alert('Property name is required');
        return;
    }
    
    if (!propertyType) {
        alert('Property type is required');
        return;
    }

    // Disable submit button and show loading modal
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        const loadingModalTitle = document.getElementById('loadingModalTitle');
        const loadingModalMessage = document.getElementById('loadingModalMessage');
        if (loadingModalTitle) loadingModalTitle.textContent = 'Saving Property...';
        if (loadingModalMessage) loadingModalMessage.textContent = 'Please wait while we save your property';
        loadingModal.classList.add('show');
    }

    // Update existing property
    db.collection('properties').doc(id).get().then((doc) => {
        const existing = doc.data();
        const propertyData = {
            name,
            address: address || null,
            propertyType: propertyType,
            description: description || null,
            createdAt: existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        return db.collection('properties').doc(id).update(propertyData);
    }).then(() => {
        console.log('Property updated successfully');
        // Hide loading modal
        if (loadingModal) {
            loadingModal.classList.remove('show');
        }
        closePropertyEditModal();
    }).catch((error) => {
        console.error('Error updating property:', error);
        // Hide loading modal
        if (loadingModal) {
            loadingModal.classList.remove('show');
        }
        alert('Error saving property: ' + error.message);
        // Re-enable submit button on error
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Property';
            submitBtn.classList.remove('saving');
        }
    });
}

window.deleteProperty = function(id) {
    if (confirm('Are you sure you want to delete this property? This will not delete associated tickets.')) {
        db.collection('properties').doc(id).delete();
    }
};

function handlePropertySelect(e) {
    selectedPropertyId = e.target.value;
    localStorage.setItem('selectedPropertyId', selectedPropertyId);
    loadTickets();
}

// Ticket Management
function loadTickets() {
    db.collection('tickets').onSnapshot((snapshot) => {
        const tickets = {};
        snapshot.docs.forEach(doc => {
            tickets[doc.id] = { id: doc.id, ...doc.data() };
        });
        renderTickets(tickets);
        updateMetrics(tickets);
    });
}

// Metrics Dashboard
function updateMetrics(tickets) {
    let activeCount = 0;
    let completedCount = 0;
    let totalHours = 0;
    let completedHours = 0;
    let estimatedCost = 0;
    let totalCost = 0;

    Object.values(tickets).forEach(ticket => {
        // Skip deleted tickets in metrics
        if (ticket.deletedAt) {
            return;
        }
        
        // Filter by selected property if one is selected
        if (selectedPropertyId && ticket.propertyId !== selectedPropertyId) {
            return;
        }

        const hours = ticket.timeAllocated || 0;
        const billingRate = ticket.billingRate || 0;
        // Calculate cost based on billing type
        const cost = ticket.billingType === 'flat' ? billingRate : (hours * billingRate);

        if (ticket.status === 'Completed') {
            completedCount++;
            completedHours += hours;
            totalCost += cost;
        } else {
            activeCount++;
            totalHours += hours;
            estimatedCost += cost;
        }
    });

    // Update metric displays
    document.getElementById('metricActiveTickets').textContent = activeCount;
    document.getElementById('metricCompletedTickets').textContent = completedCount;
    document.getElementById('metricTotalHours').textContent = totalHours.toFixed(1);
    document.getElementById('metricCompletedHours').textContent = completedHours.toFixed(1);
    document.getElementById('metricEstimatedCost').textContent = '$' + estimatedCost.toFixed(2);
    document.getElementById('metricTotalCost').textContent = '$' + totalCost.toFixed(2);
}

function renderTickets(tickets) {
    const activeList = document.getElementById('activeTicketsList');
    const completedList = document.getElementById('completedTicketsList');
    const deletedList = document.getElementById('deletedTicketsList');
    
    activeList.innerHTML = '';
    completedList.innerHTML = '';
    if (deletedList) deletedList.innerHTML = '';

    let activeTickets = [];
    let completedTickets = [];
    let deletedTickets = [];

    // First, check for and permanently delete tickets older than 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    Object.keys(tickets).forEach(id => {
        const ticket = tickets[id];
        ticket.id = id;

        // Check if ticket is deleted and older than 30 days - permanently delete it
        if (ticket.deletedAt) {
            const deletedDate = ticket.deletedAt.toDate ? ticket.deletedAt.toDate() : new Date(ticket.deletedAt);
            if (deletedDate < thirtyDaysAgo) {
                // Permanently delete this ticket
                db.collection('tickets').doc(id).delete().catch((error) => {
                    console.error('Error permanently deleting ticket:', error);
                });
                return; // Skip this ticket
            }
        }

        // Filter by selected property if one is selected
        if (selectedPropertyId && ticket.propertyId !== selectedPropertyId) {
            return;
        }

        // Check if ticket is deleted
        if (ticket.deletedAt) {
            deletedTickets.push(ticket);
        } else if (ticket.status === 'Completed') {
            completedTickets.push(ticket);
        } else {
            activeTickets.push(ticket);
        }
    });

    // Sort by date created (newest first)
    activeTickets.sort((a, b) => {
        const aTime = a.dateCreated?.toMillis ? a.dateCreated.toMillis() : (a.dateCreated || 0);
        const bTime = b.dateCreated?.toMillis ? b.dateCreated.toMillis() : (b.dateCreated || 0);
        return bTime - aTime;
    });
    completedTickets.sort((a, b) => {
        const aTime = a.dateCompleted?.toMillis ? a.dateCompleted.toMillis() : (a.dateCompleted || 0);
        const bTime = b.dateCompleted?.toMillis ? b.dateCompleted.toMillis() : (b.dateCompleted || 0);
        return bTime - aTime;
    });

    if (activeTickets.length === 0) {
        activeList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No active tickets</p></div>';
    } else {
        activeTickets.forEach(ticket => {
            activeList.appendChild(createTicketCard(ticket));
        });
    }

    if (completedTickets.length === 0) {
        completedList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><p>No completed tickets</p></div>';
    } else {
        completedTickets.forEach(ticket => {
            completedList.appendChild(createTicketCard(ticket));
        });
    }

    // Render deleted tickets
    if (deletedList) {
        deletedTickets.sort((a, b) => {
            const aTime = a.deletedAt?.toMillis ? a.deletedAt.toMillis() : (a.deletedAt || 0);
            const bTime = b.deletedAt?.toMillis ? b.deletedAt.toMillis() : (b.deletedAt || 0);
            return bTime - aTime;
        });

        if (deletedTickets.length === 0) {
            deletedList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗑️</div><p>No deleted tickets</p></div>';
        } else {
            deletedTickets.forEach(ticket => {
                deletedList.appendChild(createTicketCard(ticket, true));
            });
        }
    }
}

function createTicketCard(ticket, isDeleted = false) {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    if (isDeleted) {
        card.style.opacity = '0.7';
        card.style.borderLeft = '4px solid #e74c3c';
    }

    // Get property name
    let propertyName = 'Unknown Property';
    db.collection('properties').doc(ticket.propertyId).get().then((doc) => {
        const property = doc.data();
        if (property) {
            const nameElement = card.querySelector('.property-name');
            if (nameElement) nameElement.textContent = property.name;
        }
    });

    const isCompleted = ticket.status === 'Completed';
    const statusClass = `status-${ticket.status.toLowerCase().replace(' ', '-')}`;

    card.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-title">${escapeHtml(ticket.workDescription)}</div>
            <span class="ticket-status ${statusClass}">${escapeHtml(ticket.status)}</span>
        </div>
        <div class="ticket-details">
            ${selectedPropertyId ? '' : `<div class="ticket-detail"><span class="ticket-detail-label">Property</span><span class="ticket-detail-value property-name">Loading...</span></div>`}
            ${ticket.buildingNumber ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Building #</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.buildingNumber)}</span>
                </div>
            ` : ''}
            ${ticket.floorNumber ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Floor #</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.floorNumber)}</span>
                </div>
            ` : ''}
            ${ticket.tenantName ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Tenant Name</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.tenantName)}</span>
                </div>
            ` : ''}
            <div class="ticket-detail">
                <span class="ticket-detail-label">Time Allocated</span>
                <span class="ticket-detail-value">${ticket.timeAllocated} hours</span>
            </div>
            ${ticket.billingRate ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">${ticket.billingType === 'flat' ? 'Flat Rate' : 'Billing Rate'}</span>
                    <span class="ticket-detail-value">${ticket.billingType === 'flat' ? '$' + parseFloat(ticket.billingRate).toFixed(2) : '$' + parseFloat(ticket.billingRate).toFixed(2) + '/hr'}</span>
                </div>
                <div class="ticket-detail">
                    <span class="ticket-detail-label">${ticket.status === 'Completed' ? 'Total Cost' : 'Estimated Cost'}</span>
                    <span class="ticket-detail-value" style="font-weight: 600; color: #667eea;">$${ticket.billingType === 'flat' ? parseFloat(ticket.billingRate).toFixed(2) : ((ticket.timeAllocated || 0) * (ticket.billingRate || 0)).toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="ticket-detail">
                <span class="ticket-detail-label">Requested By</span>
                <span class="ticket-detail-value">${escapeHtml(ticket.requestedBy)}</span>
            </div>
            <div class="ticket-detail">
                <span class="ticket-detail-label">Managed By</span>
                <span class="ticket-detail-value">${escapeHtml(ticket.managedBy)}</span>
            </div>
            ${isCompleted && ticket.completedBy ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Completed By</span>
                    <span class="ticket-detail-value" style="font-weight: 600; color: #2e7d32;">${escapeHtml(ticket.completedBy)}</span>
                </div>
            ` : ''}
            <div class="ticket-detail">
                <span class="ticket-detail-label">Date Created</span>
                <span class="ticket-detail-value">${formatDate(ticket.dateCreated)}</span>
            </div>
            ${ticket.lastUpdated || ticket.updatedAt ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Last Updated</span>
                    <span class="ticket-detail-value">${formatDate(ticket.lastUpdated || ticket.updatedAt)}</span>
                </div>
            ` : ''}
            ${isDeleted && ticket.deletedAt ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Deleted On</span>
                    <span class="ticket-detail-value">${formatDate(ticket.deletedAt)}</span>
                </div>
            ` : ''}
            ${isDeleted && ticket.deletedReason ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Deletion Reason</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.deletedReason)}</span>
                </div>
            ` : ''}
            ${isCompleted ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Date Completed</span>
                    <span class="ticket-detail-value">${formatDate(ticket.dateCompleted)}</span>
                </div>
            ` : ''}
        </div>
        <div class="ticket-actions">
            ${!isDeleted ? `
                ${!isCompleted ? `
                    <button class="btn-primary btn-small" onclick="markTicketComplete('${ticket.id}')">Mark as Complete</button>
                ` : ''}
                <button class="btn-secondary btn-small" onclick="editTicket('${ticket.id}')">Edit</button>
                <button class="btn-secondary btn-small" onclick="toggleTicketDetails('${ticket.id}')">
                    <span id="toggleIcon-${ticket.id}">▼</span> <span id="toggleText-${ticket.id}">Show Details</span>
                </button>
                <button class="btn-danger btn-small" onclick="openDeleteTicketModal('${ticket.id}')">Delete</button>
            ` : `
                <button class="btn-secondary btn-small" onclick="toggleTicketDetails('${ticket.id}')">
                    <span id="toggleIcon-${ticket.id}">▼</span> <span id="toggleText-${ticket.id}">Show Details</span>
                </button>
            `}
        </div>
        <div class="ticket-expanded-details" id="expandedDetails-${ticket.id}" style="display: none;">
            ${ticket.howResolved ? `
                <div class="expanded-detail-section">
                    <h4>How Resolved</h4>
                    <p>${escapeHtml(ticket.howResolved)}</p>
                </div>
            ` : ''}
            ${ticket.detailedDescription ? `
                <div class="expanded-detail-section">
                    <h4>Detailed Description</h4>
                    <p>${escapeHtml(ticket.detailedDescription)}</p>
                </div>
            ` : ''}
            ${ticket.workUpdates ? `
                <div class="expanded-detail-section">
                    <h4>Work Updates / Notes</h4>
                    <p style="white-space: pre-wrap;">${escapeHtml(ticket.workUpdates)}</p>
                </div>
            ` : ''}
            ${(ticket.beforePhotoUrl || ticket.afterPhotoUrl) ? `
                <div class="expanded-detail-section">
                    <h4>Photos</h4>
                    <div class="ticket-photos-expanded">
                        ${ticket.beforePhotoUrl ? `
                            <div class="photo-item-expanded">
                                <span class="photo-label">Before</span>
                                <img src="${escapeHtml(ticket.beforePhotoUrl)}" alt="Before" class="ticket-photo-expanded" onclick="openPhotoModal('${escapeHtml(ticket.beforePhotoUrl)}')">
                            </div>
                        ` : ''}
                        ${ticket.afterPhotoUrl ? `
                            <div class="photo-item-expanded">
                                <span class="photo-label">After</span>
                                <img src="${escapeHtml(ticket.afterPhotoUrl)}" alt="After" class="ticket-photo-expanded" onclick="openPhotoModal('${escapeHtml(ticket.afterPhotoUrl)}')">
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            ${!ticket.howResolved && !ticket.beforePhotoUrl && !ticket.afterPhotoUrl && !ticket.detailedDescription ? `
                <div class="expanded-detail-section">
                    <p style="color: #999; text-align: center; padding: 20px;">No additional details available</p>
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

function openTicketModal(ticketId = null) {
    if (!selectedPropertyId && !ticketId) {
        // Check if there are any properties
        db.collection('properties').get().then((snapshot) => {
            if (snapshot.empty) {
                if (confirm('No properties found. Would you like to add a property first?')) {
                    openPropertyModalForAdd();
                }
            } else {
                alert('Please select a property first, or choose one when creating the ticket.');
            }
        });
        return;
    }

    document.getElementById('ticketModal').classList.add('show');
    document.getElementById('ticketForm').reset();
    document.getElementById('ticketId').value = '';
    editingTicketId = null;
    
    // Reset billing type to hourly
    document.getElementById('billingTypeHourly').checked = true;
    const billingRateLabel = document.getElementById('billingRateLabel');
    const billingRateInput = document.getElementById('billingRate');
    if (billingRateLabel && billingRateInput) {
        billingRateLabel.textContent = 'Billing Rate ($/hour)';
        billingRateInput.placeholder = 'e.g., 75.00';
    }
    
    // Reset submit button state
    const submitBtn = document.querySelector('#ticketForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Ticket';
        submitBtn.classList.remove('saving');
    }

    // Populate property dropdown
    const ticketPropertySelect = document.getElementById('ticketProperty');
    if (selectedPropertyId && ticketPropertySelect) {
        ticketPropertySelect.value = selectedPropertyId;
        // Check property type and show/hide commercial fields
        updateCommercialFieldsVisibility(selectedPropertyId);
    }

    // Set default status
    document.getElementById('ticketStatus').value = 'Not Started';
    document.getElementById('completedByGroup').style.display = 'none';
    document.getElementById('howResolvedGroup').style.display = 'none';
    document.getElementById('afterPhotoGroup').style.display = 'none';
    document.getElementById('retroactiveDatesGroup').style.display = 'none';
    document.getElementById('customDateCreated').value = '';
    document.getElementById('customDateCompleted').value = '';
    // Before photo is always visible, so no need to hide it
    
    // Reset file uploads
    beforePhotoFile = null;
    afterPhotoFile = null;
    beforePhotoUrl = null;
    afterPhotoUrl = null;
    document.getElementById('beforePhoto').value = '';
    document.getElementById('afterPhoto').value = '';
    document.getElementById('beforePhotoPreview').innerHTML = '';
    document.getElementById('afterPhotoPreview').innerHTML = '';
    document.getElementById('removeBeforePhoto').style.display = 'none';
    document.getElementById('removeAfterPhoto').style.display = 'none';

    // If editing, load ticket data
    if (ticketId) {
        loadTicketForEdit(ticketId);
    } else {
        // For new tickets, check property type
        if (selectedPropertyId) {
            updateCommercialFieldsVisibility(selectedPropertyId);
        }
    }
}

// Update commercial fields visibility based on property type
function updateCommercialFieldsVisibility(propertyId) {
    return new Promise((resolve) => {
        // Ensure propertyId is a string and not empty
        if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
            const commercialFieldsGroup = document.getElementById('commercialFieldsGroup');
            if (commercialFieldsGroup) {
                commercialFieldsGroup.style.display = 'none';
            }
            resolve();
            return;
        }
        
        // Ensure propertyId is a valid string for Firestore
        const cleanPropertyId = String(propertyId).trim();
        
        db.collection('properties').doc(cleanPropertyId).get().then((doc) => {
            if (!doc.exists) {
                console.warn('Property not found:', cleanPropertyId);
                const commercialFieldsGroup = document.getElementById('commercialFieldsGroup');
                if (commercialFieldsGroup) {
                    commercialFieldsGroup.style.display = 'none';
                }
                resolve();
                return;
            }
            
            const property = doc.data();
            const commercialFieldsGroup = document.getElementById('commercialFieldsGroup');
            
            // Check property type (case-insensitive and handle variations)
            const propertyType = property?.propertyType ? String(property.propertyType).toLowerCase().trim() : '';
            const isCommercial = propertyType === 'commercial';
            
            console.log('Property type check:', { propertyId: cleanPropertyId, propertyType, isCommercial, property });
            
            if (property && isCommercial) {
                if (commercialFieldsGroup) {
                    commercialFieldsGroup.style.display = 'block';
                    console.log('Commercial fields shown for property:', cleanPropertyId);
                }
            } else {
                if (commercialFieldsGroup) {
                    commercialFieldsGroup.style.display = 'none';
                }
                // Clear the fields when hiding
                const buildingNumber = document.getElementById('buildingNumber');
                const floorNumber = document.getElementById('floorNumber');
                const tenantName = document.getElementById('tenantName');
                if (buildingNumber) buildingNumber.value = '';
                if (floorNumber) floorNumber.value = '';
                if (tenantName) tenantName.value = '';
            }
            resolve();
        }).catch((error) => {
            console.error('Error loading property:', error);
            const commercialFieldsGroup = document.getElementById('commercialFieldsGroup');
            if (commercialFieldsGroup) {
                commercialFieldsGroup.style.display = 'none';
            }
            resolve();
        });
    });
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('show');
    editingTicketId = null;
}

function loadTicketForEdit(ticketId) {
    db.collection('tickets').doc(ticketId).get().then((doc) => {
        const ticket = doc.data();
        if (ticket) {
            editingTicketId = ticketId;
            document.getElementById('ticketId').value = ticketId;
            document.getElementById('ticketProperty').value = ticket.propertyId || '';
            // Check property type and show/hide commercial fields, then set values
            if (ticket.propertyId) {
                updateCommercialFieldsVisibility(ticket.propertyId).then(() => {
                    document.getElementById('buildingNumber').value = ticket.buildingNumber || '';
                    document.getElementById('floorNumber').value = ticket.floorNumber || '';
                    document.getElementById('tenantName').value = ticket.tenantName || '';
                });
            } else {
                document.getElementById('buildingNumber').value = ticket.buildingNumber || '';
                document.getElementById('floorNumber').value = ticket.floorNumber || '';
                document.getElementById('tenantName').value = ticket.tenantName || '';
            }
            document.getElementById('workDescription').value = ticket.workDescription || '';
            document.getElementById('detailedDescription').value = ticket.detailedDescription || '';
            document.getElementById('workUpdates').value = ticket.workUpdates || '';
            document.getElementById('timeAllocated').value = ticket.timeAllocated || '';
            document.getElementById('billingRate').value = ticket.billingRate || '';
            // Set billing type (default to hourly if not set for backward compatibility)
            const billingType = ticket.billingType || 'hourly';
            if (billingType === 'flat') {
                document.getElementById('billingTypeFlat').checked = true;
            } else {
                document.getElementById('billingTypeHourly').checked = true;
            }
            // Update label based on selected type
            const billingRateLabel = document.getElementById('billingRateLabel');
            const billingRateInput = document.getElementById('billingRate');
            if (billingRateLabel && billingRateInput) {
                if (billingType === 'flat') {
                    billingRateLabel.textContent = 'Flat Rate Amount ($)';
                    billingRateInput.placeholder = 'e.g., 500.00';
                } else {
                    billingRateLabel.textContent = 'Billing Rate ($/hour)';
                    billingRateInput.placeholder = 'e.g., 75.00';
                }
            }
            document.getElementById('requestedBy').value = ticket.requestedBy || '';
            document.getElementById('managedBy').value = ticket.managedBy || '';
            document.getElementById('ticketStatus').value = ticket.status || 'Not Started';
            
            // Always show before photo if it exists
            if (ticket.beforePhotoUrl) {
                beforePhotoUrl = ticket.beforePhotoUrl;
                showPhotoPreview(ticket.beforePhotoUrl, 'before');
            }
            
            if (ticket.status === 'Completed') {
                document.getElementById('completedBy').value = ticket.completedBy || '';
                document.getElementById('howResolved').value = ticket.howResolved || '';
                document.getElementById('completedByGroup').style.display = 'block';
                document.getElementById('howResolvedGroup').style.display = 'block';
                document.getElementById('afterPhotoGroup').style.display = 'block';
                document.getElementById('retroactiveDatesGroup').style.display = 'block';
                
                // Load existing after photo if any
                if (ticket.afterPhotoUrl) {
                    afterPhotoUrl = ticket.afterPhotoUrl;
                    showPhotoPreview(ticket.afterPhotoUrl, 'after');
                }
            }
            
            // Load custom dates if they exist (for retroactive tickets)
            // Note: Firestore timestamps need to be converted to date input format
            if (ticket.dateCreated && ticket.dateCreated.toDate) {
                const createdDate = ticket.dateCreated.toDate();
                const createdDateStr = createdDate.toISOString().split('T')[0];
                document.getElementById('customDateCreated').value = createdDateStr;
            }
            if (ticket.dateCompleted && ticket.dateCompleted.toDate) {
                const completedDate = ticket.dateCompleted.toDate();
                const completedDateStr = completedDate.toISOString().split('T')[0];
                document.getElementById('customDateCompleted').value = completedDateStr;
            }
        }
    });
}

function handleStatusChange(e) {
    if (e.target.value === 'Completed') {
        document.getElementById('completedByGroup').style.display = 'block';
        document.getElementById('howResolvedGroup').style.display = 'block';
        document.getElementById('afterPhotoGroup').style.display = 'block';
        document.getElementById('retroactiveDatesGroup').style.display = 'block';
    } else {
        document.getElementById('completedByGroup').style.display = 'none';
        document.getElementById('howResolvedGroup').style.display = 'none';
        document.getElementById('afterPhotoGroup').style.display = 'none';
        document.getElementById('retroactiveDatesGroup').style.display = 'none';
    }
}

function handleTicketSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('ticketId').value;
    const propertyIdInput = document.getElementById('ticketProperty');
    const propertyId = propertyIdInput ? String(propertyIdInput.value).trim() : '';
    if (!propertyId) {
        alert('Please select a property');
        return;
    }
    const buildingNumber = document.getElementById('buildingNumber').value.trim();
    const floorNumber = document.getElementById('floorNumber').value.trim();
    const tenantName = document.getElementById('tenantName').value.trim();
    const workDescription = document.getElementById('workDescription').value.trim();
    const detailedDescription = document.getElementById('detailedDescription').value.trim();
    const workUpdates = document.getElementById('workUpdates').value.trim();
    const timeAllocated = parseFloat(document.getElementById('timeAllocated').value);
    const billingRateInput = document.getElementById('billingRate');
    const billingRate = billingRateInput && billingRateInput.value ? parseFloat(billingRateInput.value) : null;
    const billingTypeHourly = document.getElementById('billingTypeHourly');
    const billingType = billingRateInput && billingRateInput.value && billingTypeHourly && billingTypeHourly.checked ? 'hourly' : (billingRateInput && billingRateInput.value ? 'flat' : null);
    const requestedBy = document.getElementById('requestedBy').value.trim();
    const managedBy = document.getElementById('managedBy').value.trim();
    const status = document.getElementById('ticketStatus').value;
    const completedBy = document.getElementById('completedBy').value.trim();
    const howResolved = document.getElementById('howResolved').value.trim();

    if (!propertyId || !workDescription || !requestedBy || !managedBy) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Time allocated is optional when creating/editing, but required when marking complete
    if (status === 'Completed' && (!timeAllocated || isNaN(timeAllocated) || timeAllocated <= 0)) {
        alert('Time Allocated is required before marking a ticket as complete');
        return;
    }

    if (status === 'Completed' && !completedBy) {
        alert('Please enter who completed the work');
        return;
    }
    
    // Disable submit button and show loading modal
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        loadingModal.classList.add('show');
    }

    // Upload photos first if any - track type with each upload
    const uploadPromises = [];
    
    if (beforePhotoFile) {
        uploadPromises.push(uploadPhoto(beforePhotoFile, id || 'temp', 'before').then(url => ({ type: 'before', url })));
    }
    if (afterPhotoFile) {
        uploadPromises.push(uploadPhoto(afterPhotoFile, id || 'temp', 'after').then(url => ({ type: 'after', url })));
    }
    
    // If no new photos, use existing URLs
    Promise.all(uploadPromises).then((photoResults) => {
        const beforeUrl = photoResults.find(r => r && r.type === 'before')?.url || beforePhotoUrl;
        const afterUrl = photoResults.find(r => r && r.type === 'after')?.url || afterPhotoUrl;
        
        if (id && editingTicketId) {
            // Update existing - preserve dateCreated and handle dateCompleted properly
            db.collection('tickets').doc(id).get().then((doc) => {
                const existing = doc.data();
                
                // Check for custom dates
                const customDateCreated = document.getElementById('customDateCreated')?.value;
                const customDateCompleted = document.getElementById('customDateCompleted')?.value;
                
                const ticketData = {
                    propertyId,
                    buildingNumber: buildingNumber || null,
                    floorNumber: floorNumber || null,
                    tenantName: tenantName || null,
                    workDescription,
                    detailedDescription: detailedDescription || null,
                    workUpdates: workUpdates || null,
                    timeAllocated: timeAllocated && !isNaN(timeAllocated) ? timeAllocated : null,
                    billingRate: billingRate || null,
                    billingType: billingRate ? billingType : null,
                    requestedBy,
                    managedBy,
                    status,
                    // Always update the lastUpdated timestamp
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // ONLY include dateCreated if a custom date is explicitly provided
                // Otherwise, DO NOT include it in the update to preserve the existing value
                if (customDateCreated) {
                    ticketData.dateCreated = firebase.firestore.Timestamp.fromDate(new Date(customDateCreated));
                }
                // If no custom date, we don't include dateCreated at all - Firestore will preserve existing value

                // Always save before photo if it exists (can be uploaded for any status)
                if (beforeUrl) ticketData.beforePhotoUrl = beforeUrl;
                // Only save after photo if status is Completed
                if (status === 'Completed') {
                    ticketData.completedBy = completedBy;
                    ticketData.howResolved = howResolved || null;
                    if (afterUrl) ticketData.afterPhotoUrl = afterUrl;
                    // Only set dateCompleted if it wasn't already completed
                    if (existing?.status !== 'Completed') {
                        ticketData.dateCompleted = customDateCompleted
                            ? firebase.firestore.Timestamp.fromDate(new Date(customDateCompleted))
                            : firebase.firestore.FieldValue.serverTimestamp();
                    } else {
                        // If already completed, use custom date if provided, otherwise keep existing
                        ticketData.dateCompleted = customDateCompleted
                            ? firebase.firestore.Timestamp.fromDate(new Date(customDateCompleted))
                            : existing.dateCompleted;
                    }
                } else {
                    ticketData.completedBy = null;
                    ticketData.howResolved = null;
                    ticketData.afterPhotoUrl = null;
                    ticketData.dateCompleted = null;
                    // Preserve existing afterPhotoUrl if status changed from Completed to something else
                    if (existing?.afterPhotoUrl && !afterUrl) {
                        ticketData.afterPhotoUrl = existing.afterPhotoUrl;
                    }
                }

                return db.collection('tickets').doc(id).update(ticketData);
            }).then(() => {
                // Hide loading modal
                const loadingModal = document.getElementById('loadingModal');
                if (loadingModal) {
                    loadingModal.classList.remove('show');
                }
                closeTicketModal();
            }).catch((error) => {
                console.error('Error updating ticket:', error);
                // Hide loading modal
                const loadingModal = document.getElementById('loadingModal');
                if (loadingModal) {
                    loadingModal.classList.remove('show');
                }
                alert('Error saving ticket: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Ticket';
                    submitBtn.classList.remove('saving');
                }
            });
        } else {
            // Create new ticket - first create the ticket to get ID, then update with photos
            const ticketData = {
                propertyId,
                buildingNumber: buildingNumber || null,
                floorNumber: floorNumber || null,
                tenantName: tenantName || null,
                workDescription,
                detailedDescription: detailedDescription || null,
                timeAllocated,
                billingRate: billingRate || null,
                requestedBy,
                managedBy,
                status: status || 'Not Started',
                dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Check if this is a retroactive ticket with custom dates
            const customDateCreated = document.getElementById('customDateCreated')?.value;
            const customDateCompleted = document.getElementById('customDateCompleted')?.value;
            
            if (customDateCreated) {
                ticketData.dateCreated = firebase.firestore.Timestamp.fromDate(new Date(customDateCreated));
            }
            
            if (status === 'Completed') {
                ticketData.completedBy = completedBy;
                ticketData.howResolved = howResolved || null;
                if (customDateCompleted) {
                    ticketData.dateCompleted = firebase.firestore.Timestamp.fromDate(new Date(customDateCompleted));
                } else {
                    ticketData.dateCompleted = firebase.firestore.FieldValue.serverTimestamp();
                }
            } else {
                ticketData.completedBy = null;
                ticketData.howResolved = null;
                ticketData.dateCompleted = null;
            }

            // Create ticket first to get ID
            db.collection('tickets').add(ticketData).then((docRef) => {
                const newTicketId = docRef.id;
                
                // If photos were uploaded with 'temp', we need to re-upload them with the real ID
                // OR update the ticket with the URLs we already have
                const updateData = {};
                if (beforeUrl) updateData.beforePhotoUrl = beforeUrl;
                if (afterUrl && status === 'Completed') updateData.afterPhotoUrl = afterUrl;
                
                // If we have photos to add, update the ticket
                if (Object.keys(updateData).length > 0) {
                    return db.collection('tickets').doc(newTicketId).update(updateData);
                }
            }).then(() => {
                // Hide loading modal
                const loadingModal = document.getElementById('loadingModal');
                if (loadingModal) {
                    loadingModal.classList.remove('show');
                }
                closeTicketModal();
            }).catch((error) => {
                console.error('Error creating ticket:', error);
                // Hide loading modal
                const loadingModal = document.getElementById('loadingModal');
                if (loadingModal) {
                    loadingModal.classList.remove('show');
                }
                alert('Error saving ticket: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Ticket';
                    submitBtn.classList.remove('saving');
                }
            });
        }
    }).catch((error) => {
        console.error('Error uploading photos:', error);
        // Hide loading modal
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            loadingModal.classList.remove('show');
        }
        alert('Error uploading photos: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Ticket';
            submitBtn.classList.remove('saving');
        }
    });
}

window.markTicketComplete = function(ticketId) {
    editingTicketId = ticketId;
    document.getElementById('completionModal').classList.add('show');
    document.getElementById('completionCompletedBy').value = '';
    document.getElementById('completionHowResolved').value = '';
    document.getElementById('completionAfterPhoto').value = '';
    document.getElementById('completionAfterPhotoPreview').innerHTML = '';
    document.getElementById('removeCompletionAfterPhoto').style.display = 'none';
    completionAfterPhotoFile = null;
    document.getElementById('completionCompletedBy').focus();
};

function closeCompletionModal() {
    document.getElementById('completionModal').classList.remove('show');
    editingTicketId = null;
}

function handleTicketCompletion(e) {
    e.preventDefault();
    const completedBy = document.getElementById('completionCompletedBy').value.trim();
    const howResolved = document.getElementById('completionHowResolved').value.trim();

    if (!completedBy) {
        alert('Please enter who completed the work');
        return;
    }

    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    // Check if timeAllocated is set - required before marking complete
    if (!editingTicketId) {
        alert('Error: Ticket ID not found');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mark as Complete';
        }
        return;
    }
    
    // Get the ticket to check timeAllocated
    db.collection('tickets').doc(editingTicketId).get().then((doc) => {
        const ticket = doc.data();
        const timeAllocated = ticket?.timeAllocated;
        
        if (!timeAllocated || isNaN(timeAllocated) || timeAllocated <= 0) {
            alert('Time Allocated is required before marking a ticket as complete. Please edit the ticket and add the time allocated first.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Mark as Complete';
            }
            return;
        }
        
        // Continue with completion if timeAllocated is set
        // Upload after photo if provided
        const uploadPromise = completionAfterPhotoFile 
            ? uploadPhoto(completionAfterPhotoFile, editingTicketId, 'after')
            : Promise.resolve(null);

        uploadPromise.then((afterPhotoUrl) => {
            const updateData = {
                status: 'Completed',
                completedBy: completedBy,
                howResolved: howResolved || null,
                dateCompleted: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (afterPhotoUrl) {
                updateData.afterPhotoUrl = afterPhotoUrl;
            }

            return db.collection('tickets').doc(editingTicketId).update(updateData);
        }).then(() => {
            closeCompletionModal();
        }).catch((error) => {
            console.error('Error completing ticket:', error);
            alert('Error completing ticket: ' + error.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Mark as Complete';
            }
        });
    }).catch((error) => {
        console.error('Error checking ticket:', error);
        alert('Error checking ticket: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mark as Complete';
        }
    });
}

window.editTicket = function(ticketId) {
    openTicketModal(ticketId);
};

// Delete Ticket Functions
let deletingTicketId = null;

window.openDeleteTicketModal = function(ticketId) {
    deletingTicketId = ticketId;
    document.getElementById('deleteTicketModal').classList.add('show');
    document.getElementById('deleteReason').value = '';
    document.getElementById('deleteReason').focus();
};

function closeDeleteTicketModal() {
    document.getElementById('deleteTicketModal').classList.remove('show');
    deletingTicketId = null;
    const deleteForm = document.getElementById('deleteTicketForm');
    if (deleteForm) deleteForm.reset();
}

function handleDeleteTicket(e) {
    e.preventDefault();
    
    const deleteReason = document.getElementById('deleteReason').value.trim();
    
    if (!deleteReason) {
        alert('Please provide a reason for deletion');
        return;
    }
    
    if (!deletingTicketId) {
        alert('Error: Ticket ID not found');
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Deleting...';
    }
    
    // Mark ticket as deleted instead of actually deleting it
    db.collection('tickets').doc(deletingTicketId).update({
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        deletedReason: deleteReason,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeDeleteTicketModal();
        // Reload tickets to update the view
        loadTickets();
    }).catch((error) => {
        console.error('Error deleting ticket:', error);
        alert('Error deleting ticket: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Delete Ticket';
        }
    });
}

// View Management
function switchView(view) {
    currentView = view;
    
    const activeView = document.getElementById('activeTicketsView');
    const completedView = document.getElementById('completedTicketsView');
    const deletedView = document.getElementById('deletedTicketsView');
    const activeBtn = document.getElementById('viewActiveBtn');
    const completedBtn = document.getElementById('viewCompletedBtn');
    const deletedBtn = document.getElementById('viewDeletedBtn');
    
    // Hide all views
    activeView.style.display = 'none';
    completedView.style.display = 'none';
    if (deletedView) deletedView.style.display = 'none';
    
    // Remove active class from all buttons
    activeBtn.classList.remove('active');
    completedBtn.classList.remove('active');
    if (deletedBtn) deletedBtn.classList.remove('active');
    
    // Show selected view and activate button
    if (view === 'active') {
        activeView.style.display = 'block';
        activeBtn.classList.add('active');
    } else if (view === 'completed') {
        completedView.style.display = 'block';
        completedBtn.classList.add('active');
    } else if (view === 'deleted') {
        if (deletedView) deletedView.style.display = 'block';
        if (deletedBtn) deletedBtn.classList.add('active');
    }
}

// Metrics Dashboard Toggle
function toggleMetrics() {
    const content = document.getElementById('metricsContent');
    const toggleText = document.getElementById('metricsToggleText');
    const toggleIcon = document.getElementById('metricsToggleIcon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggleText.textContent = 'Click to Collapse';
        toggleIcon.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggleText.textContent = 'Click to Expand';
        toggleIcon.textContent = '▼';
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp objects
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp.toMillis) {
        date = new Date(timestamp.toMillis());
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// File Upload Functions
function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 20MB - Firebase Storage supports up to 32MB for web)
    if (file.size > 20 * 1024 * 1024) {
        alert('File size must be less than 20MB');
        return;
    }
    
    if (type === 'before') {
        beforePhotoFile = file;
    } else {
        afterPhotoFile = file;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        showPhotoPreview(e.target.result, type);
    };
    reader.readAsDataURL(file);
}

function showPhotoPreview(url, type) {
    const previewId = type === 'before' ? 'beforePhotoPreview' : 'afterPhotoPreview';
    const removeBtnId = type === 'before' ? 'removeBeforePhoto' : 'removeAfterPhoto';
    
    const preview = document.getElementById(previewId);
    preview.innerHTML = `<img src="${url}" alt="${type} preview" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 10px;">`;
    document.getElementById(removeBtnId).style.display = 'inline-block';
}

function removeFile(type) {
    if (type === 'before') {
        beforePhotoFile = null;
        beforePhotoUrl = null;
        document.getElementById('beforePhoto').value = '';
        document.getElementById('beforePhotoPreview').innerHTML = '';
        document.getElementById('removeBeforePhoto').style.display = 'none';
    } else {
        afterPhotoFile = null;
        afterPhotoUrl = null;
        document.getElementById('afterPhoto').value = '';
        document.getElementById('afterPhotoPreview').innerHTML = '';
        document.getElementById('removeAfterPhoto').style.display = 'none';
    }
}

function handleCompletionFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 20MB - Firebase Storage supports up to 32MB for web)
    if (file.size > 20 * 1024 * 1024) {
        alert('File size must be less than 20MB');
        return;
    }
    
    completionAfterPhotoFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('completionAfterPhotoPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="after preview" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 10px;">`;
        document.getElementById('removeCompletionAfterPhoto').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

function removeCompletionFile() {
    completionAfterPhotoFile = null;
    document.getElementById('completionAfterPhoto').value = '';
    document.getElementById('completionAfterPhotoPreview').innerHTML = '';
    document.getElementById('removeCompletionAfterPhoto').style.display = 'none';
}

function uploadPhoto(file, ticketId, type) {
    return new Promise((resolve, reject) => {
        // Use a temporary ID if creating new ticket
        const fileName = ticketId === 'temp' 
            ? `temp_${type}_${Date.now()}_${file.name}`
            : `${ticketId}_${type}_${Date.now()}_${file.name}`;
        const storageRef = storage.ref().child(`tickets/${fileName}`);
        
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress tracking (optional)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload ${type} is ${progress}% done`);
            },
            (error) => {
                console.error('Upload error:', error);
                reject(error);
            },
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    resolve(downloadURL);
                }).catch(reject);
            }
        );
    });
}

// Toggle ticket details expand/collapse
window.toggleTicketDetails = function(ticketId) {
    const expandedDetails = document.getElementById(`expandedDetails-${ticketId}`);
    const toggleIcon = document.getElementById(`toggleIcon-${ticketId}`);
    const toggleText = document.getElementById(`toggleText-${ticketId}`);
    
    if (expandedDetails.style.display === 'none') {
        expandedDetails.style.display = 'block';
        toggleIcon.textContent = '▲';
        toggleText.textContent = 'Hide Details';
    } else {
        expandedDetails.style.display = 'none';
        toggleIcon.textContent = '▼';
        toggleText.textContent = 'Show Details';
    }
};

// Photo modal for viewing full-size images
window.openPhotoModal = function(photoUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
            <div class="modal-header">
                <h2>Photo</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center; padding: 20px;">
                <img src="${escapeHtml(photoUrl)}" alt="Full size" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};
// Tenant Management
let editingTenantId = null;
let currentTenantView = 'cards'; // 'cards' or 'table'
let selectedPropertyForTenants = null;

function loadTenants() {
    db.collection('tenants').onSnapshot((snapshot) => {
        const tenants = {};
        snapshot.forEach((doc) => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        renderTenantsList(tenants);
    }, (error) => {
        console.error('Error loading tenants:', error);
        const tenantsList = document.getElementById('tenantsList');
        if (tenantsList) {
            tenantsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading tenants. Please try again.</p>';
        }
    });
}

function loadPropertiesForTenantFilter() {
    const propertyFilter = document.getElementById('tenantPropertyFilter');
    if (!propertyFilter) return;
    
    propertyFilter.innerHTML = '<option value="">All Properties</option>';
    
    db.collection('properties').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const property = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = property.name || 'Unnamed Property';
            propertyFilter.appendChild(option);
        });
        
        // Restore selected property from localStorage
        const savedProperty = localStorage.getItem('selectedPropertyForTenants');
        if (savedProperty && Array.from(propertyFilter.options).some(opt => opt.value === savedProperty)) {
            propertyFilter.value = savedProperty;
            selectedPropertyForTenants = savedProperty;
        }
    }).catch((error) => {
        console.error('Error loading properties for filter:', error);
    });
}

function renderTenantsList(tenants) {
    // Filter by property if selected
    if (currentTenantView === 'table') {
        renderTenantsTableView(tenants);
    } else {
        renderTenantsCardView(tenants);
    }
}

async function renderTenantsCardView(tenants) {
    const tenantsList = document.getElementById('tenantsList');
    const tenantsTable = document.getElementById('tenantsTable');
    
    if (tenantsList) tenantsList.style.display = 'grid';
    if (tenantsTable) tenantsTable.style.display = 'none';
    
    if (!tenantsList) return;
    
    tenantsList.innerHTML = '';
    
    // Filter tenants by property if needed
    const filteredTenants = await filterTenantsByProperty(tenants);
    
    if (Object.keys(filteredTenants).length === 0) {
        tenantsList.innerHTML = '<p class="no-tenants-message">No tenants found. Add one to get started.</p>';
        return;
    }
    
    Object.keys(filteredTenants).forEach(id => {
        const tenant = filteredTenants[id];
        const card = document.createElement('div');
        card.className = 'tenant-card';
        const statusBadge = tenant.status ? `<span class="status-badge status-${tenant.status.toLowerCase()}">${tenant.status}</span>` : '';
        const typeBadge = tenant.tenantType ? `<span class="status-badge type-badge">${tenant.tenantType}</span>` : '';
        
        card.innerHTML = `
            <div class="tenant-card-header">
                <h3>${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${statusBadge}
                    ${typeBadge}
                </div>
            </div>
            <div class="tenant-card-body">
                ${tenant.mailingAddress ? `<p><strong>📍 Address:</strong> ${escapeHtml(tenant.mailingAddress)}</p>` : ''}
                ${tenant.tenantType === 'Commercial' && tenant.businessType ? `<p><strong>🏢 Business Type:</strong> ${escapeHtml(tenant.businessType)}</p>` : ''}
                ${tenant.tenantType === 'Commercial' && tenant.website ? `<p><strong>🌐 Website:</strong> <a href="${escapeHtml(tenant.website)}" target="_blank" style="color: #667eea;">${escapeHtml(tenant.website)}</a></p>` : ''}
                ${tenant.notes ? `<p><strong>📝 Notes:</strong> ${escapeHtml(tenant.notes.substring(0, 100))}${tenant.notes.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            <div class="tenant-card-actions">
                <button class="btn-primary btn-small" onclick="viewTenantDetail('${id}')">View Details</button>
                <button class="btn-secondary btn-small" onclick="editTenant('${id}')">Edit</button>
                <button class="btn-danger btn-small" onclick="deleteTenant('${id}')">Delete</button>
            </div>
        `;
        tenantsList.appendChild(card);
    });
}

async function renderTenantsTableView(tenants) {
    const tenantsList = document.getElementById('tenantsList');
    const tenantsTable = document.getElementById('tenantsTable');
    
    if (tenantsList) tenantsList.style.display = 'none';
    if (tenantsTable) tenantsTable.style.display = 'block';
    
    if (!tenantsTable) return;
    
    // Filter tenants by property if needed
    const filteredTenants = await filterTenantsByProperty(tenants);
    
    if (Object.keys(filteredTenants).length === 0) {
        tenantsTable.innerHTML = '<p class="no-tenants-message">No tenants found. Add one to get started.</p>';
        return;
    }
    
    // Load occupancies, buildings, units, and properties to group by building
    const [occupanciesSnapshot, buildingsSnapshot, unitsSnapshot, propertiesSnapshot] = await Promise.all([
        db.collection('occupancies').get(),
        db.collection('buildings').get(),
        db.collection('units').get(),
        db.collection('properties').get()
    ]);
    
    const occupanciesMap = {};
    occupanciesSnapshot.forEach(doc => {
        const occ = doc.data();
        if (!occupanciesMap[occ.tenantId]) {
            occupanciesMap[occ.tenantId] = [];
        }
        occupanciesMap[occ.tenantId].push({ ...occ, id: doc.id });
    });
    
    const buildingsMap = {};
    buildingsSnapshot.forEach(doc => {
        buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    const unitsMap = {};
    unitsSnapshot.forEach(doc => {
        unitsMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    const propertiesMap = {};
    propertiesSnapshot.forEach(doc => {
        propertiesMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Group tenants by building
    const tenantsByBuilding = {};
    const tenantsWithoutBuilding = [];
    
    Object.keys(filteredTenants).forEach(tenantId => {
        const tenant = filteredTenants[tenantId];
        const tenantOccupancies = occupanciesMap[tenantId] || [];
        
        if (tenantOccupancies.length === 0) {
            tenantsWithoutBuilding.push({ tenant, occupancies: [] });
        } else {
            // Group occupancies by building (via unit)
            const occupanciesByBuilding = {};
            
            tenantOccupancies.forEach(occ => {
                let buildingId = null;
                let buildingKey = 'No Building Assigned';
                
                if (occ.unitId && unitsMap[occ.unitId]) {
                    const unit = unitsMap[occ.unitId];
                    buildingId = unit.buildingId;
                    if (buildingId && buildingsMap[buildingId]) {
                        const building = buildingsMap[buildingId];
                        buildingKey = building.buildingName || `Building ${buildingId}`;
                    }
                }
                
                if (!occupanciesByBuilding[buildingKey]) {
                    occupanciesByBuilding[buildingKey] = {
                        building: buildingId ? buildingsMap[buildingId] : null,
                        occupancies: []
                    };
                }
                occupanciesByBuilding[buildingKey].occupancies.push(occ);
            });
            
            // Add tenant to each building group
            Object.keys(occupanciesByBuilding).forEach(buildingKey => {
                if (!tenantsByBuilding[buildingKey]) {
                    tenantsByBuilding[buildingKey] = {
                        building: occupanciesByBuilding[buildingKey].building,
                        tenants: []
                    };
                }
                
                // Check if tenant already added to this building
                const existing = tenantsByBuilding[buildingKey].tenants.find(t => t.tenant.id === tenantId);
                if (!existing) {
                    tenantsByBuilding[buildingKey].tenants.push({
                        tenant: tenant,
                        occupancies: occupanciesByBuilding[buildingKey].occupancies
                    });
                }
            });
        }
    });
    
    // First, load contacts to determine max number of contact and broker columns needed
    const { maxContacts, maxBrokers } = await determineMaxContacts(filteredTenants);
    
    // Build HTML with dynamic contact and broker columns
    let html = '';
    
    // Add contact type legend with toggle and send email button
    html += `
        <div class="contact-type-legend" style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; display: flex; gap: 20px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                <div style="font-weight: 600; font-size: 0.75rem; color: #333; margin-right: 10px;">Contact Types:</div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator primary"></span>
                    <span style="font-size: 0.7rem;">Primary</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator secondary"></span>
                    <span style="font-size: 0.7rem;">Secondary</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator leasing"></span>
                    <span style="font-size: 0.7rem;">Leasing</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator billing"></span>
                    <span style="font-size: 0.7rem;">Billing</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator tenant-rep"></span>
                    <span style="font-size: 0.7rem;">Tenant Representative</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px; padding-left: 10px; border-left: 1px solid #ddd;">
                    <input type="checkbox" id="showBrokersToggle" style="cursor: pointer;">
                    <label for="showBrokersToggle" style="font-size: 0.7rem; cursor: pointer; user-select: none;">Show Brokers</label>
                </div>
            </div>
            <button class="btn-primary" id="startEmailSelectionBtn" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap;">📧 Select Recipients</button>
            <div id="emailSelectionActions" style="display: none; gap: 10px; align-items: center;">
                <button class="btn-secondary" id="doneSelectingBtn" style="padding: 6px 12px; font-size: 0.75rem;">Done Selecting</button>
                <button class="btn-primary" id="draftEmailBtn" style="padding: 6px 12px; font-size: 0.75rem;">Draft Email</button>
                <span id="selectedCount" style="font-size: 0.7rem; color: #666;">0 selected</span>
            </div>
        </div>
    `;
    
    // Generate contact column subheaders
    const contactSubHeaders = [];
    for (let i = 1; i <= maxContacts; i++) {
        contactSubHeaders.push(`<th>Contact ${i}</th>`);
    }
    
    // Generate broker column subheaders
    const brokerSubHeaders = [];
    for (let i = 1; i <= maxBrokers; i++) {
        brokerSubHeaders.push(`<th>Broker ${i}</th>`);
    }
    
    // Render grouped by building
    Object.keys(tenantsByBuilding).sort().forEach(buildingName => {
        const group = tenantsByBuilding[buildingName];
        html += `
            <div class="building-group">
                <div class="building-group-header">
                    <input type="checkbox" class="email-select-building" data-building-id="${group.building?.id || ''}" data-building-name="${escapeHtml(buildingName)}" style="display: none; margin-right: 8px; cursor: pointer;">
                    <span>${escapeHtml(buildingName)}</span>
                </div>
                <table class="tenants-table">
                    <thead>
                        <tr class="header-major">
                            <th rowspan="2">Occupancies</th>
                            <th rowspan="2">Tenant Name</th>
                            ${maxContacts > 0 ? `<th colspan="${maxContacts}">Contacts</th>` : ''}
                            ${maxBrokers > 0 ? `<th colspan="${maxBrokers}">Brokers</th>` : ''}
                        </tr>
                        <tr class="header-sub">
                            ${contactSubHeaders.join('')}
                            ${brokerSubHeaders.join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        group.tenants.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant (not just this building)
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies - show all occupancies for this tenant
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = allTenantOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        return `<span class="occupancy-info">Unit (ID: ${occ.unitId.substring(0, 8)}...)</span>`;
                    } else {
                        return `<span class="occupancy-info">Property Level</span>`;
                    }
                }).join('');
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            html += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <input type="checkbox" class="email-select-tenant" data-tenant-id="${tenant.id}" style="display: none; cursor: pointer;">
                                <span class="tenant-name-text">${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
                            </div>
                            <div class="tenant-actions-compact">
                                <button class="btn-action btn-view" onclick="viewTenantDetail('${tenant.id}')" title="View Details">
                                    <span class="btn-icon">👁️</span>
                                </button>
                                <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                    <span class="btn-icon">✏️</span>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                    <span class="btn-icon">🗑️</span>
                                </button>
                            </div>
                        </div>
                    </td>
                    ${contactCells.join('')}
                    ${brokerCells.join('')}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    // Render tenants without building
    if (tenantsWithoutBuilding.length > 0) {
        html += `
            <div class="building-group">
                <div class="building-group-header">
                    <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Orphan Tenants" style="display: none; margin-right: 8px; cursor: pointer;">
                    <span style="font-weight: 600; color: #e65100;">⚠️ Orphan Tenants</span>
                </div>
                <table class="tenants-table">
                    <thead>
                        <tr class="header-major">
                            <th rowspan="2">Occupancies</th>
                            <th rowspan="2">Tenant Name</th>
                            ${maxContacts > 0 ? `<th colspan="${maxContacts}">Contacts</th>` : ''}
                            ${maxBrokers > 0 ? `<th colspan="${maxBrokers}">Brokers</th>` : ''}
                        </tr>
                        <tr class="header-sub">
                            ${contactSubHeaders.join('')}
                            ${brokerSubHeaders.join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        tenantsWithoutBuilding.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = allTenantOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        return `<span class="occupancy-info">Unit (ID: ${occ.unitId.substring(0, 8)}...)</span>`;
                    } else {
                        return `<span class="occupancy-info">Property Level</span>`;
                    }
                }).join('');
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            html += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <input type="checkbox" class="email-select-tenant" data-tenant-id="${tenant.id}" style="display: none; cursor: pointer;">
                                <span class="tenant-name-text">${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
                            </div>
                            <div class="tenant-actions-compact">
                                <button class="btn-action btn-view" onclick="viewTenantDetail('${tenant.id}')" title="View Details">
                                    <span class="btn-icon">👁️</span>
                                </button>
                                <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                    <span class="btn-icon">✏️</span>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                    <span class="btn-icon">🗑️</span>
                                </button>
                            </div>
                        </div>
                    </td>
                    ${contactCells.join('')}
                    ${brokerCells.join('')}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    tenantsTable.innerHTML = html;
    
    // Set up broker toggle (default to hidden)
    const showBrokersToggle = document.getElementById('showBrokersToggle');
    if (showBrokersToggle) {
        showBrokersToggle.checked = false; // Default to hidden
        toggleBrokerColumns(false); // Hide brokers initially
        
        showBrokersToggle.addEventListener('change', function() {
            toggleBrokerColumns(this.checked);
        });
    }
    
    // Set up email selection buttons
    const startEmailSelectionBtn = document.getElementById('startEmailSelectionBtn');
    const doneSelectingBtn = document.getElementById('doneSelectingBtn');
    const draftEmailBtn = document.getElementById('draftEmailBtn');
    const emailSelectionActions = document.getElementById('emailSelectionActions');
    
    if (startEmailSelectionBtn) {
        startEmailSelectionBtn.addEventListener('click', function() {
            enableEmailSelectionMode();
        });
    }
    
    if (doneSelectingBtn) {
        doneSelectingBtn.addEventListener('click', function() {
            disableEmailSelectionMode();
        });
    }
    
    if (draftEmailBtn) {
        draftEmailBtn.addEventListener('click', async function() {
            await compileAndDraftEmail(filteredTenants);
        });
    }
    
    // Load contacts for all tenants and populate individual columns
    loadContactsForTableView(filteredTenants, maxContacts, maxBrokers);
    
    // Load and display orphan contacts (contacts without tenants)
    loadOrphanContacts(maxContacts, maxBrokers);
}

async function loadOrphanContacts(maxContacts, maxBrokers) {
    try {
        // Get all contacts
        const allContactsSnapshot = await db.collection('tenantContacts').get();
        
        // Get all tenant IDs
        const allTenantsSnapshot = await db.collection('tenants').get();
        const tenantIds = new Set();
        allTenantsSnapshot.forEach(doc => tenantIds.add(doc.id));
        
        // Find orphan contacts (contacts whose tenantId doesn't exist)
        const orphanContacts = [];
        allContactsSnapshot.forEach(doc => {
            const contact = doc.data();
            if (!tenantIds.has(contact.tenantId)) {
                orphanContacts.push({ id: doc.id, ...contact });
            }
        });
        
        if (orphanContacts.length === 0) {
            return; // No orphan contacts
        }
        
        // Separate regular contacts and brokers
        const regularOrphans = [];
        const brokerOrphans = [];
        
        orphanContacts.forEach(contact => {
            const isBroker = contact.classifications && contact.classifications.includes('Tenant Representative');
            if (isBroker) {
                brokerOrphans.push(contact);
            } else {
                regularOrphans.push(contact);
            }
        });
        
        // Sort by name
        regularOrphans.sort((a, b) => (a.contactName || '').localeCompare(b.contactName || ''));
        brokerOrphans.sort((a, b) => (a.contactName || '').localeCompare(b.contactName || ''));
        
        // Render orphan contacts section
        const tenantsTable = document.getElementById('tenantsTable');
        if (!tenantsTable) return;
        
        let orphanHtml = `
            <div class="building-group" style="border-left: 3px solid #f44336; margin-top: 30px;">
                <div class="building-group-header" style="background: #ffebee;">
                    <span style="font-weight: 600; color: #c62828;">⚠️ Orphan Contacts (${orphanContacts.length})</span>
                    <span style="font-size: 0.75rem; color: #666; margin-left: 10px;">Contacts without associated tenants</span>
                </div>
                <table class="tenants-table">
                    <thead>
                        <tr class="header-major">
                            <th rowspan="2">Contact Name</th>
                            ${maxContacts > 0 ? `<th colspan="${maxContacts}">Contacts</th>` : ''}
                            ${maxBrokers > 0 ? `<th colspan="${maxBrokers}">Brokers</th>` : ''}
                        </tr>
                        <tr class="header-sub">
        `;
        
        // Generate contact column headers
        for (let i = 1; i <= maxContacts; i++) {
            orphanHtml += `<th>Contact ${i}</th>`;
        }
        for (let i = 1; i <= maxBrokers; i++) {
            orphanHtml += `<th>Broker ${i}</th>`;
        }
        
        orphanHtml += `
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight: 600; color: #c62828;">Orphan Contacts</td>
        `;
        
        // Fill contact columns
        for (let i = 0; i < maxContacts; i++) {
            if (i < regularOrphans.length) {
                const contact = regularOrphans[i];
                orphanHtml += `
                    <td class="tenant-contact-cell" data-contact-type="contact">
                        <div class="contact-card-table">
                            <div class="contact-card-header">
                                <div class="contact-card-name">${escapeHtml(contact.contactName || 'Unknown')}</div>
                                <div class="contact-type-indicators">
                `;
                
                // Add type indicators
                if (contact.classifications) {
                    contact.classifications.forEach(cls => {
                        const clsLower = cls.toLowerCase().replace(/\s+/g, '-');
                        orphanHtml += `<span class="contact-type-indicator ${clsLower}" title="${escapeHtml(cls)}"></span>`;
                    });
                }
                
                orphanHtml += `
                                </div>
                            </div>
                            <div class="contact-card-info">
                `;
                
                if (contact.contactEmail) {
                    orphanHtml += `
                        <div class="contact-info-item">
                            <span class="contact-icon-email">✉️</span>
                            <a href="mailto:${escapeHtml(contact.contactEmail)}" style="color: #2563eb; text-decoration: none; font-size: 0.65rem;">${escapeHtml(contact.contactEmail)}</a>
                        </div>
                    `;
                }
                
                if (contact.contactPhone) {
                    orphanHtml += `
                        <div class="contact-info-item">
                            <span class="contact-icon-phone">📞</span>
                            <a href="tel:${escapeHtml(contact.contactPhone)}" style="color: #2563eb; text-decoration: none; font-size: 0.65rem;">${escapeHtml(contact.contactPhone)}</a>
                        </div>
                    `;
                }
                
                if (!contact.contactEmail && !contact.contactPhone) {
                    orphanHtml += `<div style="color: #999; font-size: 0.65rem;">No contact information</div>`;
                }
                
                orphanHtml += `
                            </div>
                            <div style="text-align: right; margin-top: 4px;">
                                <button class="btn-edit-contact" onclick="deleteOrphanContact('${contact.id}')" title="Delete Orphan Contact">🗑️</button>
                            </div>
                        </div>
                    </td>
                `;
            } else {
                orphanHtml += `<td class="tenant-contact-cell" data-contact-type="contact"></td>`;
            }
        }
        
        // Fill broker columns
        for (let i = 0; i < maxBrokers; i++) {
            if (i < brokerOrphans.length) {
                const contact = brokerOrphans[i];
                orphanHtml += `
                    <td class="tenant-contact-cell" data-contact-type="broker">
                        <div class="contact-card-table">
                            <div class="contact-card-header">
                                <div class="contact-card-name">${escapeHtml(contact.contactName || 'Unknown')}</div>
                                <div class="contact-type-indicators">
                                    <span class="contact-type-indicator tenant-rep" title="Tenant Representative"></span>
                                </div>
                            </div>
                            <div class="contact-card-info">
                `;
                
                if (contact.contactEmail) {
                    orphanHtml += `
                        <div class="contact-info-item">
                            <span class="contact-icon-email">✉️</span>
                            <a href="mailto:${escapeHtml(contact.contactEmail)}" style="color: #2563eb; text-decoration: none; font-size: 0.65rem;">${escapeHtml(contact.contactEmail)}</a>
                        </div>
                    `;
                }
                
                if (contact.contactPhone) {
                    orphanHtml += `
                        <div class="contact-info-item">
                            <span class="contact-icon-phone">📞</span>
                            <a href="tel:${escapeHtml(contact.contactPhone)}" style="color: #2563eb; text-decoration: none; font-size: 0.65rem;">${escapeHtml(contact.contactPhone)}</a>
                        </div>
                    `;
                }
                
                orphanHtml += `
                            </div>
                            <div style="text-align: right; margin-top: 4px;">
                                <button class="btn-edit-contact" onclick="deleteOrphanContact('${contact.id}')" title="Delete Orphan Contact">🗑️</button>
                            </div>
                        </div>
                    </td>
                `;
            } else {
                orphanHtml += `<td class="tenant-contact-cell" data-contact-type="broker"></td>`;
            }
        }
        
        orphanHtml += `
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        tenantsTable.insertAdjacentHTML('beforeend', orphanHtml);
    } catch (error) {
        console.error('Error loading orphan contacts:', error);
    }
}

function deleteOrphanContact(contactId) {
    if (confirm('Are you sure you want to delete this orphan contact?')) {
        db.collection('tenantContacts').doc(contactId).delete()
            .then(() => {
                console.log('Orphan contact deleted');
                loadTenants(); // Refresh the view
            })
            .catch(error => {
                console.error('Error deleting orphan contact:', error);
                alert('Error deleting contact: ' + error.message);
            });
    }
}

function deleteOrphanContact(contactId) {
    if (confirm('Are you sure you want to delete this orphan contact?')) {
        db.collection('tenantContacts').doc(contactId).delete()
            .then(() => {
                console.log('Orphan contact deleted');
                loadTenants(); // Refresh the view
            })
            .catch(error => {
                console.error('Error deleting orphan contact:', error);
                alert('Error deleting contact: ' + error.message);
            });
}


function toggleBrokerColumns(show) {
    // Hide/show broker header columns by checking text content
    const majorHeaders = document.querySelectorAll('.tenants-table .header-major th');
    majorHeaders.forEach(header => {
        if (header.textContent.trim() === 'Brokers') {
            header.style.display = show ? '' : 'none';
            const colspan = parseInt(header.getAttribute('colspan')) || 0;
            const headerIndex = Array.from(header.parentElement.querySelectorAll('th')).indexOf(header);
            
            // Hide/show corresponding subheaders
            const subHeaderRow = header.parentElement.nextElementSibling;
            if (subHeaderRow && subHeaderRow.classList.contains('header-sub')) {
                const subHeaders = Array.from(subHeaderRow.querySelectorAll('th'));
                // Find broker subheaders by checking text content
                subHeaders.forEach((subHeader, idx) => {
                    if (subHeader.textContent.trim().startsWith('Broker')) {
                        subHeader.style.display = show ? '' : 'none';
                    }
                });
            }
        }
    });
    
    // Also directly hide/show all broker subheaders by text content
    const allSubHeaders = document.querySelectorAll('.tenants-table .header-sub th');
    allSubHeaders.forEach(subHeader => {
        if (subHeader.textContent.trim().startsWith('Broker')) {
            subHeader.style.display = show ? '' : 'none';
        }
    });
    
    // Hide/show broker data cells
    const brokerCells = document.querySelectorAll('td[data-contact-type="broker"]');
    brokerCells.forEach(cell => {
        cell.style.display = show ? '' : 'none';
    });
    
    // If in email selection mode, update broker contact checkboxes visibility
    const emailSelectionActions = document.getElementById('emailSelectionActions');
    if (emailSelectionActions && emailSelectionActions.style.display !== 'none') {
        // We're in selection mode, update broker contact checkboxes
        document.querySelectorAll('td[data-contact-type="broker"] .email-select-contact').forEach(cb => {
            cb.style.display = show ? 'block' : 'none';
        });
    }
}

// Track manually unchecked items to prevent re-checking
window._manuallyUncheckedItems = {
    buildings: new Set(),
    tenants: new Set(),
    contacts: new Set()
};

function enableEmailSelectionMode() {
    // Reset manually unchecked tracking
    window._manuallyUncheckedItems = {
        buildings: new Set(),
        tenants: new Set(),
        contacts: new Set()
    };
    
    // Check if brokers are currently shown
    const showBrokersToggle = document.getElementById('showBrokersToggle');
    const brokersVisible = showBrokersToggle ? showBrokersToggle.checked : false;
    
    // Show building and tenant checkboxes
    document.querySelectorAll('.email-select-building, .email-select-tenant').forEach(cb => {
        cb.style.display = 'block';
    });
    
    // Only show contact checkboxes for regular contacts (not brokers)
    document.querySelectorAll('.email-select-contact').forEach(cb => {
        // Check if this contact is in a broker cell
        const contactCard = cb.closest('.contact-card-table');
        const brokerCell = contactCard ? contactCard.closest('td[data-contact-type="broker"]') : null;
        
        if (brokerCell) {
            // Only show checkbox if brokers are visible
            cb.style.display = brokersVisible ? 'block' : 'none';
        } else {
            // Regular contact, always show
            cb.style.display = 'block';
        }
    });
    
    // Show selection action buttons
    const emailSelectionActions = document.getElementById('emailSelectionActions');
    const startEmailSelectionBtn = document.getElementById('startEmailSelectionBtn');
    if (emailSelectionActions) emailSelectionActions.style.display = 'flex';
    if (startEmailSelectionBtn) startEmailSelectionBtn.style.display = 'none';
    
    // Add event listeners for building checkboxes (cascade to tenants)
    document.querySelectorAll('.email-select-building').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleBuildingCheckboxChange(this);
            updateEmailSelectionCount();
        });
    });
    
    // Add event listeners for tenant checkboxes (cascade to contacts)
    document.querySelectorAll('.email-select-tenant').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleTenantCheckboxChange(this);
            updateEmailSelectionCount();
        });
    });
    
    // Add event listeners for contact checkboxes
    document.querySelectorAll('.email-select-contact').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleContactCheckboxChange(this);
            updateEmailSelectionCount();
        });
    });
    
    updateEmailSelectionCount();
}

function handleBuildingCheckboxChange(buildingCheckbox) {
    const buildingId = buildingCheckbox.getAttribute('data-building-id');
    const isChecked = buildingCheckbox.checked;
    
    if (isChecked) {
        // Remove from manually unchecked if it was there
        window._manuallyUncheckedItems.buildings.delete(buildingId);
        
        // Find all tenants in this building group
        const buildingGroup = buildingCheckbox.closest('.building-group');
        if (buildingGroup) {
            const tenantCheckboxes = buildingGroup.querySelectorAll('.email-select-tenant');
            tenantCheckboxes.forEach(tenantCb => {
                const tenantId = tenantCb.getAttribute('data-tenant-id');
                // Only check if not manually unchecked
                if (!window._manuallyUncheckedItems.tenants.has(tenantId)) {
                    tenantCb.checked = true;
                    // Cascade to contacts
                    handleTenantCheckboxChange(tenantCb, false); // false = don't update count yet
                }
            });
        }
    } else {
        // Mark as manually unchecked
        window._manuallyUncheckedItems.buildings.add(buildingId);
        
        // Uncheck all tenants in this building
        const buildingGroup = buildingCheckbox.closest('.building-group');
        if (buildingGroup) {
            const tenantCheckboxes = buildingGroup.querySelectorAll('.email-select-tenant');
            tenantCheckboxes.forEach(tenantCb => {
                tenantCb.checked = false;
                // Uncheck all contacts for these tenants
                const tenantId = tenantCb.getAttribute('data-tenant-id');
                const contactCheckboxes = document.querySelectorAll(`.email-select-contact[data-tenant-id="${tenantId}"]`);
                contactCheckboxes.forEach(contactCb => {
                    contactCb.checked = false;
                });
            });
        }
    }
}

function handleTenantCheckboxChange(tenantCheckbox, updateCount = true) {
    const tenantId = tenantCheckbox.getAttribute('data-tenant-id');
    const isChecked = tenantCheckbox.checked;
    
    // Check if brokers are visible
    const showBrokersToggle = document.getElementById('showBrokersToggle');
    const brokersVisible = showBrokersToggle && showBrokersToggle.checked;
    
    if (isChecked) {
        // Remove from manually unchecked if it was there
        window._manuallyUncheckedItems.tenants.delete(tenantId);
        
        // Find all contacts for this tenant
        const contactCheckboxes = document.querySelectorAll(`.email-select-contact[data-tenant-id="${tenantId}"]`);
        contactCheckboxes.forEach(contactCb => {
            // Check if this is a broker contact
            const contactCell = contactCb.closest('td[data-contact-type]');
            const isBroker = contactCell && contactCell.getAttribute('data-contact-type') === 'broker';
            
            // Only select broker contacts if brokers are visible
            if (isBroker && !brokersVisible) {
                return; // Skip this broker contact
            }
            
            // Check if the contact cell is visible
            const cellDisplay = contactCell ? window.getComputedStyle(contactCell).display : 'block';
            if (cellDisplay === 'none') {
                return; // Skip hidden contacts
            }
            
            const contactId = contactCb.getAttribute('data-contact-id');
            // Only check if not manually unchecked
            if (!window._manuallyUncheckedItems.contacts.has(contactId)) {
                contactCb.checked = true;
            }
        });
    } else {
        // Mark as manually unchecked
        window._manuallyUncheckedItems.tenants.add(tenantId);
        
        // Uncheck all contacts for this tenant (only visible ones)
        const contactCheckboxes = document.querySelectorAll(`.email-select-contact[data-tenant-id="${tenantId}"]`);
        contactCheckboxes.forEach(contactCb => {
            const contactCell = contactCb.closest('td[data-contact-type]');
            const cellDisplay = contactCell ? window.getComputedStyle(contactCell).display : 'block';
            if (cellDisplay !== 'none') {
                contactCb.checked = false;
            }
        });
    }
    
    if (updateCount) {
        updateEmailSelectionCount();
    }
}

function handleContactCheckboxChange(contactCheckbox) {
    const contactId = contactCheckbox.getAttribute('data-contact-id');
    const isChecked = contactCheckbox.checked;
    
    if (!isChecked) {
        // Mark as manually unchecked
        window._manuallyUncheckedItems.contacts.add(contactId);
    } else {
        // Remove from manually unchecked if it was there
        window._manuallyUncheckedItems.contacts.delete(contactId);
    }
}

function disableEmailSelectionMode() {
    // Hide all checkboxes
    document.querySelectorAll('.email-select-building, .email-select-tenant, .email-select-contact').forEach(cb => {
        cb.style.display = 'none';
        cb.checked = false;
    });
    
    // Hide selection action buttons
    const emailSelectionActions = document.getElementById('emailSelectionActions');
    const startEmailSelectionBtn = document.getElementById('startEmailSelectionBtn');
    if (emailSelectionActions) emailSelectionActions.style.display = 'none';
    if (startEmailSelectionBtn) startEmailSelectionBtn.style.display = 'block';
    
    // Update count
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) selectedCount.textContent = '0 selected';
}

function updateEmailSelectionCount() {
    const selectedBuildings = document.querySelectorAll('.email-select-building:checked').length;
    const selectedTenants = document.querySelectorAll('.email-select-tenant:checked').length;
    const selectedContacts = document.querySelectorAll('.email-select-contact:checked').length;
    const total = selectedBuildings + selectedTenants + selectedContacts;
    
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        selectedCount.textContent = `${total} selected`;
    }
}

async function compileAndDraftEmail(tenants) {
    const selectedBuildings = Array.from(document.querySelectorAll('.email-select-building:checked')).map(cb => ({
        id: cb.getAttribute('data-building-id'),
        name: cb.getAttribute('data-building-name')
    }));
    const selectedTenants = Array.from(document.querySelectorAll('.email-select-tenant:checked')).map(cb => cb.getAttribute('data-tenant-id'));
    const selectedContacts = Array.from(document.querySelectorAll('.email-select-contact:checked')).map(cb => ({
        id: cb.getAttribute('data-contact-id'),
        email: cb.getAttribute('data-email'),
        tenantId: cb.getAttribute('data-tenant-id')
    }));
    
    const emailSet = new Set();
    
    // Add emails from selected buildings (find tenants via occupancies and units)
    if (selectedBuildings.length > 0) {
        const buildingIds = selectedBuildings.map(b => b.id).filter(id => id);
        
        if (buildingIds.length > 0) {
            // Get all units in selected buildings
            const unitsSnapshot = await db.collection('units').get();
            const unitIdsInBuildings = new Set();
            
            unitsSnapshot.forEach(doc => {
                const unit = doc.data();
                if (unit.buildingId && buildingIds.includes(unit.buildingId)) {
                    unitIdsInBuildings.add(doc.id);
                }
            });
            
            // Get all occupancies for units in selected buildings
            const occupanciesSnapshot = await db.collection('occupancies').get();
            const tenantIdsInBuildings = new Set();
            
            occupanciesSnapshot.forEach(doc => {
                const occ = doc.data();
                if (occ.unitId && unitIdsInBuildings.has(occ.unitId)) {
                    tenantIdsInBuildings.add(occ.tenantId);
                }
            });
            
            // Get contacts for tenants in selected buildings
            const allTenantIds = Array.from(tenantIdsInBuildings);
            const batchSize = 10;
            for (let i = 0; i < allTenantIds.length; i += batchSize) {
                const batch = allTenantIds.slice(i, i + batchSize);
                const contactsSnapshot = await db.collection('tenantContacts')
                    .where('tenantId', 'in', batch)
                    .get();
                
                contactsSnapshot.forEach(doc => {
                    const contact = doc.data();
                    if (contact.contactEmail) {
                        emailSet.add(contact.contactEmail);
                    }
                });
            }
        }
    }
    
    // Add emails from selected tenants
    if (selectedTenants.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < selectedTenants.length; i += batchSize) {
            const batch = selectedTenants.slice(i, i + batchSize);
            const contactsSnapshot = await db.collection('tenantContacts')
                .where('tenantId', 'in', batch)
                .get();
            
            contactsSnapshot.forEach(doc => {
                const contact = doc.data();
                if (contact.contactEmail) {
                    emailSet.add(contact.contactEmail);
                }
            });
        }
    }
    
    // Add individually selected contacts
    selectedContacts.forEach(contact => {
        if (contact.email) {
            emailSet.add(contact.email);
        }
    });
    
    const emailList = Array.from(emailSet);
    
    if (emailList.length === 0) {
        alert('Please select at least one recipient.');
        return;
    }
    
    // Open email client with mailto: link
    const mailtoLink = `mailto:${emailList.join(',')}`;
    window.location.href = mailtoLink;
    
    // Disable selection mode after sending
    disableEmailSelectionMode();
}

async function openSendEmailModal(tenants) {
    const modal = document.getElementById('sendEmailModal');
    if (!modal) return;
    
    modal.classList.add('show');
    
    // Load all data needed for selection
    const buildings = {};
    const allContacts = {};
    const tenantIds = Object.keys(tenants);
    
    // Load buildings
    const buildingsSnapshot = await db.collection('buildings').get();
    buildingsSnapshot.forEach(doc => {
        buildings[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Load all contacts
    const batchSize = 10;
    for (let i = 0; i < tenantIds.length; i += batchSize) {
        const batch = tenantIds.slice(i, i + batchSize);
        const contactsSnapshot = await db.collection('tenantContacts')
            .where('tenantId', 'in', batch)
            .get();
        
        contactsSnapshot.forEach(doc => {
            const contact = { id: doc.id, ...doc.data() };
            if (!allContacts[contact.tenantId]) {
                allContacts[contact.tenantId] = [];
            }
            allContacts[contact.tenantId].push(contact);
        });
    }
    
    // Populate building checkboxes
    const buildingCheckboxes = document.getElementById('buildingCheckboxes');
    if (buildingCheckboxes) {
        const buildingList = Object.values(buildings).sort((a, b) => (a.buildingName || '').localeCompare(b.buildingName || ''));
        if (buildingList.length === 0) {
            buildingCheckboxes.innerHTML = '<p style="color: #999; font-style: italic;">No buildings found</p>';
        } else {
            buildingCheckboxes.innerHTML = buildingList.map(building => `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                    <input type="checkbox" class="building-checkbox" data-building-id="${building.id}" value="${building.id}">
                    <span>${escapeHtml(building.buildingName || 'Unnamed Building')}</span>
                </label>
            `).join('');
        }
    }
    
    // Populate tenant checkboxes
    const tenantCheckboxes = document.getElementById('tenantCheckboxes');
    if (tenantCheckboxes) {
        const tenantList = Object.values(tenants).sort((a, b) => (a.tenantName || '').localeCompare(b.tenantName || ''));
        if (tenantList.length === 0) {
            tenantCheckboxes.innerHTML = '<p style="color: #999; font-style: italic;">No tenants found</p>';
        } else {
            tenantCheckboxes.innerHTML = tenantList.map(tenant => `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                    <input type="checkbox" class="tenant-checkbox" data-tenant-id="${tenant.id}" value="${tenant.id}">
                    <span>${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
                </label>
            `).join('');
        }
    }
    
    // Populate contact checkboxes
    const contactCheckboxes = document.getElementById('contactCheckboxes');
    if (contactCheckboxes) {
        const contactList = [];
        Object.keys(allContacts).forEach(tenantId => {
            allContacts[tenantId].forEach(contact => {
                if (contact.contactEmail) {
                    contactList.push({
                        ...contact,
                        tenantId: tenantId,
                        tenantName: tenants[tenantId]?.tenantName || 'Unknown Tenant'
                    });
                }
            });
        });
        contactList.sort((a, b) => (a.contactName || '').localeCompare(b.contactName || ''));
        
        if (contactList.length === 0) {
            contactCheckboxes.innerHTML = '<p style="color: #999; font-style: italic;">No contacts with email addresses found</p>';
        } else {
            contactCheckboxes.innerHTML = contactList.map(contact => `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                    <input type="checkbox" class="contact-checkbox" data-contact-id="${contact.id}" data-email="${escapeHtml(contact.contactEmail)}" value="${contact.id}">
                    <span>${escapeHtml(contact.contactName || 'Unnamed')} (${escapeHtml(contact.tenantName)}) - ${escapeHtml(contact.contactEmail)}</span>
                </label>
            `).join('');
        }
    }
    
    // Update recipient count
    updateRecipientCount();
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.building-checkbox, .tenant-checkbox, .contact-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateRecipientCount);
    });
    
    // Set up open email client button
    const openEmailClientBtn = document.getElementById('openEmailClientBtn');
    if (openEmailClientBtn) {
        openEmailClientBtn.onclick = async function() {
            await compileAndOpenEmail(tenants, buildings, allContacts);
        };
    }
    
    // Store data for later use
    window._sendEmailData = { tenants, buildings, allContacts };
}

function updateRecipientCount() {
    const selectedBuildings = document.querySelectorAll('.building-checkbox:checked').length;
    const selectedTenants = document.querySelectorAll('.tenant-checkbox:checked').length;
    const selectedContacts = document.querySelectorAll('.contact-checkbox:checked').length;
    const total = selectedBuildings + selectedTenants + selectedContacts;
    
    const countElement = document.getElementById('selectedRecipientsCount');
    if (countElement) {
        countElement.textContent = total;
    }
}

async function compileAndOpenEmail(tenants, buildings, allContacts) {
    const selectedBuildings = Array.from(document.querySelectorAll('.building-checkbox:checked')).map(cb => cb.value);
    const selectedTenants = Array.from(document.querySelectorAll('.tenant-checkbox:checked')).map(cb => cb.value);
    const selectedContactIds = Array.from(document.querySelectorAll('.contact-checkbox:checked')).map(cb => cb.getAttribute('data-email'));
    
    const emailSet = new Set();
    
    // Add emails from selected buildings (find tenants via occupancies and units)
    if (selectedBuildings.length > 0) {
        // Get all units in selected buildings
        const unitsSnapshot = await db.collection('units').get();
        const unitIdsInBuildings = new Set();
        
        unitsSnapshot.forEach(doc => {
            const unit = doc.data();
            if (unit.buildingId && selectedBuildings.includes(unit.buildingId)) {
                unitIdsInBuildings.add(doc.id);
            }
        });
        
        // Get all occupancies for units in selected buildings
        const occupanciesSnapshot = await db.collection('occupancies').get();
        const tenantIdsInBuildings = new Set();
        
        occupanciesSnapshot.forEach(doc => {
            const occ = doc.data();
            if (occ.unitId && unitIdsInBuildings.has(occ.unitId)) {
                tenantIdsInBuildings.add(occ.tenantId);
            }
        });
        
        // Add emails for tenants in selected buildings
        tenantIdsInBuildings.forEach(tenantId => {
            if (allContacts[tenantId]) {
                allContacts[tenantId].forEach(contact => {
                    if (contact.contactEmail) {
                        emailSet.add(contact.contactEmail);
                    }
                });
            }
        });
    }
    
    // Add emails from selected tenants
    selectedTenants.forEach(tenantId => {
        if (allContacts[tenantId]) {
            allContacts[tenantId].forEach(contact => {
                if (contact.contactEmail) {
                    emailSet.add(contact.contactEmail);
                }
            });
        }
    });
    
    // Add individually selected contacts
    selectedContactIds.forEach(email => {
        if (email) {
            emailSet.add(email);
        }
    });
    
    const emailList = Array.from(emailSet);
    
    if (emailList.length === 0) {
        alert('Please select at least one recipient.');
        return;
    }
    
    // Open email client with mailto: link
    const mailtoLink = `mailto:${emailList.join(',')}`;
    window.location.href = mailtoLink;
}

// Close send email modal
window.closeSendEmailModal = function() {
    const modal = document.getElementById('sendEmailModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

async function determineMaxContacts(tenants) {
    const tenantIds = Object.keys(tenants);
    if (tenantIds.length === 0) return { maxContacts: 0, maxBrokers: 0 };
    
    // Firestore 'in' query limit is 10, so we need to batch
    const allContacts = {};
    const batchSize = 10;
    
    for (let i = 0; i < tenantIds.length; i += batchSize) {
        const batch = tenantIds.slice(i, i + batchSize);
        const contactsSnapshot = await db.collection('tenantContacts')
            .where('tenantId', 'in', batch)
            .get();
        
        contactsSnapshot.forEach(doc => {
            const contact = { id: doc.id, ...doc.data() };
            if (!allContacts[contact.tenantId]) {
                allContacts[contact.tenantId] = [];
            }
            allContacts[contact.tenantId].push(contact);
        });
    }
    
    // Find maximum number of contacts and brokers across all tenants
    let maxContacts = 0;
    let maxBrokers = 0;
    Object.keys(tenants).forEach(tenantId => {
        const contacts = allContacts[tenantId] || [];
        const separated = filterContactsForTableView(contacts, false);
        maxContacts = Math.max(maxContacts, separated.contacts.length);
        maxBrokers = Math.max(maxBrokers, separated.brokers.length);
    });
    
    // Store contacts for later use
    window._cachedContacts = allContacts;
    
    return {
        maxContacts: Math.max(1, maxContacts), // At least 1 column
        maxBrokers: Math.max(0, maxBrokers) // Can be 0
    };
}

function rebuildTableWithContactColumns(tenantsByBuilding, tenantsWithoutBuilding, occupanciesMap, unitsMap, maxContacts) {
    let html = '';
    
    // Generate contact column headers
    const contactHeaders = [];
    for (let i = 1; i <= maxContacts; i++) {
        contactHeaders.push(`<th>Contact ${i}</th>`);
    }
    
    // Render grouped by building
    Object.keys(tenantsByBuilding).sort().forEach(buildingName => {
        const group = tenantsByBuilding[buildingName];
        html += `
            <div class="building-group">
                <div class="building-group-header">
                    <input type="checkbox" class="email-select-building" data-building-id="${group.building?.id || ''}" data-building-name="${escapeHtml(buildingName)}" style="display: none; margin-right: 8px; cursor: pointer;">
                    <span>${escapeHtml(buildingName)}</span>
                </div>
                <table class="tenants-table">
                    <thead>
                        <tr class="header-major">
                            <th rowspan="2">Occupancies</th>
                            <th rowspan="2">Tenant Name</th>
                            ${maxContacts > 0 ? `<th colspan="${maxContacts}">Contacts</th>` : ''}
                            ${maxBrokers > 0 ? `<th colspan="${maxBrokers}">Brokers</th>` : ''}
                        </tr>
                        <tr class="header-sub">
                            ${contactSubHeaders.join('')}
                            ${brokerSubHeaders.join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        group.tenants.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant (not just this building)
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies - show all occupancies for this tenant
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = allTenantOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        return `<span class="occupancy-info">Unit (ID: ${occ.unitId.substring(0, 8)}...)</span>`;
                    } else {
                        return `<span class="occupancy-info">Property Level</span>`;
                    }
                }).join('');
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            html += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <input type="checkbox" class="email-select-tenant" data-tenant-id="${tenant.id}" style="display: none; cursor: pointer;">
                                <span class="tenant-name-text">${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
                            </div>
                            <div class="tenant-actions-compact">
                                <button class="btn-action btn-view" onclick="viewTenantDetail('${tenant.id}')" title="View Details">
                                    <span class="btn-icon">👁️</span>
                                </button>
                                <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                    <span class="btn-icon">✏️</span>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                    <span class="btn-icon">🗑️</span>
                                </button>
                            </div>
                        </div>
                    </td>
                    ${contactCells.join('')}
                    ${brokerCells.join('')}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    // Render tenants without building
    if (tenantsWithoutBuilding.length > 0) {
        html += `
            <div class="building-group">
                <div class="building-group-header">
                    <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Orphan Tenants" style="display: none; margin-right: 8px; cursor: pointer;">
                    <span style="font-weight: 600; color: #e65100;">⚠️ Orphan Tenants</span>
                </div>
                <table class="tenants-table">
                    <thead>
                        <tr class="header-major">
                            <th rowspan="2">Occupancies</th>
                            <th rowspan="2">Tenant Name</th>
                            ${maxContacts > 0 ? `<th colspan="${maxContacts}">Contacts</th>` : ''}
                            ${maxBrokers > 0 ? `<th colspan="${maxBrokers}">Brokers</th>` : ''}
                        </tr>
                        <tr class="header-sub">
                            ${contactSubHeaders.join('')}
                            ${brokerSubHeaders.join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        tenantsWithoutBuilding.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = allTenantOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        return `<span class="occupancy-info">Unit (ID: ${occ.unitId.substring(0, 8)}...)</span>`;
                    } else {
                        return `<span class="occupancy-info">Property Level</span>`;
                    }
                }).join('');
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            html += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <input type="checkbox" class="email-select-tenant" data-tenant-id="${tenant.id}" style="display: none; cursor: pointer;">
                                <span class="tenant-name-text">${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
                            </div>
                            <div class="tenant-actions-compact">
                                <button class="btn-action btn-view" onclick="viewTenantDetail('${tenant.id}')" title="View Details">
                                    <span class="btn-icon">👁️</span>
                                </button>
                                <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                    <span class="btn-icon">✏️</span>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                    <span class="btn-icon">🗑️</span>
                                </button>
                            </div>
                        </div>
                    </td>
                    ${contactCells.join('')}
                    ${brokerCells.join('')}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    return html;
}

async function loadContactsForTableView(tenants, maxContacts, maxBrokers) {
    const tenantIds = Object.keys(tenants);
    if (tenantIds.length === 0) return;
    
    // Use cached contacts if available, otherwise load them
    let allContacts = window._cachedContacts;
    if (!allContacts) {
        allContacts = {};
        const batchSize = 10;
        
        for (let i = 0; i < tenantIds.length; i += batchSize) {
            const batch = tenantIds.slice(i, i + batchSize);
            const contactsSnapshot = await db.collection('tenantContacts')
                .where('tenantId', 'in', batch)
                .get();
            
            contactsSnapshot.forEach(doc => {
                const contact = { id: doc.id, ...doc.data() };
                if (!allContacts[contact.tenantId]) {
                    allContacts[contact.tenantId] = [];
                }
                allContacts[contact.tenantId].push(contact);
            });
        }
    }
    
    // Update table with contact info in individual columns - show ALL contacts and brokers
    Object.keys(tenants).forEach(tenantId => {
        const contacts = allContacts[tenantId] || [];
        const separated = filterContactsForTableView(contacts, false);
        const sortedContacts = separated.contacts;
        const brokers = separated.brokers;
        
        // Populate each contact column
        for (let i = 0; i < maxContacts; i++) {
            const contactCell = document.querySelector(`tr[data-tenant-id="${tenantId}"] td[data-contact-type="contact"][data-contact-index="${i}"]`);
            if (contactCell) {
                if (i < sortedContacts.length) {
                    const contact = sortedContacts[i];
                    const classifications = contact.classifications || [];
                    const isPrimary = classifications.includes('Primary');
                    const isSecondary = classifications.includes('Secondary');
                    const isLeasing = classifications.includes('Leasing');
                    const isBilling = classifications.includes('Billing');
                    
                    // Create type indicator circles
                    let typeIndicators = '<div class="contact-type-indicators">';
                    if (isPrimary) typeIndicators += '<span class="contact-type-indicator primary" title="Primary"></span>';
                    if (isSecondary) typeIndicators += '<span class="contact-type-indicator secondary" title="Secondary"></span>';
                    if (isLeasing) typeIndicators += '<span class="contact-type-indicator leasing" title="Leasing"></span>';
                    if (isBilling) typeIndicators += '<span class="contact-type-indicator billing" title="Billing"></span>';
                    typeIndicators += '</div>';
                    
                    contactCell.innerHTML = `
                        <div class="contact-card-table">
                            <div style="position: absolute; top: 4px; left: 4px; z-index: 10;">
                                <input type="checkbox" class="email-select-contact" data-contact-id="${contact.id}" data-email="${escapeHtml(contact.contactEmail || '')}" data-tenant-id="${tenantId}" style="display: none; cursor: pointer;">
                            </div>
                            <div class="contact-card-header">
                                <div class="contact-card-name">${escapeHtml(contact.contactName || 'Unnamed')}</div>
                                ${typeIndicators}
                            </div>
                            ${contact.contactEmail ? `
                                <div class="contact-card-info">
                                    <div class="contact-icon-email"></div>
                                    <a href="mailto:${escapeHtml(contact.contactEmail)}" class="contact-link-table">${escapeHtml(contact.contactEmail)}</a>
                                </div>
                            ` : ''}
                            <div class="contact-card-info">
                                <div class="contact-icon-phone"></div>
                                ${contact.contactPhone ? `<a href="tel:${escapeHtml(contact.contactPhone)}" class="contact-link-table">${escapeHtml(contact.contactPhone)}</a>` : '<span class="contact-no-info">no phone number provided</span>'}
                            </div>
                            <div class="contact-card-actions">
                                <button class="btn-edit-contact" onclick="editContactFromTable('${contact.id}')" title="Edit contact">
                                    <span>✏️</span>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    contactCell.innerHTML = ''; // Empty cell if no contact for this position
                }
            }
        }
        
        // Populate each broker column
        for (let i = 0; i < maxBrokers; i++) {
            const brokerCell = document.querySelector(`tr[data-tenant-id="${tenantId}"] td[data-contact-type="broker"][data-contact-index="${i}"]`);
            if (brokerCell) {
                if (i < brokers.length) {
                    const contact = brokers[i];
                    const classifications = contact.classifications || [];
                    const isTenantRepresentative = classifications.includes('Tenant Representative');
                    
                    // Create type indicator circle for tenant representative
                    let typeIndicators = '<div class="contact-type-indicators">';
                    if (isTenantRepresentative) typeIndicators += '<span class="contact-type-indicator tenant-rep" title="Tenant Representative"></span>';
                    typeIndicators += '</div>';
                    
                    brokerCell.innerHTML = `
                        <div class="contact-card-table">
                            <div style="position: absolute; top: 4px; left: 4px; z-index: 10;">
                                <input type="checkbox" class="email-select-contact" data-contact-id="${contact.id}" data-email="${escapeHtml(contact.contactEmail || '')}" data-tenant-id="${tenantId}" style="display: none; cursor: pointer;">
                            </div>
                            <div class="contact-card-header">
                                <div class="contact-card-name">${escapeHtml(contact.contactName || 'Unnamed')}</div>
                                ${typeIndicators}
                            </div>
                            ${contact.contactEmail ? `
                                <div class="contact-card-info">
                                    <div class="contact-icon-email"></div>
                                    <a href="mailto:${escapeHtml(contact.contactEmail)}" class="contact-link-table">${escapeHtml(contact.contactEmail)}</a>
                                </div>
                            ` : ''}
                            <div class="contact-card-info">
                                <div class="contact-icon-phone"></div>
                                ${contact.contactPhone ? `<a href="tel:${escapeHtml(contact.contactPhone)}" class="contact-link-table">${escapeHtml(contact.contactPhone)}</a>` : '<span class="contact-no-info">no phone number provided</span>'}
                            </div>
                            <div class="contact-card-actions">
                                <button class="btn-edit-contact" onclick="editContactFromTable('${contact.id}')" title="Edit contact">
                                    <span>✏️</span>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    brokerCell.innerHTML = ''; // Empty cell if no broker for this position
                }
            }
        }
    });
    
    // Clear cached contacts
    delete window._cachedContacts;
}

function filterContactsForTableView(contacts, showLeasing) {
    // Separate contacts into regular contacts and brokers
    const regularContacts = [];
    const brokers = [];
    
    contacts.forEach(contact => {
        const classifications = contact.classifications || [];
        const isTenantRepresentative = classifications.includes('Tenant Representative');
        
        if (isTenantRepresentative) {
            brokers.push(contact);
        } else {
            regularContacts.push(contact);
        }
    });
    
    // Sort regular contacts by priority: Primary, Secondary, Leasing, then others
    const sortedRegularContacts = [];
    const primaryContacts = [];
    const secondaryContacts = [];
    const leasingContacts = [];
    const otherContacts = [];
    
    regularContacts.forEach(contact => {
        const classifications = contact.classifications || [];
        const isPrimary = classifications.includes('Primary');
        const isSecondary = classifications.includes('Secondary');
        const isLeasing = classifications.includes('Leasing');
        
        if (isPrimary) {
            primaryContacts.push(contact);
        } else if (isSecondary) {
            secondaryContacts.push(contact);
        } else if (isLeasing) {
            leasingContacts.push(contact);
        } else {
            otherContacts.push(contact);
        }
    });
    
    sortedRegularContacts.push(...primaryContacts);
    sortedRegularContacts.push(...secondaryContacts);
    sortedRegularContacts.push(...leasingContacts);
    sortedRegularContacts.push(...otherContacts);
    
    return {
        contacts: sortedRegularContacts,
        brokers: brokers
    };
}

function refreshContactsTableView() {
    // Reload tenants to refresh contact display (will rebuild table with new contact columns)
    db.collection('tenants').get().then((snapshot) => {
        const tenants = {};
        snapshot.forEach((doc) => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        renderTenantsList(tenants);
    });
}

async function filterTenantsByProperty(tenants) {
    if (!selectedPropertyForTenants) {
        return tenants;
    }
    
    // Get occupancies for the selected property
    const occupanciesSnapshot = await db.collection('occupancies')
        .where('propertyId', '==', selectedPropertyForTenants)
        .get();
    
    const tenantIdsInProperty = new Set();
    occupanciesSnapshot.forEach(doc => {
        tenantIdsInProperty.add(doc.data().tenantId);
    });
    
    // Filter tenants
    const filtered = {};
    Object.keys(tenants).forEach(id => {
        if (tenantIdsInProperty.has(id)) {
            filtered[id] = tenants[id];
        }
    });
    
    return filtered;
}

function showAddTenantForm() {
    editingTenantId = null;
    document.getElementById('tenantModalTitle').textContent = 'Add Tenant';
    document.getElementById('tenantId').value = '';
    document.getElementById('tenantForm').reset();
    
    // Reset button state
    const submitBtn = document.querySelector('#tenantForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Tenant';
        submitBtn.classList.remove('saving');
    }
    
    // Reset field visibility
    updateTenantTypeFields();
    
    document.getElementById('tenantModal').classList.add('show');
    setTimeout(() => {
        document.getElementById('tenantName').focus();
    }, 100);
}

function updateTenantTypeFields() {
    const tenantType = document.getElementById('tenantType')?.value || '';
    const commercialFields = document.getElementById('commercialTenantFields');
    const residentialFields = document.getElementById('residentialTenantFields');
    
    if (commercialFields) {
        commercialFields.style.display = tenantType === 'Commercial' ? 'block' : 'none';
    }
    if (residentialFields) {
        residentialFields.style.display = tenantType === 'Residential' ? 'block' : 'none';
    }
}

function closeTenantModal() {
    const modal = document.getElementById('tenantModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('tenantForm').reset();
    document.getElementById('tenantId').value = '';
    editingTenantId = null;
    
    // Reset button state
    const submitBtn = document.querySelector('#tenantForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Tenant';
        submitBtn.classList.remove('saving');
    }
    
    // Reset field visibility
    updateTenantTypeFields();
}

window.editTenant = function(tenantId) {
    db.collection('tenants').doc(tenantId).get().then((doc) => {
        const tenant = doc.data();
        if (tenant) {
            editingTenantId = tenantId;
            document.getElementById('tenantModalTitle').textContent = 'Edit Tenant';
            document.getElementById('tenantId').value = tenantId;
            document.getElementById('tenantName').value = tenant.tenantName || '';
            document.getElementById('tenantType').value = tenant.tenantType || '';
            document.getElementById('tenantStatus').value = tenant.status || 'Active';
            document.getElementById('tenantMailingAddress').value = tenant.mailingAddress || '';
            document.getElementById('tenantNotes').value = tenant.notes || '';
            
            // Commercial fields
            document.getElementById('tenantTaxId').value = tenant.taxId || '';
            document.getElementById('tenantBusinessType').value = tenant.businessType || '';
            document.getElementById('tenantNumberOfEmployees').value = tenant.numberOfEmployees || '';
            document.getElementById('tenantWebsite').value = tenant.website || '';
            
            // Residential fields
            if (tenant.dateOfBirth) {
                const dob = tenant.dateOfBirth.toDate ? tenant.dateOfBirth.toDate() : new Date(tenant.dateOfBirth);
                document.getElementById('tenantDateOfBirth').value = dob.toISOString().split('T')[0];
            } else {
                document.getElementById('tenantDateOfBirth').value = '';
            }
            
            // Reset button state
            const submitBtn = document.querySelector('#tenantForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Tenant';
                submitBtn.classList.remove('saving');
            }
            
            // Update field visibility
            updateTenantTypeFields();
            
            document.getElementById('tenantModal').classList.add('show');
            setTimeout(() => {
                document.getElementById('tenantName').focus();
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading tenant:', error);
        alert('Error loading tenant: ' + error.message);
    });
};

window.deleteTenant = function(tenantId) {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
        return;
    }
    
    db.collection('tenants').doc(tenantId).delete()
        .then(() => {
            console.log('Tenant deleted successfully');
            loadTenants();
        })
        .catch((error) => {
            console.error('Error deleting tenant:', error);
            alert('Error deleting tenant: ' + error.message);
        });
};

function handleTenantSubmit(e) {
    e.preventDefault();
    
    // Get submit button early for state management
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Helper function to reset button state
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Tenant';
            submitBtn.classList.remove('saving');
        }
    };
    
    // Get form element to scope field lookups
    const tenantForm = document.getElementById('tenantForm');
    if (!tenantForm) {
        console.error('Tenant form not found');
        alert('Error: Tenant form not found. Please refresh the page.');
        resetButtonState();
        return;
    }
    
    const id = tenantForm.querySelector('#tenantId').value;
    const tenantNameField = tenantForm.querySelector('#tenantName');
    const tenantName = tenantNameField ? tenantNameField.value.trim() : '';
    const tenantType = tenantForm.querySelector('#tenantType').value;
    const status = tenantForm.querySelector('#tenantStatus').value;
    const mailingAddress = tenantForm.querySelector('#tenantMailingAddress').value.trim();
    const notes = tenantForm.querySelector('#tenantNotes').value.trim();
    
    // Commercial specific fields
    const taxId = tenantForm.querySelector('#tenantTaxId')?.value.trim() || null;
    const businessType = tenantForm.querySelector('#tenantBusinessType')?.value.trim() || null;
    const numberOfEmployees = parseInt(tenantForm.querySelector('#tenantNumberOfEmployees')?.value) || null;
    const website = tenantForm.querySelector('#tenantWebsite')?.value.trim() || null;
    
    // Residential specific fields
    const dateOfBirthStr = tenantForm.querySelector('#tenantDateOfBirth')?.value || null;
    const dateOfBirth = dateOfBirthStr ? firebase.firestore.Timestamp.fromDate(new Date(dateOfBirthStr)) : null;
    
    // Validation - check if field exists and has value
    if (!tenantNameField) {
        console.error('Tenant name field not found');
        alert('Error: Tenant name field not found. Please refresh the page.');
        resetButtonState();
        return;
    }
    
    if (!tenantName || tenantName.length === 0) {
        console.error('Tenant name is empty. Field value:', tenantNameField.value);
        alert('Tenant name is required');
        resetButtonState();
        tenantNameField.focus();
        return;
    }
    
    if (!tenantType) {
        alert('Tenant type is required');
        resetButtonState();
        return;
    }
    
    if (!status) {
        alert('Status is required');
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
        console.error('Tenant save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);
    
    const tenantData = {
        tenantName,
        tenantType,
        status,
        mailingAddress: mailingAddress || null,
        notes: notes || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add type-specific fields
    if (tenantType === 'Commercial') {
        tenantData.taxId = taxId;
        tenantData.businessType = businessType;
        tenantData.numberOfEmployees = numberOfEmployees;
        tenantData.website = website;
        // Clear residential fields
        tenantData.dateOfBirth = null;
    } else if (tenantType === 'Residential') {
        tenantData.dateOfBirth = dateOfBirth;
        // Clear commercial fields
        tenantData.taxId = null;
        tenantData.businessType = null;
        tenantData.numberOfEmployees = null;
        tenantData.website = null;
    }
    
    if (id && editingTenantId) {
        // Update existing
        db.collection('tenants').doc(id).get().then((doc) => {
            const existing = doc.data();
            tenantData.createdAt = existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('tenants').doc(id).update(tenantData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Tenant updated successfully');
            resetButtonState();
            closeTenantModal();
            loadTenants();
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating tenant:', error);
            alert('Error saving tenant: ' + error.message);
            resetButtonState();
        });
    } else {
        // Create new
        tenantData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('tenants').add(tenantData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Tenant created successfully with ID:', docRef.id);
                resetButtonState();
                closeTenantModal();
                loadTenants();
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating tenant:', error);
                alert('Error saving tenant: ' + error.message);
                resetButtonState();
            });
    }
}


// Tenant Detail View
let currentTenantIdForDetail = null;
let editingContactId = null;
let editingOccupancyId = null;

window.viewTenantDetail = function(tenantId) {
    currentTenantIdForDetail = tenantId;
    const tenantsList = document.querySelector('.tenants-page-content .section');
    const tenantDetailView = document.getElementById('tenantDetailView');
    if (tenantsList) tenantsList.style.display = 'none';
    if (tenantDetailView) {
        tenantDetailView.style.display = 'block';
        tenantDetailView.setAttribute('data-tenant-id', tenantId);
        db.collection('tenants').doc(tenantId).get().then((doc) => {
            const tenant = doc.data();
            if (tenant) {
                const nameElement = document.getElementById('tenantDetailName');
                if (nameElement) nameElement.textContent = tenant.tenantName || 'Unnamed Tenant';
            }
        });
        loadContacts(tenantId);
        loadOccupancies(tenantId);
    }
};

window.backToTenants = function() {
    const tenantsList = document.querySelector('.tenants-page-content .section');
    const tenantDetailView = document.getElementById('tenantDetailView');
    if (tenantsList) tenantsList.style.display = 'block';
    if (tenantDetailView) tenantDetailView.style.display = 'none';
};

// Contact Management
function loadContacts(tenantId) {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    
    db.collection('tenantContacts')
        .where('tenantId', '==', tenantId)
        .get()
        .then((querySnapshot) => {
            contactsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                contactsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No contacts yet. Add one to get started.</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const contact = { id: doc.id, ...doc.data() };
                const contactItem = document.createElement('div');
                contactItem.className = 'unit-item';
                
                const classifications = contact.classifications || [];
                const classificationBadges = classifications.map(c => `<span class="contact-classification-badge">${c}</span>`).join(' ');
                
                contactItem.innerHTML = `
                    <div class="contact-card-header">
                        <div class="contact-name-section">
                            <h4>${escapeHtml(contact.contactName)}</h4>
                            ${classificationBadges ? `<div class="contact-classifications">${classificationBadges}</div>` : ''}
                        </div>
                    </div>
                    <div class="contact-card-body">
                        ${contact.contactTitle ? `<div class="contact-info-item"><span class="contact-icon">💼</span><span>${escapeHtml(contact.contactTitle)}</span></div>` : ''}
                        ${contact.contactEmail ? `<div class="contact-info-item"><span class="contact-icon">✉️</span><a href="mailto:${escapeHtml(contact.contactEmail)}" class="contact-link">${escapeHtml(contact.contactEmail)}</a></div>` : ''}
                        ${contact.contactPhone ? `<div class="contact-info-item"><span class="contact-icon">📞</span><a href="tel:${escapeHtml(contact.contactPhone)}" class="contact-link">${escapeHtml(contact.contactPhone)}</a></div>` : ''}
                        ${contact.notes ? `<div class="contact-notes"><span class="contact-icon">📝</span><span>${escapeHtml(contact.notes)}</span></div>` : ''}
                    </div>
                    <div class="contact-card-actions">
                        <button class="btn-secondary btn-small" onclick="editContact('${contact.id}')">Edit</button>
                        <button class="btn-danger btn-small" onclick="deleteContact('${contact.id}')">Delete</button>
                    </div>
                `;
                contactsList.appendChild(contactItem);
            });
        })
        .catch((error) => {
            console.error('Error loading contacts:', error);
            contactsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading contacts. Please try again.</p>';
        });
}

window.addContact = function(tenantId) {
    editingContactId = null;
    document.getElementById('contactModalTitle').textContent = 'Add Contact';
    document.getElementById('contactId').value = '';
    document.getElementById('contactTenantId').value = tenantId;
    document.getElementById('contactForm').reset();
    
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Contact';
        submitBtn.classList.remove('saving');
    }
    
    document.getElementById('contactModal').classList.add('show');
    setTimeout(() => {
        document.getElementById('contactName').focus();
    }, 100);
};

window.editContactFromTable = function(contactId, event) {
    if (event) {
        event.stopPropagation();
    }
    editContact(contactId);
};

window.editContact = function(contactId) {
    db.collection('tenantContacts').doc(contactId).get().then((doc) => {
        const contact = doc.data();
        if (contact) {
            editingContactId = contactId;
            document.getElementById('contactModalTitle').textContent = 'Edit Contact';
            document.getElementById('contactId').value = contactId;
            document.getElementById('contactTenantId').value = contact.tenantId;
            document.getElementById('contactName').value = contact.contactName || '';
            document.getElementById('contactEmail').value = contact.contactEmail || '';
            document.getElementById('contactPhone').value = contact.contactPhone || '';
            document.getElementById('contactTitle').value = contact.contactTitle || '';
            document.getElementById('contactNotes').value = contact.notes || '';
            
            const classifications = contact.classifications || [];
            document.getElementById('contactPrimary').checked = classifications.includes('Primary');
            document.getElementById('contactSecondary').checked = classifications.includes('Secondary');
            document.getElementById('contactLeasing').checked = classifications.includes('Leasing');
            document.getElementById('contactBilling').checked = classifications.includes('Billing');
            document.getElementById('contactTenantRepresentative').checked = classifications.includes('Tenant Representative');
            
            const submitBtn = document.querySelector('#contactForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Contact';
                submitBtn.classList.remove('saving');
            }
            
            document.getElementById('contactModal').classList.add('show');
            setTimeout(() => {
                document.getElementById('contactName').focus();
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading contact:', error);
        alert('Error loading contact: ' + error.message);
    });
};

window.deleteContact = function(contactId) {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
        return;
    }
    
    db.collection('tenantContacts').doc(contactId).delete()
        .then(() => {
            console.log('Contact deleted successfully');
            if (currentTenantIdForDetail) {
                loadContacts(currentTenantIdForDetail);
            }
        })
        .catch((error) => {
            console.error('Error deleting contact:', error);
            alert('Error deleting contact: ' + error.message);
        });
};

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('contactForm').reset();
    document.getElementById('contactId').value = '';
    document.getElementById('contactTenantId').value = '';
    editingContactId = null;
    
    const submitBtn = document.querySelector('#contactForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Contact';
        submitBtn.classList.remove('saving');
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Contact';
            submitBtn.classList.remove('saving');
        }
    };
    
    const id = document.getElementById('contactId').value;
    const tenantId = document.getElementById('contactTenantId').value;
    const contactName = document.getElementById('contactName').value.trim();
    const contactEmail = document.getElementById('contactEmail').value.trim();
    const contactPhone = document.getElementById('contactPhone').value.trim();
    const contactTitle = document.getElementById('contactTitle').value.trim();
    const contactNotes = document.getElementById('contactNotes').value.trim();
    
    const classifications = [];
    if (document.getElementById('contactPrimary').checked) classifications.push('Primary');
    if (document.getElementById('contactSecondary').checked) classifications.push('Secondary');
    if (document.getElementById('contactLeasing').checked) classifications.push('Leasing');
    if (document.getElementById('contactBilling').checked) classifications.push('Billing');
    if (document.getElementById('contactTenantRepresentative').checked) classifications.push('Tenant Representative');
    
    if (!contactName) {
        alert('Contact name is required');
        resetButtonState();
        return;
    }
    
    if (classifications.length === 0) {
        alert('Please select at least one contact classification');
        resetButtonState();
        return;
    }
    
    if (!tenantId) {
        alert('Tenant ID is missing');
        resetButtonState();
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    const timeoutId = setTimeout(() => {
        console.error('Contact save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);
    
    const contactData = {
        tenantId,
        contactName,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        contactTitle: contactTitle || null,
        classifications,
        notes: contactNotes || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (id && editingContactId) {
        db.collection('tenantContacts').doc(id).get().then((doc) => {
            const existing = doc.data();
            contactData.createdAt = existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('tenantContacts').doc(id).update(contactData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Contact updated successfully');
            resetButtonState();
            closeContactModal();
            if (currentTenantIdForDetail) {
                loadContacts(currentTenantIdForDetail);
            }
            // Refresh table view if we're in table view
            if (currentTenantView === 'table') {
                db.collection('tenants').get().then((snapshot) => {
                    const tenants = {};
                    snapshot.forEach((doc) => {
                        tenants[doc.id] = { id: doc.id, ...doc.data() };
                    });
                    renderTenantsList(tenants);
                });
            }
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating contact:', error);
            alert('Error saving contact: ' + error.message);
            resetButtonState();
        });
    } else {
        contactData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('tenantContacts').add(contactData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Contact created successfully with ID:', docRef.id);
                resetButtonState();
                closeContactModal();
                if (currentTenantIdForDetail) {
                    loadContacts(currentTenantIdForDetail);
                }
                // Refresh table view if we're in table view
                if (currentTenantView === 'table') {
                    db.collection('tenants').get().then((snapshot) => {
                        const tenants = {};
                        snapshot.forEach((doc) => {
                            tenants[doc.id] = { id: doc.id, ...doc.data() };
                        });
                        renderTenantsList(tenants);
                    });
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating contact:', error);
                alert('Error saving contact: ' + error.message);
                resetButtonState();
            });
    }
}

// Occupancy Management
function loadOccupancies(tenantId) {
    const occupanciesList = document.getElementById('occupanciesList');
    if (!occupanciesList) return;
    
    db.collection('occupancies')
        .where('tenantId', '==', tenantId)
        .get()
        .then((querySnapshot) => {
            occupanciesList.innerHTML = '';
            
            if (querySnapshot.empty) {
                occupanciesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No occupancies yet. Add one to get started.</p>';
                return;
            }
            
            Promise.all([
                db.collection('properties').get(),
                db.collection('units').get()
            ]).then(([propertiesSnapshot, unitsSnapshot]) => {
                const propertiesMap = {};
                const unitsMap = {};
                
                propertiesSnapshot.forEach((doc) => {
                    propertiesMap[doc.id] = doc.data();
                });
                
                unitsSnapshot.forEach((doc) => {
                    unitsMap[doc.id] = doc.data();
                });
                
                querySnapshot.forEach((doc) => {
                    const occupancy = { id: doc.id, ...doc.data() };
                    const occupancyItem = document.createElement('div');
                    occupancyItem.className = 'unit-item';
                    
                    const property = propertiesMap[occupancy.propertyId];
                    const unit = occupancy.unitId ? unitsMap[occupancy.unitId] : null;
                    const propertyName = property ? property.name : 'Unknown Property';
                    const unitName = unit ? unit.unitNumber : null;
                    
                    const moveInDate = occupancy.moveInDate?.toDate ? occupancy.moveInDate.toDate().toLocaleDateString() : 'N/A';
                    const moveOutDate = occupancy.moveOutDate?.toDate ? occupancy.moveOutDate.toDate().toLocaleDateString() : (occupancy.status === 'Active' ? 'Current' : 'N/A');
                    const statusBadge = occupancy.status ? `<span class="status-badge status-${occupancy.status.toLowerCase()}">${occupancy.status}</span>` : '';
                    
                    occupancyItem.innerHTML = `
                        <div class="unit-info">
                            <h4>${escapeHtml(propertyName)} ${statusBadge}</h4>
                            ${unitName ? `<p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>` : '<p><strong>Type:</strong> Property Level</p>'}
                            <p><strong>Move-In:</strong> ${moveInDate}</p>
                            <p><strong>Move-Out:</strong> ${moveOutDate}</p>
                            ${occupancy.notes ? `<p><strong>Notes:</strong> ${escapeHtml(occupancy.notes)}</p>` : ''}
                        </div>
                        <div class="unit-item-actions">
                            <button class="btn-secondary btn-small" onclick="editOccupancy('${occupancy.id}')">Edit</button>
                            <button class="btn-danger btn-small" onclick="deleteOccupancy('${occupancy.id}')">Delete</button>
                        </div>
                    `;
                    occupanciesList.appendChild(occupancyItem);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading occupancies:', error);
            occupanciesList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading occupancies. Please try again.</p>';
        });
}

function loadPropertiesForOccupancy() {
    const propertySelect = document.getElementById('occupancyPropertyId');
    if (!propertySelect) return Promise.resolve();
    
    propertySelect.innerHTML = '<option value="">Select property...</option>';
    
    return db.collection('properties')
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const property = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = property.name || 'Unnamed Property';
                propertySelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading properties for occupancy:', error);
        });
}

function loadUnitsForOccupancy(propertyId) {
    const unitSelect = document.getElementById('occupancyUnitId');
    if (!unitSelect) return Promise.resolve();
    
    unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
    
    if (!propertyId) return Promise.resolve();
    
    return db.collection('units')
        .where('propertyId', '==', propertyId)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const unit = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = unit.unitNumber || 'Unnamed Unit';
                unitSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading units for occupancy:', error);
        });
}

window.addOccupancy = function(tenantId) {
    editingOccupancyId = null;
    document.getElementById('occupancyModalTitle').textContent = 'Add Occupancy';
    document.getElementById('occupancyId').value = '';
    document.getElementById('occupancyTenantId').value = tenantId;
    document.getElementById('occupancyForm').reset();
    
    // Reset unit select
    const unitSelect = document.getElementById('occupancyUnitId');
    if (unitSelect) {
        unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
    }
    
    const submitBtn = document.querySelector('#occupancyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Occupancy';
        submitBtn.classList.remove('saving');
    }
    
    // Load properties first, then show modal and set up event listener
    loadPropertiesForOccupancy().then(() => {
        const propertySelect = document.getElementById('occupancyPropertyId');
        if (propertySelect) {
            // Remove any existing change listeners by cloning
            const newPropertySelect = propertySelect.cloneNode(true);
            propertySelect.parentNode.replaceChild(newPropertySelect, propertySelect);
            
            // Add change listener to load units when property changes
            newPropertySelect.addEventListener('change', function() {
                const selectedPropertyId = this.value;
                if (selectedPropertyId) {
                    loadUnitsForOccupancy(selectedPropertyId);
                } else {
                    const unitSelect = document.getElementById('occupancyUnitId');
                    if (unitSelect) {
                        unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
                    }
                }
            });
        }
        
        document.getElementById('occupancyModal').classList.add('show');
        setTimeout(() => {
            const propertySelect = document.getElementById('occupancyPropertyId');
            if (propertySelect) propertySelect.focus();
        }, 100);
    }).catch((error) => {
        console.error('Error loading properties:', error);
        alert('Error loading properties. Please try again.');
    });
};

window.editOccupancy = function(occupancyId) {
    db.collection('occupancies').doc(occupancyId).get().then((doc) => {
        const occupancy = doc.data();
        if (occupancy) {
            editingOccupancyId = occupancyId;
            document.getElementById('occupancyModalTitle').textContent = 'Edit Occupancy';
            document.getElementById('occupancyId').value = occupancyId;
            document.getElementById('occupancyTenantId').value = occupancy.tenantId;
            document.getElementById('occupancyStatus').value = occupancy.status || 'Active';
            document.getElementById('occupancyNotes').value = occupancy.notes || '';
            
            if (occupancy.moveInDate) {
                const moveIn = occupancy.moveInDate.toDate ? occupancy.moveInDate.toDate() : new Date(occupancy.moveInDate);
                document.getElementById('occupancyMoveInDate').value = moveIn.toISOString().split('T')[0];
            }
            if (occupancy.moveOutDate) {
                const moveOut = occupancy.moveOutDate.toDate ? occupancy.moveOutDate.toDate() : new Date(occupancy.moveOutDate);
                document.getElementById('occupancyMoveOutDate').value = moveOut.toISOString().split('T')[0];
            }
            
            loadPropertiesForOccupancy().then(() => {
                const propertySelect = document.getElementById('occupancyPropertyId');
                if (propertySelect) {
                    propertySelect.value = occupancy.propertyId;
                    
                    // Set up change listener for property select
                    const newPropertySelect = propertySelect.cloneNode(true);
                    propertySelect.parentNode.replaceChild(newPropertySelect, propertySelect);
                    newPropertySelect.value = occupancy.propertyId;
                    
                    newPropertySelect.addEventListener('change', function() {
                        const selectedPropertyId = this.value;
                        if (selectedPropertyId) {
                            loadUnitsForOccupancy(selectedPropertyId);
                        } else {
                            const unitSelect = document.getElementById('occupancyUnitId');
                            if (unitSelect) {
                                unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
                            }
                        }
                    });
                    
                    return loadUnitsForOccupancy(occupancy.propertyId);
                }
                return Promise.resolve();
            }).then(() => {
                if (occupancy.unitId) {
                    const unitSelect = document.getElementById('occupancyUnitId');
                    if (unitSelect) {
                        unitSelect.value = occupancy.unitId;
                    }
                }
                
                const submitBtn = document.querySelector('#occupancyForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Occupancy';
                    submitBtn.classList.remove('saving');
                }
                
                document.getElementById('occupancyModal').classList.add('show');
            });
        }
    }).catch((error) => {
        console.error('Error loading occupancy:', error);
        alert('Error loading occupancy: ' + error.message);
    });
};

window.deleteOccupancy = function(occupancyId) {
    if (!confirm('Are you sure you want to delete this occupancy? This action cannot be undone.')) {
        return;
    }
    
    db.collection('occupancies').doc(occupancyId).delete()
        .then(() => {
            console.log('Occupancy deleted successfully');
            if (currentTenantIdForDetail) {
                loadOccupancies(currentTenantIdForDetail);
            }
        })
        .catch((error) => {
            console.error('Error deleting occupancy:', error);
            alert('Error deleting occupancy: ' + error.message);
        });
};

function closeOccupancyModal() {
    const modal = document.getElementById('occupancyModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('occupancyForm').reset();
    document.getElementById('occupancyId').value = '';
    document.getElementById('occupancyTenantId').value = '';
    editingOccupancyId = null;
    
    const submitBtn = document.querySelector('#occupancyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Occupancy';
        submitBtn.classList.remove('saving');
    }
}

function handleOccupancySubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const resetButtonState = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Occupancy';
            submitBtn.classList.remove('saving');
        }
    };
    
    const id = document.getElementById('occupancyId').value;
    const tenantId = document.getElementById('occupancyTenantId').value;
    const propertyId = document.getElementById('occupancyPropertyId').value;
    const unitId = document.getElementById('occupancyUnitId').value || null;
    const moveInDateStr = document.getElementById('occupancyMoveInDate').value;
    const moveOutDateStr = document.getElementById('occupancyMoveOutDate').value;
    const status = document.getElementById('occupancyStatus').value;
    const notes = document.getElementById('occupancyNotes').value.trim();
    
    if (!tenantId) {
        alert('Tenant ID is missing');
        resetButtonState();
        return;
    }
    
    if (!propertyId) {
        alert('Property is required');
        resetButtonState();
        return;
    }
    
    if (!moveInDateStr) {
        alert('Move-in date is required');
        resetButtonState();
        return;
    }
    
    if (!status) {
        alert('Status is required');
        resetButtonState();
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        submitBtn.classList.add('saving');
    }
    
    const timeoutId = setTimeout(() => {
        console.error('Occupancy save operation timed out');
        resetButtonState();
        alert('The save operation is taking longer than expected. Please check your connection and try again.');
    }, 30000);
    
    const moveInDate = firebase.firestore.Timestamp.fromDate(new Date(moveInDateStr));
    const moveOutDate = moveOutDateStr ? firebase.firestore.Timestamp.fromDate(new Date(moveOutDateStr)) : null;
    
    const occupancyData = {
        tenantId,
        propertyId,
        unitId,
        moveInDate,
        moveOutDate,
        status,
        notes: notes || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (id && editingOccupancyId) {
        db.collection('occupancies').doc(id).get().then((doc) => {
            const existing = doc.data();
            occupancyData.createdAt = existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('occupancies').doc(id).update(occupancyData);
        }).then(() => {
            clearTimeout(timeoutId);
            console.log('Occupancy updated successfully');
            resetButtonState();
            closeOccupancyModal();
            if (currentTenantIdForDetail) {
                loadOccupancies(currentTenantIdForDetail);
            }
        }).catch((error) => {
            clearTimeout(timeoutId);
            console.error('Error updating occupancy:', error);
            alert('Error saving occupancy: ' + error.message);
            resetButtonState();
        });
    } else {
        occupancyData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('occupancies').add(occupancyData)
            .then((docRef) => {
                clearTimeout(timeoutId);
                console.log('Occupancy created successfully with ID:', docRef.id);
                resetButtonState();
                closeOccupancyModal();
                if (currentTenantIdForDetail) {
                    loadOccupancies(currentTenantIdForDetail);
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                console.error('Error creating occupancy:', error);
                alert('Error saving occupancy: ' + error.message);
                resetButtonState();
            });
    }
}

