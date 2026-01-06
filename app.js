// Global state
let selectedPropertyId = localStorage.getItem('selectedPropertyId') || '';
let currentView = 'active'; // 'active' or 'completed'
let editingTicketId = null;
let editingPropertyId = null;

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
    document.getElementById('managePropertiesBtn').addEventListener('click', openPropertyModal);
    document.getElementById('closePropertyModal').addEventListener('click', closePropertyModal);
    document.getElementById('propertyForm').addEventListener('submit', handlePropertySubmit);
    document.getElementById('cancelPropertyForm').addEventListener('click', closePropertyModal);
    document.getElementById('propertySelect').addEventListener('change', handlePropertySelect);

    // Ticket management
    document.getElementById('createTicketBtn').addEventListener('click', openTicketModal);
    document.getElementById('closeTicketModal').addEventListener('click', closeTicketModal);
    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmit);
    document.getElementById('cancelTicketForm').addEventListener('click', closeTicketModal);
    document.getElementById('ticketStatus').addEventListener('change', handleStatusChange);

    // View toggles
    document.getElementById('viewActiveBtn').addEventListener('click', () => switchView('active'));
    document.getElementById('viewCompletedBtn').addEventListener('click', () => switchView('completed'));

    // Completion modal
    document.getElementById('closeCompletionModal').addEventListener('click', closeCompletionModal);
    document.getElementById('completionForm').addEventListener('submit', handleTicketCompletion);
    document.getElementById('cancelCompletionForm').addEventListener('click', closeCompletionModal);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closePropertyModal();
            closeTicketModal();
            closeCompletionModal();
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
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    editingPropertyId = null;
    // Focus on property name input for quick entry
    setTimeout(() => {
        document.getElementById('propertyName').focus();
    }, 100);
}

function openPropertyModalForAdd() {
    openPropertyModal();
    // Scroll to top of modal to show the form
    const modalBody = document.querySelector('#propertyModal .modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('show');
}

function handlePropertySubmit(e) {
    e.preventDefault();
    console.log('Property form submitted');
    
    const id = document.getElementById('propertyId').value;
    const name = document.getElementById('propertyName').value.trim();
    const address = document.getElementById('propertyAddress').value.trim();
    const description = document.getElementById('propertyDescription').value.trim();

    console.log('Form data:', { id, name, address, description });

    if (!name) {
        alert('Property name is required');
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    if (id && editingPropertyId) {
        // Update existing - preserve createdAt
        db.collection('properties').doc(id).get().then((doc) => {
            const existing = doc.data();
            const propertyData = {
                name,
                address: address || null,
                description: description || null,
                createdAt: existing?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            return db.collection('properties').doc(id).update(propertyData);
        }).then(() => {
            console.log('Property updated successfully');
            closePropertyModal();
        }).catch((error) => {
            console.error('Error updating property:', error);
            alert('Error saving property: ' + error.message);
            // Re-enable submit button on error
            const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Property';
            }
        });
    } else {
        // Create new
        const propertyData = {
            name,
            address: address || null,
            description: description || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('properties').add(propertyData)
            .then((docRef) => {
                console.log('Property created successfully with ID:', docRef.id);
                closePropertyModal();
            })
            .catch((error) => {
                console.error('Error creating property:', error);
                alert('Error saving property: ' + error.message);
                // Re-enable submit button on error
                const submitBtn = document.querySelector('#propertyForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Property';
                }
            });
    }
}

// Make functions globally accessible for onclick handlers
window.editProperty = function(id) {
    db.collection('properties').doc(id).get().then((doc) => {
        const property = doc.data();
        if (property) {
            document.getElementById('propertyId').value = id;
            document.getElementById('propertyName').value = property.name || '';
            document.getElementById('propertyAddress').value = property.address || '';
            document.getElementById('propertyDescription').value = property.description || '';
            editingPropertyId = id;
            openPropertyModal();
        }
    });
};

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
    });
}

