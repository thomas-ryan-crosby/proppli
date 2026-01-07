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
    
    if (addTenantBtn) {
        addTenantBtn.addEventListener('click', () => {
            showAddTenantForm();
        });
    }
    if (tenantForm) tenantForm.addEventListener('submit', handleTenantSubmit);
    if (closeTenantModalBtn) closeTenantModalBtn.addEventListener('click', closeTenantModal);
    if (cancelTenantFormBtn) cancelTenantFormBtn.addEventListener('click', closeTenantModal);
    if (tenantTypeSelect) {
        tenantTypeSelect.addEventListener('change', updateTenantTypeFields);
    }
    
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
