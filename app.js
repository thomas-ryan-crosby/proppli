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

// Tenant Management - moved to top for early initialization
let editingTenantId = null;
let currentTenantView = 'table'; // 'cards' or 'table' - table is now default
let selectedPropertyForTenants = null;

// Lease Management
let editingLeaseId = null;
let currentPropertyIdForLeaseDetail = null;
let currentLeaseView = 'current'; // 'current' or 'previous'
let leaseDocumentFile = null;

// Update floating action buttons visibility
function updateFABsVisibility() {
    const fabAddTenant = document.getElementById('fabAddTenant');
    const fabAddContact = document.getElementById('fabAddContact');
    const fabAddLease = document.getElementById('fabAddLease');
    const tenantsPage = document.getElementById('tenantsPage');
    const tenantDetailModal = document.getElementById('tenantDetailModal');
    const contactsTab = document.getElementById('contactsTab');
    
    // Show Add Tenant FAB when on tenants page (visible when scrolling the table)
    if (fabAddTenant) {
        if (tenantsPage) {
            const isTenantsPageVisible = tenantsPage.style.display !== 'none';
            const isModalVisible = tenantDetailModal && tenantDetailModal.classList.contains('show');
            // Show when tenants page is visible and modal is hidden (i.e., showing the table)
            const shouldShow = isTenantsPageVisible && !isModalVisible;
            fabAddTenant.style.display = shouldShow ? 'flex' : 'none';
        } else {
            fabAddTenant.style.display = 'none';
        }
    }
    
    // Show Add Contact FAB when on tenants page (table view) OR when tenant detail modal is open with contacts tab active
    if (fabAddContact) {
        const isTenantsPageVisible = tenantsPage && tenantsPage.style.display !== 'none';
        const isModalVisible = tenantDetailModal && tenantDetailModal.classList.contains('show');
        const isContactsTabActive = contactsTab && contactsTab.classList.contains('active') && contactsTab.style.display !== 'none';
        
        // Show when:
        // 1. On tenants page (table view) - allows adding contacts from table
        // 2. OR when tenant detail modal is open with contacts tab active
        const shouldShow = (isTenantsPageVisible && !isModalVisible) || (isModalVisible && isContactsTabActive);
        fabAddContact.style.display = shouldShow ? 'flex' : 'none';
    }
    
    // Show Add Building and Add Unit FABs when property detail view is visible
    const fabAddBuilding = document.getElementById('fabAddBuilding');
    const fabAddUnit = document.getElementById('fabAddUnit');
    const propertiesPage = document.getElementById('propertiesPage');
    const propertyDetailView = document.getElementById('propertyDetailView');
    
    if (fabAddBuilding) {
        const isPropertiesPageVisible = propertiesPage && propertiesPage.style.display !== 'none';
        const isPropertyDetailVisible = propertyDetailView && propertyDetailView.style.display !== 'none';
        const shouldShow = isPropertiesPageVisible && isPropertyDetailVisible;
        fabAddBuilding.style.display = shouldShow ? 'flex' : 'none';
    }
    
    if (fabAddUnit) {
        const isPropertiesPageVisible = propertiesPage && propertiesPage.style.display !== 'none';
        const isPropertyDetailVisible = propertyDetailView && propertyDetailView.style.display !== 'none';
        const shouldShow = isPropertiesPageVisible && isPropertyDetailVisible;
        fabAddUnit.style.display = shouldShow ? 'flex' : 'none';
    }
    
    // Show Add Lease FAB when on leases page
    if (fabAddLease) {
        const leasesPage = document.getElementById('leasesPage');
        const leaseModal = document.getElementById('leaseModal');
        const isLeasesPageVisible = leasesPage && leasesPage.style.display !== 'none';
        const isModalVisible = leaseModal && leaseModal.classList.contains('show');
        // Show when leases page is visible and modal is hidden
        const shouldShow = isLeasesPageVisible && !isModalVisible;
        fabAddLease.style.display = shouldShow ? 'flex' : 'none';
    }
}

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
    setupLeaseEventListeners();
    setupNavigation();
    loadProperties();
    loadTickets();
    showPage(currentPage);
    updateFABsVisibility();
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
    } else if (page === 'leases') {
        loadLeases();
    }
    
    // Update FAB visibility
    updateFABsVisibility();
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
            window.backToProperties();
        });
    }
    
    // Floating action buttons for properties
    const fabAddBuilding = document.getElementById('fabAddBuilding');
    const fabAddUnit = document.getElementById('fabAddUnit');
    
    if (fabAddBuilding) {
        fabAddBuilding.addEventListener('click', () => {
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
    
    if (fabAddUnit) {
        fabAddUnit.addEventListener('click', () => {
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
    
    // Floating action buttons
    const fabAddTenant = document.getElementById('fabAddTenant');
    const fabAddContact = document.getElementById('fabAddContact');
    
    if (fabAddTenant) {
        fabAddTenant.addEventListener('click', () => {
            showAddTenantForm();
        });
    }
    
    if (fabAddContact) {
        fabAddContact.addEventListener('click', () => {
            // Try to get tenant ID from detail view, otherwise allow creating orphan contact
            let tenantId = currentTenantIdForDetail;
            if (!tenantId) {
                const tenantDetailView = document.getElementById('tenantDetailView');
                if (tenantDetailView && tenantDetailView.style.display !== 'none') {
                    tenantId = tenantDetailView.getAttribute('data-tenant-id');
                }
            }
            // Allow null/undefined tenantId to create orphan contact
            window.addContact(tenantId || null);
        });
    }
    
    // Floating action button for Add Lease
    const fabAddLease = document.getElementById('fabAddLease');
    if (fabAddLease) {
        fabAddLease.addEventListener('click', () => {
            if (window.openLeaseModal) {
                window.openLeaseModal();
            } else if (typeof openLeaseModal === 'function') {
                openLeaseModal();
            } else {
                console.error('openLeaseModal is not defined');
                alert('Error: Unable to open lease form. Please refresh the page.');
            }
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
                const tenantDetailModal = document.getElementById('tenantDetailModal');
                if (tenantDetailModal) {
                    tenantId = tenantDetailModal.getAttribute('data-tenant-id');
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
                const tenantDetailModal = document.getElementById('tenantDetailModal');
                if (tenantDetailModal) {
                    tenantId = tenantDetailModal.getAttribute('data-tenant-id');
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
    
    // Tab switching for tenant detail modal
    const tenantTabButtons = document.querySelectorAll('#tenantDetailModal .tab-btn');
    tenantTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and tab contents in tenant detail modal
            document.querySelectorAll('#tenantDetailModal .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#tenantDetailModal .tab-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding tab content
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.style.display = 'block';
            }
            
            updateFABsVisibility();
        });
    });
    
    // Close tenant detail modal
    const closeTenantDetailModalBtn = document.getElementById('closeTenantDetailModal');
    if (closeTenantDetailModalBtn) {
        closeTenantDetailModalBtn.addEventListener('click', function() {
            window.backToTenants();
        });
    }
    
    // Close modal when clicking outside
    const tenantDetailModal = document.getElementById('tenantDetailModal');
    if (tenantDetailModal) {
        tenantDetailModal.addEventListener('click', function(e) {
            if (e.target === tenantDetailModal) {
                window.backToTenants();
            }
        });
    }
    
    // Update FABs on scroll to ensure they stay visible when scrolling the table
    window.addEventListener('scroll', function() {
        updateFABsVisibility();
    }, { passive: true });
    
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
    
    updateFABsVisibility();
};

window.backToProperties = function() {
    const propertiesList = document.querySelector('.properties-page-content .section');
    const propertyDetailView = document.getElementById('propertyDetailView');
    
    if (propertiesList) propertiesList.style.display = 'block';
    if (propertyDetailView) propertyDetailView.style.display = 'none';
    
    updateFABsVisibility();
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
            // Refresh unit dropdown in occupancy modal if open
            refreshOccupancyUnitDropdownIfOpen();
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
            // Refresh unit dropdown in occupancy modal if open
            refreshOccupancyUnitDropdownIfOpen();
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
                // Refresh unit dropdown in occupancy modal if open
                refreshOccupancyUnitDropdownIfOpen();
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

window.deleteUnit = async function(unitId) {
    // First, check if there are any occupancies linked to this unit
    const occupanciesSnapshot = await db.collection('occupancies')
        .where('unitId', '==', unitId)
        .get();
    
    const linkedOccupancies = [];
    occupanciesSnapshot.forEach(doc => {
        linkedOccupancies.push({ id: doc.id, ...doc.data() });
    });
    
    // Get tenant names for the warning message
    let warningMessage = 'Are you sure you want to delete this unit?';
    if (linkedOccupancies.length > 0) {
        const tenantIds = [...new Set(linkedOccupancies.map(occ => occ.tenantId))];
        const tenantNames = [];
        
        // Fetch tenant names
        for (const tenantId of tenantIds) {
            try {
                const tenantDoc = await db.collection('tenants').doc(tenantId).get();
                if (tenantDoc.exists) {
                    tenantNames.push(tenantDoc.data().tenantName || 'Unknown Tenant');
                }
            } catch (error) {
                console.error('Error fetching tenant:', error);
            }
        }
        
        warningMessage = `⚠️ WARNING: Deleting this unit will orphan ${linkedOccupancies.length} occupancy record(s) for ${tenantNames.length} tenant(s):\n\n${tenantNames.join(', ')}\n\nThese tenants will be moved to "Orphan Tenants" section. Do you want to proceed?`;
    } else {
        warningMessage += ' This action cannot be undone.';
    }
    
    if (!confirm(warningMessage)) {
        return;
    }
    
    // If there are linked occupancies, remove the unitId from them (orphan them)
    if (linkedOccupancies.length > 0) {
        const batch = db.batch();
        linkedOccupancies.forEach(occ => {
            const occRef = db.collection('occupancies').doc(occ.id);
            batch.update(occRef, {
                unitId: null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        console.log(`Orphaned ${linkedOccupancies.length} occupancy record(s)`);
    }
    
    // Now delete the unit
    db.collection('units').doc(unitId).delete()
        .then(() => {
            console.log('Unit deleted successfully');
            if (currentPropertyIdForDetail) {
                loadBuildingsAndUnitsTable(currentPropertyIdForDetail);
            }
            // Also refresh tenants if on tenants page
            if (document.getElementById('tenantsPage') && document.getElementById('tenantsPage').style.display !== 'none') {
                loadTenants();
            }
            // Refresh unit dropdown in occupancy modal if open
            refreshOccupancyUnitDropdownIfOpen();
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
                loadBuildingsAndUnitsTable(currentPropertyIdForDetail);
            }
            // Refresh unit dropdown in occupancy modal if open
            refreshOccupancyUnitDropdownIfOpen();
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
                    loadBuildingsAndUnitsTable(currentPropertyIdForDetail);
                }
                // Refresh unit dropdown in occupancy modal if open
                refreshOccupancyUnitDropdownIfOpen();
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
            // If viewing property detail, refresh the table
            const propertyDetailView = document.getElementById('propertyDetailView');
            if (propertyDetailView && propertyDetailView.style.display !== 'none') {
                const propertyId = propertyDetailView.getAttribute('data-property-id');
                if (propertyId) {
                    loadBuildingsAndUnitsTable(propertyId);
                }
            }
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
                // If viewing property detail, refresh the table
                const propertyDetailView = document.getElementById('propertyDetailView');
                if (propertyDetailView && propertyDetailView.style.display !== 'none') {
                    const propertyId = propertyDetailView.getAttribute('data-property-id');
                    if (propertyId) {
                        loadBuildingsAndUnitsTable(propertyId);
                    }
                }
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
// Tenant Management - variables moved to top

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

// Load properties for tenant property select dropdown
async function loadPropertiesForTenantPropertySelect() {
    const propertySelect = document.getElementById('tenantPropertyId');
    if (!propertySelect) return Promise.resolve();
    
    // Clear existing options except the first one
    propertySelect.innerHTML = '<option value="">No Property (Orphan Tenant)</option>';
    
    return db.collection('properties').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const property = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = property.name || 'Unnamed Property';
            propertySelect.appendChild(option);
        });
    }).catch((error) => {
        console.error('Error loading properties for tenant property select:', error);
        return Promise.resolve();
    });
}

// Load properties for contact property select dropdown
async function loadPropertiesForContactPropertySelect() {
    const propertySelect = document.getElementById('contactPropertyId');
    if (!propertySelect) return Promise.resolve();
    
    // Clear existing options except the first one
    propertySelect.innerHTML = '<option value="">No Property (Orphan Contact)</option>';
    
    return db.collection('properties').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const property = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = property.name || 'Unnamed Property';
            propertySelect.appendChild(option);
        });
    }).catch((error) => {
        console.error('Error loading properties for contact property select:', error);
        return Promise.resolve();
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
    
    // Load occupancies, buildings, units, and properties to group by building
    // We need to load these even if there are no tenants, to show orphaned units
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
    
    // Map occupancies by unitId to check if units are occupied
    const occupanciesByUnitId = {};
    occupanciesSnapshot.forEach(doc => {
        const occ = doc.data();
        if (occ.unitId && (occ.status === 'Active' || !occ.status)) {
            // Only consider active occupancies (or those without status, assuming active)
            if (!occupanciesByUnitId[occ.unitId]) {
                occupanciesByUnitId[occ.unitId] = [];
            }
            occupanciesByUnitId[occ.unitId].push({ ...occ, id: doc.id });
        }
    });
    
    const buildingsMap = {};
    buildingsSnapshot.forEach(doc => {
        buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    const unitsMap = {};
    unitsSnapshot.forEach(doc => {
        unitsMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Filter units by property if a property filter is selected
    const propertyFilter = selectedPropertyForTenants;
    if (propertyFilter) {
        Object.keys(unitsMap).forEach(unitId => {
            const unit = unitsMap[unitId];
            if (unit.propertyId !== propertyFilter) {
                delete unitsMap[unitId];
            }
        });
    }
    
    // Check if we have any units for the selected property (even if no tenants)
    const hasUnitsForProperty = Object.keys(unitsMap).length > 0;
    
    // If no tenants AND no units for the selected property, show "no tenants" message
    if (Object.keys(filteredTenants).length === 0 && !hasUnitsForProperty) {
        tenantsTable.innerHTML = '<p class="no-tenants-message">No tenants found. Add one to get started.</p>';
        return;
    }
    
    // Group units by building
    const unitsByBuilding = {};
    const unitsWithoutBuilding = [];
    Object.keys(unitsMap).forEach(unitId => {
        const unit = unitsMap[unitId];
        if (unit.buildingId && buildingsMap[unit.buildingId]) {
            if (!unitsByBuilding[unit.buildingId]) {
                unitsByBuilding[unit.buildingId] = [];
            }
            unitsByBuilding[unit.buildingId].push(unit);
        } else {
            // Unit is orphaned (no building or building doesn't exist)
            unitsWithoutBuilding.push(unit);
        }
    });
    
    // Sort units by unitNumber within each building
    Object.keys(unitsByBuilding).forEach(buildingId => {
        unitsByBuilding[buildingId].sort((a, b) => {
            const aNum = a.unitNumber || '';
            const bNum = b.unitNumber || '';
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });
    });
    
    const propertiesMap = {};
    propertiesSnapshot.forEach(doc => {
        propertiesMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Separate moved out tenants from active tenants
    const movedOutTenants = [];
    const activeTenants = {};
    
    Object.keys(filteredTenants).forEach(tenantId => {
        const tenant = filteredTenants[tenantId];
        if (tenant.status === 'Moved Out') {
            const tenantOccupancies = occupanciesMap[tenantId] || [];
            movedOutTenants.push({ tenant, occupancies: tenantOccupancies });
        } else {
            activeTenants[tenantId] = tenant;
        }
    });
    
    // Group active tenants by building
    const tenantsByBuilding = {};
    const tenantsWithoutBuilding = [];
    
    Object.keys(activeTenants).forEach(tenantId => {
        const tenant = activeTenants[tenantId];
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
                    } else {
                        // Unit has no building (orphaned unit) - skip it here, it will be shown in Orphaned Units section
                        return; // Skip this occupancy - it's for an orphaned unit
                    }
                }
                // Note: If unitId is null or unit doesn't exist, it goes to "No Building Assigned"
                // This is for occupancies without valid units, not orphaned units
                
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
    // If no tenants, use default values so orphaned units can still be displayed
    const { maxContacts, maxBrokers } = Object.keys(filteredTenants).length > 0 
        ? await determineMaxContacts(filteredTenants)
        : { maxContacts: 5, maxBrokers: 2 };
    
    // Build HTML with dynamic contact and broker columns
    let html = '';
    
    // Add contact type legend with toggle and send email button
    html += `
        <div class="contact-type-legend" style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; display: flex; gap: 20px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                <div style="font-weight: 600; font-size: 0.75rem; color: #333; margin-right: 10px;">Contact Types:</div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator primary" title="Primary">#1</span>
                    <span style="font-size: 0.7rem;">Primary</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator secondary" title="Secondary">#2</span>
                    <span style="font-size: 0.7rem;">Secondary</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator leasing" title="Leasing">L</span>
                    <span style="font-size: 0.7rem;">Leasing</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator billing" title="Billing">$</span>
                    <span style="font-size: 0.7rem;">Billing</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="contact-type-indicator tenant-rep" title="Tenant Representative">TR</span>
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
    
    // Sort buildings by building number (extract number from building name)
    const sortedBuildingNames = Object.keys(tenantsByBuilding).sort((a, b) => {
        // Extract numeric part from building name (e.g., "Building 1" -> 1, "BLDG 2" -> 2)
        const extractBuildingNumber = (name) => {
            const match = name.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : Infinity; // If no number found, put at end
        };
        
        const numA = extractBuildingNumber(a);
        const numB = extractBuildingNumber(b);
        
        // If both have numbers, sort numerically
        if (numA !== Infinity && numB !== Infinity) {
            return numA - numB;
        }
        
        // If only one has a number, it comes first
        if (numA !== Infinity) return -1;
        if (numB !== Infinity) return 1;
        
        // If neither has a number, sort alphabetically
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    // Render grouped by building (sorted by building number)
    // Only render if we have tenants OR if we have units to show
    if (sortedBuildingNames.length > 0 || unitsWithoutBuilding.length > 0 || Object.keys(unitsByBuilding).length > 0) {
    sortedBuildingNames.forEach(buildingName => {
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
        
        // Sort tenants within this building by their lowest unit number
        const sortedTenants = [...group.tenants].sort((a, b) => {
            const occupanciesA = occupanciesMap[a.tenant.id] || [];
            const occupanciesB = occupanciesMap[b.tenant.id] || [];
            
            // Get unit numbers for tenant A (only units in this building)
            const unitNumbersA = occupanciesA
                .filter(occ => occ.unitId && unitsMap[occ.unitId] && unitsMap[occ.unitId].buildingId === group.building?.id)
                .map(occ => unitsMap[occ.unitId].unitNumber || '')
                .filter(num => num);
            
            // Get unit numbers for tenant B (only units in this building)
            const unitNumbersB = occupanciesB
                .filter(occ => occ.unitId && unitsMap[occ.unitId] && unitsMap[occ.unitId].buildingId === group.building?.id)
                .map(occ => unitsMap[occ.unitId].unitNumber || '')
                .filter(num => num);
            
            // If no unit numbers, sort by tenant name
            if (unitNumbersA.length === 0 && unitNumbersB.length === 0) {
                return (a.tenant.tenantName || '').localeCompare(b.tenant.tenantName || '', undefined, { numeric: true, sensitivity: 'base' });
            }
            if (unitNumbersA.length === 0) return 1;
            if (unitNumbersB.length === 0) return -1;
            
            // Sort by minimum unit number (numeric-aware)
            unitNumbersA.sort((x, y) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }));
            unitNumbersB.sort((x, y) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }));
            
            return unitNumbersA[0].localeCompare(unitNumbersB[0], undefined, { numeric: true, sensitivity: 'base' });
        });
        
        sortedTenants.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant (not just this building)
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies - show all occupancies for this tenant, sorted by unit number
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                // Sort occupancies by unit number (numeric-aware)
                const sortedOccupancies = [...allTenantOccupancies].sort((occA, occB) => {
                    const unitA = occA.unitId && unitsMap[occA.unitId] ? unitsMap[occA.unitId] : null;
                    const unitB = occB.unitId && unitsMap[occB.unitId] ? unitsMap[occB.unitId] : null;
                    
                    // Units without unitId go to end
                    if (!unitA && !unitB) return 0;
                    if (!unitA) return 1;
                    if (!unitB) return -1;
                    
                    // Sort by unit number (numeric-aware)
                    const numA = unitA.unitNumber || '';
                    const numB = unitB.unitNumber || '';
                    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                occupanciesHtml = sortedOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        // Unit was deleted but occupancy still references it
                        return `<span class="occupancy-info" style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
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
                                <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                    <span class="btn-icon">🚪</span>
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
        
        // Add rows for vacant units in this building
        const buildingId = group.building?.id;
        if (buildingId && unitsByBuilding[buildingId] && unitsByBuilding[buildingId].length > 0) {
            unitsByBuilding[buildingId].forEach(unit => {
                const isOccupied = occupanciesByUnitId[unit.id] && occupanciesByUnitId[unit.id].length > 0;
                
                // Only render vacant units as rows
                if (!isOccupied) {
                    // Create empty contact cells
                    const contactCells = [];
                    for (let i = 0; i < maxContacts; i++) {
                        contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"></td>`);
                    }
                    
                    // Create empty broker cells
                    const brokerCells = [];
                    for (let i = 0; i < maxBrokers; i++) {
                        brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"></td>`);
                    }
                    
                    html += `
                        <tr data-unit-id="${unit.id}" data-vacant="true">
                            <td class="tenant-occupancies-cell" style="vertical-align: top;">
                                <span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>
                            </td>
                            <td class="tenant-name-cell" style="vertical-align: top;">
                                <div class="tenant-name-wrapper">
                                    <div class="tenant-name-header">
                                        <span class="tenant-name-text" style="color: #6b7280; font-style: italic;">Vacant</span>
                                    </div>
                                </div>
                            </td>
                            ${contactCells.join('')}
                            ${brokerCells.join('')}
                        </tr>
                    `;
                }
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    }
    
    // Collect tenant IDs from orphaned units for contact loading
    const orphanedUnitTenantIds = new Set();
    if (unitsWithoutBuilding && unitsWithoutBuilding.length > 0) {
        // Sort orphaned units by unit number
        unitsWithoutBuilding.sort((a, b) => {
            const aNum = a.unitNumber || '';
            const bNum = b.unitNumber || '';
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        // Collect tenant IDs while iterating
        unitsWithoutBuilding.forEach(unit => {
            const unitOccupancies = occupanciesByUnitId[unit.id] || [];
            unitOccupancies.forEach(occ => {
                if (occ.tenantId) {
                    orphanedUnitTenantIds.add(occ.tenantId);
                }
            });
        });
        
        // Group tenants by their occupancies in orphaned units
        const tenantsInOrphanedUnits = {};
        const vacantOrphanedUnits = [];
        
        unitsWithoutBuilding.forEach(unit => {
            const unitOccupancies = occupanciesByUnitId[unit.id] || [];
            if (unitOccupancies.length > 0) {
                unitOccupancies.forEach(occ => {
                    const tenantId = occ.tenantId;
                    if (tenantId && filteredTenants[tenantId]) {
                        if (!tenantsInOrphanedUnits[tenantId]) {
                            tenantsInOrphanedUnits[tenantId] = {
                                tenant: filteredTenants[tenantId],
                                occupancies: []
                            };
                        }
                        tenantsInOrphanedUnits[tenantId].occupancies.push(occ);
                    }
                });
            } else {
                vacantOrphanedUnits.push(unit);
            }
        });
        
        // Sort vacant units by unit number
        vacantOrphanedUnits.sort((a, b) => {
            const aNum = a.unitNumber || '';
            const bNum = b.unitNumber || '';
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        html += `
            <div class="building-group">
                <div class="building-group-header">
                    <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Orphaned Units" style="display: none; margin-right: 8px; cursor: pointer;">
                    <span>Orphaned Units${unitsWithoutBuilding.length > 0 ? ` (${unitsWithoutBuilding.length})` : ''}</span>
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
        
        // Sort tenants by their lowest unit number
        const sortedTenants = Object.values(tenantsInOrphanedUnits).sort((a, b) => {
            const occupanciesA = a.occupancies || [];
            const occupanciesB = b.occupancies || [];
            
            const unitNumbersA = occupanciesA
                .filter(occ => occ.unitId && unitsMap[occ.unitId])
                .map(occ => unitsMap[occ.unitId].unitNumber || '')
                .filter(num => num);
            
            const unitNumbersB = occupanciesB
                .filter(occ => occ.unitId && unitsMap[occ.unitId])
                .map(occ => unitsMap[occ.unitId].unitNumber || '')
                .filter(num => num);
            
            if (unitNumbersA.length === 0 && unitNumbersB.length === 0) {
                return (a.tenant.tenantName || '').localeCompare(b.tenant.tenantName || '', undefined, { numeric: true, sensitivity: 'base' });
            }
            if (unitNumbersA.length === 0) return 1;
            if (unitNumbersB.length === 0) return -1;
            
            unitNumbersA.sort((x, y) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }));
            unitNumbersB.sort((x, y) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }));
            
            return unitNumbersA[0].localeCompare(unitNumbersB[0], undefined, { numeric: true, sensitivity: 'base' });
        });
        
        // Render tenants with occupancies in orphaned units
        sortedTenants.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant (not just orphaned units)
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies - show all occupancies for this tenant, sorted by unit number
            let occupanciesHtml = '<span style="color: #999;">No occupancies</span>';
            if (allTenantOccupancies.length > 0) {
                const sortedOccupancies = [...allTenantOccupancies].sort((occA, occB) => {
                    const unitA = occA.unitId && unitsMap[occA.unitId] ? unitsMap[occA.unitId] : null;
                    const unitB = occB.unitId && unitsMap[occB.unitId] ? unitsMap[occB.unitId] : null;
                    
                    if (!unitA && !unitB) return 0;
                    if (!unitA) return 1;
                    if (!unitB) return -1;
                    
                    const numA = unitA.unitNumber || '';
                    const numB = unitB.unitNumber || '';
                    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                const occupancyBadges = sortedOccupancies.map(occ => {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        return `<span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>`;
                    } else if (occ.unitId) {
                        return `<span class="occupancy-info" style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
                    } else {
                        return `<span class="occupancy-info">Property Level</span>`;
                    }
                }).join('');
                
                // Wrap occupancies in a container that allows wrapping
                occupanciesHtml = `<div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 100%;">${occupancyBadges}</div>`;
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"></td>`);
            }
            
            html += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top; padding-right: 20px;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top; padding-left: 20px;">
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
                                <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                    <span class="btn-icon">🚪</span>
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
        
        // Add rows for vacant orphaned units
        vacantOrphanedUnits.forEach(unit => {
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" style="vertical-align: top;"></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" style="vertical-align: top;"></td>`);
            }
            
            html += `
                <tr data-unit-id="${unit.id}" data-vacant="true">
                    <td class="tenant-occupancies-cell" style="vertical-align: top; padding-right: 20px;">
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 100%;">
                            <span class="occupancy-info">Unit ${escapeHtml(unit.unitNumber || 'N/A')}</span>
                        </div>
                    </td>
                    <td class="tenant-name-cell" style="vertical-align: top; padding-left: 20px;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <span class="tenant-name-text" style="color: #6b7280; font-style: italic;">Vacant</span>
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
    
    // Render tenants without building (always show section, even if empty)
    html += `
        <div class="building-group" style="border-left: 3px solid #e65100; margin-top: 30px;">
            <div class="building-group-header" style="background: #fff3e0;">
                <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Orphan Tenants" style="display: none; margin-right: 8px; cursor: pointer;">
                <span style="font-weight: 600; color: #e65100;">⚠️ Orphan Tenants${tenantsWithoutBuilding.length > 0 ? ` (${tenantsWithoutBuilding.length})` : ''}</span>
                <span style="font-size: 0.75rem; color: #666; margin-left: 10px;">Tenants without associated buildings</span>
            </div>
    `;
    
    if (tenantsWithoutBuilding.length > 0) {
        html += `
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
            
            // Occupancies - show all occupancies for this tenant with add/remove buttons
            let occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;"><span style="color: #999; font-size: 0.8rem;">No occupancies</span></div>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;">' + 
                    allTenantOccupancies.map(occ => {
                        let unitDisplay = '';
                        if (occ.unitId && unitsMap[occ.unitId]) {
                            const unit = unitsMap[occ.unitId];
                            unitDisplay = `Unit ${escapeHtml(unit.unitNumber || 'N/A')}`;
                        } else if (occ.unitId) {
                            // Unit was deleted but occupancy still references it
                            unitDisplay = `<span style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
                            // Show unlink button for deleted units
                            return `<div style="display: flex; align-items: center; gap: 4px; padding: 2px 0;">
                                <span class="occupancy-info" style="font-size: 0.8rem; flex: 1;">${unitDisplay}</span>
                                <button class="btn-action btn-secondary" onclick="unlinkDeletedUnit('${occ.id}', '${tenant.id}')" title="Unlink from Deleted Unit" style="padding: 2px 6px; font-size: 0.7rem; min-width: auto; height: 20px;">Unlink</button>
                                <button class="btn-action btn-danger" onclick="removeTenantFromUnit('${occ.id}', '${tenant.id}')" title="Remove" style="padding: 2px 4px; font-size: 0.7rem; min-width: 20px; height: 20px;">×</button>
                            </div>`;
                        } else {
                            unitDisplay = 'Property Level';
                        }
                        return `<div style="display: flex; align-items: center; gap: 4px; padding: 2px 0;">
                            <span class="occupancy-info" style="font-size: 0.8rem; flex: 1;">${unitDisplay}</span>
                            <button class="btn-action btn-danger" onclick="removeTenantFromUnit('${occ.id}', '${tenant.id}')" title="Remove" style="padding: 2px 4px; font-size: 0.7rem; min-width: 20px; height: 20px;">×</button>
                        </div>`;
                    }).join('') + '</div>';
            }
            // Add button to add new occupancy
            occupanciesHtml += '<button class="btn-action btn-view" onclick="addTenantToUnit(\'' + tenant.id + '\')" title="Add to Unit" style="margin-top: 4px; padding: 4px 8px; font-size: 0.75rem; width: 100%;">+ Add to Unit</button>';
            
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
                                <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                    <span class="btn-icon">🚪</span>
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
    } else {
        html += `
            <div style="padding: 20px; text-align: center; color: #999;">
                No orphan tenants found.
            </div>
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
    
    // Collect tenant IDs from orphaned units for contact loading (already collected above)
    // Add tenants from orphaned units to the contacts loading
    const allTenantsForContacts = { ...activeTenants };
    movedOutTenants.forEach(({ tenant }) => {
        allTenantsForContacts[tenant.id] = tenant;
    });
    // Add tenants from orphaned units
    orphanedUnitTenantIds.forEach(tenantId => {
        if (filteredTenants[tenantId] && !allTenantsForContacts[tenantId]) {
            allTenantsForContacts[tenantId] = filteredTenants[tenantId];
        }
    });
    loadContactsForTableView(allTenantsForContacts, maxContacts, maxBrokers);
    
    // Load and display orphan contacts (contacts without tenants)
    await loadOrphanContacts(maxContacts, maxBrokers);
    
    // Load and display moved out tenants section
    await loadMovedOutTenantsSection(movedOutTenants, occupanciesMap, unitsMap, maxContacts, maxBrokers);
}

async function loadOrphanContacts(maxContacts, maxBrokers) {
    try {
        // Get all contacts
        const allContactsSnapshot = await db.collection('tenantContacts').get();
        
        // Get all tenant IDs
        const allTenantsSnapshot = await db.collection('tenants').get();
        const tenantIds = new Set();
        allTenantsSnapshot.forEach(doc => tenantIds.add(doc.id));
        
        // Find orphan contacts (contacts whose tenantId is null, undefined, or doesn't exist)
        const orphanContacts = [];
        allContactsSnapshot.forEach(doc => {
            const contact = doc.data();
            const tenantId = contact.tenantId;
            // Contact is orphan if tenantId is null, undefined, empty string, or doesn't exist in tenants collection
            if (!tenantId || tenantId === '' || !tenantIds.has(tenantId)) {
                orphanContacts.push({ id: doc.id, ...contact });
            }
        });
        
        // Always show the orphan contacts section, even if empty
        // if (orphanContacts.length === 0) {
        //     return; // No orphan contacts
        // }
        
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
        
        // Remove any existing orphan contacts section to prevent duplicates
        const existingOrphanSection = tenantsTable.querySelector('.orphan-contacts-section');
        if (existingOrphanSection) {
            existingOrphanSection.remove();
        }
        
        let orphanHtml = `
            <div class="building-group orphan-contacts-section" style="border-left: 3px solid #f44336; margin-top: 30px;">
                <div class="building-group-header" style="background: #ffebee;">
                    <span style="font-weight: 600; color: #c62828;">⚠️ Orphan Contacts (${orphanContacts.length})</span>
                    <span style="font-size: 0.75rem; color: #666; margin-left: 10px;">Contacts without associated tenants</span>
                </div>
        `;
        
        if (orphanContacts.length === 0) {
            orphanHtml += `
                <div style="padding: 20px; text-align: center; color: #999;">
                    No orphan contacts found.
                </div>
            </div>
            `;
        } else {
            // Simple, clean table structure for orphan contacts
            orphanHtml += `
                <div style="overflow-x: auto;">
                    <table class="orphan-contacts-table">
                        <thead>
                            <tr>
                                <th style="min-width: 150px;">Name</th>
                                <th style="min-width: 200px;">Email</th>
                                <th style="min-width: 140px;">Phone</th>
                                <th style="min-width: 120px;">Title</th>
                                <th style="min-width: 200px;">Notes</th>
                                <th style="min-width: 140px;">Classifications</th>
                                <th style="min-width: 100px; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Combine regular and broker orphans for display
            const allOrphanContacts = [...regularOrphans, ...brokerOrphans];
            
            if (allOrphanContacts.length === 0) {
                orphanHtml += `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px 20px; color: #999; font-size: 0.9rem;">
                            No orphan contacts found.
                        </td>
                    </tr>
                `;
            } else {
                allOrphanContacts.forEach((contact, index) => {
                    const classifications = contact.classifications || [];
                    const classificationBadges = classifications.map(cls => {
                        const clsLower = cls.toLowerCase().replace(/\s+/g, '-');
                        // Map classification to icon
                        let icon = '';
                        if (cls === 'Primary') icon = '#1';
                        else if (cls === 'Secondary') icon = '#2';
                        else if (cls === 'Billing') icon = '$';
                        else if (cls === 'Leasing') icon = 'L';
                        else if (cls === 'Tenant Representative') icon = 'TR';
                        else icon = cls.charAt(0).toUpperCase(); // Fallback to first letter
                        return `<span class="contact-type-indicator ${clsLower}" title="${escapeHtml(cls)}">${icon}</span>`;
                    }).join(' ');
                    
                    orphanHtml += `
                        <tr class="orphan-contact-row">
                            <td style="font-weight: 600; color: #1F2937;">${escapeHtml(contact.contactName || 'Unknown')}</td>
                            <td>
                                ${contact.contactEmail ? `<a href="mailto:${escapeHtml(contact.contactEmail)}" style="color: #2563eb; text-decoration: none; font-size: 0.875rem;">${escapeHtml(contact.contactEmail)}</a>` : '<span style="color: #9ca3af; font-size: 0.875rem;">—</span>'}
                            </td>
                            <td>
                                ${contact.contactPhone ? `<a href="tel:${escapeHtml(contact.contactPhone)}" style="color: #2563eb; text-decoration: none; font-size: 0.875rem;">${escapeHtml(contact.contactPhone)}</a>` : '<span style="color: #9ca3af; font-size: 0.875rem;">—</span>'}
                            </td>
                            <td style="color: #4b5563; font-size: 0.875rem;">${escapeHtml(contact.contactTitle || '') || '<span style="color: #9ca3af;">—</span>'}</td>
                            <td style="color: #6b7280; font-size: 0.875rem; max-width: 200px; word-wrap: break-word;">${escapeHtml(contact.notes || '') || '<span style="color: #9ca3af;">—</span>'}</td>
                            <td>
                                <div class="contact-type-indicators" style="display: flex; gap: 6px; align-items: center; justify-content: flex-start;">
                                    ${classificationBadges || '<span style="color: #9ca3af; font-size: 0.875rem;">—</span>'}
                                </div>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                                    <button class="btn-action btn-edit" onclick="editContact('${contact.id}')" title="Edit Contact">
                                        <span class="btn-icon">✏️</span>
                                    </button>
                                    <button class="btn-action btn-delete" onclick="deleteOrphanContact('${contact.id}')" title="Delete Contact">
                                        <span class="btn-icon">🗑️</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
            
            orphanHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }
        
        tenantsTable.insertAdjacentHTML('beforeend', orphanHtml);
    } catch (error) {
        console.error('Error loading orphan contacts:', error);
    }
}

async function loadMovedOutTenantsSection(movedOutTenants, occupanciesMap, unitsMap, maxContacts, maxBrokers) {
    const tenantsTable = document.getElementById('tenantsTable');
    if (!tenantsTable) return;
    
    // Remove any existing moved out tenants section to prevent duplicates
    const existingMovedOutSection = tenantsTable.querySelector('.moved-out-tenants-section');
    if (existingMovedOutSection) {
        existingMovedOutSection.remove();
    }
    
    // Generate contact column headers
    const contactSubHeaders = [];
    for (let i = 1; i <= maxContacts; i++) {
        contactSubHeaders.push(`<th>Contact ${i}</th>`);
    }
    
    const brokerSubHeaders = [];
    for (let i = 1; i <= maxBrokers; i++) {
        brokerSubHeaders.push(`<th>Broker ${i}</th>`);
    }
    
    let movedOutHtml = `
        <div class="building-group moved-out-tenants-section" style="border-left: 3px solid #9ca3af; margin-top: 30px;">
            <div class="building-group-header" style="background: #f3f4f6;">
                <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Moved Out Tenants" style="display: none; margin-right: 8px; cursor: pointer;">
                <span style="font-weight: 600; color: #6b7280;">🚪 Moved Out Tenants${movedOutTenants.length > 0 ? ` (${movedOutTenants.length})` : ''}</span>
                <span style="font-size: 0.75rem; color: #666; margin-left: 10px;">Tenants who have moved out</span>
            </div>
    `;
    
    if (movedOutTenants.length > 0) {
        movedOutHtml += `
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
        
        movedOutTenants.forEach(({ tenant, occupancies }) => {
            // Get ALL occupancies for this tenant
            const allTenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Occupancies - show all occupancies for this tenant
            let occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;"><span style="color: #999; font-size: 0.8rem;">No occupancies</span></div>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;">' + 
                    allTenantOccupancies.map(occ => {
                        let unitDisplay = '';
                        if (occ.unitId && unitsMap[occ.unitId]) {
                            const unit = unitsMap[occ.unitId];
                            unitDisplay = `Unit ${escapeHtml(unit.unitNumber || 'N/A')}`;
                        } else if (occ.unitId) {
                            // Unit was deleted but occupancy still references it
                            unitDisplay = `<span style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
                        } else {
                            unitDisplay = 'Property Level';
                        }
                        // Show move-out date if available
                        if (occ.moveOutDate) {
                            const moveOut = occ.moveOutDate.toDate ? occ.moveOutDate.toDate() : new Date(occ.moveOutDate);
                            unitDisplay += ` <span style="color: #9ca3af; font-size: 0.7rem;">(Moved out: ${moveOut.toLocaleDateString()})</span>`;
                        }
                        return `<div style="display: flex; align-items: center; gap: 4px; padding: 2px 0;">
                            <span class="occupancy-info" style="font-size: 0.8rem; flex: 1;">${unitDisplay}</span>
                        </div>`;
                    }).join('') + '</div>';
            }
            
            // Create empty contact cells
            const contactCells = [];
            for (let i = 0; i < maxContacts; i++) {
                contactCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="contact" data-tenant-id="${tenant.id}" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            // Create empty broker cells
            const brokerCells = [];
            for (let i = 0; i < maxBrokers; i++) {
                brokerCells.push(`<td class="tenant-contact-cell" data-contact-index="${i}" data-contact-type="broker" data-tenant-id="${tenant.id}" style="vertical-align: top;"><span style="color: #999;">Loading...</span></td>`);
            }
            
            movedOutHtml += `
                <tr data-tenant-id="${tenant.id}">
                    <td class="tenant-occupancies-cell" style="vertical-align: top;">${occupanciesHtml}</td>
                    <td class="tenant-name-cell" style="vertical-align: top;">
                        <div class="tenant-name-wrapper">
                            <div class="tenant-name-header">
                                <input type="checkbox" class="email-select-tenant" data-tenant-id="${tenant.id}" style="display: none; cursor: pointer;">
                                <span class="tenant-name-text" style="color: #9ca3af;">${escapeHtml(tenant.tenantName || 'Unnamed Tenant')}</span>
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
        
        movedOutHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        movedOutHtml += `
            <div style="padding: 20px; text-align: center; color: #999;">
                No moved out tenants found.
            </div>
        </div>
        `;
    }
    
    tenantsTable.insertAdjacentHTML('beforeend', movedOutHtml);
    
    // Load contacts for moved out tenants
    const movedOutTenantsMap = {};
    movedOutTenants.forEach(({ tenant }) => {
        movedOutTenantsMap[tenant.id] = tenant;
    });
    if (Object.keys(movedOutTenantsMap).length > 0) {
        loadContactsForTableView(movedOutTenantsMap, maxContacts, maxBrokers);
    }
    
    // Apply broker visibility toggle to moved out tenants section (default to hidden)
    const showBrokersToggle = document.getElementById('showBrokersToggle');
    const shouldShowBrokers = showBrokersToggle ? showBrokersToggle.checked : false;
    toggleBrokerColumns(shouldShowBrokers);
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
                        // Unit was deleted but occupancy still references it
                        return `<span class="occupancy-info" style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
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
                                <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                    <span class="btn-icon">🚪</span>
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
    
    // Render tenants without building (always show section, even if empty)
    html += `
        <div class="building-group" style="border-left: 3px solid #e65100; margin-top: 30px;">
            <div class="building-group-header" style="background: #fff3e0;">
                <input type="checkbox" class="email-select-building" data-building-id="" data-building-name="Orphan Tenants" style="display: none; margin-right: 8px; cursor: pointer;">
                <span style="font-weight: 600; color: #e65100;">⚠️ Orphan Tenants${tenantsWithoutBuilding.length > 0 ? ` (${tenantsWithoutBuilding.length})` : ''}</span>
                <span style="font-size: 0.75rem; color: #666; margin-left: 10px;">Tenants without associated buildings</span>
            </div>
    `;
    
    if (tenantsWithoutBuilding.length > 0) {
        html += `
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
            
            // Occupancies - show all occupancies for this tenant with add/remove buttons
            let occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;"><span style="color: #999; font-size: 0.8rem;">No occupancies</span></div>';
            if (allTenantOccupancies.length > 0) {
                occupanciesHtml = '<div style="display: flex; flex-direction: column; gap: 4px;">' + 
                    allTenantOccupancies.map(occ => {
                        let unitDisplay = '';
                        if (occ.unitId && unitsMap[occ.unitId]) {
                            const unit = unitsMap[occ.unitId];
                            unitDisplay = `Unit ${escapeHtml(unit.unitNumber || 'N/A')}`;
                        } else if (occ.unitId) {
                            // Unit was deleted but occupancy still references it
                            unitDisplay = `<span style="color: #dc2626; font-style: italic;">Unit (Deleted)</span>`;
                            // Show unlink button for deleted units
                            return `<div style="display: flex; align-items: center; gap: 4px; padding: 2px 0;">
                                <span class="occupancy-info" style="font-size: 0.8rem; flex: 1;">${unitDisplay}</span>
                                <button class="btn-action btn-secondary" onclick="unlinkDeletedUnit('${occ.id}', '${tenant.id}')" title="Unlink from Deleted Unit" style="padding: 2px 6px; font-size: 0.7rem; min-width: auto; height: 20px;">Unlink</button>
                                <button class="btn-action btn-danger" onclick="removeTenantFromUnit('${occ.id}', '${tenant.id}')" title="Remove" style="padding: 2px 4px; font-size: 0.7rem; min-width: 20px; height: 20px;">×</button>
                            </div>`;
                        } else {
                            unitDisplay = 'Property Level';
                        }
                        return `<div style="display: flex; align-items: center; gap: 4px; padding: 2px 0;">
                            <span class="occupancy-info" style="font-size: 0.8rem; flex: 1;">${unitDisplay}</span>
                            <button class="btn-action btn-danger" onclick="removeTenantFromUnit('${occ.id}', '${tenant.id}')" title="Remove" style="padding: 2px 4px; font-size: 0.7rem; min-width: 20px; height: 20px;">×</button>
                        </div>`;
                    }).join('') + '</div>';
            }
            // Add button to add new occupancy
            occupanciesHtml += '<button class="btn-action btn-view" onclick="addTenantToUnit(\'' + tenant.id + '\')" title="Add to Unit" style="margin-top: 4px; padding: 4px 8px; font-size: 0.75rem; width: 100%;">+ Add to Unit</button>';
            
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
                                <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                    <span class="btn-icon">🚪</span>
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
                    
                    // Create type indicator icons
                    let typeIndicators = '<div class="contact-type-indicators">';
                    if (isPrimary) typeIndicators += '<span class="contact-type-indicator primary" title="Primary">#1</span>';
                    if (isSecondary) typeIndicators += '<span class="contact-type-indicator secondary" title="Secondary">#2</span>';
                    if (isLeasing) typeIndicators += '<span class="contact-type-indicator leasing" title="Leasing">L</span>';
                    if (isBilling) typeIndicators += '<span class="contact-type-indicator billing" title="Billing">$</span>';
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
                    
                    // Create type indicator icon for tenant representative
                    let typeIndicators = '<div class="contact-type-indicators">';
                    if (isTenantRepresentative) typeIndicators += '<span class="contact-type-indicator tenant-rep" title="Tenant Representative">TR</span>';
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
    
    // Get all occupancies to check which tenants have occupancies
    const allOccupanciesSnapshot = await db.collection('occupancies').get();
    const tenantIdsWithOccupancies = new Set();
    const tenantIdsInProperty = new Set();
    
    allOccupanciesSnapshot.forEach(doc => {
        const occ = doc.data();
        tenantIdsWithOccupancies.add(occ.tenantId);
        if (occ.propertyId === selectedPropertyForTenants) {
            tenantIdsInProperty.add(occ.tenantId);
        }
    });
    
    // Filter tenants: include tenants in the selected property OR tenants with no occupancies (orphan tenants) that are associated with this property
    const filtered = {};
    Object.keys(tenants).forEach(id => {
        const tenant = tenants[id];
        const hasNoOccupancies = !tenantIdsWithOccupancies.has(id);
        const isInSelectedProperty = tenantIdsInProperty.has(id);
        // Also check if tenant has propertyId matching the selected property
        const isOrphanWithProperty = hasNoOccupancies && tenant.propertyId === selectedPropertyForTenants;
        
        if (isInSelectedProperty || isOrphanWithProperty) {
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
    
    // Load properties for property dropdown
    loadPropertiesForTenantPropertySelect();
    
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
    // First, ensure form is reset and modal is ready
    const tenantForm = document.getElementById('tenantForm');
    if (tenantForm) {
        tenantForm.reset();
    }
    document.getElementById('tenantId').value = '';
    editingTenantId = null;
    
    db.collection('tenants').doc(tenantId).get().then((doc) => {
        if (!doc.exists) {
            console.error('Tenant document does not exist');
            alert('Tenant not found');
            return;
        }
        
        const tenant = doc.data();
        if (!tenant) {
            console.error('Tenant data is null');
            alert('Tenant data not found');
            return;
        }
        
            editingTenantId = tenantId;
            document.getElementById('tenantModalTitle').textContent = 'Edit Tenant';
            document.getElementById('tenantId').value = tenantId;
            
        // IMPORTANT: Get the tenantForm first, then scope all field lookups to it
        // This prevents getting fields from other forms (like ticket form)
        const tenantForm = document.getElementById('tenantForm');
        if (!tenantForm) {
            console.error('Tenant form not found');
            alert('Error: Tenant form not found. Please refresh the page.');
            return;
        }
        
        // Get all field references scoped to tenantForm
        const tenantNameField = tenantForm.querySelector('#tenantName');
        const tenantTypeField = tenantForm.querySelector('#tenantType');
        const tenantStatusField = tenantForm.querySelector('#tenantStatus');
        const tenantMailingAddressField = tenantForm.querySelector('#tenantMailingAddress');
        const tenantNotesField = tenantForm.querySelector('#tenantNotes');
        const tenantPropertyIdField = tenantForm.querySelector('#tenantPropertyId');
        const tenantTaxIdField = tenantForm.querySelector('#tenantTaxId');
        const tenantBusinessTypeField = tenantForm.querySelector('#tenantBusinessType');
        const tenantNumberOfEmployeesField = tenantForm.querySelector('#tenantNumberOfEmployees');
        const tenantWebsiteField = tenantForm.querySelector('#tenantWebsite');
        const tenantDateOfBirthField = tenantForm.querySelector('#tenantDateOfBirth');
        
        // Validate critical fields exist
        if (!tenantNameField) {
            console.error('tenantName field not found in tenantForm');
            alert('Error: Tenant name field not found. Please refresh the page.');
            return;
        }
        
        // Debug: Log what we're about to set
        console.log('Setting tenant name to:', tenant.tenantName);
        console.log('Tenant data:', tenant);
        
        // Set basic fields - DO THIS FIRST, before any async operations
        tenantNameField.value = tenant.tenantName || '';
            if (tenantTypeField) tenantTypeField.value = tenant.tenantType || '';
            if (tenantStatusField) tenantStatusField.value = tenant.status || 'Active';
            if (tenantMailingAddressField) tenantMailingAddressField.value = tenant.mailingAddress || '';
            if (tenantNotesField) tenantNotesField.value = tenant.notes || '';
            
        // Debug: Verify the value was set
        console.log('Tenant name field value after setting:', tenantNameField.value);
        
        // Update field visibility based on tenant type AFTER setting tenant type
            updateTenantTypeFields();
            
        // Set type-specific fields
            if (tenantTaxIdField) tenantTaxIdField.value = tenant.taxId || '';
            if (tenantBusinessTypeField) tenantBusinessTypeField.value = tenant.businessType || '';
            if (tenantNumberOfEmployeesField) tenantNumberOfEmployeesField.value = tenant.numberOfEmployees || '';
            if (tenantWebsiteField) tenantWebsiteField.value = tenant.website || '';
            
            // Residential fields
            if (tenantDateOfBirthField) {
                if (tenant.dateOfBirth) {
                try {
                    const dob = tenant.dateOfBirth.toDate ? tenant.dateOfBirth.toDate() : new Date(tenant.dateOfBirth);
                    tenantDateOfBirthField.value = dob.toISOString().split('T')[0];
                } catch (e) {
                    console.error('Error parsing date of birth:', e);
                    tenantDateOfBirthField.value = '';
                }
                } else {
                    tenantDateOfBirthField.value = '';
                }
            }
        
        // Load and set propertyId (async, but don't wait for it)
        if (tenantPropertyIdField) {
            loadPropertiesForTenantPropertySelect().then(() => {
                if (tenant.propertyId) {
                    tenantPropertyIdField.value = tenant.propertyId;
                }
            }).catch((error) => {
                console.error('Error loading properties for tenant:', error);
            });
            }
            
            // Reset button state
            const submitBtn = document.querySelector('#tenantForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Tenant';
                submitBtn.classList.remove('saving');
            }
            
            // Show modal
            document.getElementById('tenantModal').classList.add('show');
            setTimeout(() => {
                if (tenantNameField) tenantNameField.focus();
            }, 100);
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
    
    const propertyId = tenantForm.querySelector('#tenantPropertyId')?.value || null;
    
    const tenantData = {
        tenantName,
        tenantType,
        status,
        mailingAddress: mailingAddress || null,
        notes: notes || null,
        propertyId: propertyId || null, // Allow null for orphan tenants
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
    const tenantDetailModal = document.getElementById('tenantDetailModal');
    if (tenantDetailModal) {
        tenantDetailModal.setAttribute('data-tenant-id', tenantId);
        db.collection('tenants').doc(tenantId).get().then((doc) => {
            const tenant = doc.data();
            if (tenant) {
                const nameElement = document.getElementById('tenantDetailName');
                if (nameElement) nameElement.textContent = tenant.tenantName || 'Unnamed Tenant';
            }
        });
        loadContacts(tenantId);
        loadOccupancies(tenantId);
        
        // Show modal
        tenantDetailModal.classList.add('show');
        
        // Reset to contacts tab
        document.querySelectorAll('#tenantDetailModal .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#tenantDetailModal .tab-content').forEach(c => {
            c.classList.remove('active');
            c.style.display = 'none';
        });
        const contactsTabBtn = document.querySelector('#tenantDetailModal .tab-btn[data-tab="contacts"]');
        const contactsTab = document.getElementById('contactsTab');
        if (contactsTabBtn) contactsTabBtn.classList.add('active');
        if (contactsTab) {
            contactsTab.classList.add('active');
            contactsTab.style.display = 'block';
        }
    }
    updateFABsVisibility();
};

window.backToTenants = function() {
    const tenantDetailModal = document.getElementById('tenantDetailModal');
    if (tenantDetailModal) {
        tenantDetailModal.classList.remove('show');
    }
    currentTenantIdForDetail = null;
    updateFABsVisibility();
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

window.addContact = async function(tenantId) {
    editingContactId = null;
    document.getElementById('contactModalTitle').textContent = 'Add Contact';
    document.getElementById('contactId').value = '';
    document.getElementById('contactForm').reset();
    
    // Load tenants into dropdown (grouped by building)
    await loadTenantsForContactSelect(tenantId || null);
    
    // Load properties for property dropdown
    await loadPropertiesForContactPropertySelect();
    
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

// Load tenants for contact form dropdown, grouped by building
async function loadTenantsForContactSelect(selectedTenantId = null) {
    const tenantSelect = document.getElementById('contactTenantIdSelect');
    if (!tenantSelect) return;
    
    tenantSelect.innerHTML = '<option value="">No Tenant (Orphan Contact)</option>';
    
    try {
        // Load tenants, occupancies, units, and buildings
        const [tenantsSnapshot, occupanciesSnapshot, unitsSnapshot, buildingsSnapshot] = await Promise.all([
            db.collection('tenants').orderBy('tenantName').get(),
            db.collection('occupancies').get(),
            db.collection('units').get(),
            db.collection('buildings').get()
        ]);
        
        // Build maps
        const occupanciesMap = {};
        occupanciesSnapshot.forEach(doc => {
            const occ = doc.data();
            if (!occupanciesMap[occ.tenantId]) {
                occupanciesMap[occ.tenantId] = [];
            }
            occupanciesMap[occ.tenantId].push({ ...occ, id: doc.id });
        });
        
        const unitsMap = {};
        unitsSnapshot.forEach(doc => {
            unitsMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const buildingsMap = {};
        buildingsSnapshot.forEach(doc => {
            buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Group tenants by building
        const tenantsByBuilding = {};
        const orphanedTenants = [];
        
        tenantsSnapshot.forEach(doc => {
            const tenant = { id: doc.id, ...doc.data() };
            const tenantOccupancies = occupanciesMap[tenant.id] || [];
            
            // Find which building(s) this tenant is in
            const buildingIds = new Set();
            tenantOccupancies.forEach(occ => {
                if (occ.unitId && unitsMap[occ.unitId] && unitsMap[occ.unitId].buildingId) {
                    const buildingId = unitsMap[occ.unitId].buildingId;
                    if (buildingsMap[buildingId]) {
                        buildingIds.add(buildingId);
                    }
                }
            });
            
            if (buildingIds.size === 0) {
                // Orphaned tenant (no building association)
                orphanedTenants.push(tenant);
            } else {
                // Add tenant to each building it's associated with
                buildingIds.forEach(buildingId => {
                    if (!tenantsByBuilding[buildingId]) {
                        tenantsByBuilding[buildingId] = [];
                    }
                    tenantsByBuilding[buildingId].push(tenant);
                });
            }
        });
        
        // Sort buildings by building number (extract number from name)
        const sortedBuildings = Object.keys(buildingsMap)
            .map(id => ({ id, ...buildingsMap[id] }))
            .sort((a, b) => {
                const extractBuildingNumber = (name) => {
                    const match = (name || '').match(/(\d+)/);
                    return match ? parseInt(match[1], 10) : Infinity;
                };
                
                const numA = extractBuildingNumber(a.buildingName);
                const numB = extractBuildingNumber(b.buildingName);
                
                if (numA !== Infinity && numB !== Infinity) {
                    return numA - numB;
                }
                if (numA !== Infinity) return -1;
                if (numB !== Infinity) return 1;
                return (a.buildingName || '').localeCompare(b.buildingName || '', undefined, { numeric: true, sensitivity: 'base' });
            });
        
        // Add building groups
        sortedBuildings.forEach(building => {
            const tenantsInBuilding = tenantsByBuilding[building.id] || [];
            if (tenantsInBuilding.length > 0) {
                // Sort tenants within building alphabetically
                tenantsInBuilding.sort((a, b) => {
                    return (a.tenantName || '').localeCompare(b.tenantName || '', undefined, { numeric: true, sensitivity: 'base' });
                });
                
                const optgroup = document.createElement('optgroup');
                optgroup.label = building.buildingName || `Building ${building.id}`;
                
                tenantsInBuilding.forEach(tenant => {
                    const option = document.createElement('option');
                    option.value = tenant.id;
                    option.textContent = tenant.tenantName || 'Unnamed Tenant';
                    optgroup.appendChild(option);
                });
                
                tenantSelect.appendChild(optgroup);
            }
        });
        
        // Add orphaned tenants group
        if (orphanedTenants.length > 0) {
            orphanedTenants.sort((a, b) => {
                return (a.tenantName || '').localeCompare(b.tenantName || '', undefined, { numeric: true, sensitivity: 'base' });
            });
            
            const orphanOptgroup = document.createElement('optgroup');
            orphanOptgroup.label = '⚠️ Orphaned Tenants';
            
            orphanedTenants.forEach(tenant => {
                const option = document.createElement('option');
                option.value = tenant.id;
                option.textContent = tenant.tenantName || 'Unnamed Tenant';
                orphanOptgroup.appendChild(option);
            });
            
            tenantSelect.appendChild(orphanOptgroup);
        }
        
        // Set selected tenant if provided
        if (selectedTenantId) {
            tenantSelect.value = selectedTenantId;
        }
    } catch (error) {
        console.error('Error loading tenants for contact select:', error);
        // Fallback to simple list if error
        db.collection('tenants')
            .orderBy('tenantName')
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const tenant = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = tenant.tenantName || 'Unnamed Tenant';
                    tenantSelect.appendChild(option);
                });
                
                if (selectedTenantId) {
                    tenantSelect.value = selectedTenantId;
                }
            });
    }
}

window.editContactFromTable = function(contactId, event) {
    if (event) {
        event.stopPropagation();
    }
    editContact(contactId);
};

window.editContact = async function(contactId) {
    db.collection('tenantContacts').doc(contactId).get().then(async (doc) => {
        const contact = doc.data();
        if (contact) {
            editingContactId = contactId;
            document.getElementById('contactModalTitle').textContent = 'Edit Contact';
            document.getElementById('contactId').value = contactId;
            
            // Load tenants and set selected tenant (grouped by building)
            await loadTenantsForContactSelect(contact.tenantId || null);
            
            // Load properties for property dropdown
            await loadPropertiesForContactPropertySelect();
            
            document.getElementById('contactName').value = contact.contactName || '';
            document.getElementById('contactEmail').value = contact.contactEmail || '';
            document.getElementById('contactPhone').value = contact.contactPhone || '';
            document.getElementById('contactTitle').value = contact.contactTitle || '';
            document.getElementById('contactNotes').value = contact.notes || '';
            
            // Set propertyId if it exists
            const contactPropertyIdField = document.getElementById('contactPropertyId');
            if (contactPropertyIdField && contact.propertyId) {
                contactPropertyIdField.value = contact.propertyId;
            }
            
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
    const tenantSelect = document.getElementById('contactTenantIdSelect');
    if (tenantSelect) tenantSelect.value = '';
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
    const tenantId = document.getElementById('contactTenantIdSelect').value || null; // Get from select dropdown
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
    
    // Allow empty tenantId to create orphan contact
    // tenantId can be empty string or null/undefined
    
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
    
    const propertyId = document.getElementById('contactPropertyId')?.value || null;
    
    const contactData = {
        tenantId: tenantId || null, // Allow null for orphan contacts
        propertyId: propertyId || null, // Allow null for orphan contacts
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

// Function to refresh unit dropdown if occupancy modal is open
function refreshOccupancyUnitDropdownIfOpen() {
    const occupancyModal = document.getElementById('occupancyModal');
    const propertySelect = document.getElementById('occupancyPropertyId');
    
    // Only refresh if modal is open and a property is selected
    if (occupancyModal && occupancyModal.classList.contains('show') && propertySelect && propertySelect.value) {
        loadUnitsForOccupancy(propertySelect.value);
    }
}

function loadUnitsForOccupancy(propertyId) {
    const unitSelect = document.getElementById('occupancyUnitId');
    if (!unitSelect) return Promise.resolve();
    
    unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
    
    if (!propertyId) return Promise.resolve();
    
    // Always fetch fresh data from Firestore
    return Promise.all([
        db.collection('units').where('propertyId', '==', propertyId).get(),
        db.collection('buildings').where('propertyId', '==', propertyId).get()
    ]).then(([unitsSnapshot, buildingsSnapshot]) => {
        // Create buildings map
        const buildingsMap = {};
        buildingsSnapshot.forEach((doc) => {
            buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Group units by building
        const unitsByBuilding = {};
        const unitsWithoutBuilding = [];
        
        unitsSnapshot.forEach((doc) => {
            const unit = { id: doc.id, ...doc.data() };
            if (unit.buildingId && buildingsMap[unit.buildingId]) {
                if (!unitsByBuilding[unit.buildingId]) {
                    unitsByBuilding[unit.buildingId] = [];
                }
                unitsByBuilding[unit.buildingId].push(unit);
            } else {
                unitsWithoutBuilding.push(unit);
            }
        });
        
        // Sort buildings by name
        const sortedBuildingIds = Object.keys(unitsByBuilding).sort((a, b) => {
            const buildingA = buildingsMap[a];
            const buildingB = buildingsMap[b];
            const nameA = buildingA.buildingName || buildingA.buildingNumber || '';
            const nameB = buildingB.buildingName || buildingB.buildingNumber || '';
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        // Add units grouped by building
        sortedBuildingIds.forEach((buildingId) => {
            const building = buildingsMap[buildingId];
            const buildingName = building.buildingName || building.buildingNumber || `Building ${buildingId.substring(0, 8)}`;
            const optgroup = document.createElement('optgroup');
            optgroup.label = buildingName;
            
            // Sort units by unit number
            unitsByBuilding[buildingId].sort((a, b) => {
                const numA = a.unitNumber || '';
                const numB = b.unitNumber || '';
                return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
            });
            
            unitsByBuilding[buildingId].forEach((unit) => {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.unitNumber || 'Unnamed Unit';
                optgroup.appendChild(option);
            });
            
            unitSelect.appendChild(optgroup);
        });
        
        // Add units without building (if any)
        if (unitsWithoutBuilding.length > 0) {
            unitsWithoutBuilding.sort((a, b) => {
                const numA = a.unitNumber || '';
                const numB = b.unitNumber || '';
                return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
            });
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'No Building';
            unitsWithoutBuilding.forEach((unit) => {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.unitNumber || 'Unnamed Unit';
                optgroup.appendChild(option);
            });
            unitSelect.appendChild(optgroup);
        }
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
            // Refresh table view
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
            console.error('Error deleting occupancy:', error);
            alert('Error deleting occupancy: ' + error.message);
        });
};

// Add tenant to unit from table view
window.addTenantToUnit = function(tenantId) {
    window.addOccupancy(tenantId);
};

// Remove tenant from unit from table view
window.removeTenantFromUnit = function(occupancyId, tenantId) {
    if (!confirm('Are you sure you want to remove this tenant from the unit?')) {
        return;
    }
    
    db.collection('occupancies').doc(occupancyId).delete()
        .then(() => {
            console.log('Occupancy removed successfully');
            // Refresh table view
            db.collection('tenants').get().then((snapshot) => {
                const tenants = {};
                snapshot.forEach((doc) => {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                });
                renderTenantsList(tenants);
            });
        })
        .catch((error) => {
            console.error('Error removing occupancy:', error);
            alert('Error removing tenant from unit: ' + error.message);
        });
};

// Unlink deleted unit from occupancy
window.unlinkDeletedUnit = function(occupancyId, tenantId) {
    if (!confirm('Unlink this occupancy from the deleted unit? The occupancy will become a property-level occupancy.')) {
        return;
    }
    
    db.collection('occupancies').doc(occupancyId).update({
        unitId: null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            console.log('Occupancy unlinked from deleted unit successfully');
            // Refresh table view
            db.collection('tenants').get().then((snapshot) => {
                const tenants = {};
                snapshot.forEach((doc) => {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                });
                renderTenantsList(tenants);
            });
        })
        .catch((error) => {
            console.error('Error unlinking occupancy:', error);
            alert('Error unlinking occupancy: ' + error.message);
        });
};

// Mark tenant as moved out
window.markTenantAsMovedOut = function(tenantId) {
    // Prompt for move-out date
    const moveOutDateStr = prompt('Enter the move-out date (YYYY-MM-DD) or leave blank for today:', new Date().toISOString().split('T')[0]);
    
    if (moveOutDateStr === null) {
        // User cancelled
        return;
    }
    
    let moveOutDate = null;
    if (moveOutDateStr) {
        try {
            moveOutDate = firebase.firestore.Timestamp.fromDate(new Date(moveOutDateStr));
        } catch (error) {
            alert('Invalid date format. Please use YYYY-MM-DD format.');
            return;
        }
    } else {
        // Default to today
        moveOutDate = firebase.firestore.Timestamp.fromDate(new Date());
    }
    
    // Update tenant status
    db.collection('tenants').doc(tenantId).update({
        status: 'Moved Out',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Update all active occupancies for this tenant
        return db.collection('occupancies')
            .where('tenantId', '==', tenantId)
            .where('status', '==', 'Active')
            .get();
    })
    .then((occupanciesSnapshot) => {
        const updatePromises = [];
        occupanciesSnapshot.forEach((doc) => {
            updatePromises.push(
                db.collection('occupancies').doc(doc.id).update({
                    moveOutDate: moveOutDate,
                    status: 'Past',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
            );
        });
        return Promise.all(updatePromises);
    })
    .then(() => {
        console.log('Tenant marked as moved out and occupancies updated');
        // Refresh table view
        db.collection('tenants').get().then((snapshot) => {
            const tenants = {};
            snapshot.forEach((doc) => {
                tenants[doc.id] = { id: doc.id, ...doc.data() };
            });
            renderTenantsList(tenants);
        });
    })
    .catch((error) => {
        console.error('Error marking tenant as moved out:', error);
        alert('Error marking tenant as moved out: ' + error.message);
    });
};

// Handle tenant occupancy save from edit modal
function handleTenantOccupancySave() {
    const tenantId = document.getElementById('tenantId').value;
    if (!tenantId) {
        alert('Please save the tenant first before assigning units.');
        return;
    }
    
    const propertyId = document.getElementById('tenantEditPropertyId').value;
    if (!propertyId) {
        alert('Please select a property.');
        return;
    }
    
    const unitId = document.getElementById('tenantEditUnitId').value || null;
    const moveInDateStr = document.getElementById('tenantEditMoveInDate').value;
    const moveOutDateStr = document.getElementById('tenantEditMoveOutDate').value;
    const status = document.getElementById('tenantEditOccupancyStatus').value || 'Active';
    const notes = document.getElementById('tenantEditOccupancyNotes').value.trim() || null;
    
    if (!moveInDateStr) {
        alert('Please enter a move-in date.');
        return;
    }
    
    const moveInDate = firebase.firestore.Timestamp.fromDate(new Date(moveInDateStr));
    const moveOutDate = moveOutDateStr ? firebase.firestore.Timestamp.fromDate(new Date(moveOutDateStr)) : null;
    
    // Check if occupancy already exists for this tenant/property/unit combination
    let occupancyQuery = db.collection('occupancies')
        .where('tenantId', '==', tenantId)
        .where('propertyId', '==', propertyId);
    
    if (unitId) {
        occupancyQuery = occupancyQuery.where('unitId', '==', unitId);
    } else {
        occupancyQuery = occupancyQuery.where('unitId', '==', null);
    }
    
    occupancyQuery.get().then((snapshot) => {
        const occupancyData = {
            tenantId,
            propertyId,
            unitId,
            moveInDate,
            moveOutDate,
            status,
            notes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!snapshot.empty) {
            // Update existing occupancy
            const occupancyId = snapshot.docs[0].id;
            occupancyData.createdAt = snapshot.docs[0].data().createdAt || firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('occupancies').doc(occupancyId).update(occupancyData);
        } else {
            // Create new occupancy
            occupancyData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('occupancies').add(occupancyData);
        }
    }).then(() => {
        console.log('Occupancy saved successfully');
        alert('Unit assignment saved successfully!');
        // Refresh table view
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
        console.error('Error saving occupancy:', error);
        alert('Error saving unit assignment: ' + error.message);
    });
}

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
            // Refresh table view
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
                // Refresh table view
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
                console.error('Error creating occupancy:', error);
                alert('Error saving occupancy: ' + error.message);
                resetButtonState();
            });
    }
}

// ============================================
// LEASE MANAGEMENT
// ============================================

// Helper function to check if a lease is deleted
function isLeaseDeleted(lease) {
    return lease.deletedAt !== null && lease.deletedAt !== undefined;
}

// Helper function to check if a deleted lease should be permanently removed (older than 30 days)
function shouldPermanentlyRemoveLease(lease) {
    if (!isLeaseDeleted(lease)) return false;
    
    const deletedDate = lease.deletedAt.toDate ? lease.deletedAt.toDate() : new Date(lease.deletedAt);
    const today = new Date();
    const daysSinceDeletion = Math.floor((today - deletedDate) / (1000 * 60 * 60 * 24));
    
    return daysSinceDeletion >= 30;
}

// Load leases from Firestore
async function loadLeases() {
    try {
        const leasesSnapshot = await db.collection('leases').orderBy('leaseStartDate', 'desc').get();
        const leases = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        leasesSnapshot.forEach((doc) => {
            const leaseData = { id: doc.id, ...doc.data() };
            
            // Check if deleted lease should be permanently removed (30+ days old)
            if (shouldPermanentlyRemoveLease(leaseData)) {
                db.collection('leases').doc(doc.id).delete()
                    .then(() => console.log(`Permanently removed lease ${doc.id} (deleted >30 days ago)`))
                    .catch(err => console.error(`Error removing lease ${doc.id}:`, err));
                return; // Skip this lease, it will be deleted
            }
            
            // Calculate days until expiration
            if (leaseData.leaseEndDate) {
                const endDate = leaseData.leaseEndDate.toDate();
                const daysUntilExpiration = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                leaseData.daysUntilExpiration = daysUntilExpiration;
                
                // Only auto-update status if NOT deprecated and NOT auto-renewal
                const isDeprecated = isLeaseDeprecated(leaseData);
                const hasAutoRenewal = leaseData.autoRenewal === true || leaseData.autoRenewal === 'true';
                
                if (!isDeprecated && !hasAutoRenewal) {
                    // Auto-update status if expired (only if no auto-renewal)
                    if (daysUntilExpiration < 0 && leaseData.status === 'Active') {
                        leaseData.status = 'Expired';
                        db.collection('leases').doc(doc.id).update({ status: 'Expired' });
                    } else if (daysUntilExpiration >= 0 && daysUntilExpiration <= 90 && leaseData.status === 'Active') {
                        leaseData.status = 'Expiring Soon';
                        db.collection('leases').doc(doc.id).update({ status: 'Expiring Soon' });
                    }
                } else if (hasAutoRenewal && leaseData.status !== 'Active' && leaseData.status !== 'Expiring Soon') {
                    // If has auto-renewal and status is not Active/Expiring Soon, set to Active
                    if (leaseData.status === 'Expired') {
                        leaseData.status = 'Active';
                        db.collection('leases').doc(doc.id).update({ status: 'Active' });
                    }
                }
            }
            leases[doc.id] = leaseData;
        });
        
        // Load related data
        const [propertiesSnapshot, tenantsSnapshot, unitsSnapshot, buildingsSnapshot, occupanciesSnapshot] = await Promise.all([
            db.collection('properties').get(),
            db.collection('tenants').get(),
            db.collection('units').get(),
            db.collection('buildings').get(),
            db.collection('occupancies').get()
        ]);
        
        const properties = {};
        propertiesSnapshot.forEach((doc) => {
            properties[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const tenants = {};
        tenantsSnapshot.forEach((doc) => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const units = {};
        unitsSnapshot.forEach((doc) => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const buildings = {};
        buildingsSnapshot.forEach((doc) => {
            buildings[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Map occupancies by unitId to determine which tenant is in which unit
        const occupanciesByUnitId = {};
        occupanciesSnapshot.forEach((doc) => {
            const occ = doc.data();
            // Only consider active occupancies
            if (occ.unitId && (occ.status === 'Active' || !occ.status)) {
                if (!occupanciesByUnitId[occ.unitId]) {
                    occupanciesByUnitId[occ.unitId] = [];
                }
                occupanciesByUnitId[occ.unitId].push({ id: doc.id, ...occ });
            }
        });
        
        renderLeasesTableView(leases, properties, tenants, units, buildings, occupanciesByUnitId);
        populateLeaseFilters(properties);
    } catch (error) {
        console.error('Error loading leases:', error);
        alert('Error loading leases: ' + error.message);
    }
}

// Render leases list
function renderLeases(leases, properties, tenants, units) {
    const leasesList = document.getElementById('leasesList');
    if (!leasesList) return;
    
    // Filter by view (current vs previous)
    const filteredLeases = Object.values(leases).filter(lease => {
        if (currentLeaseView === 'current') {
            return ['Active', 'Expiring Soon'].includes(lease.status);
        } else {
            return ['Expired', 'Terminated', 'Renewed'].includes(lease.status);
        }
    });
    
    // Apply additional filters
    const propertyFilter = document.getElementById('leasePropertyFilter')?.value || '';
    const statusFilter = document.getElementById('leaseStatusFilter')?.value || '';
    const searchTerm = (document.getElementById('leaseSearch')?.value || '').toLowerCase();
    
    let displayLeases = filteredLeases.filter(lease => {
        if (propertyFilter && lease.propertyId !== propertyFilter) return false;
        if (statusFilter && lease.status !== statusFilter) return false;
        if (searchTerm) {
            const leaseNumber = (lease.leaseNumber || '').toLowerCase();
            const tenantName = (tenants[lease.tenantId]?.tenantName || '').toLowerCase();
            const propertyName = (properties[lease.propertyId]?.name || '').toLowerCase();
            if (!leaseNumber.includes(searchTerm) && !tenantName.includes(searchTerm) && !propertyName.includes(searchTerm)) {
                return false;
            }
        }
        return true;
    });
    
    if (displayLeases.length === 0) {
        leasesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No leases found.</p>';
        return;
    }
    
    // Create table
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Lease #</th>
                    <th>Tenant</th>
                    <th>Property</th>
                    <th>Unit</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Monthly Rent</th>
                    <th>Status</th>
                    <th>Days Until Expiration</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    displayLeases.forEach(lease => {
        const tenant = tenants[lease.tenantId];
        const property = properties[lease.propertyId];
        const unit = lease.unitId ? units[lease.unitId] : null;
        
        const startDate = lease.leaseStartDate ? lease.leaseStartDate.toDate().toLocaleDateString() : 'N/A';
        const endDate = lease.leaseEndDate ? lease.leaseEndDate.toDate().toLocaleDateString() : 'N/A';
        const daysUntilExpiration = lease.daysUntilExpiration !== undefined ? lease.daysUntilExpiration : 'N/A';
        
        const statusClass = lease.status === 'Active' ? 'status-active' : 
                           lease.status === 'Expiring Soon' ? 'status-warning' : 
                           lease.status === 'Expired' ? 'status-expired' : 'status-inactive';
        
        html += `
            <tr>
                <td>${lease.leaseNumber || lease.id.substring(0, 8)}</td>
                <td>${tenant?.tenantName || 'N/A'}</td>
                <td>${property?.name || 'N/A'}</td>
                <td>${unit?.unitNumber || 'N/A'}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>$${lease.monthlyRent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                <td><span class="status-badge ${statusClass}">${lease.status}</span></td>
                <td>${daysUntilExpiration !== 'N/A' ? (daysUntilExpiration < 0 ? `Expired ${Math.abs(daysUntilExpiration)} days ago` : `${daysUntilExpiration} days`) : 'N/A'}</td>
                <td>
                    <button class="btn-sm btn-primary" onclick="window.openLeaseModal('${lease.id}')">View</button>
                    <button class="btn-sm btn-secondary" onclick="window.openLeaseModal('${lease.id}', true)">Edit</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    leasesList.innerHTML = html;
}

// Populate lease filters
function populateLeaseFilters(properties) {
    const propertyFilter = document.getElementById('leasePropertyFilter');
    if (propertyFilter) {
        propertyFilter.innerHTML = '<option value="">All Properties</option>';
        Object.values(properties).forEach(property => {
            const option = document.createElement('option');
            option.value = property.id;
            option.textContent = property.name;
            propertyFilter.appendChild(option);
        });
    }
}

// Open lease modal - make it globally accessible immediately
window.openLeaseModal = async function(leaseId = null, editMode = false, unitId = null) {
    try {
        editingLeaseId = leaseId;
        leaseDocumentFile = null;
        
        const modal = document.getElementById('leaseModal');
        const form = document.getElementById('leaseForm');
        const title = document.getElementById('leaseModalTitle');
        
        if (!modal || !form || !title) return;
        
        // Reset form
        form.reset();
        document.getElementById('leaseId').value = '';
        
        // Reset drag-and-drop UI
        const dropZoneContent = document.getElementById('leaseDocumentDropZoneContent');
        const fileNameDiv = document.getElementById('leaseDocumentFileName');
        const fileInput = document.getElementById('leaseDocument');
        if (dropZoneContent) dropZoneContent.style.display = 'block';
        if (fileNameDiv) fileNameDiv.style.display = 'none';
        if (fileInput) fileInput.value = '';
        
        // Load properties and tenants for dropdowns
        await populateLeaseFormDropdowns();
        
        if (leaseId) {
            // Load existing lease
            const leaseDoc = await db.collection('leases').doc(leaseId).get();
            if (leaseDoc.exists) {
                const lease = { id: leaseDoc.id, ...leaseDoc.data() };
                populateLeaseForm(lease);
                title.textContent = editMode ? 'Edit Lease' : 'View Lease';
                
                // Display existing lease document if it exists
                if (lease.leaseDocument && lease.leaseDocument.fileUrl) {
                    const dropZoneContent = document.getElementById('leaseDocumentDropZoneContent');
                    const fileNameDiv = document.getElementById('leaseDocumentFileName');
                    const fileNameText = document.getElementById('leaseDocumentFileNameText');
                    
                    if (dropZoneContent) dropZoneContent.style.display = 'none';
                    if (fileNameDiv) {
                        fileNameDiv.style.display = 'block';
                        if (fileNameText) {
                            fileNameText.innerHTML = `
                                <a href="${lease.leaseDocument.fileUrl}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 500;">
                                    ${escapeHtml(lease.leaseDocument.fileName || 'Lease Document')}
                                </a>
                                <span style="color: #999; margin-left: 8px; font-size: 0.85em;">(Click to view)</span>
                            `;
                        }
                    }
                    // Don't clear file input - allow user to replace if needed
                }
            } else {
                alert('Lease not found.');
                closeLeaseModal();
                return;
            }
        } else {
            title.textContent = 'Add Lease';
            // Auto-generate lease number
            const leaseNumberInput = document.getElementById('leaseNumber');
            if (leaseNumberInput) {
                const timestamp = Date.now().toString().slice(-6);
                leaseNumberInput.value = `LEASE-${timestamp}`;
            }
            
            // Pre-populate unit if provided
            if (unitId) {
                const unitDoc = await db.collection('units').doc(unitId).get();
                if (unitDoc.exists) {
                    const unit = unitDoc.data();
                    const propertySelect = document.getElementById('leasePropertyId');
                    const unitSelect = document.getElementById('leaseUnitId');
                    
                    if (propertySelect && unit.propertyId) {
                        propertySelect.value = unit.propertyId;
                        // Trigger change to load units
                        propertySelect.dispatchEvent(new Event('change'));
                        // Wait a bit for units to load, then set unit
                        setTimeout(() => {
                            if (unitSelect) {
                                unitSelect.value = unitId;
                            }
                        }, 300);
                    }
                }
            }
        }
        
        // Show/hide edit fields based on mode
        const formInputs = form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.disabled = !editMode && leaseId !== null;
        });
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const editBtn = document.getElementById('editLeaseBtn');
        
        if (submitBtn) {
            submitBtn.style.display = editMode || !leaseId ? 'block' : 'none';
        }
        
        // Show Edit button when viewing (not editing) an existing lease
        if (editBtn) {
            editBtn.style.display = (!editMode && leaseId !== null) ? 'inline-block' : 'none';
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening lease modal:', error);
        alert('Error opening lease form: ' + error.message);
    }
};

// Populate lease form dropdowns
async function populateLeaseFormDropdowns() {
    // Load tenants grouped by property (via occupancies)
    const [tenantsSnapshot, occupanciesSnapshot, propertiesDataSnapshot] = await Promise.all([
        db.collection('tenants').get(),
        db.collection('occupancies').get(),
        db.collection('properties').get()
    ]);
    
    // Create properties map
    const propertiesMap = {};
    propertiesDataSnapshot.forEach(doc => {
        propertiesMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Create tenants map
    const tenantsMap = {};
    tenantsSnapshot.forEach(doc => {
        tenantsMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    // Group tenants by property via occupancies
    const tenantsByProperty = {};
    const tenantsWithoutProperty = [];
    
    tenantsSnapshot.forEach(doc => {
        const tenant = { id: doc.id, ...doc.data() };
        // Find active occupancies for this tenant
        const tenantOccupancies = [];
        occupanciesSnapshot.forEach(occDoc => {
            const occ = occDoc.data();
            if (occ.tenantId === doc.id && (occ.status === 'Active' || !occ.status)) {
                tenantOccupancies.push(occ);
            }
        });
        
        if (tenantOccupancies.length > 0) {
            // Group by property
            tenantOccupancies.forEach(occ => {
                if (occ.propertyId && propertiesMap[occ.propertyId]) {
                    if (!tenantsByProperty[occ.propertyId]) {
                        tenantsByProperty[occ.propertyId] = [];
                    }
                    // Avoid duplicates
                    if (!tenantsByProperty[occ.propertyId].find(t => t.id === tenant.id)) {
                        tenantsByProperty[occ.propertyId].push(tenant);
                    }
                }
            });
        } else {
            // Tenant has no active occupancies
            tenantsWithoutProperty.push(tenant);
        }
    });
    
    const tenantSelect = document.getElementById('leaseTenantId');
    if (tenantSelect) {
        tenantSelect.innerHTML = '<option value="">Select tenant...</option>';
        
        // Sort properties by name
        const sortedProperties = Object.keys(tenantsByProperty).map(propId => ({
            id: propId,
            ...propertiesMap[propId]
        })).sort((a, b) => {
            const aName = a.name || '';
            const bName = b.name || '';
            return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        // Add tenants grouped by property
        sortedProperties.forEach(property => {
            const propertyTenants = tenantsByProperty[property.id] || [];
            if (propertyTenants.length > 0) {
                // Property optgroup
                const optgroup = document.createElement('optgroup');
                optgroup.label = property.name || `Property ${property.id}`;
                
                // Sort tenants by name
                propertyTenants.sort((a, b) => {
                    const aName = a.tenantName || '';
                    const bName = b.tenantName || '';
                    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                propertyTenants.forEach(tenant => {
                    const option = document.createElement('option');
                    option.value = tenant.id;
                    option.textContent = tenant.tenantName || 'Unnamed Tenant';
                    optgroup.appendChild(option);
                });
                
                tenantSelect.appendChild(optgroup);
            }
        });
        
        // Add tenants without property
        if (tenantsWithoutProperty.length > 0) {
            tenantsWithoutProperty.sort((a, b) => {
                const aName = a.tenantName || '';
                const bName = b.tenantName || '';
                return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
            });
            
            tenantsWithoutProperty.forEach(tenant => {
                const option = document.createElement('option');
                option.value = tenant.id;
                option.textContent = `${tenant.tenantName || 'Unnamed Tenant'} (No Property)`;
                tenantSelect.appendChild(option);
            });
        }
    }
    
    // Load properties
    const propertiesSnapshot = await db.collection('properties').get();
    const propertySelect = document.getElementById('leasePropertyId');
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select property...</option>';
        propertiesSnapshot.forEach(doc => {
            const property = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = property.name;
            propertySelect.appendChild(option);
        });
    }
    
    // Load units when property is selected - grouped by building
    const propertySelectEl = document.getElementById('leasePropertyId');
    if (propertySelectEl) {
        // Remove existing listeners to avoid duplicates
        const newPropertySelectEl = propertySelectEl.cloneNode(true);
        propertySelectEl.parentNode.replaceChild(newPropertySelectEl, propertySelectEl);
        
        newPropertySelectEl.addEventListener('change', async function() {
            const propertyId = this.value;
            const unitSelect = document.getElementById('leaseUnitId');
            if (unitSelect && propertyId) {
                unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
                
                // Load buildings and units for this property
                const [buildingsSnapshot, unitsSnapshot] = await Promise.all([
                    db.collection('buildings').where('propertyId', '==', propertyId).get(),
                    db.collection('units').where('propertyId', '==', propertyId).get()
                ]);
                
                // Create buildings map
                const buildingsMap = {};
                buildingsSnapshot.forEach(doc => {
                    buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
                });
                
                // Group units by building
                const unitsByBuilding = {};
                const unitsWithoutBuilding = [];
                
                unitsSnapshot.forEach(doc => {
                    const unit = { id: doc.id, ...doc.data() };
                    if (unit.buildingId && buildingsMap[unit.buildingId]) {
                        if (!unitsByBuilding[unit.buildingId]) {
                            unitsByBuilding[unit.buildingId] = [];
                        }
                        unitsByBuilding[unit.buildingId].push(unit);
                    } else {
                        unitsWithoutBuilding.push(unit);
                    }
                });
                
                // Sort buildings by name
                const sortedBuildings = Object.values(buildingsMap).sort((a, b) => {
                    const aName = a.buildingName || '';
                    const bName = b.buildingName || '';
                    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
                });
                
                // Add units grouped by building
                sortedBuildings.forEach(building => {
                    const buildingUnits = unitsByBuilding[building.id] || [];
                    if (buildingUnits.length > 0) {
                        // Building optgroup
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = building.buildingName || `Building ${building.id}`;
                        
                        // Sort units by unit number
                        buildingUnits.sort((a, b) => {
                            const aNum = a.unitNumber || '';
                            const bNum = b.unitNumber || '';
                            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
                        });
                        
                        buildingUnits.forEach(unit => {
                            const option = document.createElement('option');
                            option.value = unit.id;
                            option.textContent = unit.unitNumber || 'Unnamed Unit';
                            optgroup.appendChild(option);
                        });
                        
                        unitSelect.appendChild(optgroup);
                    }
                });
                
                // Add units without building
                if (unitsWithoutBuilding.length > 0) {
                    unitsWithoutBuilding.sort((a, b) => {
                        const aNum = a.unitNumber || '';
                        const bNum = b.unitNumber || '';
                        return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
                    });
                    
                    unitsWithoutBuilding.forEach(unit => {
                        const option = document.createElement('option');
                        option.value = unit.id;
                        option.textContent = `${unit.unitNumber || 'Unnamed Unit'} (No Building)`;
                        unitSelect.appendChild(option);
                    });
                }
            } else if (unitSelect) {
                unitSelect.innerHTML = '<option value="">No Unit (Property Level)</option>';
            }
        });
    }
    
    // Calculate lease term/end date when dates or term change
    const startDateInput = document.getElementById('leaseStartDate');
    const endDateInput = document.getElementById('leaseEndDate');
    const termInput = document.getElementById('leaseTerm');
    const termInputField = document.getElementById('leaseTermInput');
    const termUnitSelect = document.getElementById('leaseTermUnit');
    
    if (startDateInput && endDateInput && termInput && termInputField && termUnitSelect) {
        const calculateTermFromDates = () => {
            if (startDateInput.value && endDateInput.value) {
                const start = new Date(startDateInput.value);
                const end = new Date(endDateInput.value);
                const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44));
                termInput.value = months > 0 ? months : 0;
                
                // Update term input field if it's empty
                if (!termInputField.value) {
                    const unit = termUnitSelect.value;
                    if (unit === 'years') {
                        termInputField.value = (months / 12).toFixed(1);
                    } else {
                        termInputField.value = months;
                    }
                }
            }
        };
        
        const calculateEndDateFromTerm = () => {
            if (startDateInput.value && termInputField.value) {
                const start = new Date(startDateInput.value);
                const termValue = parseFloat(termInputField.value) || 0;
                const unit = termUnitSelect.value;
                
                let months = 0;
                if (unit === 'years') {
                    months = Math.round(termValue * 12);
                } else {
                    months = Math.round(termValue);
                }
                
                if (months > 0) {
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + months);
                    // Adjust to last day of month if needed
                    end.setDate(end.getDate() - 1);
                    endDateInput.value = end.toISOString().split('T')[0];
                    termInput.value = months;
                }
            }
        };
        
        startDateInput.addEventListener('change', () => {
            if (endDateInput.value) {
                calculateTermFromDates();
            } else if (termInputField.value) {
                calculateEndDateFromTerm();
            }
        });
        
        endDateInput.addEventListener('change', calculateTermFromDates);
        
        termInputField.addEventListener('input', () => {
            if (termInputField.value && startDateInput.value) {
                calculateEndDateFromTerm();
            }
        });
        
        termUnitSelect.addEventListener('change', () => {
            if (termInputField.value && startDateInput.value) {
                calculateEndDateFromTerm();
            }
        });
    }
    
    // Show/hide CAM charges and commercial features based on lease type
    const leaseTypeSelect = document.getElementById('leaseType');
    const camChargesGroup = document.getElementById('camChargesGroup');
    const commercialFeatures = document.getElementById('commercialLeasingFeatures');
    
    if (leaseTypeSelect) {
        const toggleCommercialFeatures = function(isCommercial) {
            if (camChargesGroup) camChargesGroup.style.display = isCommercial ? 'block' : 'none';
            if (commercialFeatures) commercialFeatures.style.display = isCommercial ? 'block' : 'none';
        };
        
        leaseTypeSelect.addEventListener('change', function() {
            toggleCommercialFeatures(this.value === 'Commercial');
        });
        
        // Set initial state
        toggleCommercialFeatures(leaseTypeSelect.value === 'Commercial');
    }
    
    // Handle escalation type changes
    const escalationTypeSelect = document.getElementById('escalationType');
    if (escalationTypeSelect) {
        escalationTypeSelect.addEventListener('change', function() {
            const type = this.value;
            const amountGroup = document.getElementById('escalationAmountGroup');
            const percentageGroup = document.getElementById('escalationPercentageGroup');
            const frequencyGroup = document.getElementById('escalationFrequencyGroup');
            const firstDateGroup = document.getElementById('firstEscalationDateGroup');
            
            if (type === 'None') {
                if (amountGroup) amountGroup.style.display = 'none';
                if (percentageGroup) percentageGroup.style.display = 'none';
                if (frequencyGroup) frequencyGroup.style.display = 'none';
                if (firstDateGroup) firstDateGroup.style.display = 'none';
            } else {
                if (frequencyGroup) frequencyGroup.style.display = 'block';
                if (firstDateGroup) firstDateGroup.style.display = 'block';
                
                if (type === 'Fixed Amount') {
                    if (amountGroup) amountGroup.style.display = 'block';
                    if (percentageGroup) percentageGroup.style.display = 'none';
                } else if (type === 'Percentage' || type === 'CPI') {
                    if (amountGroup) amountGroup.style.display = 'none';
                    if (percentageGroup) percentageGroup.style.display = 'block';
                }
            }
        });
    }
    
    // Handle extension options checkbox
    const hasExtensionOptionsCheckbox = document.getElementById('hasExtensionOptions');
    const extensionOptionsGroup = document.getElementById('extensionOptionsGroup');
    if (hasExtensionOptionsCheckbox && extensionOptionsGroup) {
        hasExtensionOptionsCheckbox.addEventListener('change', function() {
            extensionOptionsGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Handle extension rent type changes
    const extensionRentTypeSelect = document.getElementById('extensionRentType');
    if (extensionRentTypeSelect) {
        extensionRentTypeSelect.addEventListener('change', function() {
            const type = this.value;
            const amountGroup = document.getElementById('extensionRentAmountGroup');
            const percentageGroup = document.getElementById('extensionRentPercentageGroup');
            
            if (amountGroup) amountGroup.style.display = (type === 'Fixed Amount') ? 'block' : 'none';
            if (percentageGroup) percentageGroup.style.display = (type === 'Percentage Increase') ? 'block' : 'none';
        });
    }
    
    // Handle auto renewal checkbox
    const autoRenewalCheckbox = document.getElementById('autoRenewal');
    const autoRenewalTermGroup = document.getElementById('autoRenewalTermGroup');
    if (autoRenewalCheckbox && autoRenewalTermGroup) {
        autoRenewalCheckbox.addEventListener('change', function() {
            autoRenewalTermGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Setup drag-and-drop for lease document
    setupLeaseDocumentDragDrop();
}

// Setup drag-and-drop for lease document upload
function setupLeaseDocumentDragDrop() {
    const dropZone = document.getElementById('leaseDocumentDropZone');
    const fileInput = document.getElementById('leaseDocument');
    const dropZoneContent = document.getElementById('leaseDocumentDropZoneContent');
    const fileNameDiv = document.getElementById('leaseDocumentFileName');
    const fileNameText = document.getElementById('leaseDocumentFileNameText');
    const removeBtn = document.getElementById('leaseDocumentRemoveBtn');
    
    if (!dropZone || !fileInput) return;
    
    // Handle file selection from input
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleLeaseDocumentFile(file);
        }
    });
    
    // Handle drag and drop
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#667eea';
        dropZone.style.backgroundColor = '#f0f4ff';
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.backgroundColor = '#f9f9f9';
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.backgroundColor = '#f9f9f9';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                handleLeaseDocumentFile(file);
                // Also update the file input
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            } else {
                alert('Please upload a PDF file only.');
            }
        }
    });
    
    // Handle remove button
    if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileInput.value = '';
            leaseDocumentFile = null;
            if (dropZoneContent) dropZoneContent.style.display = 'block';
            if (fileNameDiv) fileNameDiv.style.display = 'none';
        });
    }
    
    // Click on drop zone to trigger file input
    dropZone.addEventListener('click', function(e) {
        if (e.target !== removeBtn && e.target !== fileInput) {
            fileInput.click();
        }
    });
}

// Handle lease document file selection
function handleLeaseDocumentFile(file) {
    const dropZoneContent = document.getElementById('leaseDocumentDropZoneContent');
    const fileNameDiv = document.getElementById('leaseDocumentFileName');
    const fileNameText = document.getElementById('leaseDocumentFileNameText');
    
    if (file) {
        leaseDocumentFile = file;
        if (fileNameText) {
            fileNameText.textContent = file.name;
        }
        if (dropZoneContent) dropZoneContent.style.display = 'none';
        if (fileNameDiv) fileNameDiv.style.display = 'block';
    }
}

// Populate lease form with data
function populateLeaseForm(lease) {
    document.getElementById('leaseId').value = lease.id;
    if (document.getElementById('leaseNumber')) document.getElementById('leaseNumber').value = lease.leaseNumber || '';
    if (document.getElementById('leaseTenantId')) document.getElementById('leaseTenantId').value = lease.tenantId || '';
    if (document.getElementById('leasePropertyId')) document.getElementById('leasePropertyId').value = lease.propertyId || '';
    if (document.getElementById('leaseUnitId')) document.getElementById('leaseUnitId').value = lease.unitId || '';
    if (document.getElementById('leaseType')) document.getElementById('leaseType').value = lease.leaseType || '';
    if (document.getElementById('leaseStatus')) document.getElementById('leaseStatus').value = lease.status || 'Active';
    // Set deprecated toggle and show/hide fields
    const isDeprecatedCheckbox = document.getElementById('isDeprecated');
    const deprecatedDateGroup = document.getElementById('deprecatedDateGroup');
    const deprecatedReasonGroup = document.getElementById('deprecatedReasonGroup');
    
    if (isDeprecatedCheckbox) {
        isDeprecatedCheckbox.checked = lease.isDeprecated || false;
        // Show/hide fields based on toggle state
        if (deprecatedDateGroup) {
            deprecatedDateGroup.style.display = isDeprecatedCheckbox.checked ? 'block' : 'none';
        }
        if (deprecatedReasonGroup) {
            deprecatedReasonGroup.style.display = isDeprecatedCheckbox.checked ? 'block' : 'none';
        }
    }
    
    // Populate deprecated date if it exists (in lease form)
    if (lease.deprecatedDate && document.getElementById('deprecatedDate')) {
        const deprecatedDate = lease.deprecatedDate.toDate ? lease.deprecatedDate.toDate() : new Date(lease.deprecatedDate);
        document.getElementById('deprecatedDate').value = deprecatedDate.toISOString().split('T')[0];
    }
    
    // Populate deprecated reason if it exists (in lease form)
    if (lease.deprecatedReason && document.getElementById('deprecatedReasonInForm')) {
        document.getElementById('deprecatedReasonInForm').value = lease.deprecatedReason;
    }
    
    if (lease.leaseStartDate) {
        const startDate = lease.leaseStartDate.toDate().toISOString().split('T')[0];
        if (document.getElementById('leaseStartDate')) document.getElementById('leaseStartDate').value = startDate;
    }
    if (lease.leaseEndDate) {
        const endDate = lease.leaseEndDate.toDate().toISOString().split('T')[0];
        if (document.getElementById('leaseEndDate')) document.getElementById('leaseEndDate').value = endDate;
    }
    
    if (document.getElementById('leaseTerm')) {
        const term = lease.leaseTerm || '';
        document.getElementById('leaseTerm').value = term;
        
        // Populate term input field if term exists
        if (term && document.getElementById('leaseTermInput')) {
            const termUnitSelect = document.getElementById('leaseTermUnit');
            // Default to months, but allow years if term is large
            if (termUnitSelect) {
                if (term >= 24) {
                    termUnitSelect.value = 'years';
                    document.getElementById('leaseTermInput').value = (term / 12).toFixed(1);
                } else {
                    termUnitSelect.value = 'months';
                    document.getElementById('leaseTermInput').value = term;
                }
            }
        }
    }
    
    if (document.getElementById('autoRenewal')) {
        const autoRenewalCheckbox = document.getElementById('autoRenewal');
        autoRenewalCheckbox.checked = lease.autoRenewal || false;
        // Trigger change to show/hide auto renewal term field
        autoRenewalCheckbox.dispatchEvent(new Event('change'));
        
        // Populate auto renewal term if it exists
        if (lease.autoRenewalTerm) {
            const autoRenewalTermInput = document.getElementById('autoRenewalTerm');
            const autoRenewalTermUnit = document.getElementById('autoRenewalTermUnit');
            if (autoRenewalTermInput && autoRenewalTermUnit) {
                if (lease.autoRenewalTermUnit === 'years') {
                    autoRenewalTermUnit.value = 'years';
                    autoRenewalTermInput.value = (lease.autoRenewalTerm / 12).toFixed(1);
                } else {
                    autoRenewalTermUnit.value = 'months';
                    autoRenewalTermInput.value = lease.autoRenewalTerm;
                }
            }
        }
    }
    
    if (document.getElementById('monthlyRent')) document.getElementById('monthlyRent').value = lease.monthlyRent || '';
    if (document.getElementById('securityDeposit')) document.getElementById('securityDeposit').value = lease.securityDeposit || '';
    
    // Additional charges
    if (lease.additionalMonthlyCharges) {
        if (document.getElementById('utilitiesCharge')) document.getElementById('utilitiesCharge').value = lease.additionalMonthlyCharges.utilities || '';
        if (document.getElementById('parkingCharge')) document.getElementById('parkingCharge').value = lease.additionalMonthlyCharges.parking || '';
        if (document.getElementById('petFeeCharge')) document.getElementById('petFeeCharge').value = lease.additionalMonthlyCharges.petFee || '';
        if (document.getElementById('camCharges')) document.getElementById('camCharges').value = lease.additionalMonthlyCharges.camCharges || '';
    }
    
    if (document.getElementById('specialTerms')) document.getElementById('specialTerms').value = lease.specialTerms || '';
    if (document.getElementById('leaseNotes')) document.getElementById('leaseNotes').value = lease.notes || '';
    
    // Trigger property change to load units, then set unit value after units load
    if (lease.propertyId && document.getElementById('leasePropertyId')) {
        const propertySelect = document.getElementById('leasePropertyId');
        const unitIdToSet = lease.unitId;
        
        // First trigger the property change to load units
        propertySelect.dispatchEvent(new Event('change'));
        
        // Wait for units to load, then set the unit value
        // Use multiple attempts with increasing delays to ensure units are loaded
        if (unitIdToSet) {
            const setUnitValue = (attempt = 1) => {
                const unitSelect = document.getElementById('leaseUnitId');
                if (unitSelect) {
                    // Check if the unit option exists in the dropdown
                    const unitOption = Array.from(unitSelect.options).find(opt => opt.value === unitIdToSet);
                    if (unitOption) {
                        unitSelect.value = unitIdToSet;
                    } else if (attempt < 5) {
                        // Try again with increasing delay
                        setTimeout(() => setUnitValue(attempt + 1), 200 * attempt);
                    }
                }
            };
            
            // Start trying after initial delay
            setTimeout(() => setUnitValue(1), 300);
        }
    } else if (lease.unitId && document.getElementById('leaseUnitId')) {
        // If no property but has unit, try to set it directly
        document.getElementById('leaseUnitId').value = lease.unitId;
    }
    
    // Show CAM charges and commercial features if commercial
    if (lease.leaseType === 'Commercial') {
        if (document.getElementById('camChargesGroup')) document.getElementById('camChargesGroup').style.display = 'block';
        if (document.getElementById('commercialLeasingFeatures')) document.getElementById('commercialLeasingFeatures').style.display = 'block';
        
        // Populate rent escalation
        if (lease.rentEscalation) {
            const esc = lease.rentEscalation;
            if (document.getElementById('escalationType')) document.getElementById('escalationType').value = esc.escalationType || 'None';
            if (document.getElementById('escalationAmount')) document.getElementById('escalationAmount').value = esc.escalationAmount || '';
            if (document.getElementById('escalationPercentage')) document.getElementById('escalationPercentage').value = esc.escalationPercentage || '';
            if (document.getElementById('escalationFrequency')) document.getElementById('escalationFrequency').value = esc.escalationFrequency || '';
            if (esc.firstEscalationDate && document.getElementById('firstEscalationDate')) {
                const firstEscDate = esc.firstEscalationDate.toDate().toISOString().split('T')[0];
                document.getElementById('firstEscalationDate').value = firstEscDate;
            }
            // Trigger change to show/hide fields
            if (document.getElementById('escalationType')) {
                document.getElementById('escalationType').dispatchEvent(new Event('change'));
            }
        }
        
        // Populate extension options
        if (lease.extensionOptions) {
            const ext = lease.extensionOptions;
            if (document.getElementById('hasExtensionOptions')) {
                document.getElementById('hasExtensionOptions').checked = ext.hasExtensionOptions || false;
                document.getElementById('hasExtensionOptions').dispatchEvent(new Event('change'));
            }
            if (document.getElementById('numberOfExtensions')) document.getElementById('numberOfExtensions').value = ext.numberOfExtensions || '';
            
            // Handle extension term length (could be in months or years)
            if (ext.extensionTermLength) {
                const extensionTermInput = document.getElementById('extensionTermLength');
                const extensionTermUnit = document.getElementById('extensionTermUnit');
                if (extensionTermInput && extensionTermUnit) {
                    // Check stored unit or assume months if not specified
                    if (ext.extensionTermUnit === 'years') {
                        extensionTermUnit.value = 'years';
                        extensionTermInput.value = (ext.extensionTermLength / 12).toFixed(1);
                    } else {
                        extensionTermUnit.value = 'months';
                        extensionTermInput.value = ext.extensionTermLength;
                    }
                }
            }
            
            // Handle extension notice period (could be in days or months)
            if (ext.extensionNoticePeriod) {
                const extensionNoticeInput = document.getElementById('extensionNoticePeriod');
                const extensionNoticeUnit = document.getElementById('extensionNoticeUnit');
                if (extensionNoticeInput && extensionNoticeUnit) {
                    // Check stored unit or assume days if not specified
                    if (ext.extensionNoticeUnit === 'months') {
                        extensionNoticeUnit.value = 'months';
                        extensionNoticeInput.value = (ext.extensionNoticePeriod / 30.44).toFixed(1);
                    } else {
                        extensionNoticeUnit.value = 'days';
                        extensionNoticeInput.value = ext.extensionNoticePeriod;
                    }
                }
            }
            
            if (document.getElementById('extensionRentType')) {
                document.getElementById('extensionRentType').value = ext.extensionRentType || '';
                document.getElementById('extensionRentType').dispatchEvent(new Event('change'));
            }
            if (document.getElementById('extensionRentAmount')) document.getElementById('extensionRentAmount').value = ext.extensionRentAmount || '';
            if (document.getElementById('extensionRentPercentage')) document.getElementById('extensionRentPercentage').value = ext.extensionRentPercentage || '';
        }
        
        // Populate additional commercial features
        if (lease.commercialTerms) {
            const terms = lease.commercialTerms;
            if (document.getElementById('baseYear')) document.getElementById('baseYear').value = terms.baseYear || '';
            if (document.getElementById('operatingExpenseCap')) document.getElementById('operatingExpenseCap').value = terms.operatingExpenseCap || '';
            if (document.getElementById('rentAbatementMonths')) document.getElementById('rentAbatementMonths').value = terms.rentAbatementMonths || '';
            if (document.getElementById('rentAbatementAmount')) document.getElementById('rentAbatementAmount').value = terms.rentAbatementAmount || '';
            if (document.getElementById('tenantImprovementAllowance')) document.getElementById('tenantImprovementAllowance').value = terms.tenantImprovementAllowance || '';
            if (document.getElementById('rightOfFirstRefusal')) document.getElementById('rightOfFirstRefusal').checked = terms.rightOfFirstRefusal || false;
            if (document.getElementById('exclusiveUse')) document.getElementById('exclusiveUse').checked = terms.exclusiveUse || false;
            if (document.getElementById('exclusiveUseDescription')) document.getElementById('exclusiveUseDescription').value = terms.exclusiveUseDescription || '';
            if (document.getElementById('percentageRent')) document.getElementById('percentageRent').value = terms.percentageRent || '';
            if (document.getElementById('percentageRentRate')) document.getElementById('percentageRentRate').value = terms.percentageRentRate || '';
        }
    }
}

// Handle lease form submit
async function handleLeaseSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const leaseId = document.getElementById('leaseId').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validate that either end date or term is provided
    const endDateInput = document.getElementById('leaseEndDate');
    const termInput = document.getElementById('leaseTermInput');
    const startDateInput = document.getElementById('leaseStartDate');
    
    if (!startDateInput.value) {
        alert('Please enter a lease start date.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Lease';
        }
        return;
    }
    
    if ((!endDateInput.value || !endDateInput.value.trim()) && (!termInput.value || !termInput.value.trim())) {
        alert('Please enter either a lease end date or a lease term.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Lease';
        }
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }
    
    try {
        const leaseData = {
            leaseNumber: document.getElementById('leaseNumber').value || `LEASE-${Date.now().toString().slice(-6)}`,
            tenantId: document.getElementById('leaseTenantId').value,
            propertyId: document.getElementById('leasePropertyId').value,
            unitId: document.getElementById('leaseUnitId').value || null,
            leaseType: document.getElementById('leaseType').value,
            status: document.getElementById('leaseStatus').value,
            isDeprecated: document.getElementById('isDeprecated').checked || false,
            deprecatedDate: (() => {
                const deprecatedDateInput = document.getElementById('deprecatedDate');
                if (deprecatedDateInput && deprecatedDateInput.value) {
                    return firebase.firestore.Timestamp.fromDate(new Date(deprecatedDateInput.value));
                }
                // If marking as deprecated but no date set, use current date
                if (document.getElementById('isDeprecated') && document.getElementById('isDeprecated').checked) {
                    return firebase.firestore.Timestamp.now();
                }
                return null;
            })(),
            deprecatedReason: (() => {
                const deprecatedReasonInput = document.getElementById('deprecatedReasonInForm');
                return deprecatedReasonInput && deprecatedReasonInput.value ? deprecatedReasonInput.value.trim() : null;
            })(),
            leaseStartDate: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('leaseStartDate').value)),
            leaseEndDate: (() => {
                const endDateInput = document.getElementById('leaseEndDate');
                if (endDateInput && endDateInput.value) {
                    return firebase.firestore.Timestamp.fromDate(new Date(endDateInput.value));
                }
                // Calculate from term if end date not provided
                const startDate = new Date(document.getElementById('leaseStartDate').value);
                const termInput = document.getElementById('leaseTermInput');
                const termUnit = document.getElementById('leaseTermUnit');
                if (termInput && termInput.value) {
                    const termValue = parseFloat(termInput.value) || 0;
                    let months = 0;
                    if (termUnit && termUnit.value === 'years') {
                        months = Math.round(termValue * 12);
                    } else {
                        months = Math.round(termValue);
                    }
                    if (months > 0) {
                        const endDate = new Date(startDate);
                        endDate.setMonth(endDate.getMonth() + months);
                        endDate.setDate(endDate.getDate() - 1);
                        return firebase.firestore.Timestamp.fromDate(endDate);
                    }
                }
                return null;
            })(),
            leaseTerm: parseInt(document.getElementById('leaseTerm').value) || (() => {
                // Calculate term if not set
                const startDateInput = document.getElementById('leaseStartDate');
                const endDateInput = document.getElementById('leaseEndDate');
                const termInput = document.getElementById('leaseTermInput');
                const termUnit = document.getElementById('leaseTermUnit');
                
                if (endDateInput && endDateInput.value && startDateInput && startDateInput.value) {
                    const start = new Date(startDateInput.value);
                    const end = new Date(endDateInput.value);
                    return Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44));
                } else if (termInput && termInput.value) {
                    const termValue = parseFloat(termInput.value) || 0;
                    if (termUnit && termUnit.value === 'years') {
                        return Math.round(termValue * 12);
                    } else {
                        return Math.round(termValue);
                    }
                }
                return 0;
            })(),
            autoRenewal: document.getElementById('autoRenewal').checked || false,
            autoRenewalTerm: (() => {
                if (document.getElementById('autoRenewal').checked) {
                    const termInput = document.getElementById('autoRenewalTerm');
                    const termUnit = document.getElementById('autoRenewalTermUnit');
                    if (termInput && termInput.value && termUnit) {
                        const value = parseFloat(termInput.value);
                        if (termUnit.value === 'years') {
                            return Math.round(value * 12); // Convert to months for storage
                        } else {
                            return Math.round(value);
                        }
                    }
                }
                return null;
            })(),
            autoRenewalTermUnit: document.getElementById('autoRenewal').checked ? (document.getElementById('autoRenewalTermUnit')?.value || 'months') : null,
            monthlyRent: parseFloat(document.getElementById('monthlyRent').value) || 0,
            securityDeposit: parseFloat(document.getElementById('securityDeposit').value) || 0,
            additionalMonthlyCharges: {
                utilities: parseFloat(document.getElementById('utilitiesCharge').value) || null,
                parking: parseFloat(document.getElementById('parkingCharge').value) || null,
                petFee: parseFloat(document.getElementById('petFeeCharge').value) || null,
                camCharges: parseFloat(document.getElementById('camCharges').value) || null
            },
            specialTerms: document.getElementById('specialTerms').value || null,
            notes: document.getElementById('leaseNotes').value || null,
            
            // Commercial leasing features (only if commercial)
            ...(document.getElementById('leaseType').value === 'Commercial' ? {
                rentEscalation: {
                    escalationType: document.getElementById('escalationType').value || 'None',
                    escalationAmount: document.getElementById('escalationAmount').value ? parseFloat(document.getElementById('escalationAmount').value) : null,
                    escalationPercentage: document.getElementById('escalationPercentage').value ? parseFloat(document.getElementById('escalationPercentage').value) : null,
                    escalationFrequency: document.getElementById('escalationFrequency').value || null,
                    firstEscalationDate: document.getElementById('firstEscalationDate').value ? firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('firstEscalationDate').value)) : null
                },
                extensionOptions: {
                    hasExtensionOptions: document.getElementById('hasExtensionOptions').checked || false,
                    numberOfExtensions: document.getElementById('numberOfExtensions').value ? parseInt(document.getElementById('numberOfExtensions').value) : null,
                    extensionTermLength: (() => {
                        const termInput = document.getElementById('extensionTermLength');
                        const termUnit = document.getElementById('extensionTermUnit');
                        if (termInput && termInput.value && termUnit) {
                            const value = parseFloat(termInput.value);
                            if (termUnit.value === 'years') {
                                return Math.round(value * 12); // Convert to months for storage
                            } else {
                                return Math.round(value);
                            }
                        }
                        return null;
                    })(),
                    extensionTermUnit: document.getElementById('extensionTermUnit')?.value || 'months',
                    extensionNoticePeriod: (() => {
                        const noticeInput = document.getElementById('extensionNoticePeriod');
                        const noticeUnit = document.getElementById('extensionNoticeUnit');
                        if (noticeInput && noticeInput.value && noticeUnit) {
                            const value = parseFloat(noticeInput.value);
                            // Store in days for consistency (convert months to days)
                            if (noticeUnit.value === 'months') {
                                return Math.round(value * 30.44); // Convert months to days
                            } else {
                                return Math.round(value);
                            }
                        }
                        return null;
                    })(),
                    extensionNoticeUnit: document.getElementById('extensionNoticeUnit')?.value || 'days',
                    extensionRentType: document.getElementById('extensionRentType').value || null,
                    extensionRentAmount: document.getElementById('extensionRentAmount').value ? parseFloat(document.getElementById('extensionRentAmount').value) : null,
                    extensionRentPercentage: document.getElementById('extensionRentPercentage').value ? parseFloat(document.getElementById('extensionRentPercentage').value) : null
                },
                commercialTerms: {
                    baseYear: document.getElementById('baseYear').value ? parseInt(document.getElementById('baseYear').value) : null,
                    operatingExpenseCap: document.getElementById('operatingExpenseCap').value ? parseFloat(document.getElementById('operatingExpenseCap').value) : null,
                    rentAbatementMonths: document.getElementById('rentAbatementMonths').value ? parseInt(document.getElementById('rentAbatementMonths').value) : null,
                    rentAbatementAmount: document.getElementById('rentAbatementAmount').value ? parseFloat(document.getElementById('rentAbatementAmount').value) : null,
                    tenantImprovementAllowance: document.getElementById('tenantImprovementAllowance').value ? parseFloat(document.getElementById('tenantImprovementAllowance').value) : null,
                    rightOfFirstRefusal: document.getElementById('rightOfFirstRefusal').checked || false,
                    exclusiveUse: document.getElementById('exclusiveUse').checked || false,
                    exclusiveUseDescription: document.getElementById('exclusiveUseDescription').value || null,
                    percentageRent: document.getElementById('percentageRent').value ? parseFloat(document.getElementById('percentageRent').value) : null,
                    percentageRentRate: document.getElementById('percentageRentRate').value ? parseFloat(document.getElementById('percentageRentRate').value) : null
                }
            } : {}),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle document upload if present
        const documentInput = document.getElementById('leaseDocument');
        if (documentInput && documentInput.files.length > 0) {
            const file = documentInput.files[0];
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`leases/${leaseId || Date.now()}/${file.name}`);
            await fileRef.put(file);
            const fileUrl = await fileRef.getDownloadURL();
            leaseData.leaseDocument = {
                fileName: file.name,
                fileUrl: fileUrl,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
        }
        
        if (leaseId) {
            // Update existing lease
            await db.collection('leases').doc(leaseId).update(leaseData);
            console.log('Lease updated successfully');
        } else {
            // Create new lease
            leaseData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('leases').add(leaseData);
            console.log('Lease created successfully');
        }
        
        closeLeaseModal();
        loadLeases();
        
    } catch (error) {
        console.error('Error saving lease:', error);
        alert('Error saving lease: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Lease';
        }
    }
}

// Close lease modal
function closeLeaseModal() {
    const modal = document.getElementById('leaseModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    editingLeaseId = null;
    leaseDocumentFile = null;
    document.getElementById('leaseForm')?.reset();
    
    // Reset drag-and-drop UI
    const dropZoneContent = document.getElementById('leaseDocumentDropZoneContent');
    const fileNameDiv = document.getElementById('leaseDocumentFileName');
    const fileInput = document.getElementById('leaseDocument');
    if (dropZoneContent) dropZoneContent.style.display = 'block';
    if (fileNameDiv) fileNameDiv.style.display = 'none';
    if (fileInput) fileInput.value = '';
}

// Setup lease event listeners
function setupLeaseEventListeners() {
    // Filters
    const propertyFilter = document.getElementById('leasePropertyFilter');
    
    if (propertyFilter) {
        propertyFilter.addEventListener('change', () => loadLeases());
    }
    
    // Add lease button - use window.openLeaseModal to ensure it's accessible
    const addLeaseBtn = document.getElementById('addLeaseBtn');
    if (addLeaseBtn) {
        addLeaseBtn.addEventListener('click', () => {
            if (window.openLeaseModal) {
                window.openLeaseModal();
            } else if (typeof openLeaseModal === 'function') {
                openLeaseModal();
            } else {
                console.error('openLeaseModal is not defined');
                alert('Error: Unable to open lease form. Please refresh the page.');
            }
        });
    } else {
        console.warn('addLeaseBtn not found');
    }
    
    // Lease form
    const leaseForm = document.getElementById('leaseForm');
    if (leaseForm) {
        leaseForm.addEventListener('submit', handleLeaseSubmit);
    }
    
    // Deprecated lease form
    const deprecatedLeaseForm = document.getElementById('deprecatedLeaseForm');
    if (deprecatedLeaseForm) {
        deprecatedLeaseForm.addEventListener('submit', window.handleDeprecatedLeaseSubmit);
    }
    
    // Show/hide deprecated date and reason fields based on toggle
    const isDeprecatedCheckbox = document.getElementById('isDeprecated');
    const deprecatedDateGroup = document.getElementById('deprecatedDateGroup');
    const deprecatedReasonGroup = document.getElementById('deprecatedReasonGroup');
    if (isDeprecatedCheckbox) {
        isDeprecatedCheckbox.addEventListener('change', function() {
            if (deprecatedDateGroup) {
                deprecatedDateGroup.style.display = this.checked ? 'block' : 'none';
            }
            if (deprecatedReasonGroup) {
                deprecatedReasonGroup.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    // Show/hide additional monthly charges based on toggle
    const showAdditionalChargesToggle = document.getElementById('showAdditionalCharges');
    const additionalChargesGroup = document.getElementById('additionalChargesGroup');
    if (showAdditionalChargesToggle && additionalChargesGroup) {
        showAdditionalChargesToggle.addEventListener('change', function() {
            additionalChargesGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Show/hide extension options based on toggle (already exists, but ensure it works)
    const hasExtensionOptionsCheckbox = document.getElementById('hasExtensionOptions');
    const extensionOptionsGroup = document.getElementById('extensionOptionsGroup');
    if (hasExtensionOptionsCheckbox && extensionOptionsGroup) {
        hasExtensionOptionsCheckbox.addEventListener('change', function() {
            extensionOptionsGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Show/hide additional commercial terms based on toggle
    const showCommercialTermsToggle = document.getElementById('showCommercialTerms');
    const commercialTermsGroup = document.getElementById('commercialTermsGroup');
    if (showCommercialTermsToggle && commercialTermsGroup) {
        showCommercialTermsToggle.addEventListener('change', function() {
            commercialTermsGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Close deprecated modal on outside click
    const deprecatedModal = document.getElementById('deprecatedLeaseModal');
    if (deprecatedModal) {
        deprecatedModal.addEventListener('click', function(e) {
            if (e.target === deprecatedModal) {
                closeDeprecatedModal();
            }
        });
    }
    
    // Close modal
    const closeLeaseModalBtn = document.getElementById('closeLeaseModal');
    const cancelLeaseBtn = document.getElementById('cancelLeaseBtn');
    const editLeaseBtn = document.getElementById('editLeaseBtn');
    
    if (closeLeaseModalBtn) {
        closeLeaseModalBtn.addEventListener('click', closeLeaseModal);
    }
    if (cancelLeaseBtn) {
        cancelLeaseBtn.addEventListener('click', closeLeaseModal);
    }
    if (editLeaseBtn) {
        editLeaseBtn.addEventListener('click', function() {
            const leaseId = document.getElementById('leaseId').value;
            if (leaseId) {
                // Switch to edit mode
                openLeaseModal(leaseId, true);
            }
        });
    }
    
    // Tab switching for unit lease detail modal
    const unitLeaseTabButtons = document.querySelectorAll('#unitLeaseDetailModal .tab-btn');
    unitLeaseTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and tab contents
            document.querySelectorAll('#unitLeaseDetailModal .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#unitLeaseDetailModal .tab-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding tab content
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.style.display = 'block';
            }
        });
    });
    
    // Close unit lease detail modal
    const closeUnitLeaseDetailModalBtn = document.getElementById('closeUnitLeaseDetailModal');
    if (closeUnitLeaseDetailModalBtn) {
        closeUnitLeaseDetailModalBtn.addEventListener('click', function() {
            window.backToLeases();
        });
    }
    
    // Close modal when clicking outside
    const unitLeaseDetailModal = document.getElementById('unitLeaseDetailModal');
    if (unitLeaseDetailModal) {
        unitLeaseDetailModal.addEventListener('click', function(e) {
            if (e.target === unitLeaseDetailModal) {
                window.backToLeases();
            }
        });
    }
    
    // Add lease from unit button
    const addLeaseFromUnitBtn = document.getElementById('addLeaseFromUnitBtn');
    if (addLeaseFromUnitBtn) {
        addLeaseFromUnitBtn.addEventListener('click', function() {
            const unitId = unitLeaseDetailModal?.getAttribute('data-unit-id');
            if (unitId) {
                openLeaseModal(null, true, unitId);
            } else {
                openLeaseModal();
            }
        });
    }
}
// ============================================
// NEW LEASE MANAGEMENT FUNCTIONS
// Add these functions to app.js after setupLeaseEventListeners
// ============================================

// Render leases table view grouped by properties/buildings/units
async function renderLeasesTableView(leases, properties, tenants, units, buildings, occupanciesByUnitId = {}) {
    const leasesList = document.getElementById('leasesList');
    const leasesTable = document.getElementById('leasesTable');
    
    if (leasesList) leasesList.style.display = 'none';
    if (leasesTable) leasesTable.style.display = 'block';
    
    if (!leasesTable) return;
    
    // Filter by property if needed
    const propertyFilter = document.getElementById('leasePropertyFilter')?.value || '';
    let filteredProperties = Object.values(properties);
    if (propertyFilter) {
        filteredProperties = filteredProperties.filter(p => p.id === propertyFilter);
    }
    
    // Filter units and buildings by selected property(s)
    const filteredUnits = {};
    const filteredBuildings = {};
    
    if (propertyFilter) {
        // Only show units and buildings for the selected property
        // First, filter buildings by property
        Object.values(buildings).forEach(building => {
            if (building.propertyId === propertyFilter) {
                filteredBuildings[building.id] = building;
            }
        });
        // Then filter units by property
        Object.values(units).forEach(unit => {
            if (unit.propertyId === propertyFilter) {
                filteredUnits[unit.id] = unit;
            }
        });
    } else {
        // Show all units and buildings
        Object.values(buildings).forEach(building => {
            filteredBuildings[building.id] = building;
        });
        Object.values(units).forEach(unit => {
            filteredUnits[unit.id] = unit;
        });
    }
    
    // Group leases by unit and property
    const leasesByUnit = {};
    const leasesByProperty = {};
    
    Object.values(leases).forEach(lease => {
        // Only include leases for filtered properties
        if (!propertyFilter || lease.propertyId === propertyFilter) {
            if (lease.unitId) {
                if (!leasesByUnit[lease.unitId]) {
                    leasesByUnit[lease.unitId] = [];
                }
                leasesByUnit[lease.unitId].push(lease);
            } else if (lease.propertyId) {
                if (!leasesByProperty[lease.propertyId]) {
                    leasesByProperty[lease.propertyId] = [];
                }
                leasesByProperty[lease.propertyId].push(lease);
            }
        }
    });
    
    // Group filtered units by building
    const unitsByBuilding = {};
    const unitsWithoutBuilding = {};
    
    Object.values(filteredUnits).forEach(unit => {
        if (unit.buildingId && filteredBuildings[unit.buildingId]) {
            if (!unitsByBuilding[unit.buildingId]) {
                unitsByBuilding[unit.buildingId] = [];
            }
            unitsByBuilding[unit.buildingId].push(unit);
        } else {
            if (!unitsWithoutBuilding[unit.propertyId]) {
                unitsWithoutBuilding[unit.propertyId] = [];
            }
            unitsWithoutBuilding[unit.propertyId].push(unit);
        }
    });
    
    // Sort buildings (only filtered ones)
    const sortedBuildings = Object.keys(filteredBuildings).map(id => ({ id, ...filteredBuildings[id] })).sort((a, b) => {
        const aName = a.buildingName || '';
        const bName = b.buildingName || '';
        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    // Build HTML
    let html = '<table class="data-table" style="width: 100%;">';
    html += '<thead><tr>';
    html += '<th style="padding: 12px 10px;">Unit / Tenant</th>';
    html += '<th style="padding: 12px 10px;">Active Leases</th>';
    html += '<th style="padding: 12px 10px;">Legacy Leases</th>';
    html += '<th style="padding: 12px 10px;">Actions</th>';
    html += '</tr></thead><tbody>';
    
    // Render by property
    filteredProperties.forEach(property => {
        // Property header row
        html += `<tr class="property-header-row" style="background-color: #f8f9fa; font-weight: bold;">
            <td colspan="4" style="padding: 15px; border-bottom: 2px solid #dee2e6;">
                ${escapeHtml(property.name || 'Unnamed Property')}
            </td>
        </tr>`;
        
        // Buildings for this property - filter by propertyId to ensure buildings belong to this property
        sortedBuildings.filter(building => building.propertyId === property.id).forEach(building => {
            const buildingUnits = unitsByBuilding[building.id] || [];
            if (buildingUnits.length === 0) return;
            
            // Building header row
            html += `<tr class="building-header-row" style="background-color: #f0f4f8; font-weight: 600;">
                <td colspan="4" style="padding: 12px 20px; border-bottom: 1px solid #dee2e6;">
                    ${escapeHtml(building.buildingName || 'Unnamed Building')}
                </td>
            </tr>`;
            
            // Units in this building
            buildingUnits.sort((a, b) => {
                const aNum = a.unitNumber || '';
                const bNum = b.unitNumber || '';
                return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
            }).forEach(unit => {
                const unitLeases = leasesByUnit[unit.id] || [];
                const activeLeases = unitLeases.filter(l => isLeaseActive(l) && !isLeaseDeleted(l));
                const legacyLeases = unitLeases.filter(l => isLeaseDeprecated(l) && !isLeaseDeleted(l));
                
                html += buildUnitLeaseRow(unit, activeLeases, legacyLeases, tenants, occupanciesByUnitId, filteredUnits);
            });
        });
        
        // Units without building for this property
        const propertyUnitsWithoutBuilding = unitsWithoutBuilding[property.id] || [];
        if (propertyUnitsWithoutBuilding.length > 0) {
            propertyUnitsWithoutBuilding.sort((a, b) => {
                const aNum = a.unitNumber || '';
                const bNum = b.unitNumber || '';
                return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
            }).forEach(unit => {
                const unitLeases = leasesByUnit[unit.id] || [];
                const activeLeases = unitLeases.filter(l => isLeaseActive(l) && !isLeaseDeleted(l));
                const legacyLeases = unitLeases.filter(l => isLeaseDeprecated(l) && !isLeaseDeleted(l));
                
                html += buildUnitLeaseRow(unit, activeLeases, legacyLeases, tenants, occupanciesByUnitId, filteredUnits);
            });
        }
        
        // Property-level leases (no unit)
        const propertyLeases = leasesByProperty[property.id] || [];
        if (propertyLeases.length > 0) {
            const activeLeases = propertyLeases.filter(l => isLeaseActive(l) && !isLeaseDeleted(l));
            const legacyLeases = propertyLeases.filter(l => isLeaseDeprecated(l) && !isLeaseDeleted(l));
            
            // Get tenant names for property-level leases
            const propertyActiveTenantNames = activeLeases.map(lease => {
                const tenant = tenants[lease.tenantId];
                return tenant?.tenantName || 'Unknown Tenant';
            });
            
            let propertyLevelDisplay = '';
            if (propertyActiveTenantNames.length > 0) {
                const tenantNamesHtml = propertyActiveTenantNames.map(name => escapeHtml(name)).join(', ');
                propertyLevelDisplay = `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span class="occupancy-info" style="font-size: 0.75rem; color: #4a4a4a; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; display: inline-block; font-weight: 500; white-space: nowrap; margin-bottom: 4px; font-style: italic;">Property Level</span>
                        <div style="font-size: 0.85rem; color: #1a202c; font-weight: 600; line-height: 1.3; word-wrap: break-word;">${tenantNamesHtml}</div>
                    </div>
                `;
            } else {
                propertyLevelDisplay = `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span class="occupancy-info" style="font-size: 0.75rem; color: #4a4a4a; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; display: inline-block; font-weight: 500; white-space: nowrap; margin-bottom: 4px; font-style: italic;">Property Level</span>
                        <div style="font-size: 0.8rem; color: #9ca3af; font-style: italic;">No active leases</div>
                    </div>
                `;
            }
            
            html += `<tr class="property-level-lease-row">
                <td class="tenant-occupancies-cell" style="vertical-align: top; width: 180px; max-width: 180px; padding: 10px 12px; word-wrap: break-word; overflow-wrap: break-word;">${propertyLevelDisplay}</td>
                <td style="padding: 10px; vertical-align: top;">${formatLeaseSummaries(activeLeases, tenants, filteredUnits)}</td>
                <td style="padding: 10px; vertical-align: top;">${formatLeaseSummaries(legacyLeases, tenants, filteredUnits)}</td>
                <td style="padding: 10px; vertical-align: top;">
                    <button class="btn-sm btn-primary" onclick="viewPropertyLeasesDetail('${property.id}')">View</button>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    
    // Add deleted leases section at the bottom
    const allDeletedLeases = Object.values(leases).filter(l => isLeaseDeleted(l) && !shouldPermanentlyRemoveLease(l));
    
    if (allDeletedLeases.length > 0) {
        // Group deleted leases by property
        const deletedLeasesByProperty = {};
        allDeletedLeases.forEach(lease => {
            const propertyId = lease.propertyId;
            if (!deletedLeasesByProperty[propertyId]) {
                deletedLeasesByProperty[propertyId] = [];
            }
            deletedLeasesByProperty[propertyId].push(lease);
        });
        
        html += '<div style="margin-top: 40px; padding-top: 30px; border-top: 3px solid #e5e7eb;">';
        html += '<h3 style="margin-bottom: 20px; color: #666; font-size: 1.2rem;">Deleted Leases</h3>';
        html += '<small style="color: #999; display: block; margin-bottom: 20px;">Leases will be permanently removed after 30 days</small>';
        html += '<table class="data-table" style="width: 100%;">';
        html += '<thead><tr>';
        html += '<th style="padding: 12px 10px;">Unit / Tenant</th>';
        html += '<th style="padding: 12px 10px;">Lease Details</th>';
        html += '<th style="padding: 12px 10px;">Deleted Date</th>';
        html += '<th style="padding: 12px 10px;">Actions</th>';
        html += '</tr></thead><tbody>';
        
        // Render deleted leases by property
        Object.keys(deletedLeasesByProperty).forEach(propertyId => {
            const property = properties[propertyId];
            if (!property) return;
            
            // Property header
            html += `<tr class="property-header-row" style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="4" style="padding: 15px; border-bottom: 2px solid #dee2e6;">
                    ${escapeHtml(property.name || 'Unnamed Property')}
                </td>
            </tr>`;
            
            deletedLeasesByProperty[propertyId].forEach(lease => {
                const tenant = tenants[lease.tenantId];
                const tenantName = tenant ? tenant.tenantName : 'Unknown Tenant';
                const unit = lease.unitId ? units[lease.unitId] : null;
                const unitDisplay = unit ? `Unit ${escapeHtml(unit.unitNumber || 'N/A')}` : 'Property Level';
                
                // Calculate days until permanent removal
                const deletedDate = lease.deletedAt.toDate ? lease.deletedAt.toDate() : new Date(lease.deletedAt);
                const today = new Date();
                const daysSinceDeletion = Math.floor((today - deletedDate) / (1000 * 60 * 60 * 24));
                const daysRemaining = 30 - daysSinceDeletion;
                
                const deletedDateFormatted = deletedDate.toLocaleDateString();
                const daysRemainingText = daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Will be removed soon';
                
                html += `<tr style="opacity: 0.7;">
                    <td style="padding: 10px; vertical-align: top;">
                        <div style="font-weight: 600;">
                            ${escapeHtml(tenantName)}
                            <span style="font-size: 0.7em; font-weight: 400; color: #999; margin-left: 6px;">ID: ${lease.id.substring(0, 8)}</span>
                        </div>
                        <div style="font-size: 0.85em; color: #666;">${unitDisplay}</div>
                    </td>
                    <td style="padding: 10px; vertical-align: top;">
                        <div style="font-size: 0.9em;">
                            <div>Lease #: ${escapeHtml(lease.leaseNumber || lease.id.substring(0, 8))}</div>
                            ${lease.monthlyRent ? `<div>Rent: $${lease.monthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</div>` : ''}
                        </div>
                    </td>
                    <td style="padding: 10px; vertical-align: top;">
                        <div style="font-size: 0.9em;">
                            <div>${deletedDateFormatted}</div>
                            <div style="color: #999; font-size: 0.85em;">${daysRemainingText}</div>
                        </div>
                    </td>
                    <td style="padding: 10px; vertical-align: top;">
                        <button class="btn-sm btn-primary" onclick="window.openLeaseModal('${lease.id}')">View</button>
                    </td>
                </tr>`;
            });
        });
        
        html += '</tbody></table>';
        html += '</div>';
    }
    
    if (filteredProperties.length === 0 && allDeletedLeases.length === 0) {
        leasesTable.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No properties found.</p>';
    } else {
        leasesTable.innerHTML = html;
    }
}

// Helper function to check if a lease is deprecated
function isLeaseDeprecated(lease) {
    return lease.isDeprecated === true || lease.isDeprecated === 'true' || lease.isDeprecated === 1;
}

// Helper function to determine if a lease should be considered active
function isLeaseActive(lease) {
    // If deleted, never active
    if (isLeaseDeleted(lease)) {
        return false;
    }
    
    // If deprecated, never active
    if (isLeaseDeprecated(lease)) {
        return false;
    }
    
    // If explicitly terminated or renewed, not active
    if (lease.status === 'Terminated' || lease.status === 'Renewed') {
        return false;
    }
    
    // If has auto-renewal, always active (even if end date passed)
    if (lease.autoRenewal === true || lease.autoRenewal === 'true') {
        return true;
    }
    
    // If status is explicitly Active or Expiring Soon, it's active
    if (lease.status === 'Active' || lease.status === 'Expiring Soon') {
        return true;
    }
    
    // If status is Expired but no auto-renewal, check if end date has passed
    if (lease.status === 'Expired') {
        // If explicitly marked as expired and no auto-renewal, not active
        return false;
    }
    
    // Default: if no explicit status or status is unclear, consider active (unless deleted or deprecated)
    return true;
}

// Build a unit lease row
function buildUnitLeaseRow(unit, activeLeases, legacyLeases, tenants, occupanciesByUnitId = {}, filteredUnits = {}) {
    // Get tenant names from occupancies (this is the source of truth for which tenant is in which unit)
    const unitOccupancies = occupanciesByUnitId[unit.id] || [];
    const activeTenantNames = unitOccupancies.map(occ => {
        const tenant = tenants[occ.tenantId];
        return tenant?.tenantName || 'Unknown Tenant';
    });
    
    // Build unit display with tenant name(s) - similar to tenant page styling
    let unitDisplay = '';
    const unitNumber = escapeHtml(unit.unitNumber || 'Unnamed Unit');
    
    if (activeTenantNames.length > 0) {
        // Show unit number with tenant name(s) - styled like tenant page
        const tenantNamesHtml = activeTenantNames.map(name => escapeHtml(name)).join(', ');
        unitDisplay = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span class="occupancy-info" style="font-size: 0.75rem; color: #4a4a4a; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; display: inline-block; font-weight: 500; white-space: nowrap; margin-bottom: 4px;">Unit ${unitNumber}</span>
                <div style="font-size: 0.85rem; color: #1a202c; font-weight: 600; line-height: 1.3; word-wrap: break-word;">${tenantNamesHtml}</div>
            </div>
        `;
    } else {
        // No active occupancies - just show unit number with "Vacant"
        unitDisplay = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span class="occupancy-info" style="font-size: 0.75rem; color: #4a4a4a; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; display: inline-block; font-weight: 500; white-space: nowrap; margin-bottom: 4px;">Unit ${unitNumber}</span>
                <div style="font-size: 0.8rem; color: #9ca3af; font-style: italic;">Vacant</div>
            </div>
        `;
    }
    
    return `
        <tr class="unit-lease-row" data-unit-id="${unit.id}">
            <td class="tenant-occupancies-cell" style="vertical-align: top; width: 180px; max-width: 180px; padding: 10px 12px; word-wrap: break-word; overflow-wrap: break-word;">${unitDisplay}</td>
            <td style="padding: 10px; vertical-align: top;">${formatLeaseSummaries(activeLeases, tenants, filteredUnits)}</td>
            <td style="padding: 10px; vertical-align: top;">${formatLeaseSummaries(legacyLeases || [], tenants, filteredUnits)}</td>
            <td style="padding: 10px; vertical-align: top;">
                <button class="btn-sm btn-primary" onclick="viewUnitLeasesDetail('${unit.id}')">View</button>
            </td>
        </tr>
    `;
}

// Calculate current rent based on escalations
function calculateCurrentRent(lease) {
    if (!lease.monthlyRent) return null;
    
    const initialRent = lease.monthlyRent;
    
    // If no escalations, current rent is initial rent
    if (!lease.rentEscalation || !lease.rentEscalation.escalationType || lease.rentEscalation.escalationType === 'None') {
        return initialRent;
    }
    
    // Need lease start date and first escalation date to calculate
    if (!lease.leaseStartDate || !lease.rentEscalation.firstEscalationDate) {
        return initialRent;
    }
    
    const startDate = lease.leaseStartDate.toDate();
    const firstEscDate = lease.rentEscalation.firstEscalationDate.toDate();
    const today = new Date();
    
    // If we haven't reached the first escalation date, return initial rent
    if (today < firstEscDate) {
        return initialRent;
    }
    
    const esc = lease.rentEscalation;
    let currentRent = initialRent;
    
    // Calculate number of escalation periods
    let periods = 0;
    const frequency = esc.escalationFrequency;
    
    if (frequency === 'Monthly') {
        const monthsDiff = (today.getFullYear() - firstEscDate.getFullYear()) * 12 + (today.getMonth() - firstEscDate.getMonth());
        periods = Math.floor(monthsDiff);
    } else if (frequency === 'Quarterly') {
        const monthsDiff = (today.getFullYear() - firstEscDate.getFullYear()) * 12 + (today.getMonth() - firstEscDate.getMonth());
        periods = Math.floor(monthsDiff / 3);
    } else if (frequency === 'Annually') {
        const yearsDiff = today.getFullYear() - firstEscDate.getFullYear();
        if (today.getMonth() > firstEscDate.getMonth() || (today.getMonth() === firstEscDate.getMonth() && today.getDate() >= firstEscDate.getDate())) {
            periods = yearsDiff;
        } else {
            periods = yearsDiff - 1;
        }
    }
    
    // Apply escalations
    if (periods > 0) {
        if (esc.escalationType === 'Fixed Amount' && esc.escalationAmount) {
            currentRent = initialRent + (esc.escalationAmount * periods);
        } else if ((esc.escalationType === 'Percentage' || esc.escalationType === 'CPI') && esc.escalationPercentage) {
            // Compound percentage increase
            const rate = esc.escalationPercentage / 100;
            currentRent = initialRent * Math.pow(1 + rate, periods);
        }
    }
    
    return Math.round(currentRent * 100) / 100; // Round to 2 decimal places
}

// Format lease summaries for display
function formatLeaseSummaries(leases, tenants, units = {}) {
    if (leases.length === 0) {
        return '<span style="color: #999; font-style: italic;">None</span>';
    }
    
    return leases.map(lease => {
        const tenant = tenants[lease.tenantId];
        const tenantName = tenant?.tenantName || 'Unknown Tenant';
        const startDate = lease.leaseStartDate ? lease.leaseStartDate.toDate().toLocaleDateString() : 'N/A';
        const endDate = lease.leaseEndDate ? lease.leaseEndDate.toDate().toLocaleDateString() : 'N/A';
        
        const initialRent = lease.monthlyRent ? lease.monthlyRent : 0;
        const currentRent = calculateCurrentRent(lease);
        const hasEscalation = lease.rentEscalation && lease.rentEscalation.escalationType && lease.rentEscalation.escalationType !== 'None';
        
        const initialRentFormatted = initialRent ? `$${initialRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentRentFormatted = currentRent ? `$${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        const statusClass = lease.status === 'Active' ? 'status-active' : 
                           lease.status === 'Expiring Soon' ? 'status-warning' : 
                           lease.status === 'Expired' ? 'status-expired' : 'status-inactive';
        
        // Calculate annual rent (PPF - Per Year)
        const initialAnnualRent = initialRent ? (initialRent * 12) : 0;
        const currentAnnualRent = currentRent ? (currentRent * 12) : 0;
        const initialAnnualFormatted = initialAnnualRent ? `$${initialAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentAnnualFormatted = currentAnnualRent ? `$${currentAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        // Calculate price per square foot (PPF)
        const unit = lease.unitId ? units[lease.unitId] : null;
        const squareFootage = unit?.squareFootage || null;
        let ppfDisplay = '';
        if (squareFootage && squareFootage > 0) {
            const initialMonthlyPPF = initialRent / squareFootage;
            const initialAnnualPPF = initialMonthlyPPF * 12;
            const currentMonthlyPPF = currentRent ? (currentRent / squareFootage) : null;
            const currentAnnualPPF = currentMonthlyPPF ? (currentMonthlyPPF * 12) : null;
            
            if (hasEscalation && currentRent && currentMonthlyPPF) {
                ppfDisplay = `
                    <div style="font-size: 0.8em; color: #7c3aed; margin-top: 4px;">
                        <div><strong>Initial PPF:</strong> $${initialMonthlyPPF.toFixed(2)}/mo ($${initialAnnualPPF.toFixed(2)}/yr)</div>
                        <div style="font-weight: 600;"><strong>Current PPF:</strong> $${currentMonthlyPPF.toFixed(2)}/mo ($${currentAnnualPPF.toFixed(2)}/yr)</div>
                    </div>
                `;
            } else {
                ppfDisplay = `
                    <div style="font-size: 0.8em; color: #7c3aed; margin-top: 4px;">
                        <div><strong>PPF:</strong> $${initialMonthlyPPF.toFixed(2)}/mo ($${initialAnnualPPF.toFixed(2)}/yr)</div>
                    </div>
                `;
            }
        }
        
        // Show rent display - always show initial and current if escalations exist
        let rentDisplay = '';
        if (hasEscalation && currentRent) {
            // Always show both initial and current rent when escalations are configured
            rentDisplay = `
                <div style="font-size: 0.85em; color: #666; margin-top: 2px;">
                    <div style="margin-bottom: 4px;">
                        <div><strong>Initial:</strong> ${initialRentFormatted}/mo (${initialAnnualFormatted}/yr)</div>
                        <div style="font-weight: 600; color: #1e293b;"><strong>Current:</strong> ${currentRentFormatted}/mo (${currentAnnualFormatted}/yr)</div>
                    </div>
                    ${ppfDisplay}
                </div>
            `;
        } else {
            rentDisplay = `
                <div style="font-size: 0.85em; color: #666; margin-top: 2px;">
                    <div>${initialRentFormatted}/mo (${initialAnnualFormatted}/yr)</div>
                    ${ppfDisplay}
                </div>
            `;
        }
        
        return `
            <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid ${getStatusColor(lease.status)};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">
                            ${escapeHtml(tenantName)}
                            <span style="font-size: 0.7em; font-weight: 400; color: #999; margin-left: 6px;">ID: ${lease.id.substring(0, 8)}</span>
                        </div>
                        <div style="font-size: 0.85em; color: #666;">
                            <span class="status-badge ${statusClass}" style="margin-right: 8px;">${lease.status}</span>
                            ${startDate} - ${endDate}
                        </div>
                        ${rentDisplay}
                    </div>
                    <div style="display: flex; gap: 4px; margin-left: 8px;">
                        <button class="btn-sm btn-primary" onclick="window.openLeaseModal('${lease.id}')" style="font-size: 0.75em; padding: 4px 8px;" title="View">View</button>
                        <button class="btn-sm btn-secondary" onclick="window.openLeaseModal('${lease.id}', true)" style="font-size: 0.75em; padding: 4px 8px;" title="Edit">Edit</button>
                        ${!lease.isDeprecated ? `<button class="btn-sm btn-warning" onclick="window.openDeprecatedModal('${lease.id}')" style="font-size: 0.75em; padding: 4px 8px;" title="Mark as Deprecated/Legacy">Deprecate</button>` : ''}
                        ${!lease.deletedAt ? `<button class="btn-sm btn-danger" onclick="window.deleteLease('${lease.id}')" style="font-size: 0.75em; padding: 4px 8px; margin-left: 4px;" title="Delete Lease">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'Active': return '#10b981';
        case 'Expiring Soon': return '#f59e0b';
        case 'Expired': return '#ef4444';
        case 'Terminated': return '#6b7280';
        case 'Renewed': return '#3b82f6';
        default: return '#6b7280';
    }
}

// Unit Lease Detail View
let currentUnitIdForDetail = null;

window.viewUnitLeasesDetail = async function(unitId) {
    currentUnitIdForDetail = unitId;
    currentPropertyIdForLeaseDetail = null;
    const modal = document.getElementById('unitLeaseDetailModal');
    if (!modal) return;
    
    modal.setAttribute('data-unit-id', unitId);
    modal.removeAttribute('data-property-id');
    
    // Load unit info
    const unitDoc = await db.collection('units').doc(unitId).get();
    if (unitDoc.exists) {
        const unit = unitDoc.data();
        const titleElement = document.getElementById('unitLeaseDetailTitle');
        if (titleElement) {
            titleElement.textContent = `Leases - ${unit.unitNumber || 'Unit'}`;
        }
    }
    
    // Load leases
    loadUnitActiveLeases(unitId);
    loadUnitLegacyLeases(unitId);
    
    // Show modal
    modal.classList.add('show');
    
    // Reset to active leases tab
    document.querySelectorAll('#unitLeaseDetailModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#unitLeaseDetailModal .tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    const activeLeasesTabBtn = document.querySelector('#unitLeaseDetailModal .tab-btn[data-tab="activeLeases"]');
    const activeLeasesTab = document.getElementById('activeLeasesTab');
    if (activeLeasesTabBtn) activeLeasesTabBtn.classList.add('active');
    if (activeLeasesTab) {
        activeLeasesTab.classList.add('active');
        activeLeasesTab.style.display = 'block';
    }
};

window.viewPropertyLeasesDetail = async function(propertyId) {
    const modal = document.getElementById('unitLeaseDetailModal');
    if (!modal) return;
    
    currentPropertyIdForLeaseDetail = propertyId;
    currentUnitIdForDetail = null;
    
    modal.setAttribute('data-property-id', propertyId);
    modal.removeAttribute('data-unit-id');
    
    // Load property info
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (propertyDoc.exists) {
        const property = propertyDoc.data();
        const titleElement = document.getElementById('unitLeaseDetailTitle');
        if (titleElement) {
            titleElement.textContent = `Leases - ${property.name || 'Property'}`;
        }
    }
    
    // Load property-level leases
    loadPropertyActiveLeases(propertyId);
    loadPropertyLegacyLeases(propertyId);
    loadPropertyDeletedLeases(propertyId);
    
    // Show modal
    modal.classList.add('show');
    
    // Reset to active leases tab
    document.querySelectorAll('#unitLeaseDetailModal .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#unitLeaseDetailModal .tab-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    const activeLeasesTabBtn = document.querySelector('#unitLeaseDetailModal .tab-btn[data-tab="activeLeases"]');
    const activeLeasesTab = document.getElementById('activeLeasesTab');
    if (activeLeasesTabBtn) activeLeasesTabBtn.classList.add('active');
    if (activeLeasesTab) {
        activeLeasesTab.classList.add('active');
        activeLeasesTab.style.display = 'block';
    }
};

window.backToLeases = function() {
    const modal = document.getElementById('unitLeaseDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentUnitIdForDetail = null;
    currentPropertyIdForLeaseDetail = null;
};

// Load active leases for a unit
async function loadUnitActiveLeases(unitId) {
    const activeLeasesList = document.getElementById('activeLeasesList');
    if (!activeLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('unitId', '==', unitId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (isLeaseActive(lease) && !isLeaseDeleted(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, activeLeasesList, units);
    } catch (error) {
        console.error('Error loading active leases:', error);
        activeLeasesList.innerHTML = '<p style="color: #e74c3c; padding: 20px;">Error loading leases.</p>';
    }
}

// Load legacy leases for a unit
async function loadUnitLegacyLeases(unitId) {
    const legacyLeasesList = document.getElementById('legacyLeasesList');
    if (!legacyLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('unitId', '==', unitId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (isLeaseDeprecated(lease) && !isLeaseDeleted(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, legacyLeasesList, units);
    } catch (error) {
        console.error('Error loading legacy leases:', error);
        legacyLeasesList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Error loading legacy leases.</p>';
    }
}

// Load deleted leases for a unit
async function loadUnitDeletedLeases(unitId) {
    const deletedLeasesList = document.getElementById('deletedLeasesList');
    if (!deletedLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('unitId', '==', unitId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (isLeaseDeleted(lease) && !shouldPermanentlyRemoveLease(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, deletedLeasesList, units);
    } catch (error) {
        console.error('Error loading deleted leases:', error);
        deletedLeasesList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Error loading deleted leases.</p>';
    }
}

// Load active leases for a property (property-level)
async function loadPropertyActiveLeases(propertyId) {
    const activeLeasesList = document.getElementById('activeLeasesList');
    if (!activeLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('propertyId', '==', propertyId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (!lease.unitId && isLeaseActive(lease) && !isLeaseDeleted(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, activeLeasesList, units);
    } catch (error) {
        console.error('Error loading active leases:', error);
        activeLeasesList.innerHTML = '<p style="color: #e74c3c; padding: 20px;">Error loading leases.</p>';
    }
}

// Load legacy leases for a property (property-level)
async function loadPropertyLegacyLeases(propertyId) {
    const legacyLeasesList = document.getElementById('legacyLeasesList');
    if (!legacyLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('propertyId', '==', propertyId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (isLeaseDeprecated(lease) && !isLeaseDeleted(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, legacyLeasesList, units);
    } catch (error) {
        console.error('Error loading property legacy leases:', error);
        legacyLeasesList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Error loading legacy leases.</p>';
    }
}

// Load deleted leases for a property (property-level)
async function loadPropertyDeletedLeases(propertyId) {
    const deletedLeasesList = document.getElementById('deletedLeasesList');
    if (!deletedLeasesList) return;
    
    try {
        const leasesSnapshot = await db.collection('leases')
            .where('propertyId', '==', propertyId)
            .get();
        
        const leases = [];
        const tenants = {};
        const units = {};
        
        // Load tenants
        const tenantsSnapshot = await db.collection('tenants').get();
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Load units
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            if (isLeaseDeleted(lease) && !shouldPermanentlyRemoveLease(lease)) {
                leases.push(lease);
            }
        });
        
        renderLeaseDetailList(leases, tenants, deletedLeasesList, units);
    } catch (error) {
        console.error('Error loading property deleted leases:', error);
        deletedLeasesList.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Error loading deleted leases.</p>';
    }
}

// Render lease detail list (full details)
function renderLeaseDetailList(leases, tenants, container, units = {}) {
    if (leases.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No leases found.</p>';
        return;
    }
    
    let html = '';
    leases.forEach(lease => {
        const tenant = tenants[lease.tenantId];
        const tenantName = tenant?.tenantName || 'Unknown Tenant';
        const startDate = lease.leaseStartDate ? lease.leaseStartDate.toDate().toLocaleDateString() : 'N/A';
        const endDate = lease.leaseEndDate ? lease.leaseEndDate.toDate().toLocaleDateString() : 'N/A';
        const initialRent = lease.monthlyRent ? lease.monthlyRent : 0;
        const currentRent = calculateCurrentRent(lease);
        const hasEscalation = lease.rentEscalation && lease.rentEscalation.escalationType && lease.rentEscalation.escalationType !== 'None';
        
        const initialRentFormatted = initialRent ? `$${initialRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentRentFormatted = currentRent ? `$${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const deposit = lease.securityDeposit ? `$${lease.securityDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
        const statusClass = lease.status === 'Active' ? 'status-active' : 
                           lease.status === 'Expiring Soon' ? 'status-warning' : 
                           lease.status === 'Expired' ? 'status-expired' : 'status-inactive';
        
        // Calculate annual rent (PPF - Per Year)
        const initialAnnualRent = initialRent ? (initialRent * 12) : 0;
        const currentAnnualRent = currentRent ? (currentRent * 12) : 0;
        const initialAnnualFormatted = initialAnnualRent ? `$${initialAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentAnnualFormatted = currentAnnualRent ? `$${currentAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        // Calculate price per square foot (PPF)
        const unit = lease.unitId ? units[lease.unitId] : null;
        const squareFootage = unit?.squareFootage || null;
        let ppfDisplay = '';
        if (squareFootage && squareFootage > 0) {
            const initialMonthlyPPF = initialRent / squareFootage;
            const initialAnnualPPF = initialMonthlyPPF * 12;
            const currentMonthlyPPF = currentRent ? (currentRent / squareFootage) : null;
            const currentAnnualPPF = currentMonthlyPPF ? (currentMonthlyPPF * 12) : null;
            
            if (hasEscalation && currentRent && currentMonthlyPPF) {
                ppfDisplay = `
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Initial PPF</div>
                        <div style="font-weight: 600; color: #7c3aed;">$${initialMonthlyPPF.toFixed(2)}/mo</div>
                        <div style="font-size: 0.8em; color: #a78bfa;">$${initialAnnualPPF.toFixed(2)}/yr</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Current PPF</div>
                        <div style="font-weight: 600; color: #7c3aed;">$${currentMonthlyPPF.toFixed(2)}/mo</div>
                        <div style="font-size: 0.8em; color: #a78bfa;">$${currentAnnualPPF.toFixed(2)}/yr</div>
                    </div>
                `;
            } else {
                ppfDisplay = `
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Price Per Square Foot</div>
                        <div style="font-weight: 600; color: #7c3aed;">$${initialMonthlyPPF.toFixed(2)}/mo</div>
                        <div style="font-size: 0.8em; color: #a78bfa;">$${initialAnnualPPF.toFixed(2)}/yr</div>
                    </div>
                `;
            }
        }
        
        // Rent display based on escalations - always show both if escalations exist
        let rentDisplay = '';
        if (hasEscalation && currentRent) {
            // Always show both initial and current rent when escalations are configured
            rentDisplay = `
                <div>
                    <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Initial Rent</div>
                    <div style="font-weight: 600;">${initialRentFormatted}/mo</div>
                    <div style="font-size: 0.8em; color: #999;">${initialAnnualFormatted}/yr</div>
                </div>
                <div>
                    <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Current Rent</div>
                    <div style="font-weight: 600; color: #667eea;">${currentRentFormatted}/mo</div>
                    <div style="font-size: 0.8em; color: #999;">${currentAnnualFormatted}/yr</div>
                </div>
                ${ppfDisplay}
            `;
        } else {
            rentDisplay = `
                <div>
                    <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Monthly Rent</div>
                    <div style="font-weight: 600;">${initialRentFormatted}/mo</div>
                    <div style="font-size: 0.8em; color: #999;">${initialAnnualFormatted}/yr</div>
                </div>
                ${ppfDisplay}
            `;
        }
        
        html += `
            <div class="lease-detail-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; color: #1e293b;">
                            ${escapeHtml(tenantName)}
                            <span style="font-size: 0.7em; font-weight: 400; color: #999; margin-left: 6px;">ID: ${lease.id.substring(0, 8)}</span>
                        </h4>
                        <div style="color: #64748b; font-size: 0.9em;">
                            <span class="status-badge ${statusClass}">${lease.status}</span>
                            <span style="margin-left: 10px;">Lease #: ${escapeHtml(lease.leaseNumber || lease.id.substring(0, 8))}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn-sm btn-primary" onclick="window.openLeaseModal('${lease.id}')" style="margin-right: 8px;">View</button>
                        <button class="btn-sm btn-secondary" onclick="window.openLeaseModal('${lease.id}', true)" style="margin-right: 8px;">Edit</button>
                        ${!lease.isDeprecated ? `<button class="btn-sm btn-warning" onclick="window.openDeprecatedModal('${lease.id}')">Deprecate</button>` : ''}
                        ${!lease.deletedAt ? `<button class="btn-sm btn-danger" onclick="window.deleteLease('${lease.id}')" style="margin-left: 8px;">Delete</button>` : ''}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Start Date</div>
                        <div style="font-weight: 600;">${startDate}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">End Date</div>
                        <div style="font-weight: 600;">${endDate}</div>
                    </div>
                    ${rentDisplay}
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Security Deposit</div>
                        <div style="font-weight: 600;">${deposit}</div>
                    </div>
                </div>
                ${lease.specialTerms ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;"><div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Special Terms</div><div>${escapeHtml(lease.specialTerms)}</div></div>` : ''}
                ${lease.notes ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;"><div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Notes</div><div>${escapeHtml(lease.notes)}</div></div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Open deprecated lease modal
window.openDeprecatedModal = function(leaseId) {
    if (!leaseId) {
        alert('Lease ID is required');
        return;
    }
    
    const modal = document.getElementById('deprecatedLeaseModal');
    const form = document.getElementById('deprecatedLeaseForm');
    const leaseIdInput = document.getElementById('deprecatedLeaseId');
    const dateInput = document.getElementById('deprecatedLeaseDate');
    
    if (!modal || !form || !leaseIdInput || !dateInput) return;
    
    // Set lease ID
    leaseIdInput.value = leaseId;
    
    // Set default date to today
    dateInput.value = new Date().toISOString().split('T')[0];
    
    // Clear reason
    const reasonInput = document.getElementById('deprecatedReason');
    if (reasonInput) {
        reasonInput.value = '';
    }
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus on date input
    setTimeout(() => {
        dateInput.focus();
    }, 100);
};

// Close deprecated lease modal
function closeDeprecatedModal() {
    const modal = document.getElementById('deprecatedLeaseModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    // Reset form
    const form = document.getElementById('deprecatedLeaseForm');
    if (form) {
        form.reset();
    }
}

// Delete lease function
window.deleteLease = async function(leaseId) {
    if (!leaseId) {
        alert('Lease ID is required');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this lease? It will be moved to deleted leases and permanently removed after 30 days.')) {
        return;
    }
    
    try {
        await db.collection('leases').doc(leaseId).update({
            deletedAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Lease marked as deleted successfully');
        
        // Refresh leases
        loadLeases();
        
        // If viewing lease detail modal, refresh it
        if (editingLeaseId === leaseId) {
            await window.openLeaseModal(leaseId, false);
        }
        
        // If viewing unit lease detail, refresh it
        if (currentUnitIdForDetail) {
            await window.viewUnitLeasesDetail(currentUnitIdForDetail);
        }
        
        // If viewing property lease detail, refresh it
        if (currentPropertyIdForLeaseDetail) {
            await window.viewPropertyLeasesDetail(currentPropertyIdForLeaseDetail);
        }
        
        alert('Lease has been deleted. It will be permanently removed after 30 days.');
    } catch (error) {
        console.error('Error deleting lease:', error);
        alert('Error deleting lease: ' + error.message);
    }
};

// Handle deprecated lease form submission
window.handleDeprecatedLeaseSubmit = async function(e) {
    e.preventDefault();
    
    const leaseId = document.getElementById('deprecatedLeaseId').value;
    const dateInput = document.getElementById('deprecatedLeaseDate');
    const reasonInput = document.getElementById('deprecatedReason');
    
    if (!leaseId) {
        alert('Lease ID is required');
        return;
    }
    
    if (!dateInput || !dateInput.value) {
        alert('Deprecated date is required');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }
    
    try {
        const deprecatedDate = firebase.firestore.Timestamp.fromDate(new Date(dateInput.value));
        const deprecatedReason = reasonInput ? reasonInput.value.trim() : null;
        
        await db.collection('leases').doc(leaseId).update({
            isDeprecated: true,
            deprecatedDate: deprecatedDate,
            deprecatedReason: deprecatedReason || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Lease marked as deprecated successfully');
        
        // Close modal
        closeDeprecatedModal();
        
        // Refresh leases
        loadLeases();
        
        // If viewing lease detail modal, refresh it
        if (editingLeaseId === leaseId) {
            await window.openLeaseModal(leaseId, false);
        }
        
        // If viewing unit lease detail, refresh it
        if (currentUnitIdForDetail) {
            await window.viewUnitLeasesDetail(currentUnitIdForDetail);
        }
        
        // If viewing property lease detail, refresh it
        if (currentPropertyIdForLeaseDetail) {
            await window.viewPropertyLeasesDetail(currentPropertyIdForLeaseDetail);
        }
        
    } catch (error) {
        console.error('Error marking lease as deprecated:', error);
        alert('Error marking lease as deprecated: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mark as Deprecated';
        }
    }
};

// openLeaseModal is already globally accessible (defined above as window.openLeaseModal)