function renderTickets(tickets) {
    const activeList = document.getElementById('activeTicketsList');
    const completedList = document.getElementById('completedTicketsList');
    
    activeList.innerHTML = '';
    completedList.innerHTML = '';

    let activeTickets = [];
    let completedTickets = [];

    Object.keys(tickets).forEach(id => {
        const ticket = tickets[id];
        ticket.id = id;

        // Filter by selected property if one is selected
        if (selectedPropertyId && ticket.propertyId !== selectedPropertyId) {
            return;
        }

        if (ticket.status === 'Completed') {
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
}

function createTicketCard(ticket) {
    const card = document.createElement('div');
    card.className = 'ticket-card';

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
            <div class="ticket-detail">
                <span class="ticket-detail-label">Time Allocated</span>
                <span class="ticket-detail-value">${ticket.timeAllocated} hours</span>
            </div>
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
            ${isCompleted && ticket.howResolved ? `
                <div class="ticket-detail" style="grid-column: 1 / -1;">
                    <span class="ticket-detail-label">How Resolved</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.howResolved)}</span>
                </div>
            ` : ''}
            ${isCompleted && (ticket.beforePhotoUrl || ticket.afterPhotoUrl) ? `
                <div class="ticket-detail" style="grid-column: 1 / -1;">
                    <span class="ticket-detail-label">Photos</span>
                    <div class="ticket-photos">
                        ${ticket.beforePhotoUrl ? `
                            <div class="photo-item">
                                <span class="photo-label">Before</span>
                                <img src="${escapeHtml(ticket.beforePhotoUrl)}" alt="Before" class="ticket-photo" onclick="openPhotoModal('${escapeHtml(ticket.beforePhotoUrl)}')">
                            </div>
                        ` : ''}
                        ${ticket.afterPhotoUrl ? `
                            <div class="photo-item">
                                <span class="photo-label">After</span>
                                <img src="${escapeHtml(ticket.afterPhotoUrl)}" alt="After" class="ticket-photo" onclick="openPhotoModal('${escapeHtml(ticket.afterPhotoUrl)}')">
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            <div class="ticket-detail">
                <span class="ticket-detail-label">Date Created</span>
                <span class="ticket-detail-value">${formatDate(ticket.dateCreated)}</span>
            </div>
            ${isCompleted ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Date Completed</span>
                    <span class="ticket-detail-value">${formatDate(ticket.dateCompleted)}</span>
                </div>
            ` : ''}
        </div>
        <div class="ticket-actions">
            ${!isCompleted ? `
                <button class="btn-primary btn-small" onclick="markTicketComplete('${ticket.id}')">Mark as Complete</button>
                <button class="btn-secondary btn-small" onclick="editTicket('${ticket.id}')">Edit</button>
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

    // Populate property dropdown
    const ticketPropertySelect = document.getElementById('ticketProperty');
    if (selectedPropertyId) {
        ticketPropertySelect.value = selectedPropertyId;
    }

    // Set default status
    document.getElementById('ticketStatus').value = 'Not Started';
    document.getElementById('completedByGroup').style.display = 'none';
    document.getElementById('howResolvedGroup').style.display = 'none';
    document.getElementById('fileUploadGroup').style.display = 'none';
    
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
    }
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
            document.getElementById('workDescription').value = ticket.workDescription || '';
            document.getElementById('timeAllocated').value = ticket.timeAllocated || '';
            document.getElementById('requestedBy').value = ticket.requestedBy || '';
            document.getElementById('managedBy').value = ticket.managedBy || '';
            document.getElementById('ticketStatus').value = ticket.status || 'Not Started';
            
            if (ticket.status === 'Completed') {
                document.getElementById('completedBy').value = ticket.completedBy || '';
                document.getElementById('howResolved').value = ticket.howResolved || '';
                document.getElementById('completedByGroup').style.display = 'block';
                document.getElementById('howResolvedGroup').style.display = 'block';
                document.getElementById('fileUploadGroup').style.display = 'block';
                
                // Load existing photos if any
                if (ticket.beforePhotoUrl) {
                    beforePhotoUrl = ticket.beforePhotoUrl;
                    showPhotoPreview(ticket.beforePhotoUrl, 'before');
                }
                if (ticket.afterPhotoUrl) {
                    afterPhotoUrl = ticket.afterPhotoUrl;
                    showPhotoPreview(ticket.afterPhotoUrl, 'after');
                }
            }
        }
    });
}

function handleStatusChange(e) {
    if (e.target.value === 'Completed') {
        document.getElementById('completedByGroup').style.display = 'block';
        document.getElementById('howResolvedGroup').style.display = 'block';
        document.getElementById('fileUploadGroup').style.display = 'block';
    } else {
        document.getElementById('completedByGroup').style.display = 'none';
        document.getElementById('howResolvedGroup').style.display = 'none';
        document.getElementById('fileUploadGroup').style.display = 'none';
    }
}

function handleTicketSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('ticketId').value;
    const propertyId = document.getElementById('ticketProperty').value;
    const workDescription = document.getElementById('workDescription').value.trim();
    const timeAllocated = parseFloat(document.getElementById('timeAllocated').value);
    const requestedBy = document.getElementById('requestedBy').value.trim();
    const managedBy = document.getElementById('managedBy').value.trim();
    const status = document.getElementById('ticketStatus').value;
    const completedBy = document.getElementById('completedBy').value.trim();
    const howResolved = document.getElementById('howResolved').value.trim();

    if (!propertyId || !workDescription || !timeAllocated || !requestedBy || !managedBy) {
        alert('Please fill in all required fields');
        return;
    }

    if (status === 'Completed' && !completedBy) {
        alert('Please enter who completed the work');
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    // Upload photos first if any
    const uploadPromises = [];
    
    if (beforePhotoFile) {
        uploadPromises.push(uploadPhoto(beforePhotoFile, id || 'temp', 'before'));
    }
    if (afterPhotoFile) {
        uploadPromises.push(uploadPhoto(afterPhotoFile, id || 'temp', 'after'));
    }
    
    // If no new photos, use existing URLs
    Promise.all(uploadPromises).then((photoUrls) => {
        const beforeUrl = photoUrls.find(url => url && url.includes('before')) || beforePhotoUrl;
        const afterUrl = photoUrls.find(url => url && url.includes('after')) || afterPhotoUrl;
        
        if (id && editingTicketId) {
            // Update existing - preserve dateCreated and handle dateCompleted properly
            db.collection('tickets').doc(id).get().then((doc) => {
                const existing = doc.data();
                const ticketData = {
                    propertyId,
                    workDescription,
                    timeAllocated,
                    requestedBy,
                    managedBy,
                    status,
                    dateCreated: existing?.dateCreated || firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (status === 'Completed') {
                    ticketData.completedBy = completedBy;
                    ticketData.howResolved = howResolved || null;
                    if (beforeUrl) ticketData.beforePhotoUrl = beforeUrl;
                    if (afterUrl) ticketData.afterPhotoUrl = afterUrl;
                    // Only set dateCompleted if it wasn't already completed
                    if (existing?.status !== 'Completed') {
                        ticketData.dateCompleted = firebase.firestore.FieldValue.serverTimestamp();
                    } else {
                        ticketData.dateCompleted = existing.dateCompleted;
                    }
                } else {
                    ticketData.completedBy = null;
                    ticketData.howResolved = null;
                    ticketData.beforePhotoUrl = null;
                    ticketData.afterPhotoUrl = null;
                    ticketData.dateCompleted = null;
                }

                return db.collection('tickets').doc(id).update(ticketData);
            }).then(() => {
                closeTicketModal();
            }).catch((error) => {
                console.error('Error updating ticket:', error);
                alert('Error saving ticket: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Ticket';
                }
            });
        } else {
            // Create new - need to get the ID first for photo uploads
            const ticketData = {
                propertyId,
                workDescription,
                timeAllocated,
                requestedBy,
                managedBy,
                status: status || 'Not Started',
                dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (status === 'Completed') {
                ticketData.completedBy = completedBy;
                ticketData.howResolved = howResolved || null;
                ticketData.dateCompleted = firebase.firestore.FieldValue.serverTimestamp();
                if (beforeUrl) ticketData.beforePhotoUrl = beforeUrl;
                if (afterUrl) ticketData.afterPhotoUrl = afterUrl;
            } else {
                ticketData.completedBy = null;
                ticketData.howResolved = null;
                ticketData.beforePhotoUrl = null;
                ticketData.afterPhotoUrl = null;
                ticketData.dateCompleted = null;
            }

            db.collection('tickets').add(ticketData).then(() => {
                closeTicketModal();
            }).catch((error) => {
                console.error('Error creating ticket:', error);
                alert('Error saving ticket: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Ticket';
                }
            });
        }
    }).catch((error) => {
        console.error('Error uploading photos:', error);
        alert('Error uploading photos: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Ticket';
        }
    });
}

window.markTicketComplete = function(ticketId) {
    editingTicketId = ticketId;
    document.getElementById('completionModal').classList.add('show');
    document.getElementById('completionCompletedBy').value = '';
    document.getElementById('completionCompletedBy').focus();
};

function closeCompletionModal() {
    document.getElementById('completionModal').classList.remove('show');
    editingTicketId = null;
}

function handleTicketCompletion(e) {
    e.preventDefault();
    const completedBy = document.getElementById('completionCompletedBy').value.trim();

    if (!completedBy) {
        alert('Please enter who completed the work');
        return;
    }

    db.collection('tickets').doc(editingTicketId).update({
        status: 'Completed',
        completedBy: completedBy,
        dateCompleted: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    closeCompletionModal();
}

window.editTicket = function(ticketId) {
    openTicketModal(ticketId);
};

// View Management
function switchView(view) {
    currentView = view;
    
    if (view === 'active') {
        document.getElementById('activeTicketsView').style.display = 'block';
        document.getElementById('completedTicketsView').style.display = 'none';
        document.getElementById('viewActiveBtn').classList.add('active');
        document.getElementById('viewCompletedBtn').classList.remove('active');
    } else {
        document.getElementById('activeTicketsView').style.display = 'none';
        document.getElementById('completedTicketsView').style.display = 'block';
        document.getElementById('viewActiveBtn').classList.remove('active');
        document.getElementById('viewCompletedBtn').classList.add('active');
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
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
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
