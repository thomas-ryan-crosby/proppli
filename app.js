// Global state
let selectedPropertyId = localStorage.getItem('selectedPropertyId') || '';
let currentView = 'active'; // 'active' or 'completed'
let editingTicketId = null;
let editingPropertyId = null;
let beforePhotoFile = null;
let afterPhotoFile = null;
let beforePhotoUrl = null;
let afterPhotoUrl = null;
let completionAfterPhotoFile = null;

// Sort and filter state
let activeSortBy = localStorage.getItem('activeSortBy') || 'dateCreated-desc';
let activeFilterStatus = localStorage.getItem('activeFilterStatus') || '';
let activeFilterAssigned = localStorage.getItem('activeFilterAssigned') || '';
let completedSortBy = localStorage.getItem('completedSortBy') || 'dateCompleted-desc';
let completedFilterAssigned = localStorage.getItem('completedFilterAssigned') || '';
let allTickets = {}; // Store all tickets for filtering

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !db) {
        console.error('Firebase is not initialized. Check firebase-config.js');
        alert('Error: Firebase is not properly configured. Please check the browser console.');
        return;
    }
    console.log('Firebase initialized successfully');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadProperties();
    loadTickets();
}

// Event Listeners
function setupEventListeners() {
    // Property management
    const managePropertiesBtn = document.getElementById('managePropertiesBtn');
    const closePropertyModalBtn = document.getElementById('closePropertyModal');
    const addPropertyBtn = document.getElementById('addPropertyBtn');
    const propertyForm = document.getElementById('propertyForm');
    const cancelPropertyFormBtn = document.getElementById('cancelPropertyForm');
    const propertySelect = document.getElementById('propertySelect');
    
    if (managePropertiesBtn) managePropertiesBtn.addEventListener('click', openPropertyModal);
    if (closePropertyModalBtn) closePropertyModalBtn.addEventListener('click', closePropertyModal);
    if (addPropertyBtn) addPropertyBtn.addEventListener('click', showAddPropertyForm);
    if (propertyForm) propertyForm.addEventListener('submit', handlePropertySubmit);
    if (cancelPropertyFormBtn) cancelPropertyFormBtn.addEventListener('click', hidePropertyForm);
    if (propertySelect) propertySelect.addEventListener('change', handlePropertySelect);
    
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
    
    // Handle assignedTo field changes - auto-update status if assigned
    const assignedToField = document.getElementById('assignedTo');
    if (assignedToField) {
        assignedToField.addEventListener('change', handleAssignedToChange);
        assignedToField.addEventListener('blur', handleAssignedToChange);
    }
    
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
    
    // Sort and filter controls
    const activeSortBySelect = document.getElementById('activeSortBy');
    const activeFilterStatusSelect = document.getElementById('activeFilterStatus');
    const activeFilterAssignedSelect = document.getElementById('activeFilterAssigned');
    const completedSortBySelect = document.getElementById('completedSortBy');
    const completedFilterAssignedSelect = document.getElementById('completedFilterAssigned');
    
    if (activeSortBySelect) {
        activeSortBySelect.value = activeSortBy;
        activeSortBySelect.addEventListener('change', (e) => {
            activeSortBy = e.target.value;
            localStorage.setItem('activeSortBy', activeSortBy);
            renderTickets(allTickets);
        });
    }
    
    if (activeFilterStatusSelect) {
        activeFilterStatusSelect.value = activeFilterStatus;
        activeFilterStatusSelect.addEventListener('change', (e) => {
            activeFilterStatus = e.target.value;
            localStorage.setItem('activeFilterStatus', activeFilterStatus);
            renderTickets(allTickets);
        });
    }
    
    if (activeFilterAssignedSelect) {
        activeFilterAssignedSelect.value = activeFilterAssigned;
        activeFilterAssignedSelect.addEventListener('change', (e) => {
            activeFilterAssigned = e.target.value;
            localStorage.setItem('activeFilterAssigned', activeFilterAssigned);
            renderTickets(allTickets);
        });
    }
    
    if (completedSortBySelect) {
        completedSortBySelect.value = completedSortBy;
        completedSortBySelect.addEventListener('change', (e) => {
            completedSortBy = e.target.value;
            localStorage.setItem('completedSortBy', completedSortBy);
            renderTickets(allTickets);
        });
    }
    
    if (completedFilterAssignedSelect) {
        completedFilterAssignedSelect.value = completedFilterAssigned;
        completedFilterAssignedSelect.addEventListener('change', (e) => {
            completedFilterAssigned = e.target.value;
            localStorage.setItem('completedFilterAssigned', completedFilterAssigned);
            renderTickets(allTickets);
        });
    }

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

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closePropertyModal();
            closeTicketModal();
            closeCompletionModal();
            closeDeleteTicketModal();
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
    list.innerHTML = '';

    if (Object.keys(properties).length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No properties yet. Create one above!</p>';
        return;
    }

    Object.keys(properties).forEach(id => {
        const property = properties[id];
        const item = document.createElement('div');
        item.className = 'property-item';
        item.innerHTML = `
            <div class="property-info">
                <h4>${escapeHtml(property.name)}</h4>
                <p><strong>Type:</strong> ${property.propertyType === 'commercial' ? 'Commercial' : property.propertyType === 'hoa' ? 'HOA' : property.propertyType === 'residential' ? 'Residential' : 'Not Set'}</p>
                ${property.address ? `<p>📍 ${escapeHtml(property.address)}</p>` : ''}
                ${property.description ? `<p>${escapeHtml(property.description)}</p>` : ''}
            </div>
            <div class="property-item-actions">
                <button class="btn-secondary btn-small" onclick="editProperty('${id}')">Edit</button>
                <button class="btn-danger btn-small" onclick="deleteProperty('${id}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function openPropertyModal() {
    document.getElementById('propertyModal').classList.add('show');
    hidePropertyForm();
}

function showAddPropertyForm() {
    document.getElementById('propertyForm').style.display = 'block';
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
    // Focus on property name input for quick entry
    setTimeout(() => {
        document.getElementById('propertyName').focus();
    }, 100);
}

function hidePropertyForm() {
    document.getElementById('propertyForm').style.display = 'none';
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('show');
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
}

function handlePropertySubmit(e) {
    e.preventDefault();
    console.log('Property form submitted');
    
    const id = document.getElementById('propertyId').value;
    const name = document.getElementById('propertyName').value.trim();
    const address = document.getElementById('propertyAddress').value.trim();
    const propertyType = document.getElementById('propertyType').value;
    const description = document.getElementById('propertyDescription').value.trim();

    console.log('Form data:', { id, name, address, propertyType, description });

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

    if (id && editingPropertyId) {
        // Update existing - preserve createdAt
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
            hidePropertyForm();
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
    } else {
        // Create new
        const propertyData = {
            name,
            address: address || null,
            propertyType: propertyType,
            description: description || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('properties').add(propertyData)
            .then((docRef) => {
                console.log('Property created successfully with ID:', docRef.id);
                // Hide loading modal
                if (loadingModal) {
                    loadingModal.classList.remove('show');
                }
                hidePropertyForm();
            })
            .catch((error) => {
                console.error('Error creating property:', error);
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
                document.getElementById('propertyDescription').value = property.description || '';
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
        allTickets = tickets; // Store for filter dropdown population
        renderTickets(tickets);
        updateMetrics(tickets);
        updateFilterDropdowns(tickets);
    });
}

// Update filter dropdowns with unique values from tickets
function updateFilterDropdowns(tickets) {
    // Get unique assigned to values for active tickets
    const assignedToSet = new Set();
    const completedBySet = new Set();
    
    Object.values(tickets).forEach(ticket => {
        // Filter by selected property if one is selected
        if (selectedPropertyId && ticket.propertyId !== selectedPropertyId) {
            return;
        }
        
        if (!ticket.deletedAt && ticket.status !== 'Completed' && ticket.assignedTo) {
            assignedToSet.add(ticket.assignedTo);
        }
        if (ticket.status === 'Completed' && ticket.completedBy) {
            completedBySet.add(ticket.completedBy);
        }
    });
    
    // Update active filter assigned dropdown
    const activeFilterAssignedSelect = document.getElementById('activeFilterAssigned');
    if (activeFilterAssignedSelect) {
        const currentValue = activeFilterAssignedSelect.value;
        activeFilterAssignedSelect.innerHTML = '<option value="">All Assignees</option>';
        Array.from(assignedToSet).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            activeFilterAssignedSelect.appendChild(option);
        });
        activeFilterAssignedSelect.value = currentValue;
    }
    
    // Update completed filter assigned dropdown
    const completedFilterAssignedSelect = document.getElementById('completedFilterAssigned');
    if (completedFilterAssignedSelect) {
        const currentValue = completedFilterAssignedSelect.value;
        completedFilterAssignedSelect.innerHTML = '<option value="">All</option>';
        Array.from(completedBySet).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            completedFilterAssignedSelect.appendChild(option);
        });
        completedFilterAssignedSelect.value = currentValue;
    }
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
            // Apply filters for completed tickets
            if (completedFilterAssigned && ticket.completedBy !== completedFilterAssigned) {
                return;
            }
            completedTickets.push(ticket);
        } else {
            // Apply filters for active tickets
            if (activeFilterStatus && ticket.status !== activeFilterStatus) {
                return;
            }
            if (activeFilterAssigned && ticket.assignedTo !== activeFilterAssigned) {
                return;
            }
            activeTickets.push(ticket);
        }
    });

    // Sort active tickets
    activeTickets.sort((a, b) => {
        return sortTickets(a, b, activeSortBy);
    });
    
    // Sort completed tickets
    completedTickets.sort((a, b) => {
        return sortTickets(a, b, completedSortBy);
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

// Sort tickets based on sort option
function sortTickets(a, b, sortOption) {
    const [field, direction] = sortOption.split('-');
    const ascending = direction === 'asc';
    let comparison = 0;
    
    switch (field) {
        case 'dateCreated':
            const aTime = a.dateCreated?.toMillis ? a.dateCreated.toMillis() : (a.dateCreated || 0);
            const bTime = b.dateCreated?.toMillis ? b.dateCreated.toMillis() : (b.dateCreated || 0);
            comparison = aTime - bTime;
            break;
        case 'dateCompleted':
            const aCompleted = a.dateCompleted?.toMillis ? a.dateCompleted.toMillis() : (a.dateCompleted || 0);
            const bCompleted = b.dateCompleted?.toMillis ? b.dateCompleted.toMillis() : (b.dateCompleted || 0);
            comparison = aCompleted - bCompleted;
            break;
        case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
        case 'assignedTo':
            comparison = (a.assignedTo || '').localeCompare(b.assignedTo || '');
            break;
        case 'completedBy':
            comparison = (a.completedBy || '').localeCompare(b.completedBy || '');
            break;
        case 'timeAllocated':
            comparison = (a.timeAllocated || 0) - (b.timeAllocated || 0);
            break;
        default:
            comparison = 0;
    }
    
    return ascending ? comparison : -comparison;
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
    // Generate status class - handle "New (Unassigned)" specially
    let statusClass = ticket.status.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    if (statusClass === 'new-unassigned') {
        statusClass = 'new-unassigned';
    }
    statusClass = `status-${statusClass}`;

    card.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-title">${escapeHtml(ticket.workDescription)}</div>
            <span class="ticket-status ${statusClass}">${escapeHtml(ticket.status)}</span>
        </div>
        ${ticket.assignedTo ? `
            <div style="display: flex; justify-content: center; margin: 12px 0 16px 0;">
                <div class="assigned-to-badge">
                    <span class="assigned-to-icon">👤</span>
                    <span class="assigned-to-text">${escapeHtml(ticket.assignedTo)}</span>
                </div>
            </div>
        ` : ''}
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
    const statusField = document.getElementById('ticketStatus');
    if (statusField) {
        statusField.value = 'New (Unassigned)';
        statusField.setAttribute('data-previous-status', 'New (Unassigned)');
    }
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
            const assignedToField = document.getElementById('assignedTo');
            const statusField = document.getElementById('ticketStatus');
            if (assignedToField) assignedToField.value = ticket.assignedTo || '';
            if (statusField) {
                statusField.value = ticket.status || 'New (Unassigned)';
                statusField.setAttribute('data-previous-status', ticket.status || 'New (Unassigned)');
            }
            
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
            // Only load custom dates if status is Completed (when retroactive dates group is visible)
            // For normal editing, we preserve the original dateCreated without loading it into customDateCreated
            if (ticket.status === 'Completed') {
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
        }
    });
}

function handleStatusChange(e) {
    const newStatus = e.target.value;
    const statusField = e.target;
    const assignedToField = document.getElementById('assignedTo');
    const assignedToValue = assignedToField ? assignedToField.value.trim() : '';
    
    // Get previous status from attribute or current value
    const previousStatus = statusField.getAttribute('data-previous-status') || statusField.value;
    
    // If changing to "New (Unassigned)" and there's an assigned person, warn and clear it
    if (newStatus === 'New (Unassigned)' && assignedToValue) {
        const assignedPerson = assignedToValue;
        if (!confirm(`Changing status to "New (Unassigned)" will remove the assigned person (${assignedPerson}). Continue?`)) {
            // Revert to previous status
            statusField.value = previousStatus;
            return;
        }
        // Clear assignedTo field
        if (assignedToField) {
            assignedToField.value = '';
        }
    }
    
    // Store current status for potential revert (store the new status after confirmation)
    statusField.setAttribute('data-previous-status', newStatus);
    
    if (newStatus === 'Completed') {
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

function handleAssignedToChange(e) {
    const assignedToValue = e.target.value.trim();
    const statusField = document.getElementById('ticketStatus');
    const currentStatus = statusField ? statusField.value : '';
    
    // If assignedTo is set and status is "New (Unassigned)", automatically change to "Not Started"
    if (assignedToValue && currentStatus === 'New (Unassigned)') {
        if (statusField) {
            statusField.value = 'Not Started';
            statusField.setAttribute('data-previous-status', 'Not Started');
            // Trigger status change handler to update UI
            const changeEvent = new Event('change');
            statusField.dispatchEvent(changeEvent);
        }
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
    const assignedTo = document.getElementById('assignedTo').value.trim();
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
    
    // Validate: "New (Unassigned)" status cannot have an assigned person
    if (status === 'New (Unassigned)' && assignedTo) {
        alert('A ticket with status "New (Unassigned)" cannot have an assigned person. Please either change the status or remove the assigned person.');
        return;
    }
    
    // Auto-update status if assignedTo is set but status is "New (Unassigned)"
    let finalStatus = status;
    if (assignedTo && status === 'New (Unassigned)') {
        finalStatus = 'Not Started';
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
                    assignedTo: assignedTo || null,
                    status: finalStatus,
                    // Always update the lastUpdated timestamp
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // ONLY include dateCreated if a custom date is explicitly provided AND status is Completed
                // Otherwise, DO NOT include it in the update to preserve the existing value
                // This prevents the creation date from being reset when editing non-completed tickets
                if (customDateCreated && status === 'Completed') {
                    ticketData.dateCreated = firebase.firestore.Timestamp.fromDate(new Date(customDateCreated));
                }
                // If no custom date or status is not Completed, we don't include dateCreated at all - Firestore will preserve existing value

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
                assignedTo: assignedTo || null,
                status: finalStatus || 'New (Unassigned)',
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
    // Load ticket data to populate time allocated
    db.collection('tickets').doc(ticketId).get().then((doc) => {
        const ticket = doc.data();
        if (ticket) {
            document.getElementById('completionTimeAllocated').value = ticket.timeAllocated || '';
        }
    }).catch((error) => {
        console.error('Error loading ticket:', error);
    });
    
    document.getElementById('completionModal').classList.add('show');
    document.getElementById('completionCompletedBy').value = '';
    document.getElementById('completionHowResolved').value = '';
    document.getElementById('completionAfterPhoto').value = '';
    document.getElementById('completionAfterPhotoPreview').innerHTML = '';
    document.getElementById('removeCompletionAfterPhoto').style.display = 'none';
    completionAfterPhotoFile = null;
    document.getElementById('completionTimeAllocated').focus();
};

function closeCompletionModal() {
    document.getElementById('completionModal').classList.remove('show');
    editingTicketId = null;
}

function handleTicketCompletion(e) {
    e.preventDefault();
    const timeAllocated = parseFloat(document.getElementById('completionTimeAllocated').value);
    const completedBy = document.getElementById('completionCompletedBy').value.trim();
    const howResolved = document.getElementById('completionHowResolved').value.trim();

    if (!timeAllocated || isNaN(timeAllocated) || timeAllocated <= 0) {
        alert('Please enter a valid time allocated (in hours)');
        return;
    }

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

    if (!editingTicketId) {
        alert('Error: Ticket ID not found');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mark as Complete';
        }
        return;
    }
    
    // Upload after photo if provided
    const uploadPromise = completionAfterPhotoFile 
        ? uploadPhoto(completionAfterPhotoFile, editingTicketId, 'after')
        : Promise.resolve(null);

    uploadPromise.then((afterPhotoUrl) => {
        const updateData = {
            status: 'Completed',
            timeAllocated: timeAllocated,
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
