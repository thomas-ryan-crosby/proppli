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

// Authentication state
let currentUser = null;
let currentUserProfile = null;
let auth = null; // Firebase Auth instance
let isUserActivelyLoggingIn = false; // Flag to track active login (not page load)

// User Management
let allUsers = {}; // Store all users for filtering

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
    
    // Hide add buttons for maintenance users (they can't add/edit properties or tenants)
    const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
    
    // Show Add Tenant FAB when on tenants page (visible when scrolling the table)
    if (fabAddTenant) {
        if (tenantsPage && !isMaintenance) {
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
        const shouldShow = isPropertiesPageVisible && isPropertyDetailVisible && !isMaintenance;
        fabAddBuilding.style.display = shouldShow ? 'flex' : 'none';
    }
    
    if (fabAddUnit) {
        const isPropertiesPageVisible = propertiesPage && propertiesPage.style.display !== 'none';
        const isPropertyDetailVisible = propertyDetailView && propertyDetailView.style.display !== 'none';
        const shouldShow = isPropertiesPageVisible && isPropertyDetailVisible && !isMaintenance;
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
    
    // Check for hash routing (e.g., #signup, #login)
    const handleHashRouting = () => {
        const hash = window.location.hash;
        if (hash === '#signup') {
            // User clicked invite link - ensure they're signed out so they can set password
            if (auth && auth.currentUser) {
                console.log('🔒 Invite link detected - signing out existing session to require password setup');
                auth.signOut().then(() => {
                    showAuthPages(false);
                });
            } else {
                showAuthPages(false); // Don't force login, let hash routing handle it
            }
        } else if (hash === '#login') {
            // Show auth pages and login
            showAuthPages(false); // Don't force login, let hash routing handle it
        }
        // If no hash, don't do anything - let landing page show
    };
    
    // Handle hash on initial load - only if there's a hash
    // Use setTimeout to ensure it runs after other initialization
    if (window.location.hash) {
        setTimeout(() => {
            handleHashRouting();
        }, 200);
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashRouting);
    
    // Initialize auth first
    initAuth();
    
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

// Initialize Firebase Auth
function initAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        auth = firebase.auth();
        console.log('✅ Firebase Auth initialized');
        
        // Track if this is the initial page load (first auth state change)
        let isInitialLoad = true;
        
        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Only check "Remember Me" on initial page load (when page first loads with existing session)
                // Skip this check if user is actively logging in (isUserActivelyLoggingIn flag is set)
                if (isInitialLoad && !isUserActivelyLoggingIn) {
                    isInitialLoad = false;
                    
                    // Check if "Remember Me" was set
                    // We check both sessionStorage (clears on tab close) and localStorage
                    // If user logged in without "Remember Me", the flag won't be set
                    const rememberMe = sessionStorage.getItem('rememberMe') === 'true' || localStorage.getItem('rememberMe') === 'true';
                    
                    // If user is authenticated on page load but "Remember Me" was not checked, sign them out
                    // This prevents auto-login when "Remember Me" was unchecked
                    if (!rememberMe) {
                        console.log('⚠️ User authenticated on page load but "Remember Me" was not checked - signing out');
                        try {
                            await auth.signOut();
                            sessionStorage.removeItem('rememberMe');
                            localStorage.removeItem('rememberMe');
                            // Show auth pages so user can log in again
                            showAuthPages();
                            return;
                        } catch (signOutError) {
                            console.error('Error signing out:', signOutError);
                        }
                    }
                } else {
                    // Not initial load OR user is actively logging in - allow it
                    isInitialLoad = false;
                    // Clear the active login flag after processing
                    isUserActivelyLoggingIn = false;
                }
                
                console.log('👤 User authenticated:', user.email);
                currentUser = user;
                // Reset permission error flag on new login
                permissionErrorShown = false;
                
                // Check email verification (optional - can be enabled/disabled)
                // Uncomment the block below to require email verification
                /*
                if (!user.emailVerified) {
                    console.warn('⚠️ Email not verified');
                    showPermissionDeniedModal('Please verify your email address before accessing the application. Check your inbox for the verification email.');
                    await auth.signOut();
                    return;
                }
                */
                
                await loadUserProfile(user.uid);
                // Only show application if user profile loaded successfully and is active
                if (currentUserProfile && currentUserProfile.isActive) {
                    showApplication();
                    // Load data now that user is authenticated
                    // Use setTimeout to ensure these load after the app is shown
                    setTimeout(() => {
                    loadProperties();
                    loadTickets();
                    }, 100);
                } else if (currentUserProfile && !currentUserProfile.isActive) {
                    // User profile exists but is inactive - permission modal already shown by loadUserProfile
                    // User will be signed out by loadUserProfile
                    console.log('⚠️ User profile is inactive - access denied');
                } else {
                    // User profile doesn't exist - this shouldn't happen after loadUserProfile
                    // But if it does, show error
                    console.error('❌ User profile not found after loadUserProfile');
                    showPermissionDeniedModal('Your user profile could not be loaded. Please contact an administrator.');
                    await auth.signOut();
                }
            } else {
                console.log('👤 No user authenticated');
                currentUser = null;
                currentUserProfile = null;
                permissionErrorShown = false;
                // Don't automatically show auth pages - let landing page show
                // Auth pages will be shown when:
                // 1. User clicks "Launch Application" button
                // 2. User is explicitly signed out (handled elsewhere)
                // 3. Hash routing directs to #signup or #login
                
                // Hide app container if it was showing
                const appContainer = document.getElementById('appContainer');
                if (appContainer) {
                    appContainer.style.display = 'none';
                }
                
                // Show landing page if not already showing auth pages
                const authPages = document.getElementById('authPages');
                const landingPage = document.getElementById('landingPage');
                if (authPages && authPages.style.display !== 'block' && landingPage) {
                    landingPage.style.display = 'block';
                }
            }
        });
    } else {
        console.error('❌ Firebase Auth not available');
    }
}

// ============================================
// QUERY HELPER FUNCTIONS - Role-based query building
// ============================================

/**
 * Builds a Firestore query for a collection based on user role
 * For maintenance users, filters by assignedProperties
 * @param {string} collectionName - Name of the collection
 * @param {string} propertyField - Field name that contains propertyId (default: 'propertyId')
 * @returns {Object} Firestore query object
 */
function buildFilteredQuery(collectionName, propertyField = 'propertyId') {
    console.log(`🔍 buildFilteredQuery: ${collectionName}`, {
        userRole: currentUserProfile?.role,
        assignedProperties: currentUserProfile?.assignedProperties
    });
    
    let query = db.collection(collectionName);
    
    // For maintenance users, filter by assigned properties
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        if (currentUserProfile.assignedProperties.length <= 10) {
            query = query.where(propertyField, 'in', currentUserProfile.assignedProperties);
            console.log(`✅ buildFilteredQuery: Applied whereIn filter for ${collectionName}`);
        } else {
            console.warn(`⚠️ buildFilteredQuery: More than 10 assigned properties, cannot use whereIn for ${collectionName}`);
        }
    }
    
    return query;
}

/**
 * Loads properties based on user role
 * For maintenance users, loads assigned properties individually
 * @returns {Promise} Promise that resolves to a snapshot-like object
 */
async function loadPropertiesForRole() {
    console.log('🔍 loadPropertiesForRole called', {
        userRole: currentUserProfile?.role,
        assignedProperties: currentUserProfile?.assignedProperties
    });
    
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        // Load assigned properties individually
        const propertyPromises = currentUserProfile.assignedProperties.map(propId => 
            db.collection('properties').doc(propId).get().catch(e => {
                console.warn(`Could not load property ${propId}:`, e);
                return null;
            })
        );
        const docs = await Promise.all(propertyPromises);
        console.log(`✅ loadPropertiesForRole: Loaded ${docs.filter(d => d && d.exists).length} properties for maintenance user`);
        // Convert to snapshot-like object
        return {
            forEach: (fn) => docs.forEach(doc => doc && doc.exists && fn(doc))
        };
    } else {
        // For other roles, load all properties
        console.log('🔍 loadPropertiesForRole: Loading all properties for non-maintenance user');
        return db.collection('properties').get();
    }
}

/**
 * Loads tenants based on user role
 * For maintenance users, filters via occupancies
 * @returns {Promise} Promise that resolves to tenants object
 */
async function loadTenantsForRole() {
    console.log('🔍 loadTenantsForRole called', {
        userRole: currentUserProfile?.role,
        assignedProperties: currentUserProfile?.assignedProperties
    });
    
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        // Load occupancies for assigned properties first, then filter tenants
        if (currentUserProfile.assignedProperties.length <= 10) {
            const occupanciesSnapshot = await db.collection('occupancies')
                .where('propertyId', 'in', currentUserProfile.assignedProperties)
                .get();
            
            const tenantIds = new Set();
            occupanciesSnapshot.forEach(doc => {
                const occ = doc.data();
                if (occ.tenantId) {
                    tenantIds.add(occ.tenantId);
                }
            });
            
            // Load tenants individually
            const tenantPromises = Array.from(tenantIds).map(tenantId => 
                db.collection('tenants').doc(tenantId).get().catch(e => {
                    console.warn(`Could not load tenant ${tenantId}:`, e);
                    return null;
                })
            );
            
            const tenantDocs = await Promise.all(tenantPromises);
            const tenants = {};
            tenantDocs.forEach(doc => {
                if (doc && doc.exists) {
                    tenants[doc.id] = { id: doc.id, ...doc.data() };
                }
            });
            console.log(`✅ loadTenantsForRole: Loaded ${Object.keys(tenants).length} tenants for maintenance user`);
            return tenants;
        }
    }
    
    // For other roles or if more than 10 properties, load all tenants
    console.log('🔍 loadTenantsForRole: Loading all tenants');
    const tenantsSnapshot = await db.collection('tenants').get();
    const tenants = {};
    tenantsSnapshot.forEach(doc => {
        tenants[doc.id] = { id: doc.id, ...doc.data() };
    });
    return tenants;
}

// Comprehensive sync function to ensure all user data is in sync
async function syncUserData(userId, email) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    console.log('🔄 Syncing user data:', { userId, email: normalizedEmail });
    
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    // Step 1: Check users collection
    const userDoc = await db.collection('users').doc(userId).get();
    const userExists = userDoc.exists;
    const userData = userExists ? userDoc.data() : null;
    
    // Step 2: Check pendingUsers collection
    let pendingUser = null;
    try {
        const pendingSnapshot = await db.collection('pendingUsers')
            .where('email', '==', normalizedEmail)
            .where('status', '==', 'pending_signup')
            .limit(1)
            .get();
        if (!pendingSnapshot.empty) {
            pendingUser = pendingSnapshot.docs[0].data();
            pendingUser.pendingId = pendingSnapshot.docs[0].id;
        }
    } catch (e) {
        console.warn('Could not check pendingUsers:', e);
    }
    
    // Step 3: Check userInvitations collection
    let invitation = null;
    try {
        const inviteSnapshot = await db.collection('userInvitations')
            .where('email', '==', normalizedEmail)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        if (!inviteSnapshot.empty) {
            invitation = inviteSnapshot.docs[0].data();
            invitation.invitationId = inviteSnapshot.docs[0].id;
        }
    } catch (e) {
        console.warn('Could not check userInvitations:', e);
    }
    
    // Step 4: Determine what to do based on state
    if (pendingUser) {
        // There's a pending invitation - link it
        console.log('✅ Found pending invitation, linking...');
        
        // Create or update user document with pending data
        // Ensure assignedProperties is always an array
        const assignedProps = Array.isArray(pendingUser.assignedProperties) 
            ? pendingUser.assignedProperties 
            : (pendingUser.assignedProperties ? [pendingUser.assignedProperties] : []);
        
        const userProfileData = {
            email: normalizedEmail,
            displayName: pendingUser.displayName,
            role: pendingUser.role,
            isActive: pendingUser.isActive !== false, // Ensure active
            assignedProperties: assignedProps,
            profile: pendingUser.profile || {},
            createdAt: userData?.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: pendingUser.createdBy
        };
        
        if (userExists) {
            // Update existing user
            await db.collection('users').doc(userId).update(userProfileData);
            console.log('✅ Updated existing user with pending invitation data');
        } else {
            // Create new user
            await db.collection('users').doc(userId).set(userProfileData);
            console.log('✅ Created user with pending invitation data');
        }
        
        // Mark pendingUser as completed
        if (pendingUser.pendingId) {
            try {
                await db.collection('pendingUsers').doc(pendingUser.pendingId).update({
                    status: 'completed',
                    linkedUserId: userId,
                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Marked pending user as completed');
            } catch (e) {
                console.warn('Could not update pendingUser:', e);
            }
        }
        
        // Mark invitation as accepted
        if (invitation?.invitationId) {
            try {
                await db.collection('userInvitations').doc(invitation.invitationId).update({
                    status: 'accepted',
                    acceptedBy: userId,
                    acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Marked invitation as accepted');
            } catch (e) {
                console.warn('Could not update invitation:', e);
            }
        }
        
        // Return the synced user data
        const syncedDoc = await db.collection('users').doc(userId).get();
        return { id: syncedDoc.id, ...syncedDoc.data() };
    } else if (userExists) {
        // User exists, no pending invitation - ensure assignedProperties is an array
        console.log('✅ User exists, no pending invitation');
        
        // Ensure assignedProperties is always an array
        if (!Array.isArray(userData.assignedProperties)) {
            console.log('⚠️ assignedProperties is not an array, fixing...');
            const fixedProps = userData.assignedProperties ? [userData.assignedProperties] : [];
            await db.collection('users').doc(userId).update({
                assignedProperties: fixedProps
            });
            userData.assignedProperties = fixedProps;
            console.log('✅ Fixed assignedProperties:', fixedProps);
        }
        
        return { id: userDoc.id, ...userData };
    } else {
        // No user, no pending invitation - create default profile
        console.log('⚠️ No user found, creating default profile');
        const defaultProfile = {
            email: normalizedEmail,
            displayName: auth?.currentUser?.displayName || normalizedEmail.split('@')[0] || 'User',
            role: 'viewer',
            isActive: false,
            assignedProperties: [],
            profile: {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
        };
        
        await db.collection('users').doc(userId).set(defaultProfile);
        console.log('✅ Created default user profile');
        
        const newDoc = await db.collection('users').doc(userId).get();
        return { id: newDoc.id, ...newDoc.data() };
    }
}

// Load user profile from Firestore
async function loadUserProfile(userId) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return;
        }
        
        const authUser = currentUser || auth?.currentUser;
        if (!authUser || !authUser.email) {
            throw new Error('No authenticated user found');
        }
        
        const normalizedEmail = (authUser.email || '').toLowerCase().trim();
        
        // Use sync function to ensure everything is in sync
        currentUserProfile = await syncUserData(userId, normalizedEmail);
            console.log('✅ User profile loaded:', currentUserProfile);
        
        // CRITICAL: Ensure assignedProperties is always an array
        if (!Array.isArray(currentUserProfile.assignedProperties)) {
            console.warn('⚠️ assignedProperties is not an array, fixing immediately...');
            const fixedProps = currentUserProfile.assignedProperties ? [currentUserProfile.assignedProperties] : [];
            try {
                await db.collection('users').doc(userId).update({
                    assignedProperties: fixedProps
                });
                currentUserProfile.assignedProperties = fixedProps;
                console.log('✅ Fixed assignedProperties in database:', fixedProps);
            } catch (fixError) {
                console.error('❌ Could not fix assignedProperties:', fixError);
                // Set it locally anyway so the app doesn't crash
                currentUserProfile.assignedProperties = fixedProps;
            }
        }
        
        console.log('📋 User assignedProperties:', currentUserProfile.assignedProperties);
            
            // Update user menu with name
            updateUserMenu();
            
            // Check if user is active
            if (!currentUserProfile.isActive) {
                console.warn('⚠️ User account is not active');
                showPermissionDeniedModal('Your account is pending admin approval. Please contact a system administrator to activate your account.');
                await auth.signOut();
                return;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        if (error.code === 'permission-denied') {
            showPermissionDeniedModal('You do not have permission to access this system. Please contact a system administrator for assistance.');
            await auth.signOut();
        } else {
            showPermissionDeniedModal('Error loading your account. Please contact an administrator.');
            await auth.signOut();
        }
    }
}

// Create user profile in Firestore (used during signup)
async function createUserProfile(userId, userData) {
    try {
        if (!db) {
            throw new Error('Database not initialized');
        }
        
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        if (!userData || !userData.email) {
            throw new Error('User email is required');
        }
        
        // Users can create their own profile with isActive: false and role: 'viewer'
        // Security rules enforce these restrictions
        const profileData = {
            email: userData.email,
            displayName: userData.displayName || userData.email.split('@')[0] || 'User',
            role: 'viewer', // Default role, admins can change later
            isActive: false, // Requires admin approval
            assignedProperties: [],
            profile: userData.profile || {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null // No login yet
        };
        
        console.log('Creating user profile with data:', {
            userId: userId,
            email: profileData.email,
            displayName: profileData.displayName,
            role: profileData.role,
            isActive: profileData.isActive
        });
        
        await db.collection('users').doc(userId).set(profileData);
        console.log('✅ User profile created successfully for:', userData.email);
    } catch (error) {
        console.error('❌ Error creating user profile:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            userId: userId,
            email: userData?.email
        });
        throw error;
    }
}

// Update user menu with current user info
function updateUserMenu() {
    const userMenuName = document.getElementById('userMenuName');
    if (userMenuName) {
        if (currentUserProfile) {
            userMenuName.textContent = currentUserProfile.displayName || currentUserProfile.email || 'User';
        } else if (currentUser) {
            userMenuName.textContent = currentUser.displayName || currentUser.email || 'User';
        } else {
            userMenuName.textContent = 'User';
        }
    }
    
    // Show/hide Users nav link based on role
    const usersNavLink = document.getElementById('usersNavLink');
    if (usersNavLink) {
        if (currentUserProfile && ['admin', 'super_admin'].includes(currentUserProfile.role)) {
            usersNavLink.style.display = 'inline-block';
        } else {
            usersNavLink.style.display = 'none';
        }
    }
    
    // Hide Finance nav link for maintenance users
    const financeNavLinks = document.querySelectorAll('.sidebar-nav-link[data-page="finance"]');
    financeNavLinks.forEach(link => {
        if (currentUserProfile && currentUserProfile.role === 'maintenance') {
            link.style.display = 'none';
        } else {
            link.style.display = 'inline-block';
        }
    });
    
    // Hide Add Property button for maintenance users
    const addPropertyBtn = document.getElementById('addPropertyBtn');
    if (addPropertyBtn) {
        if (currentUserProfile && currentUserProfile.role === 'maintenance') {
            addPropertyBtn.style.display = 'none';
        } else {
            addPropertyBtn.style.display = 'inline-block';
        }
    }
}

// Handle permission errors globally
let permissionErrorShown = false;

function handlePermissionError(context = '') {
    // Only show modal if user is actually logged in
    if (!currentUser || !auth || !auth.currentUser) {
        // No user logged in, just log the error silently
        return;
    }
    
    // Only show modal once per session
    if (permissionErrorShown) {
        return;
    }
    
    let message = 'You do not have permission to access this system.';
    if (context) {
        message = `You do not have permission to access ${context}.`;
    }
    message += ' Please contact a system administrator to activate your account and grant permissions.';
    
    showPermissionDeniedModal(message);
    permissionErrorShown = true;
}

// Show permission denied modal
function showPermissionDeniedModal(message) {
    // Remove existing modal if present
    const existingModal = document.getElementById('permissionDeniedModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'permissionDeniedModal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Account Access Required</h2>
                <button class="close-btn" onclick="closePermissionDeniedModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: #64748b;">${message}</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e293b;">Contact System Administrator:</p>
                    <p style="margin: 0; color: #475569;">
                        <strong>Email:</strong> <a href="mailto:thomas.ryan.crosby@gmail.com" style="color: #667eea; text-decoration: none;">thomas.ryan.crosby@gmail.com</a>
                    </p>
                </div>
                <button class="btn btn-secondary" onclick="closePermissionDeniedModal()" style="width: 100%;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Close permission denied modal
window.closePermissionDeniedModal = function() {
    const modal = document.getElementById('permissionDeniedModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};

// Toggle password visibility
window.togglePasswordVisibility = function(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const eyeIcon = button.querySelector('.eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        if (eyeIcon) eyeIcon.textContent = '🙈';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        if (eyeIcon) eyeIcon.textContent = '👁️';
        button.setAttribute('aria-label', 'Show password');
    }
};

// Show no account found modal
function showNoAccountModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('noAccountModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'noAccountModal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>No Account Found</h2>
                <button class="close-btn" onclick="closeNoAccountModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: #64748b;">We couldn't find an account with those credentials. Would you like to create a new account?</p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeNoAccountModal()" style="flex: 1;">Cancel</button>
                    <button class="btn btn-primary" onclick="closeNoAccountModal(); showSignupPage();" style="flex: 1;">Sign Up</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Close no account modal
window.closeNoAccountModal = function() {
    const modal = document.getElementById('noAccountModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};

// Show authentication pages
function showAuthPages(forceLogin = false) {
    const landingPage = document.getElementById('landingPage');
    const authPages = document.getElementById('authPages');
    const appContainer = document.getElementById('appContainer');
    
    if (landingPage) landingPage.style.display = 'none';
    if (appContainer) appContainer.style.display = 'none';
    if (authPages) {
        authPages.style.display = 'block';
        // Check hash routing first, unless forced to show login
        if (!forceLogin) {
            const hash = window.location.hash;
            if (hash === '#signup') {
                showSignupPage();
                return;
            } else if (hash === '#login') {
                showLoginPage();
                return;
            }
        }
        // Default to login page
        showLoginPage();
    }
}

// Show application
function showApplication() {
    const landingPage = document.getElementById('landingPage');
    const authPages = document.getElementById('authPages');
    const appContainer = document.getElementById('appContainer');
    
    if (landingPage) landingPage.style.display = 'none';
    if (authPages) authPages.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
}

// Show login page
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    const passwordResetPage = document.getElementById('passwordResetPage');
    
    if (loginPage) loginPage.style.display = 'block';
    if (signupPage) signupPage.style.display = 'none';
    if (passwordResetPage) passwordResetPage.style.display = 'none';
}

// Show signup page
function showSignupPage() {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    const passwordResetPage = document.getElementById('passwordResetPage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (signupPage) signupPage.style.display = 'block';
    if (passwordResetPage) passwordResetPage.style.display = 'none';
}

// Show password reset page
function showPasswordResetPage() {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    const passwordResetPage = document.getElementById('passwordResetPage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (signupPage) signupPage.style.display = 'none';
    if (passwordResetPage) passwordResetPage.style.display = 'block';
}

// Initialize landing page and app
function initLandingPage() {
    const launchAppBtn = document.getElementById('launchAppBtn');
    const landingPage = document.getElementById('landingPage');
    const authPages = document.getElementById('authPages');
    
    if (launchAppBtn && landingPage) {
        launchAppBtn.addEventListener('click', function() {
            console.log('Launch Application button clicked');
            landingPage.style.display = 'none';
            // Check if user is authenticated
            if (currentUser) {
                showApplication();
            } else {
                showAuthPages();
            }
        });
        console.log('Landing page initialized - Launch button ready');
    }
    
    // Initialize auth pages navigation
    initAuthPages();
    
    // Start app initialization
    startApp();
}

// Initialize authentication pages
function initAuthPages() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Remove any existing listeners by replacing the form
        loginForm.onsubmit = null;
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form initialized');
    } else {
        console.warn('⚠️ Login form not found');
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        // Remove any existing listeners by replacing the form
        signupForm.onsubmit = null;
        signupForm.addEventListener('submit', handleSignup);
        console.log('✅ Signup form initialized');
    } else {
        console.warn('⚠️ Signup form not found');
    }
    
    // Password reset form
    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Navigation links
    const showSignupLink = document.getElementById('showSignupLink');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupPage();
        });
    }
    
    const showLoginLink = document.getElementById('showLoginLink');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPage();
        });
    }
    
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordResetPage();
        });
    }
    
    const backToLoginLink = document.getElementById('backToLoginLink');
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPage();
        });
    }
    
    // Google Sign-In button
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    try {
        if (!auth) {
            throw new Error('Authentication not initialized');
        }
        
        // Set flag to indicate user is actively logging in (not a page load)
        // This prevents the "Remember Me" check from running on fresh logins
        isUserActivelyLoggingIn = true;
        
        // Set persistence BEFORE sign-in
        // Note: setPersistence must be called before signInWithEmailAndPassword
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        // Store "Remember Me" preference in sessionStorage (clears when tab closes)
        // This allows us to check on page load if user should be auto-logged in
        if (rememberMe) {
            sessionStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberMe', 'true'); // Also store in localStorage for cross-tab consistency
        } else {
            // Clear the flag so user will be signed out on next page load
            sessionStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberMe');
        }
        
        // If "Remember Me" is not checked, ensure we're using SESSION persistence
        // This means the session will only last for the current browser session
        await auth.setPersistence(persistence);
        
        // Sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login successful');
        
        // Note: isUserActivelyLoggingIn flag will be cleared in onAuthStateChanged handler
        
        // Update last login (if profile exists) - do this after auth state change
        // Don't block login if this fails
        if (userCredential.user && db) {
            // Use setTimeout to ensure this happens after auth state change
            setTimeout(async () => {
                try {
                    const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
                    if (userDoc.exists) {
            await db.collection('users').doc(userCredential.user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
                        console.log('✅ Last login updated');
                    }
                    // If profile doesn't exist, loadUserProfile will create it
                } catch (updateError) {
                    // Silently fail - this is not critical for login
                    console.warn('Could not update last login (non-critical):', updateError.message);
                    // Continue anyway - profile creation will happen in loadUserProfile
                }
            }, 100);
        }
        
        // Auth state change will handle showing the app
        // The onAuthStateChanged handler will process the user and show the application
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login.';
        
        // Check for invalid credential errors - distinguish between wrong password and user not found
        if (error.code === 'auth/wrong-password') {
            // Wrong password - show specific error message
            if (errorDiv) {
                errorDiv.textContent = 'Invalid password. Please try again.';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        if (error.code === 'auth/invalid-credential') {
            // Could be either wrong password or user not found
            // Firebase sometimes returns invalid-credential for both cases
            // Try to be more specific if possible
            if (errorDiv) {
                errorDiv.textContent = 'Invalid email or password. Please check your credentials and try again.';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        if (error.code === 'auth/user-not-found') {
            // User not found - show modal for account not found
            showNoAccountModal();
            return;
        }
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed login attempts. Please try again later.';
                break;
            default:
                errorMessage = error.message || 'Failed to sign in. Please try again.';
        }
        
        if (errorDiv) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const fullName = document.getElementById('signupFullName').value;
    const phone = document.getElementById('signupPhone').value;
    const errorDiv = document.getElementById('signupError');
    const successDiv = document.getElementById('signupSuccess');
    
    // Clear previous messages
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    // Validate password match
    if (password !== passwordConfirm) {
        if (errorDiv) {
            errorDiv.textContent = 'Passwords do not match.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        if (errorDiv) {
            errorDiv.textContent = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    try {
        if (!auth) {
            throw new Error('Authentication not initialized');
        }
        
        // Normalize email (lowercase, trim) for consistent matching
        const normalizedEmail = (email || '').toLowerCase().trim();
        
        if (!normalizedEmail) {
            throw new Error('Email is required');
        }
        
        console.log('🔵 Starting signup for email:', normalizedEmail);
        
        // Set flag to indicate user is actively signing up (not a page load)
        // This prevents the "Remember Me" check from signing them out
        isUserActivelyLoggingIn = true;
        
        // CRITICAL: Check for pending invitation BEFORE creating account
        // This allows us to handle "email already exists" error properly
        console.log('🔍 Checking for pending invitation BEFORE account creation...');
        let pendingUserBeforeSignup = null;
        if (db) {
            try {
                pendingUserBeforeSignup = await checkPendingInvitation(normalizedEmail);
                if (pendingUserBeforeSignup) {
                    console.log('✅ Found pending invitation BEFORE signup - user is invited');
                } else {
                    console.log('ℹ️ No pending invitation found - regular signup');
                }
            } catch (checkError) {
                console.warn('⚠️ Could not check pending invitation (non-critical):', checkError.message);
                // Continue with signup - we'll check again after account creation
            }
        }
        
        // Create user account
        let userCredential;
        try {
            userCredential = await auth.createUserWithEmailAndPassword(normalizedEmail, password);
        console.log('✅ Account created successfully');
        } catch (createError) {
            // Handle "email already exists" error
            if (createError.code === 'auth/email-already-in-use') {
                // If we found a pending invitation, guide user to sign in
                if (pendingUserBeforeSignup) {
                    if (errorDiv) {
                        errorDiv.innerHTML = `
                            <p>An account with this email already exists. Since you have a pending invitation, please sign in to complete your account setup.</p>
                            <p style="margin-top: 10px;">
                                <a href="#login" style="color: #667eea; text-decoration: underline; font-weight: 600;">Go to Sign In</a> | 
                                <a href="#" id="forgotPasswordFromSignup" style="color: #667eea; text-decoration: underline;">Forgot Password?</a>
                            </p>
                        `;
                        errorDiv.style.display = 'block';
                        
                        // Add event listener for forgot password link
                        const forgotPasswordLink = document.getElementById('forgotPasswordFromSignup');
                        if (forgotPasswordLink) {
                            forgotPasswordLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                showPasswordResetPage();
                            });
                        }
                    }
                    return;
                } else {
                    // No pending invitation - regular account exists
                    if (errorDiv) {
                        errorDiv.textContent = 'An account with this email already exists. Please sign in instead.';
                        errorDiv.style.display = 'block';
                    }
                    return;
                }
            }
            // Re-throw other errors
            throw createError;
        }
        
        // Update user display name
        await userCredential.user.updateProfile({
            displayName: fullName
        });
        
        // Send email verification (Firebase Auth built-in)
        try {
            await userCredential.user.sendEmailVerification();
            console.log('✅ Email verification sent');
        } catch (verifyError) {
            console.warn('Could not send email verification:', verifyError);
            // Don't fail signup if verification email fails
        }
        
        // Use sync function to ensure everything is in sync and prevent duplicates
        console.log('🔄 Syncing user data after account creation...');
        let syncedProfile;
        try {
            syncedProfile = await syncUserData(userCredential.user.uid, normalizedEmail);
            console.log('✅ User data synced:', syncedProfile);
        } catch (syncError) {
            console.error('❌ Failed to sync user data:', syncError);
        await auth.signOut();
            if (errorDiv) {
                errorDiv.textContent = `Account created but failed to sync data: ${syncError.message}. Please contact an administrator.`;
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        // Check if user is active (invited users are active, self-registered are not)
        if (syncedProfile.isActive) {
            // User is active - invited user completed signup
            console.log('✅ Invited user completed signup, allowing access');
            sessionStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberMe', 'true');
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        // Show success message
        if (successDiv) {
                successDiv.innerHTML = '<p>Account created successfully! You are now logged in.</p>';
            successDiv.style.display = 'block';
        }
        
        // Reset form
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.reset();
            }
            
            // Reload to show app after a brief delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            return;
        } else {
            // User is inactive - sign out and show message
            console.log('⚠️ User is inactive, signing out');
            await auth.signOut();
            
            if (successDiv) {
                successDiv.innerHTML = '<p>Account created successfully! Your account is pending admin approval. You\'ll receive an email when it\'s activated.</p>';
                successDiv.style.display = 'block';
            }
            
            // Reset form
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.reset();
            }
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'An error occurred during signup.';
        
        // Check if this is a permission error from profile creation
        if (error.code === 'permission-denied' || error.message.includes('permission') || error.message.includes('Permission')) {
            errorMessage = 'Your account has been created but requires admin approval. Please contact a system administrator to activate your account.';
        } else if (error.code === 'auth/email-already-in-use') {
            // Email already exists in Firebase Auth
            // Check if there's a pending invitation for this email
            const normalizedEmail = (email || '').toLowerCase().trim();
            const pendingUser = await checkPendingInvitation(normalizedEmail);
            
            if (pendingUser) {
                // There's a pending invitation - user should sign in instead
                errorMessage = 'An account with this email already exists. Please sign in to complete your account setup. If you don\'t remember your password, use the "Forgot Password" link.';
                // Show link to login page
                if (errorDiv) {
                    errorDiv.innerHTML = `
                        <p>${errorMessage}</p>
                        <p style="margin-top: 10px;">
                            <a href="#login" style="color: #667eea; text-decoration: underline;">Go to Sign In</a> | 
                            <a href="#" id="forgotPasswordFromSignup" style="color: #667eea; text-decoration: underline;">Forgot Password?</a>
                        </p>
                    `;
                    errorDiv.style.display = 'block';
                    
                    // Add event listener for forgot password link
                    const forgotPasswordLink = document.getElementById('forgotPasswordFromSignup');
                    if (forgotPasswordLink) {
                        forgotPasswordLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            showPasswordResetPage();
                        });
                    }
                }
                return;
            } else {
                // No pending invitation - regular account exists
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            }
        } else {
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                break;
            default:
                errorMessage = error.message || 'Failed to create account. Please try again.';
            }
        }
        
        if (errorDiv) {
            // Only set text if we haven't already set HTML content
            if (!errorDiv.innerHTML || errorDiv.innerHTML === errorDiv.textContent) {
            errorDiv.textContent = errorMessage;
            }
            errorDiv.style.display = 'block';
        }
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    try {
        if (!auth) {
            throw new Error('Authentication not initialized');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Set flag to indicate user is actively logging in (not a page load)
        isUserActivelyLoggingIn = true;
        
        // Set persistence to LOCAL for Google sign-in (users typically want to stay logged in)
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        sessionStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMe', 'true');
        
        // Sign in with Google
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('✅ Google Sign-In successful:', user.email);
        
        // Check if user profile exists, create if not
        if (user && db) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                // Create user profile
                const normalizedEmail = (user.email || '').toLowerCase().trim();
                
                // Check for pending invitation
                const pendingUser = await checkPendingInvitation(normalizedEmail);
                
                if (pendingUser) {
                    // Link to pending invitation
                    await linkPendingUserToAccount(user.uid, normalizedEmail);
                } else {
                    // Create default profile
                    await createUserProfile(user.uid, {
                        email: normalizedEmail,
                        displayName: user.displayName || normalizedEmail.split('@')[0] || 'User',
                        profile: {}
                    });
                }
            }
        }
        
        // Auth state change will handle showing the app
    } catch (error) {
        console.error('Google Sign-In error:', error);
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            if (error.code === 'auth/popup-closed-by-user') {
                errorDiv.textContent = 'Sign-in was cancelled.';
            } else if (error.code === 'auth/popup-blocked') {
                errorDiv.textContent = 'Popup was blocked. Please allow popups for this site.';
            } else {
                errorDiv.textContent = 'Error signing in with Google: ' + (error.message || 'Unknown error');
            }
            errorDiv.style.display = 'block';
        }
    }
}

// Handle password reset
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const errorDiv = document.getElementById('resetError');
    const successDiv = document.getElementById('resetSuccess');
    
    // Clear previous messages
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    try {
        if (!auth) {
            throw new Error('Authentication not initialized');
        }
        
        await auth.sendPasswordResetEmail(email, {
            // Optional: Customize the action URL
            url: window.location.origin + '/#login',
            handleCodeInApp: false
        });
        console.log('✅ Password reset email sent to:', email);
        
        if (successDiv) {
            successDiv.style.display = 'block';
            successDiv.innerHTML = `
                <p><strong>Password reset link sent!</strong></p>
                <p>Check your email inbox (and spam folder) for instructions to reset your password.</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    If you don't see the email, check your spam folder or contact your administrator.
                </p>
            `;
        }
        
        // Reset form
        document.getElementById('passwordResetForm').reset();
        
    } catch (error) {
        console.error('Password reset error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'An error occurred.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many requests. Please try again later.';
                break;
            default:
                errorMessage = error.message || 'Failed to send reset email. Please try again.';
                // Add helpful message if it's a configuration issue
                if (error.code && error.code.includes('email') || error.message.includes('email')) {
                    errorMessage += ' Note: Email sending may need to be configured in Firebase Console → Authentication → Templates → SMTP settings.';
                }
        }
        
        if (errorDiv) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }
}

// Logout function
window.logout = async function() {
    try {
        if (auth) {
            await auth.signOut();
            console.log('✅ Logged out successfully');
            currentUser = null;
            currentUserProfile = null;
            // Clear "Remember Me" flags on logout
            sessionStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberMe');
            showAuthPages();
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
};

// Setup user menu dropdown
function setupUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.querySelector('.user-menu-dropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userMenuBtn && userMenuDropdown) {
        // Toggle dropdown on button click
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.remove('active');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.logout();
        });
    }
    
    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            userMenuDropdown.classList.remove('active');
            switchPage('profile');
        });
    }
}

// Check if DOM is already loaded, if so run immediately, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initLandingPage();
    });
} else {
    // DOM is already loaded, run immediately
    initLandingPage();
}

function initializeApp() {
    setupEventListeners();
    setupLeaseEventListeners();
    setupNavigation();
    setupUserMenu();
    
    // Restore saved view state
    const savedView = localStorage.getItem('currentView');
    if (savedView && ['active', 'monitoring', 'completed', 'deleted'].includes(savedView)) {
        currentView = savedView;
        switchView(savedView);
    }
    
    // Only load data if user is authenticated
    if (currentUser && auth && auth.currentUser) {
        loadProperties();
        loadTickets();
    }
    
    showPage(currentPage);
    updateFABsVisibility();
    
    // Update user menu when app initializes
    if (currentUserProfile || currentUser) {
        updateUserMenu();
    }
}

// Navigation
function setupNavigation() {
    // Sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = e.target.closest('.sidebar-nav-link').getAttribute('data-page');
            if (page) {
            switchPage(page);
            }
        });
    });
    
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarNav = document.getElementById('sidebarNav');
    const mainContentWrapper = document.querySelector('.main-content-wrapper');
    
    if (sidebarToggle && sidebarNav) {
        // Load saved state from localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebarNav.classList.add('collapsed');
            if (mainContentWrapper) {
                mainContentWrapper.classList.add('sidebar-collapsed');
            }
        }
        
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarNav.classList.toggle('collapsed');
            if (mainContentWrapper) {
                mainContentWrapper.classList.toggle('sidebar-collapsed');
            }
            
            // Save state to localStorage
            const isNowCollapsed = sidebarNav.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isNowCollapsed.toString());
            
            // Update toggle button aria label
            sidebarToggle.setAttribute('aria-label', isNowCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
            sidebarToggle.setAttribute('title', isNowCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
        });
        
        // Update tooltips for navigation links when collapsed
        const navLinks = document.querySelectorAll('.sidebar-nav-link');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page && !link.getAttribute('title')) {
                const pageTitles = {
                    'maintenance': 'Maintenance',
                    'properties': 'Properties',
                    'tenants': 'Tenants',
                    'leases': 'Leases',
                    'finance': 'Finance',
                    'users': 'Users'
                };
                link.setAttribute('title', pageTitles[page] || page);
            }
        });
    }
}

function switchPage(page) {
    currentPage = page;
    localStorage.setItem('currentPage', page);
    showPage(page);
    
    // Update active nav link
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // Update page title
    updatePageTitle(page);
}

function updatePageTitle(page) {
    const pageTitles = {
        'maintenance': 'Maintenance',
        'properties': 'Properties',
        'tenants': 'Tenants',
        'leases': 'Leases',
        'finance': 'Finance',
        'users': 'User Management',
        'profile': 'Profile'
    };
    
    const pageTitleElement = document.getElementById('currentPageTitle');
    if (pageTitleElement && pageTitles[page]) {
        pageTitleElement.textContent = pageTitles[page];
    }
}

function showPage(page) {
    // Prevent maintenance users from accessing finance page
    if (page === 'finance' && currentUserProfile && currentUserProfile.role === 'maintenance') {
        console.warn('⚠️ Maintenance users cannot access finance page');
        switchPage('maintenance'); // Redirect to maintenance page
        return;
    }
    
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
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
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
        // Reload property filter dropdown when showing tenants page
        loadPropertiesForTenantFilter();
    } else if (page === 'maintenance') {
        loadTickets();
    } else if (page === 'leases') {
        loadLeases();
    } else if (page === 'finance') {
        loadFinance();
    } else if (page === 'users') {
        loadUsers();
    } else if (page === 'profile') {
        loadProfile();
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
    
    // Tenant selection handler
    const ticketTenantSelect = document.getElementById('ticketTenantSelect');
    if (ticketTenantSelect) {
        ticketTenantSelect.addEventListener('change', handleTenantSelectionChange);
    }
    
    // Handle "Other" option for user dropdowns
    function setupUserDropdownOtherToggle(selectId, otherInputId) {
        const select = document.getElementById(selectId);
        const otherInput = document.getElementById(otherInputId);
        if (select && otherInput) {
            select.addEventListener('change', function() {
                if (this.value === '__other__') {
                    otherInput.style.display = 'block';
                    otherInput.required = select.required;
                } else {
                    otherInput.style.display = 'none';
                    otherInput.value = '';
                    otherInput.required = false;
                }
            });
        }
    }
    
    setupUserDropdownOtherToggle('requestedBy', 'requestedByOther');
    setupUserDropdownOtherToggle('managedBy', 'managedByOther');
    setupUserDropdownOtherToggle('assignedTo', 'assignedToOther');
    setupUserDropdownOtherToggle('completedBy', 'completedByOther');
    setupUserDropdownOtherToggle('completionCompletedBy', 'completionCompletedByOther');
    
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
    
    // Drag and drop handlers for before photo
    const beforePhotoDropZone = document.getElementById('beforePhotoDropZone');
    if (beforePhotoDropZone) {
        setupDragAndDrop(beforePhotoDropZone, beforePhoto, 'before');
    }
    
    // Drag and drop handlers for after photo
    const afterPhotoDropZone = document.getElementById('afterPhotoDropZone');
    if (afterPhotoDropZone) {
        setupDragAndDrop(afterPhotoDropZone, afterPhoto, 'after');
    }
    
    // Time allocation toggle handler
    const enableTimeAllocationToggle = document.getElementById('enableTimeAllocation');
    const timeAllocationGroup = document.getElementById('timeAllocationGroup');
    if (enableTimeAllocationToggle && timeAllocationGroup) {
        enableTimeAllocationToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                timeAllocationGroup.style.display = 'block';
            } else {
                timeAllocationGroup.style.display = 'none';
                document.getElementById('timeAllocated').value = '';
                document.getElementById('billingRate').value = '';
                // Reset billing type to hourly
                const billingTypeHourly = document.getElementById('billingTypeHourly');
                if (billingTypeHourly) billingTypeHourly.checked = true;
            }
        });
        // Set initial state (default to hidden since toggle defaults to unchecked)
        timeAllocationGroup.style.display = enableTimeAllocationToggle.checked ? 'block' : 'none';
    }
    
    // Completion modal file handlers (check if elements exist)
    const completionAfterPhoto = document.getElementById('completionAfterPhoto');
    const completionAfterPhotoDropZone = document.getElementById('completionAfterPhotoDropZone');
    const removeCompletionAfterPhoto = document.getElementById('removeCompletionAfterPhoto');
    if (completionAfterPhoto) {
        completionAfterPhoto.addEventListener('change', (e) => handleCompletionFileSelect(e));
    }
    
    // Drag and drop handler for completion after photo
    if (completionAfterPhotoDropZone && completionAfterPhoto) {
        setupDragAndDrop(completionAfterPhotoDropZone, completionAfterPhoto, 'completion');
    }
    if (removeCompletionAfterPhoto) {
        removeCompletionAfterPhoto.addEventListener('click', () => removeCompletionFile());
    }
    
    // Workflow modal time allocation toggle handler
    const workflowEnableTimeAllocationToggle = document.getElementById('workflowEnableTimeAllocation');
    const workflowTimeAllocationFields = document.getElementById('workflowTimeAllocationFields');
    if (workflowEnableTimeAllocationToggle && workflowTimeAllocationFields) {
        workflowEnableTimeAllocationToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                workflowTimeAllocationFields.style.display = 'block';
            } else {
                workflowTimeAllocationFields.style.display = 'none';
                const workflowTimeAllocated = document.getElementById('workflowTimeAllocated');
                const workflowBillingRate = document.getElementById('workflowBillingRate');
                if (workflowTimeAllocated) workflowTimeAllocated.value = '';
                if (workflowBillingRate) workflowBillingRate.value = '';
                // Reset billing type to hourly
                const workflowBillingTypeHourly = document.getElementById('workflowBillingTypeHourly');
                if (workflowBillingTypeHourly) workflowBillingTypeHourly.checked = true;
            }
        });
    }
    
    // Update billing rate label based on billing type in workflow modal
    const workflowBillingTypeHourly = document.getElementById('workflowBillingTypeHourly');
    const workflowBillingTypeFlat = document.getElementById('workflowBillingTypeFlat');
    const workflowBillingRateLabel = document.getElementById('workflowBillingRateLabel');
    const workflowBillingRateInput = document.getElementById('workflowBillingRate');
    
    if (workflowBillingTypeHourly && workflowBillingTypeFlat && workflowBillingRateLabel && workflowBillingRateInput) {
        function updateWorkflowBillingRateLabel() {
            if (workflowBillingTypeHourly.checked) {
                workflowBillingRateLabel.textContent = 'Billing Rate ($/hour)';
                workflowBillingRateInput.placeholder = 'e.g., 75.00';
            } else if (workflowBillingTypeFlat.checked) {
                workflowBillingRateLabel.textContent = 'Flat Rate Amount ($)';
                workflowBillingRateInput.placeholder = 'e.g., 500.00';
            }
        }
        
        workflowBillingTypeHourly.addEventListener('change', updateWorkflowBillingRateLabel);
        workflowBillingTypeFlat.addEventListener('change', updateWorkflowBillingRateLabel);
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
            // Reload tenants with filter - use loadTenants() which properly filters for maintenance users
            loadTenants();
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
            
            // Load documents if documents tab is clicked
            if (tabName === 'documents' && currentTenantIdForDetail) {
                loadTenantDocuments(currentTenantIdForDetail);
            }
            
            updateFABsVisibility();
        });
    });
    
    // Tenant document upload
    const uploadDocumentBtn = document.getElementById('uploadDocumentBtn');
    const tenantDocumentInput = document.getElementById('tenantDocumentInput');
    
    if (uploadDocumentBtn) {
        uploadDocumentBtn.addEventListener('click', () => {
            if (tenantDocumentInput) {
                tenantDocumentInput.click();
            }
        });
    }
    
    if (tenantDocumentInput) {
        tenantDocumentInput.addEventListener('change', async function(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            if (!currentTenantIdForDetail) {
                alert('Error: No tenant selected');
                return;
            }
            
            const uploadBtn = document.getElementById('uploadDocumentBtn');
            const originalText = uploadBtn ? uploadBtn.textContent : 'Upload Document';
            
            try {
                if (uploadBtn) {
                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'Uploading...';
                }
                
                // Upload all selected files
                let uploadedCount = 0;
                for (let i = 0; i < files.length; i++) {
                    try {
                        await uploadTenantDocument(currentTenantIdForDetail, files[i]);
                        uploadedCount++;
                    } catch (uploadError) {
                        console.error(`Error uploading file ${files[i].name}:`, uploadError);
                        // Continue with other files
                    }
                }
                
                // Reload documents
                loadTenantDocuments(currentTenantIdForDetail);
                
                // Reset file input
                tenantDocumentInput.value = '';
                
                if (uploadedCount > 0) {
                    alert(`Successfully uploaded ${uploadedCount} document(s)`);
                } else {
                    alert('No documents were uploaded. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading documents:', error);
                alert('Error uploading documents: ' + error.message);
            } finally {
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = originalText;
                }
            }
        });
    }
    
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
    
    // User management event listeners
    const userSearch = document.getElementById('userSearch');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const inviteUserBtn = document.getElementById('inviteUserBtn');
    
    if (userSearch) {
        userSearch.addEventListener('input', () => {
            // Re-render users with current filters
            if (currentPage === 'users' && Object.keys(allUsers).length > 0) {
                renderUsersList(allUsers);
            }
        });
    }
    
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', () => {
            if (currentPage === 'users' && Object.keys(allUsers).length > 0) {
                renderUsersList(allUsers);
            }
        });
    }
    
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', () => {
            if (currentPage === 'users' && Object.keys(allUsers).length > 0) {
                renderUsersList(allUsers);
            }
        });
    }
    
    if (inviteUserBtn) {
        inviteUserBtn.addEventListener('click', () => {
            openInviteUserModal();
        });
    }
    
    // Invite user modal event listeners
    const inviteUserForm = document.getElementById('inviteUserForm');
    const closeInviteUserModalBtn = document.getElementById('closeInviteUserModal');
    const cancelInviteUserFormBtn = document.getElementById('cancelInviteUserForm');
    
    if (inviteUserForm) {
        inviteUserForm.addEventListener('submit', handleInviteUser);
    }
    
    if (closeInviteUserModalBtn) {
        closeInviteUserModalBtn.addEventListener('click', closeInviteUserModal);
    }
    
    if (cancelInviteUserFormBtn) {
        cancelInviteUserFormBtn.addEventListener('click', closeInviteUserModal);
    }
    
    // User detail modal event listeners
    const closeUserDetailModalBtn = document.getElementById('closeUserDetailModal');
    const cancelUserDetailFormBtn = document.getElementById('cancelUserDetailForm');
    const userDetailForm = document.getElementById('userDetailForm');
    const saveUserPropertiesBtn = document.getElementById('saveUserPropertiesBtn');
    
    if (closeUserDetailModalBtn) {
        closeUserDetailModalBtn.addEventListener('click', closeUserDetailModal);
    }
    
    if (cancelUserDetailFormBtn) {
        cancelUserDetailFormBtn.addEventListener('click', closeUserDetailModal);
    }
    
    if (userDetailForm) {
        userDetailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!editingUserId) {
                alert('No user selected.');
                return;
            }
            
            try {
                const userData = {
                    displayName: document.getElementById('userDetailDisplayName').value,
                    role: document.getElementById('userDetailRole').value,
                    isActive: document.getElementById('userDetailStatus').value === 'true',
                    phone: document.getElementById('userDetailPhone').value,
                    title: document.getElementById('userDetailTitle').value,
                    department: document.getElementById('userDetailDepartment').value,
                    notes: document.getElementById('userDetailNotes').value
                };
                
                await saveUserDetails(editingUserId, userData);
                alert('User updated successfully!');
                
                // Reload users list
                loadUsers();
                
                // Reload current user data in modal
                await window.openUserDetailModal(editingUserId, true);
                
            } catch (error) {
                console.error('Error saving user:', error);
                alert('Error saving user: ' + error.message);
            }
        });
    }
    
    if (saveUserPropertiesBtn) {
        saveUserPropertiesBtn.addEventListener('click', async () => {
            if (!editingUserId) {
                alert('No user selected.');
                return;
            }
            
            try {
                // Get checked property IDs
                const checkboxes = document.querySelectorAll('#userPropertyCheckboxes input[type="checkbox"]:checked');
                const propertyIds = Array.from(checkboxes).map(cb => cb.value);
                
                await saveUserProperties(editingUserId, propertyIds);
                alert('Property assignments updated successfully!');
                
                // Reload user properties
                const userDoc = await db.collection('users').doc(editingUserId).get();
                if (userDoc.exists) {
                    const user = { id: userDoc.id, ...userDoc.data() };
                    await loadUserProperties(user);
                }
                
                // Reload users list
                loadUsers();
                
            } catch (error) {
                console.error('Error saving user properties:', error);
                alert('Error saving property assignments: ' + error.message);
            }
        });
    }
    
    // User detail tab switching
    document.querySelectorAll('[data-user-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-user-tab');
            switchUserDetailTab(tabName);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('userDetailModal');
        if (modal && e.target === modal) {
            closeUserDetailModal();
        }
    });
    
    // Profile page event listeners
    // Profile tabs
    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-profile-tab');
            switchProfileTab(tabName);
        });
    });
    
    // Profile personal information form
    const profilePersonalForm = document.getElementById('profilePersonalForm');
    if (profilePersonalForm) {
        profilePersonalForm.addEventListener('submit', handleProfilePersonalSubmit);
    }
    
    // Profile password form
    const profilePasswordForm = document.getElementById('profilePasswordForm');
    if (profilePasswordForm) {
        profilePasswordForm.addEventListener('submit', handleProfilePasswordSubmit);
    }
    
    // Profile preferences form
    const profilePreferencesForm = document.getElementById('profilePreferencesForm');
    if (profilePreferencesForm) {
        profilePreferencesForm.addEventListener('submit', handleProfilePreferencesSubmit);
    }
    
    // Resend verification email
    const resendVerificationBtn = document.getElementById('resendVerificationBtn');
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', handleResendVerification);
    }
    
    // Avatar change
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');
    if (changeAvatarBtn && avatarFileInput) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarFileInput.click();
        });
        if (avatarFileInput) {
            avatarFileInput.addEventListener('change', handleAvatarChange);
        }
    }
}

// Profile page functions
function switchProfileTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-profile-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById('profile' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab');
    if (activeContent) {
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
    }
}

async function handleProfilePersonalSubmit(e) {
    e.preventDefault();
    if (!currentUser || !auth || !auth.currentUser) {
        alert('You must be logged in to update your profile.');
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        const updates = {
            displayName: document.getElementById('profileFormDisplayName').value.trim(),
            phone: document.getElementById('profileFormPhone').value.trim() || null,
            title: document.getElementById('profileFormTitle').value.trim() || null,
            department: document.getElementById('profileFormDepartment').value.trim() || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(userId).update(updates);
        
        // Update current user profile
        currentUserProfile = { ...currentUserProfile, ...updates };
        
        // Reload profile to show updated data
        await loadProfile();
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    }
}

async function handleProfilePasswordSubmit(e) {
    e.preventDefault();
    if (!currentUser || !auth || !auth.currentUser) {
        alert('You must be logged in to change your password.');
        return;
    }
    
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }
    
    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
        );
        await auth.currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await auth.currentUser.updatePassword(newPassword);
        
        // Clear form
        document.getElementById('profilePasswordForm').reset();
        
        alert('Password updated successfully!');
    } catch (error) {
        console.error('Error updating password:', error);
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect.');
        } else {
            alert('Error updating password: ' + error.message);
        }
    }
}

async function handleProfilePreferencesSubmit(e) {
    e.preventDefault();
    if (!currentUser || !auth || !auth.currentUser) {
        alert('You must be logged in to update preferences.');
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        const preferences = {
            theme: document.getElementById('profileTheme').value,
            language: document.getElementById('profileLanguage').value,
            timezone: document.getElementById('profileTimezone').value,
            emailNotifications: document.getElementById('profileEmailNotifications').checked,
            desktopNotifications: document.getElementById('profileDesktopNotifications').checked
        };
        
        await db.collection('users').doc(userId).update({
            preferences: preferences,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Preferences saved successfully!');
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Error saving preferences: ' + error.message);
    }
}

async function handleResendVerification() {
    if (!auth || !auth.currentUser) {
        alert('You must be logged in to resend verification email.');
        return;
    }
    
    try {
        await auth.currentUser.sendEmailVerification();
        alert('Verification email sent! Please check your inbox.');
    } catch (error) {
        console.error('Error sending verification email:', error);
        alert('Error sending verification email: ' + error.message);
    }
}

function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB.');
        return;
    }
    
    // TODO: Implement avatar upload to Firebase Storage
    alert('Avatar upload functionality coming soon!');
}

// Property Management
function loadProperties() {
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser || !currentUserProfile) {
        return;
    }
    
    // Build query based on user role
    // For maintenance users with assigned properties, load them individually
    // For others, use full collection query
    if (currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        // Load assigned properties individually (more efficient than complex rules)
        console.log('🔍 Loading assigned properties for maintenance user:', currentUserProfile.assignedProperties);
        const propertyPromises = currentUserProfile.assignedProperties.map(propId => 
            db.collection('properties').doc(propId).get().catch(e => {
                console.warn(`Could not load property ${propId}:`, e);
                return null;
            })
        );
        
        Promise.all(propertyPromises).then((propertyDocs) => {
            const properties = {};
            propertyDocs.forEach(doc => {
                if (doc && doc.exists) {
                    properties[doc.id] = { id: doc.id, ...doc.data() };
                }
            });
            
            // Populate dropdowns
            const select = document.getElementById('propertySelect');
            const ticketPropertySelect = document.getElementById('ticketProperty');
            
            if (select) {
                select.innerHTML = '<option value="">Select a property...</option>';
                Object.keys(properties).forEach(id => {
                    const property = properties[id];
                    const option = new Option(property.name, id);
                    select.appendChild(option);
                });
            }
            
            if (ticketPropertySelect) {
                ticketPropertySelect.innerHTML = '<option value="">Select a property...</option>';
                Object.keys(properties).forEach(id => {
                    const property = properties[id];
                    const ticketOption = new Option(property.name, id);
                    ticketPropertySelect.appendChild(ticketOption);
                });
            }
            
            // Restore selected property
            if (selectedPropertyId && properties[selectedPropertyId]) {
                if (select) select.value = selectedPropertyId;
            } else if (Object.keys(properties).length === 1) {
                // Auto-select if only one property
                selectedPropertyId = Object.keys(properties)[0];
                if (select) select.value = selectedPropertyId;
                localStorage.setItem('selectedPropertyId', selectedPropertyId);
            }
            
            // Set up listeners for changes to assigned properties
            const propertiesRef = properties; // Store reference for listeners
            currentUserProfile.assignedProperties.forEach(propId => {
                db.collection('properties').doc(propId).onSnapshot((doc) => {
                    if (doc.exists) {
                        propertiesRef[doc.id] = { id: doc.id, ...doc.data() };
                        // Update dropdowns
                        if (select) {
                            const existingOption = Array.from(select.options).find(opt => opt.value === doc.id);
                            if (existingOption) {
                                existingOption.textContent = doc.data().name;
                            } else {
                                select.appendChild(new Option(doc.data().name, doc.id));
                            }
                        }
                        if (ticketPropertySelect) {
                            const existingOption = Array.from(ticketPropertySelect.options).find(opt => opt.value === doc.id);
                            if (existingOption) {
                                existingOption.textContent = doc.data().name;
                            } else {
                                ticketPropertySelect.appendChild(new Option(doc.data().name, doc.id));
                            }
                        }
                        renderPropertiesList(propertiesRef);
                    } else {
                        // Property was deleted, remove from list
                        delete propertiesRef[doc.id];
                        // Remove from dropdowns
                        if (select) {
                            const option = Array.from(select.options).find(opt => opt.value === doc.id);
                            if (option) option.remove();
                        }
                        if (ticketPropertySelect) {
                            const option = Array.from(ticketPropertySelect.options).find(opt => opt.value === doc.id);
                            if (option) option.remove();
                        }
                        renderPropertiesList(propertiesRef);
                    }
                }, (error) => {
                    console.warn(`Error listening to property ${propId}:`, error);
                });
            });
            
            renderPropertiesList(properties);
            loadTickets(); // Load tickets after properties are loaded
        }).catch((error) => {
            console.error('Error loading properties:', error);
            if (error.code === 'permission-denied') {
                handlePermissionError('properties');
            }
        });
        return; // Exit early for maintenance users
    }
    
    // For admins, super admins, and property managers - use full collection query
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
            updateCommercialFieldsVisibility(e.target.value).then(() => {
                // Reload tenants when property changes
                loadTenantsForTicketForm(e.target.value);
            });
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
    }, (error) => {
        console.error('Error loading properties:', error);
        if (error.code === 'permission-denied') {
            handlePermissionError('properties');
        }
    });
}

function renderPropertiesList(properties) {
    const list = document.getElementById('propertiesList');
    if (!list) return;
    
    list.innerHTML = '';

    if (Object.keys(properties).length === 0) {
        const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
        const emptyMessage = isMaintenance 
            ? '<p style="color: #999; text-align: center; padding: 20px; grid-column: 1 / -1;">No properties assigned.</p>'
            : '<p style="color: #999; text-align: center; padding: 20px; grid-column: 1 / -1;">No properties yet. Create one above!</p>';
        list.innerHTML = emptyMessage;
        return;
    }

    const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';

    Object.keys(properties).forEach(id => {
        const property = properties[id];
        const item = document.createElement('div');
        item.className = 'property-item';
        const statusBadge = property.status ? `<span class="status-badge status-${property.status.toLowerCase().replace(' ', '-')}">${property.status}</span>` : '';
        const editDeleteButtons = isMaintenance 
            ? '' 
            : `
                <button class="btn-secondary btn-small" onclick="editProperty('${id}')">Edit</button>
                <button class="btn-danger btn-small" onclick="deleteProperty('${id}')">Delete</button>
            `;
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
                ${editDeleteButtons}
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
                const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
                const addUnitButton = isMaintenance 
                    ? '' 
                    : `<button class="btn-primary btn-small" onclick="addUnitToBuilding('${propertyId}', '${buildingId}')">+ Add Unit</button>`;
                buildingSection.innerHTML = `
                    <div class="building-units-header">
                        <div>
                            <h4>${escapeHtml(building.buildingName)}</h4>
                            ${building.buildingAddress ? `<p style="color: #666; font-size: 0.9rem; margin: 5px 0 0 0;">📍 ${escapeHtml(building.buildingAddress)}</p>` : ''}
                            ${buildingUnits.length > 0 ? `<p style="color: #999; font-size: 0.85rem; margin: 5px 0 0 0;">${buildingUnits.length} unit${buildingUnits.length !== 1 ? 's' : ''}</p>` : ''}
                        </div>
                        ${addUnitButton}
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
                    
                    const editDeleteButtons = isMaintenance 
                        ? '' 
                        : `
                            <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                            <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                        `;
                    
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
                                ${editDeleteButtons}
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
                
                const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
                const addUnitButton = isMaintenance 
                    ? '' 
                    : `<button class="btn-primary btn-small" onclick="addUnit('${propertyId}')">+ Add Unit</button>`;
                const propertyLevelSection = document.createElement('div');
                propertyLevelSection.className = 'building-units-section';
                propertyLevelSection.innerHTML = `
                    <div class="building-units-header">
                        <h4>Property-Level Units</h4>
                        ${addUnitButton}
                    </div>
                    <div class="building-units-list" id="units-property-level"></div>
                `;
                unitsList.appendChild(propertyLevelSection);
                
                const propertyLevelList = document.getElementById('units-property-level');
                sortedPropertyLevelUnits.forEach(unit => {
                    const item = document.createElement('div');
                    item.className = 'unit-item';
                    const statusBadge = unit.status ? `<span class="status-badge status-${unit.status.toLowerCase().replace(' ', '-')}">${unit.status}</span>` : '';
                    const editDeleteButtons = isMaintenance 
                        ? '' 
                        : `
                            <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                            <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                        `;
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
                            ${editDeleteButtons}
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
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser || !currentUserProfile) {
        return;
    }
    
    // Build query based on user role
    let ticketsQuery = db.collection('tickets');
    
    // For maintenance users, filter by assigned properties at query level
    if (currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        // Use whereIn to filter tickets by assigned properties
        ticketsQuery = ticketsQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
        console.log('🔍 Filtering tickets for maintenance user by properties:', currentUserProfile.assignedProperties);
    }
    // Admins and super admins can see all tickets (no filter)
    // Property managers are handled by Firestore rules
    
    ticketsQuery.onSnapshot((snapshot) => {
        const tickets = {};
        snapshot.docs.forEach(doc => {
            tickets[doc.id] = { id: doc.id, ...doc.data() };
        });
        renderTickets(tickets);
        updateMetrics(tickets);
    }, (error) => {
        console.error('Error loading tickets:', error);
        if (error.code === 'permission-denied') {
            handlePermissionError('ticket data');
        }
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

    let monitoringCount = 0;

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
        } else if (ticket.status === 'Monitoring') {
            monitoringCount++;
            // Monitoring tickets don't count toward active metrics
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
    const monitoringList = document.getElementById('monitoringTicketsList');
    const completedList = document.getElementById('completedTicketsList');
    const deletedList = document.getElementById('deletedTicketsList');
    
    activeList.innerHTML = '';
    if (monitoringList) monitoringList.innerHTML = '';
    completedList.innerHTML = '';
    if (deletedList) deletedList.innerHTML = '';

    let activeTickets = [];
    let monitoringTickets = [];
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
        } else if (ticket.status === 'Monitoring') {
            monitoringTickets.push(ticket);
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
    monitoringTickets.sort((a, b) => {
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

    if (monitoringList) {
        if (monitoringTickets.length === 0) {
            monitoringList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👁️</div><p>No tickets in monitoring</p></div>';
        } else {
            monitoringTickets.forEach(ticket => {
                monitoringList.appendChild(createTicketCard(ticket));
            });
        }
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
    const isMonitoring = ticket.status === 'Monitoring';
    const statusClass = `status-${ticket.status.toLowerCase().replace(' ', '-')}`;

    // Get assigned to display name
    const assignedToDisplay = ticket.assignedTo || 'Unassigned';

    card.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-title">${escapeHtml(ticket.workDescription)}</div>
            <span class="ticket-status ${statusClass}">${escapeHtml(ticket.status)}</span>
        </div>
        ${ticket.assignedTo ? `
            <div class="ticket-assigned-badge" style="text-align: center; margin: 8px 0; padding: 6px 12px; background: #e0e7ff; border-radius: 16px; display: inline-block; max-width: fit-content; margin-left: auto; margin-right: auto;">
                <span style="font-size: 0.85rem; color: #2563EB; font-weight: 600;">👤 Assigned to: ${escapeHtml(assignedToDisplay)}</span>
            </div>
        ` : ''}
        ${isMonitoring && (ticket.invoiceUrl || ticket.invoiceNotes) ? `
            <div class="monitoring-info" style="background: #F9FAFB; border-left: 3px solid #F59E0B; padding: 12px; margin: 12px 0; border-radius: 8px;">
                <div style="font-size: 0.85rem; color: #6B7280; font-weight: 600; margin-bottom: 8px;">📄 Monitoring Information:</div>
                ${ticket.invoiceUrl ? `
                    <div style="margin-bottom: 8px;">
                        <a href="${escapeHtml(ticket.invoiceUrl)}" target="_blank" style="color: #2563EB; text-decoration: underline; font-size: 0.85rem;">View Invoice/Proposal</a>
                    </div>
                ` : ''}
                ${ticket.invoiceNotes ? `
                    <div style="font-size: 0.85rem; color: #1F2937; line-height: 1.5;">${escapeHtml(ticket.invoiceNotes)}</div>
                ` : ''}
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
            ${ticket.unitNumber ? `
                <div class="ticket-detail">
                    <span class="ticket-detail-label">Unit #</span>
                    <span class="ticket-detail-value">${escapeHtml(ticket.unitNumber)}</span>
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
                ${!isCompleted && ticket.status !== 'Monitoring' ? `
                    <div class="btn-group" style="position: relative; display: inline-block;">
                        <button class="btn-primary btn-small" onclick="openAdvanceWorkflowDropdown('${ticket.id}')" style="position: relative;">
                            Advance Workflow
                            <span style="margin-left: 5px;">▼</span>
                        </button>
                        <div id="workflowDropdown-${ticket.id}" class="workflow-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; margin-top: 4px; min-width: 180px;">
                            <button class="workflow-option" onclick="advanceWorkflow('${ticket.id}', 'Completed')" style="display: block; width: 100%; padding: 10px 15px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 8px 8px 0 0;">
                                Complete
                            </button>
                            <button class="workflow-option" onclick="advanceWorkflow('${ticket.id}', 'Monitoring')" style="display: block; width: 100%; padding: 10px 15px; text-align: left; border: none; background: none; cursor: pointer; border-top: 1px solid #eee; border-radius: 0 0 8px 8px;">
                                Monitoring
                            </button>
                        </div>
                    </div>
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

// Load users for dropdowns (simpler version than loadUsers for admin page)
let usersForDropdowns = {};
async function loadUsersForDropdowns() {
    console.log('🔍 loadUsersForDropdowns called', {
        userRole: currentUserProfile?.role
    });
    
    try {
        // All authenticated users can now read other users' profiles (per Firestore rules)
        // So maintenance users can see all users for assignment purposes
        
        // For other roles, load all active users
        console.log('🔍 loadUsersForDropdowns: Loading all active users');
        const snapshot = await db.collection('users')
            .where('isActive', '==', true)
            .get();
        
        usersForDropdowns = {};
        snapshot.forEach((doc) => {
            const userData = doc.data();
            usersForDropdowns[doc.id] = {
                id: doc.id,
                displayName: userData.displayName || userData.email || 'Unknown',
                email: userData.email
            };
        });
        
        console.log(`✅ loadUsersForDropdowns: Loaded ${Object.keys(usersForDropdowns).length} users`);
        return usersForDropdowns;
    } catch (error) {
        console.error('❌ Error loading users for dropdowns:', error);
        // Return at least current user if available
        if (currentUserProfile && currentUserProfile.id) {
            usersForDropdowns = {
                [currentUserProfile.id]: {
                    id: currentUserProfile.id,
                    displayName: currentUserProfile.displayName || currentUserProfile.email || 'Unknown',
                    email: currentUserProfile.email
                }
            };
        }
        return usersForDropdowns;
    }
}

// Populate user dropdown
function populateUserDropdown(selectId, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except first two (Select... and Other)
    while (select.options.length > 2) {
        select.remove(2);
    }
    
    // Add users
    Object.values(usersForDropdowns).forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.displayName;
        if (selectedValue === user.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Handle "Other" option
    if (selectedValue && selectedValue !== '__other__' && !usersForDropdowns[selectedValue]) {
        // Value is not a user ID, so it must be "Other"
        select.value = '__other__';
        const otherInput = document.getElementById(selectId + 'Other');
        if (otherInput) {
            otherInput.value = selectedValue;
            otherInput.style.display = 'block';
        }
    }
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
        updateCommercialFieldsVisibility(selectedPropertyId).then(() => {
            // Load tenants for the selected property
            loadTenantsForTicketForm(selectedPropertyId);
        });
    }
    
    // Reset tenant fields
    document.getElementById('ticketTenantSelect').value = '';
    document.getElementById('ticketTenantId').value = '';
    document.getElementById('tenantName').value = '';
    document.getElementById('tenantName').style.display = 'none';

    // Set default status
    document.getElementById('ticketStatus').value = 'Not Started';
    document.getElementById('completedByGroup').style.display = 'none';
    document.getElementById('howResolvedGroup').style.display = 'none';
    document.getElementById('afterPhotoGroup').style.display = 'none';
    document.getElementById('retroactiveDatesGroup').style.display = 'none';
    
    // Set "Created by" to current user
    if (currentUserProfile) {
        document.getElementById('ticketCreatedBy').value = currentUserProfile.displayName || currentUserProfile.email || 'Current User';
    }
    
    // Load and populate user dropdowns
    loadUsersForDropdowns().then(() => {
        populateUserDropdown('requestedBy', currentUserProfile?.id || '');
        populateUserDropdown('managedBy');
        populateUserDropdown('assignedTo');
        populateUserDropdown('completedBy');
        
        // Set "Requested by" to current user by default
        if (currentUserProfile?.id) {
            document.getElementById('requestedBy').value = currentUserProfile.id;
        }
    });
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
                const unitNumber = document.getElementById('unitNumber');
                const floorNumber = document.getElementById('floorNumber');
                const tenantName = document.getElementById('tenantName');
                if (buildingNumber) buildingNumber.value = '';
                if (unitNumber) unitNumber.value = '';
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
    // Ensure ticketId is a string
    const ticketIdStr = String(ticketId).trim();
    if (!ticketIdStr) {
        console.error('Invalid ticket ID');
        return;
    }
    
    db.collection('tickets').doc(ticketIdStr).get().then((doc) => {
        const ticket = doc.data();
        if (ticket) {
            editingTicketId = ticketIdStr;
            document.getElementById('ticketId').value = ticketIdStr;
            document.getElementById('ticketProperty').value = ticket.propertyId || '';
            // Check property type and show/hide commercial fields, then set values
            if (ticket.propertyId) {
                updateCommercialFieldsVisibility(ticket.propertyId).then(() => {
                    document.getElementById('buildingNumber').value = ticket.buildingNumber || '';
                    document.getElementById('unitNumber').value = ticket.unitNumber || '';
                    document.getElementById('floorNumber').value = ticket.floorNumber || '';
                    
                    // Load tenants and set selected tenant
                    loadTenantsForTicketForm(ticket.propertyId).then(() => {
                        if (ticket.tenantId) {
                            document.getElementById('ticketTenantSelect').value = ticket.tenantId;
                            document.getElementById('ticketTenantId').value = ticket.tenantId;
                            document.getElementById('tenantName').style.display = 'none';
                        } else if (ticket.tenantName) {
                            document.getElementById('ticketTenantSelect').value = '__manual__';
                            document.getElementById('tenantName').value = ticket.tenantName;
                            document.getElementById('tenantName').style.display = 'block';
                        }
                    });
                });
            } else {
                document.getElementById('buildingNumber').value = ticket.buildingNumber || '';
                document.getElementById('unitNumber').value = ticket.unitNumber || '';
                document.getElementById('floorNumber').value = ticket.floorNumber || '';
                
                // Handle tenant
                if (ticket.tenantId) {
                    document.getElementById('ticketTenantSelect').value = ticket.tenantId;
                    document.getElementById('ticketTenantId').value = ticket.tenantId;
                    document.getElementById('tenantName').style.display = 'none';
                } else if (ticket.tenantName) {
                    document.getElementById('ticketTenantSelect').value = '__manual__';
                    document.getElementById('tenantName').value = ticket.tenantName;
                    document.getElementById('tenantName').style.display = 'block';
                }
            }
            document.getElementById('workDescription').value = ticket.workDescription || '';
            document.getElementById('detailedDescription').value = ticket.detailedDescription || '';
            document.getElementById('workUpdates').value = ticket.workUpdates || '';
            
            // Check if time allocation should be enabled (either explicitly enabled OR if fields are populated)
            const timeAllocated = ticket.timeAllocated;
            const billingRate = ticket.billingRate;
            const enableTimeAllocation = ticket.enableTimeAllocation === true || (timeAllocated && timeAllocated > 0) || (billingRate && billingRate > 0);
            
            const enableTimeAllocationToggle = document.getElementById('enableTimeAllocation');
            if (enableTimeAllocationToggle) {
                enableTimeAllocationToggle.checked = enableTimeAllocation;
            }
            
            const timeAllocatedInput = document.getElementById('timeAllocated');
            if (timeAllocatedInput) {
                timeAllocatedInput.value = ticket.timeAllocated || '';
            }
            
            // Update time allocation group visibility
            const timeAllocationGroup = document.getElementById('timeAllocationGroup');
            if (timeAllocationGroup) {
                timeAllocationGroup.style.display = enableTimeAllocation ? 'block' : 'none';
            }
            
            const billingRateInput = document.getElementById('billingRate');
            if (billingRateInput) {
                billingRateInput.value = ticket.billingRate || '';
            }
            // Set billing type (default to hourly if not set for backward compatibility)
            const billingType = ticket.billingType || 'hourly';
            if (billingType === 'flat') {
                document.getElementById('billingTypeFlat').checked = true;
            } else {
                document.getElementById('billingTypeHourly').checked = true;
            }
            // Update label based on selected type
            const billingRateLabel = document.getElementById('billingRateLabel');
            if (billingRateLabel && billingRateInput) {
                if (billingType === 'flat') {
                    billingRateLabel.textContent = 'Flat Rate Amount ($)';
                    billingRateInput.placeholder = 'e.g., 500.00';
                } else {
                    billingRateLabel.textContent = 'Billing Rate ($/hour)';
                    billingRateInput.placeholder = 'e.g., 75.00';
                }
            }
            // Load users for dropdowns first, then populate
            loadUsersForDropdowns().then(() => {
                // Populate user dropdowns with ticket data
                populateUserDropdown('requestedBy', ticket.requestedByUserId || ticket.requestedBy || '');
                populateUserDropdown('managedBy', ticket.managedByUserId || ticket.managedBy || '');
                populateUserDropdown('assignedTo', ticket.assignedToUserId || ticket.assignedTo || '');
                
                // Set "Created by" if it exists
                if (ticket.createdBy) {
                    document.getElementById('ticketCreatedBy').value = ticket.createdBy;
                } else if (currentUserProfile) {
                    document.getElementById('ticketCreatedBy').value = currentUserProfile.displayName || currentUserProfile.email || 'Current User';
                }
            });
            
            document.getElementById('ticketStatus').value = ticket.status || 'Not Started';
            
            // Show/hide fields based on status
            const status = ticket.status || 'Not Started';
            if (status === 'Monitoring') {
                const monitoringFieldsGroup = document.getElementById('monitoringFieldsGroup');
                if (monitoringFieldsGroup) monitoringFieldsGroup.style.display = 'block';
                document.getElementById('invoiceUrl').value = ticket.invoiceUrl || '';
                document.getElementById('invoiceNotes').value = ticket.invoiceNotes || '';
            } else {
                const monitoringFieldsGroup = document.getElementById('monitoringFieldsGroup');
                if (monitoringFieldsGroup) monitoringFieldsGroup.style.display = 'none';
            }
            
            // Always show before photo if it exists
            if (ticket.beforePhotoUrl) {
                beforePhotoUrl = ticket.beforePhotoUrl;
                showPhotoPreview(ticket.beforePhotoUrl, 'before');
            }
            
            if (ticket.status === 'Completed') {
                // Populate completedBy dropdown
                loadUsersForDropdowns().then(() => {
                    populateUserDropdown('completedBy', ticket.completedByUserId || ticket.completedBy || '');
                });
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
    const status = e.target.value;
    const completedByGroup = document.getElementById('completedByGroup');
    const howResolvedGroup = document.getElementById('howResolvedGroup');
    const afterPhotoGroup = document.getElementById('afterPhotoGroup');
    const retroactiveDatesGroup = document.getElementById('retroactiveDatesGroup');
    const monitoringFieldsGroup = document.getElementById('monitoringFieldsGroup');
    
    // Show/hide completed fields
    if (status === 'Completed') {
        if (completedByGroup) completedByGroup.style.display = 'block';
        if (howResolvedGroup) howResolvedGroup.style.display = 'block';
        if (afterPhotoGroup) afterPhotoGroup.style.display = 'block';
        if (retroactiveDatesGroup) retroactiveDatesGroup.style.display = 'block';
    } else {
        if (completedByGroup) completedByGroup.style.display = 'none';
        if (howResolvedGroup) howResolvedGroup.style.display = 'none';
        if (afterPhotoGroup) afterPhotoGroup.style.display = 'none';
        if (retroactiveDatesGroup) retroactiveDatesGroup.style.display = 'none';
    }
    
    // Show/hide monitoring fields
    if (status === 'Monitoring') {
        if (monitoringFieldsGroup) monitoringFieldsGroup.style.display = 'block';
    } else {
        if (monitoringFieldsGroup) monitoringFieldsGroup.style.display = 'none';
    }
}

// Load tenants for ticket form, filtered by property
async function loadTenantsForTicketForm(propertyId) {
    const tenantSelect = document.getElementById('ticketTenantSelect');
    if (!tenantSelect) return Promise.resolve();
    
    // Clear existing options except first two
    tenantSelect.innerHTML = '<option value="">Select a tenant...</option><option value="__manual__">Enter manually</option>';
    
    if (!propertyId) {
        return Promise.resolve();
    }
    
    try {
        // For maintenance users, verify property is assigned
        if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
            Array.isArray(currentUserProfile.assignedProperties) && 
            !currentUserProfile.assignedProperties.includes(propertyId)) {
            console.warn('⚠️ Maintenance user trying to access unassigned property:', propertyId);
            return Promise.resolve(); // Don't load tenants for unassigned properties
        }
        
        // Load occupancies first to get tenant IDs, then load only those tenants
        // This avoids loading all tenants which maintenance users can't do
        const [occupanciesSnapshot, unitsSnapshot, buildingsSnapshot] = await Promise.all([
            db.collection('occupancies').where('propertyId', '==', propertyId).get(),
            db.collection('units').where('propertyId', '==', propertyId).get(),
            db.collection('buildings').where('propertyId', '==', propertyId).get()
        ]);
        
        // Extract tenant IDs from occupancies
        const tenantIds = new Set();
        const occupanciesMap = {};
        occupanciesSnapshot.forEach(doc => {
            const occ = doc.data();
            if (occ.status === 'Active' || !occ.status) {
                if (occ.tenantId) {
                    tenantIds.add(occ.tenantId);
                }
                if (!occupanciesMap[occ.tenantId]) {
                    occupanciesMap[occ.tenantId] = [];
                }
                occupanciesMap[occ.tenantId].push({ ...occ, id: doc.id });
            }
        });
        
        // Load only tenants that have occupancies in this property
        const tenantsMap = {};
        if (tenantIds.size > 0) {
            const tenantPromises = Array.from(tenantIds).map(tenantId => 
                db.collection('tenants').doc(tenantId).get().catch(e => {
                    console.warn(`Could not load tenant ${tenantId}:`, e);
                    return null;
                })
            );
            const tenantDocs = await Promise.all(tenantPromises);
            tenantDocs.forEach(doc => {
                if (doc && doc.exists) {
                    tenantsMap[doc.id] = { id: doc.id, ...doc.data() };
                }
            });
        }
        
        const unitsMap = {};
        unitsSnapshot.forEach(doc => {
            unitsMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const buildingsMap = {};
        buildingsSnapshot.forEach(doc => {
            buildingsMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Group tenants by building for sorting
        const tenantsByBuilding = {};
        const tenantsWithoutBuilding = [];
        
        Object.keys(occupanciesMap).forEach(tenantId => {
            if (tenantsMap[tenantId]) {
                const tenant = tenantsMap[tenantId];
                const occupancies = occupanciesMap[tenantId];
                
                // Find the first occupancy with a unit that has a building
                let buildingId = null;
                let buildingName = null;
                
                for (const occ of occupancies) {
                    if (occ.unitId && unitsMap[occ.unitId]) {
                        const unit = unitsMap[occ.unitId];
                        if (unit.buildingId && buildingsMap[unit.buildingId]) {
                            buildingId = unit.buildingId;
                            buildingName = buildingsMap[buildingId].buildingName || `Building ${buildingId}`;
                            break;
                        }
                    }
                }
                
                if (buildingId) {
                    if (!tenantsByBuilding[buildingId]) {
                        tenantsByBuilding[buildingId] = {
                            buildingName: buildingName,
                            tenants: []
                        };
                    }
                    tenantsByBuilding[buildingId].tenants.push({
                        tenantId: tenantId,
                        tenant: tenant,
                        occupancies: occupancies
                    });
                } else {
                    tenantsWithoutBuilding.push({
                        tenantId: tenantId,
                        tenant: tenant,
                        occupancies: occupancies
                    });
                }
            }
        });
        
        // Sort buildings by name
        const sortedBuildingIds = Object.keys(tenantsByBuilding).sort((a, b) => {
            const nameA = tenantsByBuilding[a].buildingName.toLowerCase();
            const nameB = tenantsByBuilding[b].buildingName.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Sort tenants within each building by name
        sortedBuildingIds.forEach(buildingId => {
            tenantsByBuilding[buildingId].tenants.sort((a, b) => {
                const nameA = a.tenant.tenantName.toLowerCase();
                const nameB = b.tenant.tenantName.toLowerCase();
                return nameA.localeCompare(nameB);
            });
        });
        
        // Sort tenants without building by name
        tenantsWithoutBuilding.sort((a, b) => {
            const nameA = a.tenant.tenantName.toLowerCase();
            const nameB = b.tenant.tenantName.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Add tenants grouped by building
        sortedBuildingIds.forEach(buildingId => {
            const buildingGroup = tenantsByBuilding[buildingId];
            const optgroup = document.createElement('optgroup');
            optgroup.label = buildingGroup.buildingName;
            
            buildingGroup.tenants.forEach(({ tenantId, tenant, occupancies }) => {
                const option = document.createElement('option');
                option.value = tenantId;
                option.textContent = tenant.tenantName;
                option.dataset.occupancies = JSON.stringify(occupancies);
                optgroup.appendChild(option);
            });
            
            tenantSelect.appendChild(optgroup);
        });
        
        // Add tenants without building (if any)
        if (tenantsWithoutBuilding.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = 'No Building';
            
            tenantsWithoutBuilding.forEach(({ tenantId, tenant, occupancies }) => {
                const option = document.createElement('option');
                option.value = tenantId;
                option.textContent = tenant.tenantName;
                option.dataset.occupancies = JSON.stringify(occupancies);
                optgroup.appendChild(option);
            });
            
            tenantSelect.appendChild(optgroup);
        }
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading tenants for ticket form:', error);
        return Promise.resolve();
    }
}

// Handle tenant selection change - auto-populate floor, unit number, and building number
async function handleTenantSelectionChange(e) {
    const tenantSelect = e.target;
    const tenantId = tenantSelect.value;
    const tenantNameInput = document.getElementById('tenantName');
    const ticketTenantIdInput = document.getElementById('ticketTenantId');
    const propertyId = document.getElementById('ticketProperty').value;
    const floorNumberInput = document.getElementById('floorNumber');
    const unitNumberInput = document.getElementById('unitNumber');
    const buildingNumberInput = document.getElementById('buildingNumber');
    
    if (tenantSelect.value === '__manual__') {
        // Show manual input
        tenantNameInput.style.display = 'block';
        ticketTenantIdInput.value = '';
        return;
    }
    
    if (tenantSelect.value === '' || !propertyId) {
        // Clear fields
        tenantNameInput.style.display = 'none';
        tenantNameInput.value = '';
        ticketTenantIdInput.value = '';
        return;
    }
    
    // Hide manual input
    tenantNameInput.style.display = 'none';
    ticketTenantIdInput.value = tenantId;
    
    // Get occupancy data from option
    const selectedOption = tenantSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.dataset.occupancies) {
        return;
    }
    
    try {
        const occupancies = JSON.parse(selectedOption.dataset.occupancies);
        // Find the first active occupancy with a unitId
        const occupancyWithUnit = occupancies.find(occ => occ.unitId);
        
        if (occupancyWithUnit && occupancyWithUnit.unitId) {
            // Load unit data
            const unitDoc = await db.collection('units').doc(occupancyWithUnit.unitId).get();
            if (unitDoc.exists) {
                const unit = unitDoc.data();
                
                // Auto-populate floor number
                if (unit.floorNumber && floorNumberInput) {
                    floorNumberInput.value = unit.floorNumber;
                }
                
                // Auto-populate unit number
                if (unit.unitNumber && unitNumberInput) {
                    unitNumberInput.value = unit.unitNumber;
                }
                
                // If unit has a buildingId, get building name/number
                if (unit.buildingId && buildingNumberInput) {
                    const buildingDoc = await db.collection('buildings').doc(unit.buildingId).get();
                    if (buildingDoc.exists) {
                        const building = buildingDoc.data();
                        // Populate building number with building name
                        if (building.buildingName) {
                            buildingNumberInput.value = building.buildingName;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading tenant unit data:', error);
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
    
    // Get tenant info - either from dropdown or manual entry
    const ticketTenantSelect = document.getElementById('ticketTenantSelect');
    const ticketTenantId = document.getElementById('ticketTenantId').value;
    const tenantNameInput = document.getElementById('tenantName');
    const tenantName = ticketTenantSelect?.value === '__manual__' 
        ? tenantNameInput.value.trim() 
        : (ticketTenantSelect?.selectedOptions[0]?.text || '');
    const workDescription = document.getElementById('workDescription').value.trim();
    const detailedDescription = document.getElementById('detailedDescription').value.trim();
    const workUpdates = document.getElementById('workUpdates').value.trim();
    const timeAllocated = parseFloat(document.getElementById('timeAllocated').value);
    const billingRateInput = document.getElementById('billingRate');
    const billingRate = billingRateInput && billingRateInput.value ? parseFloat(billingRateInput.value) : null;
    const billingTypeHourly = document.getElementById('billingTypeHourly');
    const billingType = billingRateInput && billingRateInput.value && billingTypeHourly && billingTypeHourly.checked ? 'hourly' : (billingRateInput && billingRateInput.value ? 'flat' : null);
    
    // Get user assignments - handle dropdowns with "Other" option
    const requestedBySelect = document.getElementById('requestedBy');
    const requestedByOther = document.getElementById('requestedByOther');
    const requestedBy = requestedBySelect?.value === '__other__' 
        ? (requestedByOther?.value.trim() || '') 
        : (requestedBySelect?.value ? (usersForDropdowns[requestedBySelect.value]?.displayName || requestedBySelect.value) : '');
    const requestedByUserId = requestedBySelect?.value && requestedBySelect.value !== '__other__' ? requestedBySelect.value : null;
    
    const managedBySelect = document.getElementById('managedBy');
    const managedByOther = document.getElementById('managedByOther');
    const managedBy = managedBySelect?.value === '__other__' 
        ? (managedByOther?.value.trim() || '') 
        : (managedBySelect?.value ? (usersForDropdowns[managedBySelect.value]?.displayName || managedBySelect.value) : '');
    const managedByUserId = managedBySelect?.value && managedBySelect.value !== '__other__' ? managedBySelect.value : null;
    
    const assignedToSelect = document.getElementById('assignedTo');
    const assignedToOther = document.getElementById('assignedToOther');
    const assignedTo = assignedToSelect?.value === '__other__' 
        ? (assignedToOther?.value.trim() || '') 
        : (assignedToSelect?.value ? (usersForDropdowns[assignedToSelect.value]?.displayName || '') : '');
    const assignedToUserId = assignedToSelect?.value && assignedToSelect.value !== '__other__' ? assignedToSelect.value : null;
    
    const status = document.getElementById('ticketStatus').value;
    
    const completedBySelect = document.getElementById('completedBy');
    const completedByOther = document.getElementById('completedByOther');
    const completedBy = completedBySelect?.value === '__other__' 
        ? (completedByOther?.value.trim() || '') 
        : (completedBySelect?.value ? (usersForDropdowns[completedBySelect.value]?.displayName || completedBySelect.value) : '');
    const completedByUserId = completedBySelect?.value && completedBySelect.value !== '__other__' ? completedBySelect.value : null;
    
    const howResolved = document.getElementById('howResolved').value.trim();
    
    // Get created by (current user for new tickets, existing value for edits)
    const createdBy = document.getElementById('ticketCreatedBy')?.value || (currentUserProfile?.displayName || currentUserProfile?.email || 'Current User');
    const createdByUserId = currentUserProfile?.id || null;

    if (!propertyId || !workDescription || !requestedBy || !managedBy) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check if time allocation is enabled
    const enableTimeAllocation = document.getElementById('enableTimeAllocation')?.checked ?? false;
    
    // Time allocated is required when marking complete IF time allocation is enabled
    if (status === 'Completed' && enableTimeAllocation && (!timeAllocated || isNaN(timeAllocated) || timeAllocated <= 0)) {
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
                    tenantId: ticketTenantId || null,
                    workDescription,
                    detailedDescription: detailedDescription || null,
                    workUpdates: workUpdates || null,
                    enableTimeAllocation: enableTimeAllocation,
                    timeAllocated: timeAllocated && !isNaN(timeAllocated) ? timeAllocated : null,
                    billingRate: billingRate || null,
                    billingType: billingRate ? billingType : null,
                    requestedBy,
                    requestedByUserId: requestedByUserId || null,
                    managedBy,
                    managedByUserId: managedByUserId || null,
                    assignedTo: assignedTo || null,
                    assignedToUserId: assignedToUserId || null,
                    createdBy: id ? (existing?.createdBy || createdBy) : createdBy, // Preserve existing for edits
                    createdByUserId: id ? (existing?.createdByUserId || createdByUserId) : createdByUserId,
                    status,
                    // Always update the lastUpdated timestamp
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add monitoring-specific fields if status is Monitoring
                if (status === 'Monitoring') {
                    const invoiceUrl = document.getElementById('invoiceUrl')?.value.trim() || null;
                    const invoiceNotes = document.getElementById('invoiceNotes')?.value.trim() || null;
                    ticketData.invoiceUrl = invoiceUrl;
                    ticketData.invoiceNotes = invoiceNotes;
                } else {
                    // Clear monitoring fields if status is not Monitoring
                    ticketData.invoiceUrl = null;
                    ticketData.invoiceNotes = null;
                }
                
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
                    ticketData.completedByUserId = completedByUserId || null;
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
                tenantId: ticketTenantId || null,
                workDescription,
                detailedDescription: detailedDescription || null,
                enableTimeAllocation: enableTimeAllocation,
                timeAllocated: timeAllocated && !isNaN(timeAllocated) ? timeAllocated : null,
                billingRate: billingRate || null,
                requestedBy,
                requestedByUserId: requestedByUserId || null,
                managedBy,
                managedByUserId: managedByUserId || null,
                assignedTo: assignedTo || null,
                assignedToUserId: assignedToUserId || null,
                createdBy: createdBy,
                createdByUserId: createdByUserId || null,
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
                ticketData.completedByUserId = completedByUserId || null;
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
            
            // Add monitoring-specific fields if status is Monitoring
            if (status === 'Monitoring') {
                const invoiceUrl = document.getElementById('invoiceUrl')?.value.trim() || null;
                const invoiceNotes = document.getElementById('invoiceNotes')?.value.trim() || null;
                ticketData.invoiceUrl = invoiceUrl;
                ticketData.invoiceNotes = invoiceNotes;
            } else {
                ticketData.invoiceUrl = null;
                ticketData.invoiceNotes = null;
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

// Open advance workflow dropdown
window.openAdvanceWorkflowDropdown = function(ticketId) {
    // Close any other open dropdowns
    document.querySelectorAll('.workflow-dropdown').forEach(dropdown => {
        if (dropdown.id !== `workflowDropdown-${ticketId}`) {
            dropdown.style.display = 'none';
        }
    });
    
    // Toggle the dropdown
    const dropdown = document.getElementById(`workflowDropdown-${ticketId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest(`#workflowDropdown-${ticketId}`) && !e.target.closest(`button[onclick="openAdvanceWorkflowDropdown('${ticketId}')"]`)) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
};

// Advance workflow (Complete or Monitoring)
window.advanceWorkflow = function(ticketId, targetStatus) {
    // Close dropdown
    const dropdown = document.getElementById(`workflowDropdown-${ticketId}`);
    if (dropdown) dropdown.style.display = 'none';
    
    // For "Completed" status, check if time allocation is required
    if (targetStatus === 'Completed') {
        db.collection('tickets').doc(ticketId).get().then((doc) => {
            const ticket = doc.data();
            const enableTimeAllocation = ticket?.enableTimeAllocation === true;
            const timeAllocated = ticket?.timeAllocated;
            
            // If time allocation is enabled but not set, open edit modal instead
            if (enableTimeAllocation && (!timeAllocated || isNaN(timeAllocated) || timeAllocated <= 0)) {
                alert('Time allocation is required before marking this ticket as complete. Please set the time allocation in the ticket edit form first.');
                openTicketModal(ticketId);
                return;
            }
            
            // Time allocation is set or not required, proceed with completion modal
            openWorkflowModal(ticketId, targetStatus);
        }).catch((error) => {
            console.error('Error checking ticket:', error);
            alert('Error checking ticket: ' + error.message);
        });
    } else {
        // For Monitoring status, open modal directly
        openWorkflowModal(ticketId, targetStatus);
    }
};

function openWorkflowModal(ticketId, targetStatus) {
    editingTicketId = ticketId;
    const workflowTargetStatus = document.getElementById('workflowTargetStatus');
    if (workflowTargetStatus) {
        workflowTargetStatus.value = targetStatus;
    }
    
    // Reset submit button state first
    const submitBtn = document.getElementById('workflowSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = targetStatus === 'Completed' ? 'Mark as Complete' : 'Move to Monitoring';
    }
    
    // Update modal title and button text
    const modalTitle = document.getElementById('workflowModalTitle');
    
    if (targetStatus === 'Completed') {
        if (modalTitle) modalTitle.textContent = 'Mark Ticket as Complete';
    } else if (targetStatus === 'Monitoring') {
        if (modalTitle) modalTitle.textContent = 'Move Ticket to Monitoring';
    }
    
    // Reset form
    const completionHowResolved = document.getElementById('completionHowResolved');
    const completionAfterPhoto = document.getElementById('completionAfterPhoto');
    const completionAfterPhotoPreview = document.getElementById('completionAfterPhotoPreview');
    const removeCompletionAfterPhoto = document.getElementById('removeCompletionAfterPhoto');
    
    if (completionHowResolved) completionHowResolved.value = '';
    if (completionAfterPhoto) completionAfterPhoto.value = '';
    if (completionAfterPhotoPreview) completionAfterPhotoPreview.innerHTML = '';
    if (removeCompletionAfterPhoto) removeCompletionAfterPhoto.style.display = 'none';
    completionAfterPhotoFile = null;
    
    // Load ticket data to check time allocation settings
    db.collection('tickets').doc(ticketId).get().then((doc) => {
        const ticket = doc.data();
        const enableTimeAllocation = ticket?.enableTimeAllocation === true;
        const timeAllocated = ticket?.timeAllocated;
        const billingRate = ticket?.billingRate;
        
        // Show time allocation group if enabled or if fields are populated
        const workflowTimeAllocationGroup = document.getElementById('workflowTimeAllocationGroup');
        const workflowEnableTimeAllocation = document.getElementById('workflowEnableTimeAllocation');
        const workflowTimeAllocationFields = document.getElementById('workflowTimeAllocationFields');
        
        if (workflowTimeAllocationGroup) {
            // Show group if time allocation is enabled OR if fields are populated
            const shouldShow = enableTimeAllocation || (timeAllocated && timeAllocated > 0) || (billingRate && billingRate > 0);
            workflowTimeAllocationGroup.style.display = shouldShow ? 'block' : 'none';
            
            if (workflowEnableTimeAllocation) {
                // Set toggle based on enableTimeAllocation OR if fields are populated
                workflowEnableTimeAllocation.checked = enableTimeAllocation || (timeAllocated && timeAllocated > 0) || (billingRate && billingRate > 0);
            }
            
            if (workflowTimeAllocationFields) {
                workflowTimeAllocationFields.style.display = workflowEnableTimeAllocation?.checked ? 'block' : 'none';
            }
            
            // Populate fields if they exist
            const workflowTimeAllocated = document.getElementById('workflowTimeAllocated');
            const workflowBillingRate = document.getElementById('workflowBillingRate');
            const workflowBillingTypeHourly = document.getElementById('workflowBillingTypeHourly');
            const workflowBillingTypeFlat = document.getElementById('workflowBillingTypeFlat');
            
            if (workflowTimeAllocated && timeAllocated) {
                workflowTimeAllocated.value = timeAllocated;
            }
            if (workflowBillingRate && billingRate) {
                workflowBillingRate.value = billingRate;
            }
            if (ticket?.billingType === 'hourly' && workflowBillingTypeHourly) {
                workflowBillingTypeHourly.checked = true;
            } else if (ticket?.billingType === 'flat' && workflowBillingTypeFlat) {
                workflowBillingTypeFlat.checked = true;
            }
        }
        
        // Load and populate completion dropdown, default to current user
        return loadUsersForDropdowns();
    }).then(() => {
        populateUserDropdown('completionCompletedBy', currentUserProfile?.id || '');
        // Set default to current user if available
        const completionCompletedBy = document.getElementById('completionCompletedBy');
        if (completionCompletedBy && currentUserProfile?.id) {
            completionCompletedBy.value = currentUserProfile.id;
        }
        if (completionCompletedBy) completionCompletedBy.focus();
    }).catch((error) => {
        console.error('Error loading ticket data:', error);
        // Still show modal even if ticket load fails
        loadUsersForDropdowns().then(() => {
            populateUserDropdown('completionCompletedBy', currentUserProfile?.id || '');
            const completionCompletedBy = document.getElementById('completionCompletedBy');
            if (completionCompletedBy && currentUserProfile?.id) {
                completionCompletedBy.value = currentUserProfile.id;
            }
            if (completionCompletedBy) completionCompletedBy.focus();
        });
    });
    
    // Show modal
    const completionModal = document.getElementById('completionModal');
    if (completionModal) completionModal.classList.add('show');
}

function closeCompletionModal() {
    const completionModal = document.getElementById('completionModal');
    if (completionModal) completionModal.classList.remove('show');
    
    // Reset submit button state
    const submitBtn = document.getElementById('workflowSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Advance Workflow';
    }
    
    editingTicketId = null;
}

function handleTicketCompletion(e) {
    e.preventDefault();
    const workflowTargetStatusEl = document.getElementById('workflowTargetStatus');
    const targetStatus = workflowTargetStatusEl?.value || 'Completed';
    const completedBySelect = document.getElementById('completionCompletedBy');
    const completedByOther = document.getElementById('completionCompletedByOther');
    const completedBy = completedBySelect?.value === '__other__' 
        ? (completedByOther?.value.trim() || '') 
        : (completedBySelect?.value ? (usersForDropdowns[completedBySelect.value]?.displayName || completedBySelect.value) : '');
    const completedByUserId = completedBySelect?.value && completedBySelect.value !== '__other__' ? completedBySelect.value : null;
    const howResolvedEl = document.getElementById('completionHowResolved');
    const howResolved = howResolvedEl?.value.trim() || '';

    if (!completedBy) {
        alert('Please enter who completed the work');
        return;
    }

    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitBtnText = submitBtn ? submitBtn.textContent : 'Saving...';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    // Check if timeAllocated is set - required before marking complete IF time allocation is enabled
    if (!editingTicketId) {
        alert('Error: Ticket ID not found');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtnText;
        }
        return;
    }
    
    // Get the ticket to check timeAllocated and enableTimeAllocation setting
    db.collection('tickets').doc(editingTicketId).get().then((doc) => {
        const ticket = doc.data();
        const timeAllocated = ticket?.timeAllocated;
        const enableTimeAllocation = ticket?.enableTimeAllocation === true; // Default to false - must be explicitly enabled
        
        // Check workflow modal time allocation if it exists (for editing during workflow)
        const workflowEnableTimeAllocation = document.getElementById('workflowEnableTimeAllocation');
        const workflowTimeAllocated = document.getElementById('workflowTimeAllocated');
        let finalEnableTimeAllocation = enableTimeAllocation;
        let finalTimeAllocated = timeAllocated;
        
        if (workflowEnableTimeAllocation && workflowEnableTimeAllocation.checked) {
            finalEnableTimeAllocation = true;
            if (workflowTimeAllocated && workflowTimeAllocated.value) {
                finalTimeAllocated = parseFloat(workflowTimeAllocated.value);
            }
        }
        
        // Only require time allocation for Completed status, not Monitoring
        if (targetStatus === 'Completed' && finalEnableTimeAllocation && (!finalTimeAllocated || isNaN(finalTimeAllocated) || finalTimeAllocated <= 0)) {
            alert('Time Allocated is required before marking a ticket as complete. Please set the time allocation in the form above.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtnText;
            }
            return;
        }
        
        // Upload after photo if provided
        const uploadPromise = completionAfterPhotoFile 
            ? uploadPhoto(completionAfterPhotoFile, editingTicketId, 'after')
            : Promise.resolve(null);

        uploadPromise.then((afterPhotoUrl) => {
            // Get workflow modal time allocation data if it exists
            const workflowEnableTimeAllocation = document.getElementById('workflowEnableTimeAllocation');
            const workflowTimeAllocated = document.getElementById('workflowTimeAllocated');
            const workflowBillingRate = document.getElementById('workflowBillingRate');
            const workflowBillingTypeHourly = document.getElementById('workflowBillingTypeHourly');
            
            const updateData = {
                status: targetStatus,
                completedBy: completedBy,
                completedByUserId: completedByUserId || null,
                howResolved: howResolved || null,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Update time allocation if it was edited in the workflow modal
            if (workflowEnableTimeAllocation) {
                updateData.enableTimeAllocation = workflowEnableTimeAllocation.checked;
                
                if (workflowEnableTimeAllocation.checked) {
                    if (workflowTimeAllocated && workflowTimeAllocated.value) {
                        updateData.timeAllocated = parseFloat(workflowTimeAllocated.value);
                    }
                    if (workflowBillingRate && workflowBillingRate.value) {
                        updateData.billingRate = parseFloat(workflowBillingRate.value);
                        updateData.billingType = workflowBillingTypeHourly?.checked ? 'hourly' : 'flat';
                    }
                } else {
                    // If toggle is off, clear the fields
                    updateData.timeAllocated = null;
                    updateData.billingRate = null;
                    updateData.billingType = null;
                }
            }

            // Only set dateCompleted for Completed status
            if (targetStatus === 'Completed') {
                updateData.dateCompleted = firebase.firestore.FieldValue.serverTimestamp();
            }

            if (afterPhotoUrl) {
                updateData.afterPhotoUrl = afterPhotoUrl;
            }

            return db.collection('tickets').doc(editingTicketId).update(updateData);
        }).then(() => {
            closeCompletionModal();
        }).catch((error) => {
            console.error(`Error updating ticket to ${targetStatus}:`, error);
            alert(`Error updating ticket: ${error.message}`);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtnText;
            }
        });
    }).catch((error) => {
        console.error('Error checking ticket:', error);
        alert('Error checking ticket: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtnText;
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

// Setup drag and drop for ticket photo uploads
function setupDragAndDrop(dropZone, fileInput, type) {
    if (!dropZone || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#2563EB';
            dropZone.style.backgroundColor = '#EBF5FF';
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '';
            dropZone.style.backgroundColor = '';
        }, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please drop an image file');
                return;
            }
            
            // Validate file size (max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                alert('File size must be less than 20MB');
                return;
            }
            
            // Set the file to the input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Trigger the file select handler
            handleFileSelect({ target: fileInput }, type);
        }
    }, false);
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
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser || !currentUserProfile) {
        return;
    }
    
    // For maintenance users, filter tenants by assigned properties via occupancies
    if (currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        // Load occupancies for assigned properties first, then filter tenants
        console.log('🔍 Filtering tenants for maintenance user by properties:', currentUserProfile.assignedProperties);
        
        // Firestore 'in' queries are limited to 10 items
        if (currentUserProfile.assignedProperties.length <= 10) {
            db.collection('occupancies')
                .where('propertyId', 'in', currentUserProfile.assignedProperties)
                .get()
                .then((occupanciesSnapshot) => {
                    console.log('✅ Loaded occupancies for maintenance user:', occupanciesSnapshot.size);
                    const tenantIds = new Set();
                    occupanciesSnapshot.forEach(doc => {
                        const occ = doc.data();
                        if (occ.tenantId) {
                            tenantIds.add(occ.tenantId);
                        }
                    });
                    
                    if (tenantIds.size === 0) {
                        renderTenantsList({});
                        return;
                    }
                    
                    // Load tenants that have occupancies in assigned properties
                    const tenantPromises = Array.from(tenantIds).map(tenantId => 
                        db.collection('tenants').doc(tenantId).get().catch(e => {
                            console.warn(`Could not load tenant ${tenantId}:`, e);
                            return null;
                        })
                    );
                    
                    Promise.all(tenantPromises).then((tenantDocs) => {
                        const tenants = {};
                        tenantDocs.forEach(doc => {
                            if (doc && doc.exists) {
                                tenants[doc.id] = { id: doc.id, ...doc.data() };
                            }
                        });
                        renderTenantsList(tenants);
                    }).catch((error) => {
                        console.error('Error loading tenants:', error);
                        const tenantsList = document.getElementById('tenantsList');
                        if (tenantsList) {
                            tenantsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading tenants. Please try again.</p>';
                        }
                    });
                }).catch((error) => {
                    console.error('Error loading occupancies:', error);
                    console.error('Error details:', error.code, error.message);
                    // If permission denied, show empty list instead of error
                    if (error.code === 'permission-denied') {
                        console.warn('⚠️ Permission denied loading occupancies - showing empty tenant list');
                        renderTenantsList({});
                    } else {
                        const tenantsList = document.getElementById('tenantsList');
                        if (tenantsList) {
                            tenantsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading tenants. Please try again.</p>';
                        }
                    }
                });
        } else {
            console.warn('⚠️ User has more than 10 assigned properties, loading all tenants (will be filtered by rules)');
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
        return; // Exit early for maintenance users
    }
    
    // For admins, super admins, property managers, and viewers - use full collection query
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

// User Management
async function loadUsers() {
    // Don't load if user is not authenticated or not admin
    if (!currentUser || !auth || !auth.currentUser) {
        return;
    }
    
    // Check if user is admin
    if (!currentUserProfile || !['admin', 'super_admin'].includes(currentUserProfile.role)) {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">You do not have permission to view users.</p>';
        }
        return;
    }
    
    try {
        // Load users from Firestore
        const firestoreSnapshot = await db.collection('users').get();
        const firestoreUsers = {};
        firestoreSnapshot.forEach((doc) => {
            firestoreUsers[doc.id] = { id: doc.id, ...doc.data(), source: 'firestore' };
        });
        
        // Also load pending invitations to show in the list
        // BUT: Filter out pending users that have already been linked to active users
        try {
            const pendingUsersSnapshot = await db.collection('pendingUsers')
                .where('status', '==', 'pending_signup')
                .get();
            
            pendingUsersSnapshot.forEach((doc) => {
                const pendingUser = doc.data();
                const normalizedEmail = (pendingUser.email || '').toLowerCase().trim();
                
                // Check if this email already has an active user account
                const existingUser = Object.values(firestoreUsers).find(u => {
                    const userEmail = (u.email || '').toLowerCase().trim();
                    return userEmail === normalizedEmail && u.isActive;
                });
                
                // Only show pending user if no active user exists with this email
                if (!existingUser) {
                    const tempId = `pending_${doc.id}`;
                    firestoreUsers[tempId] = {
                        id: tempId,
                        email: pendingUser.email,
                        displayName: pendingUser.displayName,
                        role: pendingUser.role,
                        isActive: pendingUser.isActive || false,
                        assignedProperties: pendingUser.assignedProperties || [],
                        status: 'pending',
                        isPending: true,
                        pendingUserId: doc.id,
                        createdAt: pendingUser.createdAt,
                        source: 'pending'
                    };
                } else {
                    // Pending user already linked - mark it as completed if not already
                    if (!pendingUser.linkedUserId) {
                        console.log('🔄 Auto-completing pending user that already has active account:', normalizedEmail);
                        db.collection('pendingUsers').doc(doc.id).update({
                            status: 'completed',
                            linkedUserId: existingUser.id,
                            linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(e => console.warn('Could not update pending user:', e));
                    }
                }
            });
        } catch (pendingError) {
            console.warn('Could not load pending users:', pendingError);
            // Continue without pending users
        }
        
        // Merge and store
        allUsers = firestoreUsers;
        
        // Set up real-time listener for Firestore updates
        // Use get() instead of orderBy to avoid index requirements and handle missing createdAt
        db.collection('users')
            .onSnapshot(async (snapshot) => {
                allUsers = {};
                snapshot.forEach((doc) => {
                    allUsers[doc.id] = { id: doc.id, ...doc.data(), source: 'firestore' };
                });
                
                // Also load pending users for real-time updates
                // BUT: Filter out pending users that have already been linked to active users
                try {
                    const pendingUsersSnapshot = await db.collection('pendingUsers')
                        .where('status', '==', 'pending_signup')
                        .get();
                    
                    pendingUsersSnapshot.forEach((doc) => {
                        const pendingUser = doc.data();
                        const normalizedEmail = (pendingUser.email || '').toLowerCase().trim();
                        
                        // Check if this email already has an active user account
                        const existingUser = Object.values(allUsers).find(u => {
                            const userEmail = (u.email || '').toLowerCase().trim();
                            return userEmail === normalizedEmail && u.isActive && !u.isPending;
                        });
                        
                        // Only show pending user if no active user exists with this email
                        if (!existingUser) {
                            const tempId = `pending_${doc.id}`;
                            allUsers[tempId] = {
                                id: tempId,
                                email: pendingUser.email,
                                displayName: pendingUser.displayName,
                                role: pendingUser.role,
                                isActive: pendingUser.isActive || false,
                                assignedProperties: pendingUser.assignedProperties || [],
                                status: 'pending',
                                isPending: true,
                                pendingUserId: doc.id,
                                createdAt: pendingUser.createdAt,
                                source: 'pending'
                            };
                        } else {
                            // Pending user already linked - mark it as completed if not already
                            if (!pendingUser.linkedUserId) {
                                console.log('🔄 Auto-completing pending user that already has active account:', normalizedEmail);
                                db.collection('pendingUsers').doc(doc.id).update({
                                    status: 'completed',
                                    linkedUserId: existingUser.id,
                                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                                }).catch(e => console.warn('Could not update pending user:', e));
                            }
                        }
                    });
                } catch (pendingError) {
                    console.warn('Could not load pending users:', pendingError);
                }
                
                // Sort by createdAt if available, otherwise by email
                const sortedUsers = Object.values(allUsers).sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    }
                    if (a.createdAt) return -1;
                    if (b.createdAt) return 1;
                    return (a.email || '').localeCompare(b.email || '');
                });
                // Convert back to object for renderUsersList
                const sortedUsersObj = {};
                sortedUsers.forEach(user => {
                    sortedUsersObj[user.id] = user;
                });
                renderUsersList(sortedUsersObj);
            }, (error) => {
                console.error('Error loading users:', error);
                const usersList = document.getElementById('usersList');
                if (usersList) {
                    if (error.code === 'permission-denied') {
                        usersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">You do not have permission to view users.</p>';
                        handlePermissionError('user management');
                    } else {
                        usersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading users. Please try again.</p>';
                    }
                }
            });
        
        // Initial render
        renderUsersList(allUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        const usersList = document.getElementById('usersList');
        if (usersList) {
            if (error.code === 'permission-denied') {
                usersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">You do not have permission to view users.</p>';
                handlePermissionError('user management');
            } else {
                usersList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading users. Please try again.</p>';
            }
        }
    }
}

function renderUsersList(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    // Get filter values
    const searchTerm = (document.getElementById('userSearch')?.value || '').toLowerCase();
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const statusFilter = document.getElementById('userStatusFilter')?.value || '';
    
    // Filter users
    const filteredUsers = Object.values(users).filter(user => {
        // Search filter
        if (searchTerm) {
            const nameMatch = (user.displayName || '').toLowerCase().includes(searchTerm);
            const emailMatch = (user.email || '').toLowerCase().includes(searchTerm);
            if (!nameMatch && !emailMatch) return false;
        }
        
        // Role filter
        if (roleFilter && user.role !== roleFilter) return false;
        
        // Status filter
        if (statusFilter) {
            if (statusFilter === 'active' && (!user.isActive || user.isPending)) return false;
            if (statusFilter === 'inactive' && (user.isActive || user.isPending)) return false;
            if (statusFilter === 'pending' && !user.isPending) return false;
        }
        
        return true;
    });
    
    // Show info message about Firebase Auth users
    const userCount = Object.keys(users).length;
    let infoMessage = '';
    if (userCount === 0) {
        infoMessage = `
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #78350f; font-size: 0.9rem;">
                    <strong>Note:</strong> This page shows users from Firestore. Users who exist in Firebase Authentication but don't have a Firestore document won't appear here. 
                    To add them, use the "Invite User" button or manually create their Firestore document.
                </p>
            </div>
        `;
    }
    
    if (filteredUsers.length === 0) {
        usersList.innerHTML = infoMessage + `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No users found${searchTerm || roleFilter || statusFilter ? ' matching filters' : ''}.</p>
                ${userCount === 0 ? '<p style="margin-top: 10px; font-size: 0.9rem; color: #666;">Check Firebase Console → Authentication to see all Auth users.</p>' : ''}
            </div>
        `;
        return;
    }
    
    // Render user cards
    usersList.innerHTML = infoMessage + filteredUsers.map(user => {
        const roleBadge = getRoleBadge(user.role);
        // Handle pending users differently
        const statusBadge = user.isPending 
            ? `<span class="status-badge" style="background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pending Signup</span>`
            : getStatusBadge(user.isActive);
        const lastLogin = user.isPending ? 'Not signed up yet' : (user.lastLogin ? formatDate(user.lastLogin) : 'Never');
        const assignedPropertiesCount = user.assignedProperties ? user.assignedProperties.length : 0;
        
        // Different actions for pending users
        let actionsHtml = '';
        if (user.isPending) {
            actionsHtml = `
                <button class="btn-small btn-primary" onclick="viewPendingUser('${user.pendingUserId}')">View Invitation</button>
                <span style="color: #666; font-size: 0.85rem; font-style: italic;">Waiting for signup</span>
            `;
        } else {
            actionsHtml = `
                <button class="btn-small btn-primary" onclick="openUserDetailModal('${user.id}')">View</button>
                <button class="btn-small btn-secondary" onclick="openUserDetailModal('${user.id}', true)">Edit</button>
                ${user.isActive 
                    ? `<button class="btn-small btn-warning" onclick="toggleUserStatus('${user.id}', false)">Deactivate</button>`
                    : `<button class="btn-small btn-success" onclick="toggleUserStatus('${user.id}', true)">Activate</button>`
                }
            `;
        }
        
        return `
            <div class="user-card" data-user-id="${user.id}" ${user.isPending ? 'style="border-left: 4px solid #fbbf24;"' : ''}>
                <div class="user-card-header">
                    <div class="user-card-info">
                        <h3>${escapeHtml(user.displayName || user.email || 'Unknown User')}</h3>
                        <p class="user-email">${escapeHtml(user.email || 'No email')}</p>
                        ${user.isPending ? '<p style="color: #f59e0b; font-size: 0.85rem; margin-top: 4px; font-style: italic;">⏳ Invitation sent - waiting for user to sign up</p>' : ''}
                    </div>
                    <div class="user-card-badges">
                        ${roleBadge}
                        ${statusBadge}
                    </div>
                </div>
                <div class="user-card-details">
                    <div class="user-detail-item">
                        <span class="detail-label">Last Login:</span>
                        <span class="detail-value">${lastLogin}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="detail-label">Properties:</span>
                        <span class="detail-value">${assignedPropertiesCount}</span>
                    </div>
                </div>
                <div class="user-card-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Load user profile page
async function loadProfile() {
    if (!currentUser || !auth || !auth.currentUser || !currentUserProfile) {
        console.error('User not authenticated or profile not loaded');
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        const profile = currentUserProfile;
        
        // Update profile header
        const displayName = profile.displayName || profile.email || 'User';
        const email = profile.email || auth.currentUser.email || '';
        const role = profile.role || 'viewer';
        const isActive = profile.isActive !== false;
        
        // Update avatar initials
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
        const avatarElement = document.getElementById('profileAvatarInitials');
        if (avatarElement) {
            avatarElement.textContent = initials;
        }
        
        // Update header info
        const profileDisplayNameEl = document.getElementById('profileDisplayName');
        if (profileDisplayNameEl) profileDisplayNameEl.textContent = displayName;
        
        const profileEmailEl = document.getElementById('profileEmail');
        if (profileEmailEl) profileEmailEl.textContent = email;
        
        const roleBadgeEl = document.getElementById('profileRoleBadge');
        if (roleBadgeEl) {
            const roleLabels = {
                'super_admin': 'Super Admin',
                'admin': 'Admin',
                'property_manager': 'Property Manager',
                'maintenance': 'Maintenance',
                'viewer': 'Viewer'
            };
            roleBadgeEl.textContent = roleLabels[role] || role;
        }
        
        const statusBadgeEl = document.getElementById('profileStatusBadge');
        if (statusBadgeEl) {
            statusBadgeEl.textContent = isActive ? 'Active' : 'Inactive';
        }
        
        // Update overview tab
        if (document.getElementById('overviewEmail')) document.getElementById('overviewEmail').textContent = email;
        if (document.getElementById('overviewName')) document.getElementById('overviewName').textContent = displayName;
        if (document.getElementById('overviewRole')) {
            const roleLabels = {
                'super_admin': 'Super Admin',
                'admin': 'Admin',
                'property_manager': 'Property Manager',
                'maintenance': 'Maintenance',
                'viewer': 'Viewer'
            };
            document.getElementById('overviewRole').textContent = roleLabels[role] || role;
        }
        if (document.getElementById('overviewStatus')) {
            document.getElementById('overviewStatus').textContent = isActive ? 'Active' : 'Inactive';
        }
        if (document.getElementById('overviewPhone')) {
            document.getElementById('overviewPhone').textContent = profile.phone || '—';
        }
        if (document.getElementById('overviewCreated')) {
            const created = profile.createdAt ? formatDate(profile.createdAt) : '—';
            document.getElementById('overviewCreated').textContent = created;
        }
        
        // Load assigned properties
        await loadProfileAssignedProperties(profile.assignedProperties || []);
        
        // Update personal information form
        if (document.getElementById('profileFormDisplayName')) {
            document.getElementById('profileFormDisplayName').value = displayName;
        }
        if (document.getElementById('profileFormEmail')) {
            document.getElementById('profileFormEmail').value = email;
        }
        if (document.getElementById('profileFormPhone')) {
            document.getElementById('profileFormPhone').value = profile.phone || '';
        }
        if (document.getElementById('profileFormTitle')) {
            document.getElementById('profileFormTitle').value = profile.title || '';
        }
        if (document.getElementById('profileFormDepartment')) {
            document.getElementById('profileFormDepartment').value = profile.department || '';
        }
        
        // Check email verification status
        if (auth.currentUser) {
            const emailVerified = auth.currentUser.emailVerified;
            const verificationStatusEl = document.getElementById('emailVerificationStatus');
            if (verificationStatusEl) {
                if (emailVerified) {
                    verificationStatusEl.innerHTML = '<span style="color: #10b981;">✓ Email verified</span>';
                } else {
                    verificationStatusEl.innerHTML = '<span style="color: #f59e0b;">⚠ Email not verified</span>';
                    const resendBtn = document.getElementById('resendVerificationBtn');
                    if (resendBtn) {
                        resendBtn.style.display = 'inline-block';
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load assigned properties for profile
async function loadProfileAssignedProperties(assignedPropertyIds) {
    const propertiesListEl = document.getElementById('profileAssignedProperties');
    if (!propertiesListEl) return;
    
    if (!assignedPropertyIds || assignedPropertyIds.length === 0) {
        propertiesListEl.innerHTML = '<p style="color: #999; font-style: italic;">No properties assigned</p>';
        return;
    }
    
    try {
        const propertyPromises = assignedPropertyIds.map(propId => 
            db.collection('properties').doc(propId).get()
        );
        const propertyDocs = await Promise.all(propertyPromises);
        
        const properties = propertyDocs
            .filter(doc => doc.exists)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (properties.length === 0) {
            propertiesListEl.innerHTML = '<p style="color: #999; font-style: italic;">No properties found</p>';
            return;
        }
        
        propertiesListEl.innerHTML = properties.map(prop => `
            <div class="properties-list-item">
                <strong>${escapeHtml(prop.name || prop.id)}</strong>
                ${prop.address ? `<span style="color: #666; margin-left: 10px;">${escapeHtml(prop.address)}</span>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assigned properties:', error);
        propertiesListEl.innerHTML = '<p style="color: #dc2626;">Error loading properties</p>';
    }
}

// View pending user invitation details
window.viewPendingUser = async function(pendingUserId) {
    try {
        const pendingUserDoc = await db.collection('pendingUsers').doc(pendingUserId).get();
        if (!pendingUserDoc.exists) {
            alert('Pending invitation not found.');
            return;
        }
        
        const pendingUser = pendingUserDoc.data();
        const properties = [];
        
        if (pendingUser.assignedProperties && pendingUser.assignedProperties.length > 0) {
            const propertyPromises = pendingUser.assignedProperties.map(propId => 
                db.collection('properties').doc(propId).get()
            );
            const propertyDocs = await Promise.all(propertyPromises);
            propertyDocs.forEach(doc => {
                if (doc.exists) {
                    properties.push(doc.data().name || doc.id);
                }
            });
        }
        
        alert(`Pending Invitation Details:\n\n` +
              `Name: ${pendingUser.displayName}\n` +
              `Email: ${pendingUser.email}\n` +
              `Role: ${pendingUser.role}\n` +
              `Properties: ${properties.length > 0 ? properties.join(', ') : 'None'}\n` +
              `Status: Waiting for user to sign up\n\n` +
              `The user will receive an invitation email and can sign up to activate their account.`);
    } catch (error) {
        console.error('Error viewing pending user:', error);
        alert('Error loading pending invitation details.');
    }
};

function getRoleBadge(role) {
    const roleColors = {
        'super_admin': { bg: '#dc2626', text: '#fff', label: 'Super Admin' },
        'admin': { bg: '#ea580c', text: '#fff', label: 'Admin' },
        'property_manager': { bg: '#2563eb', text: '#fff', label: 'Property Manager' },
        'maintenance': { bg: '#059669', text: '#fff', label: 'Maintenance' },
        'viewer': { bg: '#64748b', text: '#fff', label: 'Viewer' }
    };
    
    const roleInfo = roleColors[role] || { bg: '#6b7280', text: '#fff', label: role || 'Unknown' };
    
    return `<span class="role-badge" style="background: ${roleInfo.bg}; color: ${roleInfo.text}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${roleInfo.label}</span>`;
}

function getStatusBadge(isActive) {
    if (isActive === undefined || isActive === null) {
        return `<span class="status-badge" style="background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pending Approval</span>`;
    }
    
    if (isActive) {
        return `<span class="status-badge" style="background: #10b981; color: #064e3b; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Active</span>`;
    } else {
        return `<span class="status-badge" style="background: #ef4444; color: #7f1d1d; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Inactive</span>`;
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Unknown';
}

// User detail modal functions
let editingUserId = null;

window.openUserDetailModal = async function(userId, editMode = false) {
    editingUserId = userId;
    
    try {
        // Load user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found.');
            return;
        }
        
        const user = { id: userDoc.id, ...userDoc.data() };
        
        // Populate form fields
        document.getElementById('userDetailId').value = user.id;
        document.getElementById('userDetailEmail').value = user.email || '';
        document.getElementById('userDetailDisplayName').value = user.displayName || '';
        document.getElementById('userDetailPhone').value = user.profile?.phone || '';
        document.getElementById('userDetailRole').value = user.role || 'viewer';
        document.getElementById('userDetailStatus').value = user.isActive ? 'true' : 'false';
        document.getElementById('userDetailTitle').value = user.profile?.title || '';
        document.getElementById('userDetailDepartment').value = user.profile?.department || '';
        document.getElementById('userDetailNotes').value = user.profile?.notes || '';
        
        // Format dates
        const createdDate = user.createdAt ? formatDate(user.createdAt) : 'Unknown';
        const lastLoginDate = user.lastLogin ? formatDate(user.lastLogin) : 'Never';
        document.getElementById('userDetailCreated').textContent = createdDate;
        document.getElementById('userDetailLastLogin').textContent = lastLoginDate;
        
        // Update modal title
        const modalTitle = document.getElementById('userDetailModalTitle');
        if (modalTitle) {
            modalTitle.textContent = editMode ? 'Edit User' : 'User Details';
        }
        
        // Check if current user can edit this user's role
        const roleSelect = document.getElementById('userDetailRole');
        const roleNote = document.getElementById('userDetailRoleNote');
        if (currentUserProfile) {
            const isSuperAdmin = currentUserProfile.role === 'super_admin';
            const isEditingSuperAdmin = user.role === 'super_admin';
            
            if (!isSuperAdmin && isEditingSuperAdmin) {
                roleSelect.disabled = true;
                if (roleNote) {
                    roleNote.textContent = 'Only Super Admins can change Super Admin roles.';
                    roleNote.style.color = '#e74c3c';
                }
            } else {
                roleSelect.disabled = false;
                if (roleNote) {
                    roleNote.textContent = '';
                }
            }
        }
        
        // Load assigned properties
        await loadUserProperties(user);
        
        // Show modal
        const modal = document.getElementById('userDetailModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Reset to Details tab
            switchUserDetailTab('details');
        }
        
    } catch (error) {
        console.error('Error opening user detail modal:', error);
        alert('Error loading user details: ' + error.message);
    }
};

// Switch user detail tabs
function switchUserDetailTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.user-tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('[data-user-tab]').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#666';
        btn.style.borderBottom = 'none';
        btn.style.marginBottom = '0';
    });
    
    // Show selected tab
    const selectedTab = document.getElementById('user' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
    
    // Activate tab button
    const tabButton = document.querySelector(`[data-user-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
        tabButton.style.color = '#667eea';
        tabButton.style.borderBottom = '2px solid #667eea';
        tabButton.style.marginBottom = '-2px';
    }
}

// Load user's assigned properties
async function loadUserProperties(user) {
    const propertiesList = document.getElementById('userPropertiesList');
    const propertyCheckboxes = document.getElementById('userPropertyCheckboxes');
    
    if (!propertiesList || !propertyCheckboxes) return;
    
    try {
        // Load all properties
        const propertiesSnapshot = await db.collection('properties').get();
        const allProperties = {};
        propertiesSnapshot.forEach(doc => {
            allProperties[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Get user's assigned properties
        const assignedPropertyIds = user.assignedProperties || [];
        
        // Display assigned properties
        if (assignedPropertyIds.length === 0) {
            propertiesList.innerHTML = '<p style="color: #999; font-style: italic;">No properties assigned.</p>';
        } else {
            let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
            assignedPropertyIds.forEach(propId => {
                const property = allProperties[propId];
                if (property) {
                    html += `
                        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600;">${escapeHtml(property.name || 'Unknown Property')}</span>
                            <button type="button" class="btn-small btn-danger" onclick="removeUserProperty('${editingUserId}', '${propId}')">Remove</button>
                        </div>
                    `;
                }
            });
            html += '</div>';
            propertiesList.innerHTML = html;
        }
        
        // Display property checkboxes
        if (Object.keys(allProperties).length === 0) {
            propertyCheckboxes.innerHTML = '<p style="color: #999; font-style: italic;">No properties available.</p>';
        } else {
            let html = '';
            Object.values(allProperties).forEach(property => {
                const isAssigned = assignedPropertyIds.includes(property.id);
                html += `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" 
                           onmouseover="this.style.background='#e8f0fe'" 
                           onmouseout="this.style.background='transparent'">
                        <input type="checkbox" value="${property.id}" ${isAssigned ? 'checked' : ''} 
                               onchange="updateUserPropertyCheckbox('${editingUserId}', '${property.id}', this.checked)">
                        <span style="font-weight: 500;">${escapeHtml(property.name || 'Unknown Property')}</span>
                    </label>
                `;
            });
            propertyCheckboxes.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Error loading user properties:', error);
        propertiesList.innerHTML = '<p style="color: #e74c3c;">Error loading properties.</p>';
        propertyCheckboxes.innerHTML = '<p style="color: #e74c3c;">Error loading properties.</p>';
    }
}

// Update user property checkbox
window.updateUserPropertyCheckbox = function(userId, propertyId, isChecked) {
    // This will be handled by the save button
    console.log('Property checkbox updated:', propertyId, isChecked);
};

// Remove user property
window.removeUserProperty = async function(userId, propertyId) {
    if (!confirm('Remove this property assignment?')) {
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found.');
            return;
        }
        
        const user = userDoc.data();
        const assignedProperties = user.assignedProperties || [];
        const updatedProperties = assignedProperties.filter(id => id !== propertyId);
        
        await db.collection('users').doc(userId).update({
            assignedProperties: updatedProperties
        });
        
        console.log('✅ Property removed successfully');
        
        // Reload user properties
        const updatedUser = { id: userId, ...user, assignedProperties: updatedProperties };
        await loadUserProperties(updatedUser);
        
        // Reload users list
        loadUsers();
    } catch (error) {
        console.error('Error removing property:', error);
        alert('Error removing property: ' + error.message);
    }
};

// Toggle user status
window.toggleUserStatus = async function(userId, isActive) {
    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`)) {
        return;
    }
    
    try {
        // Get user data before updating (for email)
        let userData = null;
        if (isActive) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                userData = userDoc.data();
            }
        }
        await db.collection('users').doc(userId).update({
            isActive: isActive,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ User ${isActive ? 'activated' : 'deactivated'} successfully`);
        
        // Send activation email if user was activated
        if (isActive && userData) {
            try {
                const sendActivationEmail = firebase.functions().httpsCallable('sendActivationEmail');
                await sendActivationEmail({
                    email: userData.email,
                    displayName: userData.displayName,
                    role: userData.role
                });
                console.log('✅ Activation email sent to:', userData.email);
            } catch (emailError) {
                console.error('Error sending activation email:', emailError);
                // Don't fail the activation if email fails - just log it
                console.warn('User activated but activation email could not be sent');
            }
        }
        
        // Reload users to refresh the list
        loadUsers();
    } catch (error) {
        console.error('Error updating user status:', error);
        alert(`Error ${isActive ? 'activating' : 'deactivating'} user: ${error.message}`);
    }
};

// Save user details
async function saveUserDetails(userId, userData) {
    try {
        // Get current user data to preserve existing profile fields
        const userDoc = await db.collection('users').doc(userId).get();
        const currentUser = userDoc.exists ? userDoc.data() : {};
        const currentProfile = currentUser.profile || {};
        
        const updateData = {
            displayName: userData.displayName,
            role: userData.role,
            isActive: userData.isActive,
            profile: {
                ...currentProfile,
                phone: userData.phone || null,
                title: userData.title || null,
                department: userData.department || null,
                notes: userData.notes || null
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(userId).update(updateData);
        
        console.log('✅ User updated successfully');
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

// Save user property assignments
async function saveUserProperties(userId, propertyIds) {
    try {
        await db.collection('users').doc(userId).update({
            assignedProperties: propertyIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ User properties updated successfully');
        return true;
    } catch (error) {
        console.error('Error saving user properties:', error);
        throw error;
    }
}

// Close user detail modal
function closeUserDetailModal() {
    const modal = document.getElementById('userDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    editingUserId = null;
}

// Invite User Modal Functions
async function openInviteUserModal() {
    const modal = document.getElementById('inviteUserModal');
    if (!modal) return;
    
    // Reset form
    const form = document.getElementById('inviteUserForm');
    if (form) form.reset();
    
    // Clear error
    const errorDiv = document.getElementById('inviteUserError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    // Load properties for checkboxes
    await loadInviteProperties();
    
    // Update properties note
    updateInvitePropertiesNote();
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeInviteUserModal() {
    const modal = document.getElementById('inviteUserModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function updateInvitePropertiesNote() {
    const roleSelect = document.getElementById('inviteRole');
    const noteElement = document.getElementById('invitePropertiesNote');
    if (!roleSelect || !noteElement) return;
    
    const role = roleSelect.value;
    if (role === 'admin' || role === 'super_admin') {
        noteElement.textContent = 'Admins have access to all properties. Property assignment is optional.';
        noteElement.style.color = '#059669';
    } else {
        noteElement.textContent = 'Select at least one property for this user to access.';
        noteElement.style.color = '#666';
    }
}

async function loadInviteProperties() {
    const checkboxesDiv = document.getElementById('invitePropertiesCheckboxes');
    if (!checkboxesDiv) return;
    
    try {
        const propertiesSnapshot = await db.collection('properties').get();
        const properties = [];
        propertiesSnapshot.forEach(doc => {
            properties.push({ id: doc.id, ...doc.data() });
        });
        
        if (properties.length === 0) {
            checkboxesDiv.innerHTML = '<p style="color: #999; font-style: italic;">No properties available. Create properties first.</p>';
            return;
        }
        
        let html = '';
        properties.forEach(property => {
            html += `
                <label style="display: flex; align-items: center; gap: 10px; padding: 10px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" 
                       onmouseover="this.style.background='#e8f0fe'" 
                       onmouseout="this.style.background='transparent'">
                    <input type="checkbox" value="${property.id}" name="inviteProperty">
                    <span style="font-weight: 500;">${escapeHtml(property.name || 'Unknown Property')}</span>
                </label>
            `;
        });
        checkboxesDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading properties for invite:', error);
        checkboxesDiv.innerHTML = '<p style="color: #e74c3c;">Error loading properties.</p>';
    }
}

async function handleInviteUser(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔵 handleInviteUser called');
    
    // Safety checks
    if (!db) {
        console.error('❌ Firestore database not initialized');
        alert('Error: Database not initialized. Please refresh the page.');
        return;
    }
    
    if (!currentUser || !currentUser.uid) {
        console.error('❌ Current user not available');
        alert('Error: You must be logged in to invite users.');
        return;
    }
    
    const email = document.getElementById('inviteEmail')?.value;
    const fullName = document.getElementById('inviteFullName')?.value;
    const phone = document.getElementById('invitePhone')?.value;
    const role = document.getElementById('inviteRole')?.value;
    const title = document.getElementById('inviteTitle')?.value;
    const department = document.getElementById('inviteDepartment')?.value;
    const sendEmail = document.getElementById('sendInviteEmail')?.checked || false;
    const errorDiv = document.getElementById('inviteUserError');
    
    // Validate required fields
    if (!email || !fullName) {
        if (errorDiv) {
            errorDiv.textContent = 'Please fill in all required fields (Email and Full Name).';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Get selected properties
    const propertyCheckboxes = document.querySelectorAll('#invitePropertiesCheckboxes input[type="checkbox"]:checked');
    const propertyIds = Array.from(propertyCheckboxes).map(cb => cb.value);
    
    // Validate role
    if (!role) {
        if (errorDiv) {
            errorDiv.textContent = 'Please select a role.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Validate properties for non-admin roles
    if (role !== 'admin' && role !== 'super_admin' && propertyIds.length === 0) {
        if (errorDiv) {
            errorDiv.textContent = 'Please select at least one property for non-admin roles.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Clear previous errors
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    try {
        // Normalize email (lowercase, trim) for consistent matching
        const normalizedEmail = (email || '').toLowerCase().trim();
        
        // Check if user already exists in the system
        console.log('🔍 Checking if user already exists:', normalizedEmail);
        
        // Check Firestore users collection - only check active users (not deleted)
        // Note: We can't check Firebase Auth directly from client, but we check Firestore
        // If a user was deleted from Auth, they shouldn't have an active Firestore profile
        const existingUsersSnapshot = await db.collection('users')
            .where('email', '==', normalizedEmail)
            .limit(1)
            .get();
        
        if (!existingUsersSnapshot.empty) {
            const userDoc = existingUsersSnapshot.docs[0];
            const userData = userDoc.data();
            
            // Only block if user is active (not deleted/inactive)
            // If user was deleted from Auth, their Firestore doc might still exist but should be inactive
            // Allow re-inviting deleted users
            if (userData.isActive !== false) {
                const errorMsg = 'A user with this email already exists in the system.';
                console.warn('⚠️', errorMsg);
                if (errorDiv) {
                    errorDiv.textContent = errorMsg;
                    errorDiv.style.display = 'block';
                }
                return;
            } else {
                // User exists but is inactive - this might be a deleted user
                // Check if there's a corresponding Firebase Auth user
                // Since we can't check Auth directly, we'll allow the invitation
                // The system will handle linking if the user signs up again
                console.log('ℹ️ Found inactive user with this email - allowing re-invitation');
            }
        }
        
        // Check pendingUsers collection
        const existingPendingSnapshot = await db.collection('pendingUsers')
            .where('email', '==', normalizedEmail)
            .limit(1)
            .get();
        
        if (!existingPendingSnapshot.empty) {
            const errorMsg = 'A pending invitation already exists for this email address.';
            console.warn('⚠️', errorMsg);
            if (errorDiv) {
                errorDiv.textContent = errorMsg;
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        // Check userInvitations collection for pending invitations
        const existingInvitationsSnapshot = await db.collection('userInvitations')
            .where('email', '==', normalizedEmail)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        
        if (!existingInvitationsSnapshot.empty) {
            const errorMsg = 'A pending invitation already exists for this email address.';
            console.warn('⚠️', errorMsg);
            if (errorDiv) {
                errorDiv.textContent = errorMsg;
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        console.log('✅ Email is unique, proceeding with invitation creation');
        
        // Create user invitation document
        // The user will sign up themselves, and we'll link their account to this invitation
        const invitationData = {
            email: normalizedEmail, // Store normalized email
            displayName: fullName,
            role: role,
            assignedProperties: propertyIds,
            profile: {
                phone: phone || null,
                title: title || null,
                department: department || null
            },
            invitedBy: currentUser.uid,
            invitedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            sendEmail: sendEmail
        };
        
        // Create invitation document
        let invitationRef;
        try {
            invitationRef = await db.collection('userInvitations').add(invitationData);
            console.log('✅ User invitation created:', invitationRef.id);
        } catch (inviteError) {
            console.error('❌ Failed to create invitation:', inviteError);
            throw new Error(`Failed to create invitation: ${inviteError.message || 'Unknown error'}`);
        }
        
        // Create pending user document
        // Use normalizedEmail already declared above
        let pendingUserRef;
        try {
            pendingUserRef = db.collection('pendingUsers').doc();
            await pendingUserRef.set({
                email: normalizedEmail, // Store normalized email
                displayName: fullName,
                role: role,
                isActive: true, // Admin-invited users are active immediately
                assignedProperties: propertyIds,
                profile: {
                    phone: phone || null,
                    title: title || null,
                    department: department || null
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentUser.uid,
                invitationId: invitationRef.id,
                status: 'pending_signup'
            });
            console.log('✅ Pending user document created:', pendingUserRef.id);
            
            // Verify the document was actually created
            const verifyDoc = await pendingUserRef.get();
            if (!verifyDoc.exists) {
                throw new Error('Pending user document was not created successfully');
            }
        } catch (pendingError) {
            console.error('❌ Failed to create pending user:', pendingError);
            // Try to clean up invitation if pending user creation fails
            try {
                await invitationRef.delete();
                console.log('⚠️ Cleaned up invitation due to pending user creation failure');
            } catch (cleanupError) {
                console.error('⚠️ Could not clean up invitation:', cleanupError);
            }
            throw new Error(`Failed to create pending user: ${pendingError.message || 'Unknown error'}`);
        }
        
        // Email sending is handled by the Firestore trigger (onInvitationCreated)
        // The trigger automatically sends the email when userInvitations document is created with sendEmail: true
        // We don't need to call the callable function - the trigger handles it
        let emailSent = false;
        let emailError = null;
        
        if (sendEmail) {
            // The email will be sent automatically by the onInvitationCreated trigger
            // We set emailSent to true since the trigger will handle it
            // The trigger fires when the userInvitations document is created above
            emailSent = true;
            console.log('✅ Invitation email will be sent via Firestore trigger');
            
            // Optional: Also try to call the callable function as a backup
            // But don't fail if it doesn't work since the trigger handles it
            try {
                if (firebase.functions) {
                    const sendInvitationEmail = firebase.functions().httpsCallable('sendInvitationEmail');
                    // Use a timeout to prevent hanging if CORS blocks it
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Function call timeout')), 5000)
                    );
                    
                    const result = await Promise.race([
                        sendInvitationEmail({
                            email: normalizedEmail,
                            displayName: fullName,
                            role: role,
                            assignedProperties: propertyIds
                        }),
                        timeoutPromise
                    ]);
                    
                    if (result.data && result.data.success) {
                        console.log('✅ Invitation email also sent via callable function');
                    }
                }
            } catch (emailErr) {
                // Silently ignore - the trigger already handles email sending
                console.log('ℹ️ Callable function call failed (trigger will handle email):', emailErr.code || emailErr.message);
                // Don't set emailError - the trigger handles it, so this is not an error
            }
        }
        
        // Show success message
        let successMessage = `Invitation created for ${fullName} (${normalizedEmail}).\n\n`;
        
        if (sendEmail) {
            // Email is sent via Firestore trigger, so it should always succeed
            successMessage += '✅ An invitation email will be sent automatically.\n\n';
        }
        
        successMessage += 'The user can now sign up and their account will be automatically configured with the assigned role and properties.\n\n';
        successMessage += 'Note: The user will appear in the Users list after they sign up.';
        
        alert(successMessage);
        
        // Close modal
        closeInviteUserModal();
        
        // Reload users list (though invited user won't appear until they sign up)
        loadUsers();
        
    } catch (error) {
        console.error('Error creating invitation:', error);
        let errorMessage = 'An error occurred while creating the invitation.';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'You do not have permission to create user invitations.';
        } else {
            errorMessage = error.message || 'Failed to create invitation. Please try again.';
        }
        
        if (errorDiv) {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }
}

// Check for pending user invitation when user signs up
async function checkPendingInvitation(email) {
    try {
        // Normalize email (lowercase, trim) for consistent matching
        const normalizedEmail = (email || '').toLowerCase().trim();
        
        if (!normalizedEmail) {
            console.log('⚠️ No email provided to checkPendingInvitation');
            return null;
        }
        
        console.log('🔍 Checking for pending invitation with email:', normalizedEmail);
        
        // Try to use Cloud Function first (works for unauthenticated users)
        if (firebase && firebase.functions) {
            try {
                const checkInvitation = firebase.functions().httpsCallable('checkPendingInvitation');
                const result = await checkInvitation({ email: normalizedEmail });
                
                if (result.data && result.data.hasInvitation) {
                    console.log('✅ Found pending invitation via Cloud Function');
                    // Cloud Function now returns full data
                    return {
                        displayName: result.data.displayName,
                        role: result.data.role,
                        isActive: result.data.isActive !== false,
                        email: result.data.email || normalizedEmail,
                        assignedProperties: result.data.assignedProperties || [],
                        profile: result.data.profile || {},
                        createdBy: result.data.createdBy
                    };
                } else {
                    console.log('ℹ️ No pending invitation found via Cloud Function');
                    return null;
                }
            } catch (cfError) {
                console.warn('⚠️ Cloud Function check failed, trying direct Firestore query:', cfError.message);
                // Fall through to direct Firestore query if authenticated
            }
        }
        
        // Fallback: Try direct Firestore query (requires authentication)
        if (db && auth && auth.currentUser) {
            const pendingUsersSnapshot = await db.collection('pendingUsers')
                .where('email', '==', normalizedEmail)
                .where('status', '==', 'pending_signup')
                .limit(1)
                .get();
            
            if (!pendingUsersSnapshot.empty) {
                const pendingUser = pendingUsersSnapshot.docs[0].data();
                console.log('✅ Found pending invitation via Firestore:', pendingUser);
                return pendingUser;
            }
        }
        
        console.log('ℹ️ No pending invitation found for:', normalizedEmail);
        return null;
    } catch (error) {
        console.error('❌ Error checking pending invitation:', error);
        return null;
    }
}

// Link pending user to actual user account
async function linkPendingUserToAccount(userId, email) {
    try {
        // Normalize email for consistent matching
        const normalizedEmail = (email || '').toLowerCase().trim();
        console.log('🔗 Linking pending user to account:', { userId, email: normalizedEmail });
        
        // Get full pending user data from Firestore (user is authenticated now)
        // Query directly to ensure we get all fields including assignedProperties
        let pendingUser = null;
        if (db) {
            try {
                const pendingUsersSnapshot = await db.collection('pendingUsers')
                    .where('email', '==', normalizedEmail)
                    .where('status', '==', 'pending_signup')
                    .limit(1)
                    .get();
                
                if (!pendingUsersSnapshot.empty) {
                    pendingUser = pendingUsersSnapshot.docs[0].data();
                    console.log('✅ Got full pending user data for linking:', {
                        role: pendingUser.role,
                        isActive: pendingUser.isActive,
                        displayName: pendingUser.displayName,
                        assignedPropertiesCount: (pendingUser.assignedProperties || []).length
                    });
                }
            } catch (queryError) {
                console.warn('⚠️ Could not query Firestore for pending user:', queryError.message);
                // Fallback to checkPendingInvitation
                pendingUser = await checkPendingInvitation(normalizedEmail);
            }
        } else {
            pendingUser = await checkPendingInvitation(normalizedEmail);
        }
        
        if (!pendingUser) {
            console.log('❌ No pending invitation found for:', normalizedEmail);
            return false;
        }
        
        // Check if user profile already exists - prevent duplicates
        const existingProfile = await db.collection('users').doc(userId).get();
        if (existingProfile.exists) {
            const existingData = existingProfile.data();
            console.log('⚠️ User profile already exists:', existingData);
            
            // If profile exists but doesn't match pending invitation, update it
            const shouldBeActive = pendingUser.isActive !== false; // Ensure invited users are active
            if (existingData.role !== pendingUser.role || existingData.isActive !== shouldBeActive) {
                console.log('🔄 Updating existing profile to match pending invitation...');
                await db.collection('users').doc(userId).update({
                    email: normalizedEmail,
                    displayName: pendingUser.displayName,
                    role: pendingUser.role,
                    isActive: shouldBeActive, // Ensure active
                    assignedProperties: pendingUser.assignedProperties || [],
                    profile: pendingUser.profile || {},
                    createdBy: pendingUser.createdBy
                });
                console.log('✅ Updated existing profile with pending invitation data - user is now ACTIVE');
            } else {
                console.log('✅ Existing profile already matches pending invitation');
            }
        } else {
            // Create user document with pending user's data
            try {
                const userData = {
                    email: normalizedEmail, // Use normalized email
                    displayName: pendingUser.displayName,
                    role: pendingUser.role,
                    isActive: pendingUser.isActive !== false, // Ensure invited users are active (default to true)
                    assignedProperties: pendingUser.assignedProperties || [],
                    profile: pendingUser.profile || {},
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: pendingUser.createdBy
                };
                
                console.log('📝 Creating user profile with data:', userData);
                console.log('🔑 User will be ACTIVE:', userData.isActive);
                await db.collection('users').doc(userId).set(userData);
                console.log('✅ User profile created with pending invitation data - user is ACTIVE');
            } catch (createError) {
                console.error('❌ Error creating user profile:', createError);
                // Provide specific error message
                if (createError.code === 'permission-denied') {
                    throw new Error('Permission denied: Unable to create user profile. Please contact an administrator.');
                } else {
                    throw new Error(`Failed to create user profile: ${createError.message}`);
                }
            }
        }
        
        // Mark pending user as completed
        try {
            const pendingDoc = await db.collection('pendingUsers')
                .where('email', '==', normalizedEmail)
                .where('status', '==', 'pending_signup')
                .limit(1)
                .get();
            
            if (!pendingDoc.empty) {
                await pendingDoc.docs[0].ref.update({
                    status: 'completed',
                    linkedUserId: userId,
                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Pending user marked as completed');
            }
        } catch (updateError) {
            console.warn('⚠️ Could not update pending user status:', updateError);
            // Don't fail the whole process if this update fails
        }
        
        // Update invitation status if exists
        try {
            if (pendingUser.invitationId) {
                await db.collection('userInvitations').doc(pendingUser.invitationId).update({
                    status: 'accepted',
                    acceptedBy: userId,
                    acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Invitation marked as accepted');
            }
        } catch (inviteError) {
            console.warn('⚠️ Could not update invitation status:', inviteError);
            // Don't fail the whole process if this update fails
        }
        
        console.log('✅ Pending user successfully linked to account');
        return true;
    } catch (error) {
        console.error('❌ Error linking pending user:', error);
        // Re-throw with more context
        throw error;
    }
}

function loadPropertiesForTenantFilter() {
    const propertyFilter = document.getElementById('tenantPropertyFilter');
    if (!propertyFilter) {
        console.warn('⚠️ loadPropertiesForTenantFilter: tenantPropertyFilter not found');
        return;
    }
    
    console.log('🔍 loadPropertiesForTenantFilter called', {
        userRole: currentUserProfile?.role,
        assignedProperties: currentUserProfile?.assignedProperties
    });
    
    propertyFilter.innerHTML = '<option value="">All Properties</option>';
    
    // For maintenance users, only show assigned properties
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        console.log('🔍 loadPropertiesForTenantFilter: Loading assigned properties for maintenance user');
        // Load assigned properties individually
        const propertyPromises = currentUserProfile.assignedProperties.map(propId => 
            db.collection('properties').doc(propId).get().catch(e => {
                console.warn(`Could not load property ${propId}:`, e);
                return null;
            })
        );
        
        Promise.all(propertyPromises).then((propertyDocs) => {
            const loadedProperties = propertyDocs.filter(doc => doc && doc.exists);
            console.log(`✅ loadPropertiesForTenantFilter: Loaded ${loadedProperties.length} properties for maintenance user`);
            
            loadedProperties.forEach(doc => {
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
                console.log('✅ loadPropertiesForTenantFilter: Restored saved property:', savedProperty);
            }
        }).catch((error) => {
            console.error('❌ loadPropertiesForTenantFilter: Error loading properties:', error);
        });
        return; // Exit early for maintenance users
    }
    
    // For other roles, load all properties
    console.log('🔍 loadPropertiesForTenantFilter: Loading all properties for non-maintenance user');
    db.collection('properties').get().then((querySnapshot) => {
        console.log(`✅ loadPropertiesForTenantFilter: Loaded ${querySnapshot.size} properties`);
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
        console.error('❌ loadPropertiesForTenantFilter: Error loading properties:', error);
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
                ${(currentUserProfile && currentUserProfile.role === 'maintenance') ? '' : `
                    <button class="btn-secondary btn-small" onclick="editTenant('${id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteTenant('${id}')">Delete</button>
                `}
            </div>
        `;
        tenantsList.appendChild(card);
    });
}

async function renderTenantsTableView(tenants) {
    console.log('🔍 renderTenantsTableView: START', {
        tenantCount: Object.keys(tenants).length,
        userRole: currentUserProfile?.role
    });
    
    try {
        const tenantsList = document.getElementById('tenantsList');
        const tenantsTable = document.getElementById('tenantsTable');
        
        if (tenantsList) tenantsList.style.display = 'none';
        if (tenantsTable) tenantsTable.style.display = 'block';
        
        if (!tenantsTable) {
            console.log('⚠️ renderTenantsTableView: tenantsTable not found');
            return;
        }
        
        // Filter tenants by property if needed
        console.log('🔍 renderTenantsTableView: Filtering tenants by property');
        const filteredTenants = await filterTenantsByProperty(tenants).catch(error => {
            console.error('❌ renderTenantsTableView: Error in filterTenantsByProperty:', error);
            throw error;
        });
        console.log('✅ renderTenantsTableView: Filtered tenants:', Object.keys(filteredTenants).length);
    
    // Load occupancies, buildings, units, and properties to group by building
    // We need to load these even if there are no tenants, to show orphaned units
    // Filter for maintenance users
    console.log('🔍 renderTenantsTableView: Starting to load data...', {
        userRole: currentUserProfile?.role,
        assignedProperties: currentUserProfile?.assignedProperties
    });
    
    let occupanciesQuery = db.collection('occupancies');
    let buildingsQuery = db.collection('buildings');
    let unitsQuery = db.collection('units');
    let propertiesPromise;
    
    // For maintenance users, filter by assigned properties
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0) {
        console.log('🔍 renderTenantsTableView: Filtering for maintenance user');
        if (currentUserProfile.assignedProperties.length <= 10) {
            occupanciesQuery = occupanciesQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
            buildingsQuery = buildingsQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
            unitsQuery = unitsQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
            console.log('🔍 renderTenantsTableView: Applied whereIn filters');
        }
        // Load assigned properties individually
        const propertyPromises = currentUserProfile.assignedProperties.map(propId => 
            db.collection('properties').doc(propId).get().catch(e => {
                console.warn(`Could not load property ${propId}:`, e);
                return null;
            })
        );
        propertiesPromise = Promise.all(propertyPromises).then(docs => {
            console.log('✅ renderTenantsTableView: Loaded properties:', docs.filter(d => d && d.exists).length);
            // Convert to snapshot-like object
            return {
                forEach: (fn) => docs.forEach(doc => doc && doc.exists && fn(doc))
            };
        }).catch(error => {
            console.error('❌ renderTenantsTableView: Error in propertiesPromise.then():', error);
            throw error;
        });
    } else {
        // For other roles, load all
        console.log('🔍 renderTenantsTableView: Loading all data for non-maintenance user');
        propertiesPromise = db.collection('properties').get();
    }
    
    console.log('🔍 renderTenantsTableView: Executing Promise.all...');
    const [occupanciesSnapshot, buildingsSnapshot, unitsSnapshot, propertiesSnapshot] = await Promise.all([
        occupanciesQuery.get().catch(e => {
            console.error('❌ Error loading occupancies:', e);
            throw e;
        }),
        buildingsQuery.get().catch(e => {
            console.error('❌ Error loading buildings:', e);
            throw e;
        }),
        unitsQuery.get().catch(e => {
            console.error('❌ Error loading units:', e);
            throw e;
        }),
        propertiesPromise.catch(e => {
            console.error('❌ Error loading properties:', e);
            throw e;
        })
    ]);
    console.log('✅ renderTenantsTableView: All data loaded', {
        occupancies: occupanciesSnapshot.size,
        buildings: buildingsSnapshot.size,
        units: unitsSnapshot.size
    });
    
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
    // Maintenance users CAN access tenantContacts for tenants in assigned properties
    let maxContacts, maxBrokers;
    if (Object.keys(filteredTenants).length > 0) {
        console.log('🔍 renderTenantsTableView: Determining max contacts');
        const result = await determineMaxContacts(filteredTenants).catch(error => {
            console.error('❌ renderTenantsTableView: Error in determineMaxContacts:', error);
            // Use defaults if there's an error
            return { maxContacts: 5, maxBrokers: 2 };
        });
        maxContacts = result.maxContacts;
        maxBrokers = result.maxBrokers;
    } else {
        maxContacts = 5;
        maxBrokers = 2;
    }
    console.log('✅ renderTenantsTableView: Using maxContacts:', maxContacts, 'maxBrokers:', maxBrokers);
    
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
                                ${(currentUserProfile && currentUserProfile.role === 'maintenance') ? '' : `
                                    <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                        <span class="btn-icon">✏️</span>
                                    </button>
                                    <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                        <span class="btn-icon">🚪</span>
                                    </button>
                                    <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                        <span class="btn-icon">🗑️</span>
                                    </button>
                                `}
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
            
            const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
            const editDeleteButtons = isMaintenance 
                ? '' 
                : `
                    <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                        <span class="btn-icon">✏️</span>
                    </button>
                    <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                        <span class="btn-icon">🚪</span>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                        <span class="btn-icon">🗑️</span>
                    </button>
                `;
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
                                ${editDeleteButtons}
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
                                ${(currentUserProfile && currentUserProfile.role === 'maintenance') ? '' : `
                                    <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                        <span class="btn-icon">✏️</span>
                                    </button>
                                    <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                        <span class="btn-icon">🚪</span>
                                    </button>
                                    <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                        <span class="btn-icon">🗑️</span>
                                    </button>
                                `}
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
    console.log('🔍 renderTenantsTableView: Loading contacts for all tenants');
    try {
        await loadContactsForTableView(allTenantsForContacts, maxContacts, maxBrokers);
        console.log('✅ renderTenantsTableView: Contacts loaded successfully');
    } catch (error) {
        console.error('❌ renderTenantsTableView: Error loading contacts:', error);
        // Don't throw - continue with rendering
    }
    
    // Load and display orphan contacts (contacts without tenants)
    console.log('🔍 renderTenantsTableView: Loading orphan contacts');
    try {
        await loadOrphanContacts(maxContacts, maxBrokers);
        console.log('✅ renderTenantsTableView: Orphan contacts loaded successfully');
    } catch (error) {
        console.error('❌ renderTenantsTableView: Error loading orphan contacts:', error);
        // Don't throw - continue with rendering
    }
    
    // Load and display moved out tenants section
    console.log('🔍 renderTenantsTableView: Loading moved out tenants section');
    try {
        await loadMovedOutTenantsSection(movedOutTenants, occupanciesMap, unitsMap, maxContacts, maxBrokers);
        console.log('✅ renderTenantsTableView: Moved out tenants section loaded successfully');
    } catch (error) {
        console.error('❌ renderTenantsTableView: Error loading moved out tenants section:', error);
        // Don't throw - continue with rendering
    }
    
        console.log('✅ renderTenantsTableView: Completed successfully');
    } catch (error) {
        console.error('❌ renderTenantsTableView: FATAL ERROR:', error);
        console.error('❌ renderTenantsTableView: Error stack:', error.stack);
        // Show error message to user
        const tenantsTable = document.getElementById('tenantsTable');
        if (tenantsTable) {
            tenantsTable.innerHTML = `<p class="no-tenants-message" style="color: #dc2626;">Error loading tenants: ${error.message}</p>`;
        }
        // Don't rethrow - we've handled it
    }
}

async function loadOrphanContacts(maxContacts, maxBrokers) {
    try {
        console.log('🔍 loadOrphanContacts: Starting', {
            userRole: currentUserProfile?.role
        });
        
        // For maintenance users, we need to filter contacts by assigned properties
        // Get tenantIds for assigned properties first
        let tenantIdsForContacts = new Set();
        if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
            Array.isArray(currentUserProfile.assignedProperties) && 
            currentUserProfile.assignedProperties.length > 0) {
            console.log('🔍 loadOrphanContacts: Filtering for maintenance user');
            // Load occupancies for assigned properties to get tenantIds
            if (currentUserProfile.assignedProperties.length <= 10) {
                const occupanciesSnapshot = await db.collection('occupancies')
                    .where('propertyId', 'in', currentUserProfile.assignedProperties)
                    .get();
                occupanciesSnapshot.forEach(doc => {
                    const occ = doc.data();
                    if (occ.tenantId) {
                        tenantIdsForContacts.add(occ.tenantId);
                    }
                });
                console.log(`✅ loadOrphanContacts: Found ${tenantIdsForContacts.size} tenantIds for assigned properties`);
            }
        }
        
        // Get all contacts (or filtered for maintenance users)
        let allContactsSnapshot;
        if (currentUserProfile && currentUserProfile.role === 'maintenance' && tenantIdsForContacts.size > 0) {
            // For maintenance users, only get contacts for tenants in assigned properties
            // Batch queries if needed (Firestore 'in' limit is 10)
            const tenantIdsArray = Array.from(tenantIdsForContacts);
            const allContacts = [];
            const batchSize = 10;
            
            for (let i = 0; i < tenantIdsArray.length; i += batchSize) {
                const batch = tenantIdsArray.slice(i, i + batchSize);
                const batchSnapshot = await db.collection('tenantContacts')
                    .where('tenantId', 'in', batch)
                    .get();
                batchSnapshot.forEach(doc => {
                    allContacts.push(doc);
                });
            }
            
            // Convert to snapshot-like object
            allContactsSnapshot = {
                forEach: (fn) => allContacts.forEach(fn),
                size: allContacts.length
            };
        } else {
            // For other roles, get all contacts
            allContactsSnapshot = await db.collection('tenantContacts').get();
        }
        
        // Get tenant IDs
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
        console.log('🔍 loadMovedOutTenantsSection: Loading contacts for moved out tenants');
        try {
            await loadContactsForTableView(movedOutTenantsMap, maxContacts, maxBrokers);
            console.log('✅ loadMovedOutTenantsSection: Contacts loaded successfully');
        } catch (error) {
            console.error('❌ loadMovedOutTenantsSection: Error loading contacts:', error);
            // Don't throw - just log the error
        }
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
    
    console.log('🔍 determineMaxContacts: Starting', {
        tenantCount: tenantIds.length,
        userRole: currentUserProfile?.role
    });
    
    // Firestore 'in' query limit is 10, so we need to batch
    const allContacts = {};
    const batchSize = 10;
    
    for (let i = 0; i < tenantIds.length; i += batchSize) {
        const batch = tenantIds.slice(i, i + batchSize);
        try {
            console.log(`🔍 determineMaxContacts: Loading batch ${i / batchSize + 1} (${batch.length} tenants)`);
            const contactsSnapshot = await db.collection('tenantContacts')
                .where('tenantId', 'in', batch)
                .get();
            
            console.log(`✅ determineMaxContacts: Loaded ${contactsSnapshot.size} contacts for batch`);
            contactsSnapshot.forEach(doc => {
                const contact = { id: doc.id, ...doc.data() };
                if (!allContacts[contact.tenantId]) {
                    allContacts[contact.tenantId] = [];
                }
                allContacts[contact.tenantId].push(contact);
            });
        } catch (error) {
            console.error(`❌ determineMaxContacts: Error loading batch ${i / batchSize + 1}:`, error);
            // Continue with other batches
        }
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
                                ${(currentUserProfile && currentUserProfile.role === 'maintenance') ? '' : `
                                    <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                                        <span class="btn-icon">✏️</span>
                                    </button>
                                    <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                                        <span class="btn-icon">🚪</span>
                                    </button>
                                    <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                                        <span class="btn-icon">🗑️</span>
                                    </button>
                                `}
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
            
            const isMaintenance = currentUserProfile && currentUserProfile.role === 'maintenance';
            const editDeleteButtons = isMaintenance 
                ? '' 
                : `
                    <button class="btn-action btn-edit" onclick="editTenant('${tenant.id}')" title="Edit">
                        <span class="btn-icon">✏️</span>
                    </button>
                    <button class="btn-action btn-danger" onclick="markTenantAsMovedOut('${tenant.id}')" title="Mark as Moved Out" style="background: #f97316; border-color: #f97316; color: white;">
                        <span class="btn-icon">🚪</span>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTenant('${tenant.id}')" title="Delete">
                        <span class="btn-icon">🗑️</span>
                    </button>
                `;
            
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
                                ${editDeleteButtons}
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
    console.log('🔍 loadContactsForTableView called', {
        tenantCount: Object.keys(tenants).length,
        userRole: currentUserProfile?.role
    });
    
    const tenantIds = Object.keys(tenants);
    if (tenantIds.length === 0) {
        console.log('⚠️ loadContactsForTableView: No tenants provided');
        return;
    }
    
    // Maintenance users CAN access tenantContacts for tenants in assigned properties
    // The tenants passed in are already filtered by assigned properties
    try {
        // Use cached contacts if available, otherwise load them
        let allContacts = window._cachedContacts;
        if (!allContacts) {
            console.log('🔍 loadContactsForTableView: Loading contacts from Firestore');
            allContacts = {};
            const batchSize = 10;
            
            for (let i = 0; i < tenantIds.length; i += batchSize) {
                const batch = tenantIds.slice(i, i + batchSize);
                try {
                    console.log(`🔍 loadContactsForTableView: Loading batch ${i / batchSize + 1} (${batch.length} tenants)`);
                    const contactsSnapshot = await db.collection('tenantContacts')
                        .where('tenantId', 'in', batch)
                        .get();
                    
                    console.log(`✅ loadContactsForTableView: Loaded ${contactsSnapshot.size} contacts for batch`);
                    contactsSnapshot.forEach(doc => {
                        const contact = { id: doc.id, ...doc.data() };
                        if (!allContacts[contact.tenantId]) {
                            allContacts[contact.tenantId] = [];
                        }
                        allContacts[contact.tenantId].push(contact);
                    });
                } catch (error) {
                    console.error(`❌ loadContactsForTableView: Error loading contacts batch ${i / batchSize + 1}:`, error);
                    // Continue with other batches
                }
            }
            window._cachedContacts = allContacts; // Cache for future use
        } else {
            console.log('✅ loadContactsForTableView: Using cached contacts');
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
        console.log('✅ loadContactsForTableView: Completed successfully');
    } catch (error) {
        console.error('❌ loadContactsForTableView: Fatal error:', error);
        // Don't throw - just log and return
        return Promise.resolve();
    }
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
    console.log('🔍 filterTenantsByProperty called', {
        tenantCount: Object.keys(tenants).length,
        selectedProperty: selectedPropertyForTenants,
        userRole: currentUserProfile?.role
    });
    
    if (!selectedPropertyForTenants) {
        return tenants;
    }
    
    // For maintenance users, verify the selected property is assigned
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        !currentUserProfile.assignedProperties.includes(selectedPropertyForTenants)) {
        console.warn('⚠️ Maintenance user trying to filter by unassigned property:', selectedPropertyForTenants);
        return {}; // Return empty - can't filter by unassigned property
    }
    
    // Get occupancies to check which tenants have occupancies
    // Filter for maintenance users
    let occupanciesQuery = db.collection('occupancies');
    if (currentUserProfile && currentUserProfile.role === 'maintenance' && 
        Array.isArray(currentUserProfile.assignedProperties) && 
        currentUserProfile.assignedProperties.length > 0 &&
        currentUserProfile.assignedProperties.length <= 10) {
        occupanciesQuery = occupanciesQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
        console.log('🔍 Filtering occupancies for maintenance user in filterTenantsByProperty');
    }
    
    console.log('🔍 Loading occupancies for filterTenantsByProperty...');
    const allOccupanciesSnapshot = await occupanciesQuery.get().catch(error => {
        console.error('❌ Error loading occupancies in filterTenantsByProperty:', error);
        throw error;
    });
    console.log('✅ Loaded occupancies for filterTenantsByProperty:', allOccupanciesSnapshot.size);
    
    const tenantIdsWithOccupancies = new Set();
    const tenantIdsInProperty = new Set();
    
    allOccupanciesSnapshot.forEach(doc => {
        const occ = doc.data();
        if (occ.tenantId) {
            tenantIdsWithOccupancies.add(occ.tenantId);
        }
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
        loadTenantDocuments(tenantId);
        
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

// Tenant Document Management
function loadTenantDocuments(tenantId) {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) return;
    
    db.collection('tenants').doc(tenantId).get().then((doc) => {
        const tenant = doc.data();
        if (!tenant) {
            documentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No documents found.</p>';
            return;
        }
        
        const documents = tenant.documents || [];
        documentsList.innerHTML = '';
        
        if (documents.length === 0) {
            documentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No documents uploaded yet. Click "Upload Document" to add one.</p>';
            return;
        }
        
        // Sort documents by upload date (newest first)
        const sortedDocuments = [...documents].sort((a, b) => {
            const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt || 0);
            const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt || 0);
            return dateB - dateA;
        });
        
        sortedDocuments.forEach((docItem, index) => {
            const documentItem = document.createElement('div');
            documentItem.className = 'unit-item';
            documentItem.style.marginBottom = '15px';
            
            const uploadedDate = docItem.uploadedAt?.toDate 
                ? docItem.uploadedAt.toDate().toLocaleDateString() 
                : 'Unknown date';
            
            const fileIcon = getFileIcon(docItem.fileName);
            const fileSize = docItem.fileSize ? formatFileSize(docItem.fileSize) : '';
            
            documentItem.innerHTML = `
                <div class="unit-info">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 24px;">${fileIcon}</span>
                        <div style="flex: 1;">
                            <h4 style="margin: 0;">${escapeHtml(docItem.fileName)}</h4>
                            ${fileSize ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 0.85em;">${fileSize}</p>` : ''}
                        </div>
                    </div>
                    <p style="margin: 8px 0 0 0; color: #999; font-size: 0.85em;">Uploaded: ${uploadedDate}</p>
                    ${docItem.description ? `<p style="margin: 8px 0 0 0; color: #666;">${escapeHtml(docItem.description)}</p>` : ''}
                </div>
                <div class="unit-item-actions">
                    <a href="${docItem.fileUrl}" target="_blank" class="btn-primary btn-small" style="text-decoration: none; display: inline-block;">View</a>
                    <a href="${docItem.fileUrl}" download="${docItem.fileName}" class="btn-secondary btn-small" style="text-decoration: none; display: inline-block;">Download</a>
                    <button class="btn-danger btn-small" onclick="deleteTenantDocument('${tenantId}', ${index})">Delete</button>
                </div>
            `;
            documentsList.appendChild(documentItem);
        });
    })
    .catch((error) => {
        console.error('Error loading tenant documents:', error);
        documentsList.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">Error loading documents. Please try again.</p>';
    });
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'xls': '📊',
        'xlsx': '📊',
        'txt': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️'
    };
    return iconMap[extension] || '📎';
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function uploadTenantDocument(tenantId, file) {
    try {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`tenants/${tenantId}/documents/${Date.now()}_${file.name}`);
        
        // Upload file
        const uploadTask = fileRef.put(file);
        
        await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress tracking (optional)
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress}%`);
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                () => {
                    resolve();
                }
            );
        });
        
        // Get download URL
        const fileUrl = await fileRef.getDownloadURL();
        
        // Get tenant document
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        const tenant = tenantDoc.data();
        const documents = tenant.documents || [];
        
        // Add new document to array
        documents.push({
            fileName: file.name,
            fileUrl: fileUrl,
            fileSize: file.size,
            uploadedAt: firebase.firestore.Timestamp.now(),
            description: null
        });
        
        // Update tenant document
        await db.collection('tenants').doc(tenantId).update({
            documents: documents,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Document uploaded successfully');
        return true;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
}

window.deleteTenantDocument = async function(tenantId, documentIndex) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        const tenant = tenantDoc.data();
        const documents = tenant.documents || [];
        
        if (documentIndex < 0 || documentIndex >= documents.length) {
            alert('Invalid document index');
            return;
        }
        
        const document = documents[documentIndex];
        
        // Delete file from storage
        try {
            const storageRef = firebase.storage().refFromURL(document.fileUrl);
            await storageRef.delete();
        } catch (storageError) {
            console.warn('Error deleting file from storage:', storageError);
            // Continue with removing from Firestore even if storage delete fails
        }
        
        // Remove document from array
        documents.splice(documentIndex, 1);
        
        // Update tenant document
        await db.collection('tenants').doc(tenantId).update({
            documents: documents,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reload documents
        loadTenantDocuments(tenantId);
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document: ' + error.message);
    }
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
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser || !currentUserProfile) {
        return;
    }
    
    try {
        // Build query based on user role
        let leasesQuery = db.collection('leases');
        let needsClientSideSort = false;
        
        // For maintenance users, filter by assigned properties
        if (currentUserProfile.role === 'maintenance' && 
            Array.isArray(currentUserProfile.assignedProperties) && 
            currentUserProfile.assignedProperties.length > 0) {
            // Firestore 'in' queries are limited to 10 items
            if (currentUserProfile.assignedProperties.length <= 10) {
                leasesQuery = leasesQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
                console.log('🔍 Filtering leases for maintenance user by properties:', currentUserProfile.assignedProperties);
                // Note: Can't use orderBy with whereIn without a composite index, so we'll sort client-side
                needsClientSideSort = true;
            } else {
                console.warn('⚠️ User has more than 10 assigned properties, loading all leases (will be filtered by rules)');
                leasesQuery = leasesQuery.orderBy('leaseStartDate', 'desc');
            }
        } else {
            // Admins and super admins can see all leases with orderBy
            // Property managers are handled by Firestore rules
            leasesQuery = leasesQuery.orderBy('leaseStartDate', 'desc');
        }
        
        const leasesSnapshot = await leasesQuery.get();
        const leases = {};
        const leasesArray = []; // For client-side sorting if needed
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
                } else if (!isDeprecated && hasAutoRenewal && leaseData.status !== 'Active' && leaseData.status !== 'Expiring Soon') {
                    // If has auto-renewal and status is not Active/Expiring Soon, set to Active (only if not deprecated)
                    if (leaseData.status === 'Expired') {
                        leaseData.status = 'Active';
                        db.collection('leases').doc(doc.id).update({ status: 'Active' });
                    }
                }
            }
            
            // Store in array for sorting if needed, otherwise directly in object
            if (needsClientSideSort) {
                leasesArray.push(leaseData);
            } else {
            leases[doc.id] = leaseData;
            }
        });
        
        // Sort client-side if needed (for maintenance users with whereIn query)
        if (needsClientSideSort && leasesArray.length > 0) {
            leasesArray.sort((a, b) => {
                const dateA = a.leaseStartDate?.toDate ? a.leaseStartDate.toDate() : (a.leaseStartDate ? new Date(a.leaseStartDate) : new Date(0));
                const dateB = b.leaseStartDate?.toDate ? b.leaseStartDate.toDate() : (b.leaseStartDate ? new Date(b.leaseStartDate) : new Date(0));
                return dateB - dateA; // Descending order
            });
            // Convert back to object
            leasesArray.forEach(lease => {
                leases[lease.id] = lease;
            });
        }
        
        // Load related data - filter for maintenance users
        // For maintenance users, load assigned properties individually
        let propertiesPromise;
        let tenantsQuery = db.collection('tenants');
        let unitsQuery = db.collection('units');
        let buildingsQuery = db.collection('buildings');
        let occupanciesQuery = db.collection('occupancies');
        
        // For maintenance users, filter by assigned properties
        if (currentUserProfile.role === 'maintenance' && 
            Array.isArray(currentUserProfile.assignedProperties) && 
            currentUserProfile.assignedProperties.length > 0) {
            // Load assigned properties individually
            const propertyPromises = currentUserProfile.assignedProperties.map(propId => 
                db.collection('properties').doc(propId).get().catch(e => {
                    console.warn(`Could not load property ${propId}:`, e);
                    return null;
                })
            );
            propertiesPromise = Promise.all(propertyPromises);
            
            if (currentUserProfile.assignedProperties.length <= 10) {
                unitsQuery = unitsQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
                buildingsQuery = buildingsQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
                occupanciesQuery = occupanciesQuery.where('propertyId', 'in', currentUserProfile.assignedProperties);
            }
            // Tenants will be filtered via occupancies below
        } else {
            // For other roles, load all properties
            propertiesPromise = db.collection('properties').get();
        }
        
        const [propertiesResult, tenantsSnapshot, unitsSnapshot, buildingsSnapshot, occupanciesSnapshot] = await Promise.all([
            propertiesPromise,
            tenantsQuery.get(),
            unitsQuery.get(),
            buildingsQuery.get(),
            occupanciesQuery.get()
        ]);
        
        // Handle properties result (could be snapshot or array of docs)
        const propertiesSnapshot = Array.isArray(propertiesResult) ? 
            { forEach: (fn) => propertiesResult.forEach(doc => doc && doc.exists && fn(doc)) } : 
            propertiesResult;
        
        const properties = {};
        propertiesSnapshot.forEach((doc) => {
            properties[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const tenants = {};
        // For maintenance users, filter tenants by those with occupancies in assigned properties
        if (currentUserProfile.role === 'maintenance' && 
            Array.isArray(currentUserProfile.assignedProperties) && 
            currentUserProfile.assignedProperties.length > 0) {
            // Get tenant IDs from occupancies
            const tenantIds = new Set();
            occupanciesSnapshot.forEach((doc) => {
                const occ = doc.data();
                if (occ.tenantId && currentUserProfile.assignedProperties.includes(occ.propertyId)) {
                    tenantIds.add(occ.tenantId);
                }
            });
            // Only include tenants that have occupancies in assigned properties
        tenantsSnapshot.forEach((doc) => {
                if (tenantIds.has(doc.id)) {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
                }
        });
        } else {
            tenantsSnapshot.forEach((doc) => {
                tenants[doc.id] = { id: doc.id, ...doc.data() };
            });
        }
        
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
        if (error.code === 'permission-denied') {
            handlePermissionError('lease data');
        } else {
            alert('Error loading leases: ' + error.message);
        }
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
                    <th>Square Footage</th>
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
        
        // Determine display status - if deprecated, show Deprecated status
        const displayStatus = isLeaseDeprecated(lease) ? 'Deprecated' : lease.status;
        const statusClass = displayStatus === 'Active' ? 'status-active' : 
                           displayStatus === 'Expiring Soon' ? 'status-warning' : 
                           displayStatus === 'Expired' ? 'status-expired' :
                           displayStatus === 'Deprecated' ? 'status-inactive' : 'status-inactive';
        
        const squareFootageDisplay = lease.squareFootage 
            ? `${lease.squareFootage.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft`
            : 'N/A';
        
        // Calculate rent to display - calculateCurrentRent automatically uses deprecatedDate if lease is deprecated
        const rentToDisplay = calculateCurrentRent(lease) ?? lease.monthlyRent;
        
        html += `
            <tr>
                <td>${lease.leaseNumber || lease.id.substring(0, 8)}</td>
                <td>${tenant?.tenantName || 'N/A'}</td>
                <td>${property?.name || 'N/A'}</td>
                <td>${unit?.unitNumber || 'N/A'}</td>
                <td>${squareFootageDisplay}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>$${rentToDisplay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                <td><span class="status-badge ${statusClass}">${displayStatus}</span></td>
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
            
            // Ensure toggles are off and groups are hidden for new lease
            const showAdditionalChargesToggle = document.getElementById('showAdditionalCharges');
            const additionalChargesGroup = document.getElementById('additionalChargesGroup');
            if (showAdditionalChargesToggle) {
                showAdditionalChargesToggle.checked = false;
                if (additionalChargesGroup) {
                    additionalChargesGroup.style.display = 'none';
                }
            }
            
            const hasExtensionOptionsCheckbox = document.getElementById('hasExtensionOptions');
            const extensionOptionsGroup = document.getElementById('extensionOptionsGroup');
            if (hasExtensionOptionsCheckbox) {
                hasExtensionOptionsCheckbox.checked = false;
                if (extensionOptionsGroup) {
                    extensionOptionsGroup.style.display = 'none';
                }
            }
            
            const showCommercialTermsToggle = document.getElementById('showCommercialTerms');
            const commercialTermsGroup = document.getElementById('commercialTermsGroup');
            if (showCommercialTermsToggle) {
                showCommercialTermsToggle.checked = false;
                if (commercialTermsGroup) {
                    commercialTermsGroup.style.display = 'none';
                }
            }
            
            // Reset lease term field
            const termInput = document.getElementById('leaseTerm');
            if (termInput) {
                termInput.value = '';
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
                // Parse dates as local dates (not UTC) to avoid timezone issues
                const startParts = startDateInput.value.split('-');
                const endParts = endDateInput.value.split('-');
                
                if (startParts.length !== 3 || endParts.length !== 3) {
                    termInput.value = '';
                    return;
                }
                
                const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                
                // Validate dates
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    termInput.value = '';
                    return;
                }
                
                // Ensure end date is after or equal to start date
                if (end < start) {
                    termInput.value = '';
                    return;
                }
                
                // Calculate difference in months more accurately
                const yearDiff = end.getFullYear() - start.getFullYear();
                const monthDiff = end.getMonth() - start.getMonth();
                const dayDiff = end.getDate() - start.getDate();
                
                let months = yearDiff * 12 + monthDiff;
                // If end date is earlier in the month, don't count that month
                if (dayDiff < 0) {
                    months -= 1;
                }
                
                // Only set if positive
                if (months > 0) {
                    termInput.value = months;
                    
                    // Update term input field if it's empty
                    if (!termInputField.value) {
                        const unit = termUnitSelect.value;
                        if (unit === 'years') {
                            termInputField.value = (months / 12).toFixed(1);
                        } else {
                            termInputField.value = months;
                        }
                    }
                } else {
                    termInput.value = '';
                }
            } else {
                // Clear term if dates are not both set
                termInput.value = '';
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
            const noticeDateGroup = document.getElementById('escalationNoticeDateGroup');
            
            if (type === 'None') {
                if (amountGroup) amountGroup.style.display = 'none';
                if (percentageGroup) percentageGroup.style.display = 'none';
                if (frequencyGroup) frequencyGroup.style.display = 'none';
                if (firstDateGroup) firstDateGroup.style.display = 'none';
                if (noticeDateGroup) noticeDateGroup.style.display = 'none';
            } else {
                if (frequencyGroup) frequencyGroup.style.display = 'block';
                if (firstDateGroup) firstDateGroup.style.display = 'block';
                if (noticeDateGroup) noticeDateGroup.style.display = 'block';
                
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
    
    // Handle escalation notice type changes
    const escalationNoticeTypeSelect = document.getElementById('escalationNoticeType');
    if (escalationNoticeTypeSelect) {
        escalationNoticeTypeSelect.addEventListener('change', function() {
            const noticeType = this.value;
            const dateInputGroup = document.getElementById('escalationNoticeDateInputGroup');
            const periodGroup = document.getElementById('escalationNoticePeriodGroup');
            
            if (noticeType === 'date') {
                if (dateInputGroup) dateInputGroup.style.display = 'block';
                if (periodGroup) periodGroup.style.display = 'none';
            } else {
                if (dateInputGroup) dateInputGroup.style.display = 'none';
                if (periodGroup) periodGroup.style.display = 'block';
                // Set the unit based on notice type
                const noticeUnitSelect = document.getElementById('escalationNoticeUnit');
                if (noticeUnitSelect) {
                    noticeUnitSelect.value = noticeType === 'months' ? 'months' : 'days';
                }
            }
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
    
    // Handle auto renewal notice type changes
    const autoRenewalNoticeTypeSelect = document.getElementById('autoRenewalNoticeType');
    if (autoRenewalNoticeTypeSelect) {
        autoRenewalNoticeTypeSelect.addEventListener('change', function() {
            const noticeType = this.value;
            const dateInputGroup = document.getElementById('autoRenewalNoticeDateInputGroup');
            const periodGroup = document.getElementById('autoRenewalNoticePeriodGroup');
            
            if (noticeType === 'date') {
                if (dateInputGroup) dateInputGroup.style.display = 'block';
                if (periodGroup) periodGroup.style.display = 'none';
            } else {
                if (dateInputGroup) dateInputGroup.style.display = 'none';
                if (periodGroup) periodGroup.style.display = 'block';
                // Set the unit based on notice type
                const noticeUnitSelect = document.getElementById('autoRenewalNoticeUnit');
                if (noticeUnitSelect) {
                    noticeUnitSelect.value = noticeType === 'months' ? 'months' : 'days';
                }
            }
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
    // Set status - if deprecated, status should be "Deprecated"
    const leaseStatusField = document.getElementById('leaseStatus');
    if (leaseStatusField) {
        if (isLeaseDeprecated(lease)) {
            leaseStatusField.value = 'Deprecated';
        } else {
            leaseStatusField.value = lease.status || 'Active';
        }
    }
    
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
        
        // Populate auto renewal notice
        if (lease.autoRenewalNoticeType || lease.autoRenewalNoticeDate) {
            const autoRenewalNoticeTypeSelect = document.getElementById('autoRenewalNoticeType');
            const noticeType = lease.autoRenewalNoticeType || 'date';
            if (autoRenewalNoticeTypeSelect) {
                autoRenewalNoticeTypeSelect.value = noticeType;
                autoRenewalNoticeTypeSelect.dispatchEvent(new Event('change'));
            }
            
            if (noticeType === 'date' && lease.autoRenewalNoticeDate && document.getElementById('autoRenewalNoticeDate')) {
                const noticeDate = lease.autoRenewalNoticeDate.toDate ? lease.autoRenewalNoticeDate.toDate() : new Date(lease.autoRenewalNoticeDate);
                document.getElementById('autoRenewalNoticeDate').value = noticeDate.toISOString().split('T')[0];
            } else if ((noticeType === 'months' || noticeType === 'days') && lease.autoRenewalNoticePeriod) {
                const noticePeriodInput = document.getElementById('autoRenewalNoticePeriod');
                const noticeUnitSelect = document.getElementById('autoRenewalNoticeUnit');
                if (noticePeriodInput) {
                    noticePeriodInput.value = lease.autoRenewalNoticePeriod;
                    if (noticeUnitSelect) {
                        noticeUnitSelect.value = noticeType === 'months' ? 'months' : 'days';
                    }
                }
            }
        }
    }
    
    if (document.getElementById('leaseSquareFootage')) document.getElementById('leaseSquareFootage').value = lease.squareFootage || '';
    if (document.getElementById('monthlyRent')) document.getElementById('monthlyRent').value = lease.monthlyRent || '';
    if (document.getElementById('securityDeposit')) {
        // Explicitly handle 0 value - don't use || operator which treats 0 as falsy
        const securityDepositField = document.getElementById('securityDeposit');
        if (lease.securityDeposit !== null && lease.securityDeposit !== undefined) {
            securityDepositField.value = lease.securityDeposit;
        } else {
            securityDepositField.value = '';
        }
    }
    
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
            
            // Populate escalation notice
            const noticeTypeSelect = document.getElementById('escalationNoticeType');
            if (esc.noticeType || esc.noticeDate) {
                const noticeType = esc.noticeType || 'date';
                if (noticeTypeSelect) {
                    noticeTypeSelect.value = noticeType;
                    noticeTypeSelect.dispatchEvent(new Event('change'));
                }
                
                if (noticeType === 'date' && esc.noticeDate && document.getElementById('escalationNoticeDate')) {
                    const noticeDate = esc.noticeDate.toDate ? esc.noticeDate.toDate() : new Date(esc.noticeDate);
                    document.getElementById('escalationNoticeDate').value = noticeDate.toISOString().split('T')[0];
                } else if ((noticeType === 'months' || noticeType === 'days') && esc.noticePeriod) {
                    const noticePeriodInput = document.getElementById('escalationNoticePeriod');
                    const noticeUnitSelect = document.getElementById('escalationNoticeUnit');
                    if (noticePeriodInput) {
                        if (noticeType === 'months') {
                            noticePeriodInput.value = esc.noticePeriod;
                            if (noticeUnitSelect) noticeUnitSelect.value = 'months';
                        } else {
                            noticePeriodInput.value = esc.noticePeriod;
                            if (noticeUnitSelect) noticeUnitSelect.value = 'days';
                        }
                    }
                }
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
                    // Parse dates as local dates (not UTC) to avoid timezone issues
                    const startParts = startDateInput.value.split('-');
                    const endParts = endDateInput.value.split('-');
                    
                    if (startParts.length !== 3 || endParts.length !== 3) {
                        return 0;
                    }
                    
                    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                    const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                    
                    // Validate dates
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        return 0;
                    }
                    
                    // Ensure end date is after or equal to start date
                    if (end < start) {
                        return 0;
                    }
                    
                    // Calculate difference in months more accurately
                    const yearDiff = end.getFullYear() - start.getFullYear();
                    const monthDiff = end.getMonth() - start.getMonth();
                    const dayDiff = end.getDate() - start.getDate();
                    
                    let months = yearDiff * 12 + monthDiff;
                    // If end date is earlier in the month, don't count that month
                    if (dayDiff < 0) {
                        months -= 1;
                    }
                    
                    return months > 0 ? months : 0;
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
            autoRenewalNoticeType: document.getElementById('autoRenewal').checked ? (document.getElementById('autoRenewalNoticeType')?.value || null) : null,
            autoRenewalNoticeDate: document.getElementById('autoRenewal').checked && document.getElementById('autoRenewalNoticeDate')?.value ? firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('autoRenewalNoticeDate').value)) : null,
            autoRenewalNoticePeriod: document.getElementById('autoRenewal').checked && document.getElementById('autoRenewalNoticePeriod')?.value ? parseFloat(document.getElementById('autoRenewalNoticePeriod').value) : null,
            autoRenewalNoticeUnit: document.getElementById('autoRenewal').checked ? (document.getElementById('autoRenewalNoticeUnit')?.value || null) : null,
            squareFootage: document.getElementById('leaseSquareFootage').value ? parseFloat(document.getElementById('leaseSquareFootage').value) : null,
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
                    firstEscalationDate: document.getElementById('firstEscalationDate').value ? firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('firstEscalationDate').value)) : null,
                    noticeType: document.getElementById('escalationNoticeType')?.value || null,
                    noticeDate: document.getElementById('escalationNoticeDate')?.value ? firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('escalationNoticeDate').value)) : null,
                    noticePeriod: document.getElementById('escalationNoticePeriod')?.value ? parseFloat(document.getElementById('escalationNoticePeriod').value) : null,
                    noticeUnit: document.getElementById('escalationNoticeUnit')?.value || null
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
function calculateCurrentRent(lease, asOfDate = null) {
    if (!lease.monthlyRent) return null;
    
    const initialRent = lease.monthlyRent;
    
    // If deprecated, calculate rent as of deprecation date instead of today
    const isDeprecated = isLeaseDeprecated(lease);
    const calculationDate = isDeprecated && lease.deprecatedDate 
        ? (lease.deprecatedDate.toDate ? lease.deprecatedDate.toDate() : new Date(lease.deprecatedDate))
        : (asOfDate || new Date());
    
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
    
    // If we haven't reached the first escalation date, return initial rent
    if (calculationDate < firstEscDate) {
        return initialRent;
    }
    
    const esc = lease.rentEscalation;
    let currentRent = initialRent;
    
    // Calculate number of escalation periods
    let periods = 0;
    const frequency = esc.escalationFrequency;
    
    if (frequency === 'Monthly') {
        const monthsDiff = (calculationDate.getFullYear() - firstEscDate.getFullYear()) * 12 + (calculationDate.getMonth() - firstEscDate.getMonth());
        periods = Math.floor(monthsDiff);
    } else if (frequency === 'Quarterly') {
        const monthsDiff = (calculationDate.getFullYear() - firstEscDate.getFullYear()) * 12 + (calculationDate.getMonth() - firstEscDate.getMonth());
        periods = Math.floor(monthsDiff / 3);
    } else if (frequency === 'Annually') {
        const yearsDiff = calculationDate.getFullYear() - firstEscDate.getFullYear();
        if (calculationDate.getMonth() > firstEscDate.getMonth() || (calculationDate.getMonth() === firstEscDate.getMonth() && calculationDate.getDate() >= firstEscDate.getDate())) {
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
        const leaseTerm = `${startDate} - ${endDate}`;
        const deprecatedDate = lease.deprecatedDate ? (lease.deprecatedDate.toDate ? lease.deprecatedDate.toDate().toLocaleDateString() : new Date(lease.deprecatedDate).toLocaleDateString()) : null;
        
        const initialRent = lease.monthlyRent ? lease.monthlyRent : 0;
        // If deprecated, calculate rent as of deprecation date
        const currentRent = calculateCurrentRent(lease);
        const hasEscalation = lease.rentEscalation && lease.rentEscalation.escalationType && lease.rentEscalation.escalationType !== 'None';
        
        const initialRentFormatted = initialRent ? `$${initialRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentRentFormatted = currentRent ? `$${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        // Determine display status - if deprecated, show Deprecated status
        const displayStatus = isLeaseDeprecated(lease) ? 'Deprecated' : lease.status;
        const statusClass = displayStatus === 'Active' ? 'status-active' : 
                           displayStatus === 'Expiring Soon' ? 'status-warning' : 
                           displayStatus === 'Expired' ? 'status-expired' :
                           displayStatus === 'Deprecated' ? 'status-inactive' : 'status-inactive';
        
        // Calculate annual rent (PPF - Per Year)
        const initialAnnualRent = initialRent ? (initialRent * 12) : 0;
        const currentAnnualRent = currentRent ? (currentRent * 12) : 0;
        const initialAnnualFormatted = initialAnnualRent ? `$${initialAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentAnnualFormatted = currentAnnualRent ? `$${currentAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        // Calculate price per square foot (PPF) - use lease squareFootage, not unit squareFootage
        const squareFootage = lease.squareFootage || null;
        let ppfDisplay = '';
        if (squareFootage && squareFootage > 0) {
            const initialMonthlyPPF = initialRent / squareFootage;
            const initialAnnualPPF = initialMonthlyPPF * 12;
            const currentMonthlyPPF = currentRent ? (currentRent / squareFootage) : null;
            const currentAnnualPPF = currentMonthlyPPF ? (currentMonthlyPPF * 12) : null;
            
            if (hasEscalation && currentRent && currentMonthlyPPF) {
                const ppfLabel = isLeaseDeprecated(lease) ? 'Deprecated PPF' : 'Current PPF';
                ppfDisplay = `
                    <div style="font-size: 0.8em; color: #7c3aed; margin-top: 4px;">
                        <div><strong>Initial PPF:</strong> $${initialMonthlyPPF.toFixed(2)}/mo ($${initialAnnualPPF.toFixed(2)}/yr)</div>
                        <div style="font-weight: 600;"><strong>${ppfLabel}:</strong> $${currentMonthlyPPF.toFixed(2)}/mo ($${currentAnnualPPF.toFixed(2)}/yr)</div>
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
                            <span class="status-badge ${statusClass}" style="margin-right: 8px;">${displayStatus}</span>
                            <span style="margin-right: 8px;">${leaseTerm}</span>
                            ${squareFootage ? `<span style="margin-right: 8px;">${squareFootage.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft</span>` : ''}
                            ${deprecatedDate ? `<span style="color: #dc2626;">Deprecated: ${deprecatedDate}</span>` : ''}
                        </div>
                        ${rentDisplay}
                        <div style="margin-top: 8px;">
                            <button class="btn-sm btn-primary" onclick="window.openLeaseModal('${lease.id}')" style="font-size: 0.85em; padding: 6px 12px; font-weight: 500;" title="View Lease">View Lease</button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; margin-left: 8px; flex-direction: column; align-items: flex-end;">
                        <button class="btn-sm btn-secondary" onclick="window.openLeaseModal('${lease.id}', true)" style="font-size: 0.75em; padding: 4px 8px;" title="Edit">Edit</button>
                        ${!lease.isDeprecated ? `<button class="btn-sm btn-warning" onclick="window.openDeprecatedModal('${lease.id}')" style="font-size: 0.75em; padding: 4px 8px; margin-top: 4px;" title="Mark as Deprecated/Legacy">Deprecate</button>` : ''}
                        ${!lease.deletedAt ? `<button class="btn-sm btn-danger" onclick="window.deleteLease('${lease.id}')" style="font-size: 0.75em; padding: 4px 8px; margin-top: 4px;" title="Delete Lease">Delete</button>` : ''}
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
        const leaseTerm = `${startDate} - ${endDate}`;
        const deprecatedDate = lease.deprecatedDate ? (lease.deprecatedDate.toDate ? lease.deprecatedDate.toDate().toLocaleDateString() : new Date(lease.deprecatedDate).toLocaleDateString()) : null;
        const initialRent = lease.monthlyRent ? lease.monthlyRent : 0;
        const currentRent = calculateCurrentRent(lease);
        const hasEscalation = lease.rentEscalation && lease.rentEscalation.escalationType && lease.rentEscalation.escalationType !== 'None';
        
        const initialRentFormatted = initialRent ? `$${initialRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentRentFormatted = currentRent ? `$${currentRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const deposit = lease.securityDeposit !== null && lease.securityDeposit !== undefined ? `$${lease.securityDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
        
        // Determine display status - if deprecated, show Deprecated status
        const displayStatus = isLeaseDeprecated(lease) ? 'Deprecated' : lease.status;
        const statusClass = displayStatus === 'Active' ? 'status-active' : 
                           displayStatus === 'Expiring Soon' ? 'status-warning' : 
                           displayStatus === 'Expired' ? 'status-expired' :
                           displayStatus === 'Deprecated' ? 'status-inactive' : 'status-inactive';
        
        // Calculate annual rent (PPF - Per Year)
        const initialAnnualRent = initialRent ? (initialRent * 12) : 0;
        const currentAnnualRent = currentRent ? (currentRent * 12) : 0;
        const initialAnnualFormatted = initialAnnualRent ? `$${initialAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        const currentAnnualFormatted = currentAnnualRent ? `$${currentAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
        
        // Calculate price per square foot (PPF) - use lease squareFootage, not unit squareFootage
        const squareFootage = lease.squareFootage || null;
        let ppfDisplay = '';
        if (squareFootage && squareFootage > 0) {
            const initialMonthlyPPF = initialRent / squareFootage;
            const initialAnnualPPF = initialMonthlyPPF * 12;
            const currentMonthlyPPF = currentRent ? (currentRent / squareFootage) : null;
            const currentAnnualPPF = currentMonthlyPPF ? (currentMonthlyPPF * 12) : null;
            
            if (hasEscalation && currentRent && currentMonthlyPPF) {
                const ppfLabel = isLeaseDeprecated(lease) ? 'Deprecated PPF' : 'Current PPF';
                ppfDisplay = `
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Initial PPF</div>
                        <div style="font-weight: 600; color: #7c3aed;">$${initialMonthlyPPF.toFixed(2)}/mo</div>
                        <div style="font-size: 0.8em; color: #a78bfa;">$${initialAnnualPPF.toFixed(2)}/yr</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">${ppfLabel}</div>
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
            const rentLabel = isLeaseDeprecated(lease) ? 'Deprecated Rent' : 'Current Rent';
            rentDisplay = `
                <div>
                    <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Initial Rent</div>
                    <div style="font-weight: 600;">${initialRentFormatted}/mo</div>
                    <div style="font-size: 0.8em; color: #999;">${initialAnnualFormatted}/yr</div>
                </div>
                <div>
                    <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">${rentLabel}</div>
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
                            <span class="status-badge ${statusClass}">${displayStatus}</span>
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
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Lease Term</div>
                        <div style="font-weight: 600;">${leaseTerm}</div>
                    </div>
                    ${squareFootage ? `
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Square Footage</div>
                        <div style="font-weight: 600;">${squareFootage.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft</div>
                    </div>
                    ` : ''}
                    ${deprecatedDate ? `
                    <div>
                        <div style="color: #64748b; font-size: 0.85em; margin-bottom: 4px;">Deprecated On</div>
                        <div style="font-weight: 600;">${deprecatedDate}</div>
                    </div>
                    ` : ''}
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
            status: 'Deprecated',
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

// ============================================
// FINANCE PAGE FUNCTIONS
// ============================================

// Load Finance page
async function loadFinance() {
    // Populate property filter
    await populateRentRollFilters();
    
    // Load rent roll
    await loadRentRoll();
    
    // Setup finance tab switching
    setupFinanceTabs();
}

// Populate rent roll filters
async function populateRentRollFilters() {
    const propertyFilter = document.getElementById('rentRollPropertyFilter');
    const buildingFilter = document.getElementById('rentRollBuildingFilter');
    const tenantFilter = document.getElementById('rentRollTenantFilter');
    
    if (!propertyFilter) return;
    
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser) {
        return;
    }
    
    try {
        // Populate property filter
        const propertiesSnapshot = await db.collection('properties').orderBy('name').get();
        propertyFilter.innerHTML = '<option value="">All Properties</option>';
        
        propertiesSnapshot.forEach(doc => {
            const property = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = property.name || 'Unnamed Property';
            propertyFilter.appendChild(option);
        });
        
        // Populate building filter (will be updated when property changes)
        if (buildingFilter) {
            buildingFilter.innerHTML = '<option value="">All Buildings</option>';
        }
        
        // Populate tenant filter
        if (tenantFilter) {
            const tenantsSnapshot = await db.collection('tenants').orderBy('tenantName').get();
            tenantFilter.innerHTML = '<option value="">All Tenants</option>';
            
            tenantsSnapshot.forEach(doc => {
                const tenant = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = tenant.tenantName || 'Unnamed Tenant';
                tenantFilter.appendChild(option);
            });
        }
        
        // Add event listeners for filter changes
        propertyFilter.addEventListener('change', async () => {
            // Update building filter when property changes
            if (buildingFilter) {
                const selectedPropertyId = propertyFilter.value;
                buildingFilter.innerHTML = '<option value="">All Buildings</option>';
                
                if (selectedPropertyId) {
                    try {
                        const buildingsSnapshot = await db.collection('buildings')
                            .where('propertyId', '==', selectedPropertyId)
                            .orderBy('name')
                            .get();
                        
                        buildingsSnapshot.forEach(doc => {
                            const building = doc.data();
                            const option = document.createElement('option');
                            option.value = doc.id;
                            option.textContent = building.name || 'Unnamed Building';
                            buildingFilter.appendChild(option);
                        });
                    } catch (error) {
                        console.error('Error loading buildings:', error);
                    }
                }
            }
            loadRentRoll();
        });
        
        if (buildingFilter) {
            buildingFilter.addEventListener('change', () => {
                loadRentRoll();
            });
        }
        
        if (tenantFilter) {
            tenantFilter.addEventListener('change', () => {
                loadRentRoll();
            });
        }
        
        // Add event listener for year filter
        const yearFilter = document.getElementById('rentRollYearFilter');
        if (yearFilter) {
            yearFilter.addEventListener('change', () => {
                loadRentRoll();
            });
        }
        
        // Add event listeners for view option changes
        const orientationRadios = document.querySelectorAll('input[name="rentRollOrientation"]');
        orientationRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                loadRentRoll();
            });
        });
        
        const breakoutByBuildingCheckbox = document.getElementById('rentRollBreakoutByBuilding');
        if (breakoutByBuildingCheckbox) {
            breakoutByBuildingCheckbox.addEventListener('change', () => {
                loadRentRoll();
            });
        }
    } catch (error) {
        console.error('Error loading filters for rent roll:', error);
        if (error.code === 'permission-denied') {
            handlePermissionError('rent roll filters');
        }
    }
}

// Setup finance tab switching
function setupFinanceTabs() {
    const financeTabButtons = document.querySelectorAll('[data-finance-tab]');
    financeTabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-finance-tab');
            
            // Remove active class from all tabs and tab contents
            document.querySelectorAll('[data-finance-tab]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#financePage .tab-content').forEach(c => {
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
            
            // Load tab-specific data
            if (tabName === 'rentRoll') {
                loadRentRoll();
            }
        });
    });
}

// Calculate rent for a specific month based on lease and escalation
// Returns { rent: number, hasEscalation: boolean }
function calculateRentForMonth(lease, year, month) {
    if (!lease.monthlyRent) return { rent: 0, hasEscalation: false };
    
    const initialRent = lease.monthlyRent;
    const targetDate = new Date(year, month - 1, 1); // First day of the month
    
    // If no escalations, return initial rent
    if (!lease.rentEscalation || !lease.rentEscalation.escalationType || lease.rentEscalation.escalationType === 'None') {
        return { rent: initialRent, hasEscalation: false };
    }
    
    // Check if lease has started
    if (lease.leaseStartDate) {
        const startDate = lease.leaseStartDate.toDate();
        if (targetDate < startDate) {
            return { rent: 0, hasEscalation: false }; // Lease hasn't started yet
        }
    }
    
    // Check if lease has ended (unless auto-renewal)
    if (lease.leaseEndDate && !lease.autoRenewal) {
        const endDate = lease.leaseEndDate.toDate();
        const endOfMonth = new Date(year, month, 0); // Last day of the month
        if (endOfMonth > endDate) {
            return { rent: 0, hasEscalation: false }; // Lease has ended
        }
    }
    
    // Need first escalation date to calculate
    if (!lease.rentEscalation.firstEscalationDate) {
        return { rent: initialRent, hasEscalation: false };
    }
    
    const firstEscDate = lease.rentEscalation.firstEscalationDate.toDate();
    
    // Get the escalation year and month (1-based for clarity)
    const firstEscYear = firstEscDate.getFullYear();
    const firstEscMonth = firstEscDate.getMonth() + 1; // Convert to 1-based (1 = January, 12 = December)
    
    // Target year and month (1-based)
    const targetYear = year;
    const targetMonth = month; // Already 1-based (1 = January, 12 = December)
    
    // If we haven't reached the first escalation month, return initial rent
    if (targetYear < firstEscYear) {
        return { rent: initialRent, hasEscalation: false };
    }
    if (targetYear === firstEscYear && targetMonth < firstEscMonth) {
        return { rent: initialRent, hasEscalation: false };
    }
    
    const esc = lease.rentEscalation;
    let rent = initialRent;
    let hasEscalation = false;
    
    // Calculate number of escalation periods from first escalation to target month
    let periods = 0;
    const frequency = esc.escalationFrequency;
    
    if (frequency === 'Monthly') {
        // Calculate months difference (both are 1-based now)
        const monthsDiff = (targetYear - firstEscYear) * 12 + (targetMonth - firstEscMonth);
        periods = Math.max(0, monthsDiff + 1); // +1 because the first month itself is period 1
    } else if (frequency === 'Quarterly') {
        const monthsDiff = (targetYear - firstEscYear) * 12 + (targetMonth - firstEscMonth);
        periods = Math.max(0, Math.floor(monthsDiff / 3) + 1); // +1 because the first quarter itself is period 1
    } else if (frequency === 'Annually') {
        // For annual escalations, count how many full years have passed since the first escalation
        // The first escalation month itself counts as period 1
        const yearsDiff = targetYear - firstEscYear;
        
        if (yearsDiff < 0) {
            periods = 0;
        } else if (yearsDiff === 0) {
            // Same year - only count if we're at or past the escalation month
            if (targetMonth >= firstEscMonth) {
                periods = 1; // First escalation period (the escalation month itself)
            } else {
                periods = 0;
            }
        } else {
            // Future year - calculate based on month position
            if (targetMonth >= firstEscMonth) {
                // We're at or past the escalation month in a future year
                periods = yearsDiff + 1;
            } else {
                // We're before the escalation month in a future year
                periods = yearsDiff;
            }
        }
    }
    
    // Apply escalations
    if (periods > 0) {
        hasEscalation = true; // This month has an escalation applied
        
        if (esc.escalationType === 'Fixed Amount' && esc.escalationAmount) {
            rent = initialRent + (esc.escalationAmount * periods);
        } else if ((esc.escalationType === 'Percentage' || esc.escalationType === 'CPI') && esc.escalationPercentage) {
            // Compound percentage increase
            const rate = esc.escalationPercentage / 100;
            rent = initialRent * Math.pow(1 + rate, periods);
        }
    }
    
    // Note: periods calculation above should handle the first escalation month correctly
    // For annual: if targetMonth >= firstEscMonth in same year, periods = 1
    // For monthly/quarterly: monthsDiff will be 0 for the first month, so periods = 0, but we need to apply the first escalation
    if (frequency === 'Monthly' || frequency === 'Quarterly') {
        if (periods === 0 && targetYear === firstEscYear && targetMonth === firstEscMonth) {
            // This is the exact first escalation month for monthly/quarterly
            periods = 1;
            hasEscalation = true;
            if (esc.escalationType === 'Fixed Amount' && esc.escalationAmount) {
                rent = initialRent + esc.escalationAmount;
            } else if ((esc.escalationType === 'Percentage' || esc.escalationType === 'CPI') && esc.escalationPercentage) {
                const rate = esc.escalationPercentage / 100;
                rent = initialRent * (1 + rate);
            }
        }
    }
    
    return { rent: Math.round(rent * 100) / 100, hasEscalation }; // Round to 2 decimal places
}

// Load and render rent roll
async function loadRentRoll() {
    const rentRollTable = document.getElementById('rentRollTable');
    if (!rentRollTable) return;
    
    // Don't load if user is not authenticated
    if (!currentUser || !auth || !auth.currentUser) {
        return;
    }
    
    try {
        // Get filters
        const propertyFilter = document.getElementById('rentRollPropertyFilter')?.value || '';
        const buildingFilter = document.getElementById('rentRollBuildingFilter')?.value || '';
        const tenantFilter = document.getElementById('rentRollTenantFilter')?.value || '';
        const yearFilter = parseInt(document.getElementById('rentRollYearFilter')?.value || new Date().getFullYear());
        
        // Get view options
        const orientation = document.querySelector('input[name="rentRollOrientation"]:checked')?.value || 'vertical';
        const breakoutByBuilding = document.getElementById('rentRollBreakoutByBuilding')?.checked || false;
        
        // Load all necessary data
        const [leasesSnapshot, propertiesSnapshot, tenantsSnapshot, unitsSnapshot, buildingsSnapshot] = await Promise.all([
            db.collection('leases').get(),
            db.collection('properties').get(),
            db.collection('tenants').get(),
            db.collection('units').get(),
            db.collection('buildings').get()
        ]);
        
        // Build data maps
        const properties = {};
        propertiesSnapshot.forEach(doc => {
            properties[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const tenants = {};
        tenantsSnapshot.forEach(doc => {
            tenants[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const units = {};
        unitsSnapshot.forEach(doc => {
            units[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        const buildings = {};
        buildingsSnapshot.forEach(doc => {
            buildings[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Filter and process leases
        const activeLeases = [];
        leasesSnapshot.forEach(doc => {
            const lease = { id: doc.id, ...doc.data() };
            
            // Only include active, non-deprecated, non-deleted leases
            if (isLeaseActive(lease) && !isLeaseDeleted(lease)) {
                // Filter by property if specified
                if (propertyFilter && lease.propertyId !== propertyFilter) {
                    return;
                }
                
                // Filter by building if specified
                if (buildingFilter) {
                    const unit = lease.unitId ? units[lease.unitId] : null;
                    if (!unit || unit.buildingId !== buildingFilter) {
                        return;
                    }
                }
                
                // Filter by tenant if specified
                if (tenantFilter && lease.tenantId !== tenantFilter) {
                    return;
                }
                
                activeLeases.push(lease);
            }
        });
        
        // Group leases by property
        const leasesByProperty = {};
        activeLeases.forEach(lease => {
            const propId = lease.propertyId || 'no-property';
            if (!leasesByProperty[propId]) {
                leasesByProperty[propId] = [];
            }
            leasesByProperty[propId].push(lease);
        });
        
        // Render rent roll
        renderRentRoll(leasesByProperty, properties, tenants, units, buildings, yearFilter, orientation, breakoutByBuilding);
        
    } catch (error) {
        console.error('Error loading rent roll:', error);
        rentRollTable.innerHTML = '<p style="color: #e74c3c; padding: 20px;">Error loading rent roll data.</p>';
    }
}

// Render rent roll table
function renderRentRoll(leasesByProperty, properties, tenants, units, buildings, year, orientation = 'vertical', breakoutByBuilding = false) {
    const rentRollTable = document.getElementById('rentRollTable');
    if (!rentRollTable) return;
    
    if (Object.keys(leasesByProperty).length === 0) {
        rentRollTable.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No active leases found.</p>';
        return;
    }
    
    if (orientation === 'vertical') {
        renderRentRollVertical(leasesByProperty, properties, tenants, units, buildings, year, breakoutByBuilding);
    } else {
        renderRentRollHorizontal(leasesByProperty, properties, tenants, units, buildings, year, breakoutByBuilding);
    }
}

// Render rent roll in vertical orientation (tenants as columns, months as rows)
function renderRentRollVertical(leasesByProperty, properties, tenants, units, buildings, year, breakoutByBuilding) {
    const rentRollTable = document.getElementById('rentRollTable');
    let html = '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = months.map((m, i) => `${m}/${String(year).slice(-2)}`);
    
    Object.keys(leasesByProperty).forEach(propertyId => {
        const property = properties[propertyId] || { name: 'Unknown Property' };
        const propertyLeases = leasesByProperty[propertyId];
        
        html += `<div style="margin-bottom: 40px;">`;
        html += `<h3 style="margin-bottom: 20px; color: #1e293b; font-size: 1.5rem;">${escapeHtml(property.name)} Rent Roll</h3>`;
        html += `<div style="font-size: 0.9em; color: #64748b; margin-bottom: 15px;">As of ${new Date().toLocaleDateString()}</div>`;
        
        if (breakoutByBuilding) {
            // Group leases by building
            const leasesByBuilding = {};
            propertyLeases.forEach(lease => {
                const unit = lease.unitId ? units[lease.unitId] : null;
                const buildingId = unit?.buildingId || 'no-building';
                if (!leasesByBuilding[buildingId]) {
                    leasesByBuilding[buildingId] = [];
                }
                leasesByBuilding[buildingId].push(lease);
            });
            
            // Render each building separately
            Object.keys(leasesByBuilding).forEach(buildingId => {
                const buildingLeases = leasesByBuilding[buildingId];
                const building = buildingId !== 'no-building' ? buildings[buildingId] : null;
                const buildingName = building?.name || 'No Building Assigned';
                
                html += renderVerticalTable(buildingLeases, tenants, units, buildings, year, monthLabels, buildingName);
            });
        } else {
            // Render all leases together
            propertyLeases.sort((a, b) => {
                const tenantA = tenants[a.tenantId]?.tenantName || '';
                const tenantB = tenants[b.tenantId]?.tenantName || '';
                return tenantA.localeCompare(tenantB);
            });
            
            html += renderVerticalTable(propertyLeases, tenants, units, buildings, year, monthLabels);
        }
        
        html += `</div>`;
    });
    
    rentRollTable.innerHTML = html;
}

// Helper function to render vertical table
function renderVerticalTable(leases, tenants, units, buildings, year, monthLabels, buildingName = null) {
    let html = '';
    
    if (buildingName) {
        html += `<h4 style="margin: 20px 0 10px 0; color: #475569; font-size: 1.2rem;">${escapeHtml(buildingName)}</h4>`;
    }
    
    html += `<div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">`;
    html += `<table class="rent-roll-table" style="width: 100%; min-width: 800px; border-collapse: collapse;">`;
    
    // Header row
    html += `<thead>`;
    html += `<tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">`;
    html += `<th style="padding: 12px; text-align: left; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); position: sticky; left: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: 10; min-width: 120px;">Month</th>`;
    
    leases.forEach(lease => {
        const tenant = tenants[lease.tenantId];
        const tenantName = tenant?.tenantName || 'Unknown Tenant';
        const unit = lease.unitId ? units[lease.unitId] : null;
        const suiteNumber = unit?.unitNumber || 'N/A';
        const squareFootage = unit?.squareFootage || null;
        
        html += `<th style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); min-width: 140px; vertical-align: top;">`;
        html += `<div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(tenantName)}</div>`;
        html += `<div style="font-size: 0.85em; font-weight: 400; opacity: 0.9; margin-bottom: 2px;">${escapeHtml(suiteNumber)}</div>`;
        if (squareFootage) {
            html += `<div style="font-size: 0.8em; font-weight: 400; opacity: 0.8;">${squareFootage.toLocaleString()} SF</div>`;
        }
        html += `</th>`;
    });
    
    html += `<th style="padding: 12px; text-align: right; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); position: sticky; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: 10; min-width: 120px;">Total</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    
    // Data rows: One row per month
    const monthlyTotals = [];
    for (let month = 1; month <= 12; month++) {
        html += `<tr style="border-bottom: 1px solid #e2e8f0;">`;
        html += `<td style="padding: 10px; font-weight: 600; position: sticky; left: 0; background: white; z-index: 5; border-right: 1px solid #e2e8f0;">${monthLabels[month - 1]}</td>`;
        
        let monthTotal = 0;
        
        leases.forEach(lease => {
            const result = calculateRentForMonth(lease, year, month);
            const rent = result.rent;
            monthTotal += rent;
            
            // Determine if escalation indicator should be shown
            // Show indicator if rent changed from previous month
            let hasEscalation = false;
            
            if (rent > 0) {
                let prevRent = 0;
                if (month > 1) {
                    // Compare with previous month
                    const prevResult = calculateRentForMonth(lease, year, month - 1);
                    prevRent = prevResult.rent;
                } else {
                    // January - compare with December of previous year
                    const prevResult = calculateRentForMonth(lease, year - 1, 12);
                    prevRent = prevResult.rent;
                }
                
                // Show escalation indicator if rent changed
                if (prevRent > 0 && Math.abs(rent - prevRent) > 0.01) {
                    hasEscalation = true;
                }
            }
            
            const rentDisplay = rent > 0 ? `$${rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
            const cellColor = rent > 0 ? '#1e293b' : '#cbd5e1';
            
            html += `<td style="padding: 10px; text-align: right; font-variant-numeric: tabular-nums; color: ${cellColor}; position: relative;">`;
            if (hasEscalation && rent > 0) {
                html += `<span style="position: absolute; top: 2px; right: 4px; color: #10b981; font-size: 0.75em; font-weight: bold;" title="Rent escalation applied">↑</span>`;
            }
            html += `<span style="display: block; padding-right: ${hasEscalation ? '12px' : '0'};">${rentDisplay}</span>`;
            html += `</td>`;
        });
        
        monthlyTotals.push(monthTotal);
        html += `<td style="padding: 10px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; color: #667eea; position: sticky; right: 0; background: white; z-index: 5; border-left: 1px solid #e2e8f0;">$${monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
        html += `</tr>`;
    }
    
    // Total row
    let grandTotal = 0;
    const annualRents = [];
    leases.forEach(lease => {
        let annualRent = 0;
        for (let month = 1; month <= 12; month++) {
            const result = calculateRentForMonth(lease, year, month);
            annualRent += result.rent;
        }
        annualRents.push(annualRent);
        grandTotal += annualRent;
    });
    
    html += `<tr style="background: #f8f9fa; font-weight: 600; border-top: 2px solid #667eea;">`;
    html += `<td style="padding: 12px; position: sticky; left: 0; background: #f8f9fa; z-index: 5; border-right: 1px solid #e2e8f0;">TOTAL</td>`;
    
    annualRents.forEach(annualRent => {
        html += `<td style="padding: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #667eea;">$${annualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    });
    
    html += `<td style="padding: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #667eea; font-size: 1.1em; position: sticky; right: 0; background: #f8f9fa; z-index: 5; border-left: 1px solid #e2e8f0;">$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    html += `</tr>`;
    
    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;
    
    return html;
}

// Render rent roll in horizontal orientation (tenants as rows, months as columns)
function renderRentRollHorizontal(leasesByProperty, properties, tenants, units, buildings, year, breakoutByBuilding) {
    const rentRollTable = document.getElementById('rentRollTable');
    let html = '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = months.map((m, i) => `${m}/${String(year).slice(-2)}`);
    
    Object.keys(leasesByProperty).forEach(propertyId => {
        const property = properties[propertyId] || { name: 'Unknown Property' };
        const propertyLeases = leasesByProperty[propertyId];
        
        html += `<div style="margin-bottom: 40px;">`;
        html += `<h3 style="margin-bottom: 20px; color: #1e293b; font-size: 1.5rem;">${escapeHtml(property.name)} Rent Roll</h3>`;
        html += `<div style="font-size: 0.9em; color: #64748b; margin-bottom: 15px;">As of ${new Date().toLocaleDateString()}</div>`;
        
        if (breakoutByBuilding) {
            // Group leases by building
            const leasesByBuilding = {};
            propertyLeases.forEach(lease => {
                const unit = lease.unitId ? units[lease.unitId] : null;
                const buildingId = unit?.buildingId || 'no-building';
                if (!leasesByBuilding[buildingId]) {
                    leasesByBuilding[buildingId] = [];
                }
                leasesByBuilding[buildingId].push(lease);
            });
            
            // Render each building separately
            Object.keys(leasesByBuilding).forEach(buildingId => {
                const buildingLeases = leasesByBuilding[buildingId];
                const building = buildingId !== 'no-building' ? buildings[buildingId] : null;
                const buildingName = building?.name || 'No Building Assigned';
                
                html += renderHorizontalTable(buildingLeases, tenants, units, buildings, year, monthLabels, buildingName);
            });
        } else {
            // Render all leases together
            propertyLeases.sort((a, b) => {
                const tenantA = tenants[a.tenantId]?.tenantName || '';
                const tenantB = tenants[b.tenantId]?.tenantName || '';
                return tenantA.localeCompare(tenantB);
            });
            
            html += renderHorizontalTable(propertyLeases, tenants, units, buildings, year, monthLabels);
        }
        
        html += `</div>`;
    });
    
    rentRollTable.innerHTML = html;
}

// Helper function to render horizontal table
function renderHorizontalTable(leases, tenants, units, buildings, year, monthLabels, buildingName = null) {
    let html = '';
    
    if (buildingName) {
        html += `<h4 style="margin: 20px 0 10px 0; color: #475569; font-size: 1.2rem;">${escapeHtml(buildingName)}</h4>`;
    }
    
    html += `<div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">`;
    html += `<table class="rent-roll-table" style="width: 100%; min-width: 1200px; border-collapse: collapse;">`;
    
    // Header row
    html += `<thead>`;
    html += `<tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">`;
    html += `<th style="padding: 12px; text-align: left; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); position: sticky; left: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: 10;">Tenant</th>`;
    html += `<th style="padding: 12px; text-align: center; font-weight: 600; border: 1px solid rgba(255,255,255,0.2);">Suite #</th>`;
    html += `<th style="padding: 12px; text-align: right; font-weight: 600; border: 1px solid rgba(255,255,255,0.2);">Area (SF)</th>`;
    
    monthLabels.forEach(month => {
        html += `<th style="padding: 12px; text-align: right; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); min-width: 100px;">${month}</th>`;
    });
    
    html += `<th style="padding: 12px; text-align: right; font-weight: 600; border: 1px solid rgba(255,255,255,0.2);">Total Annual</th>`;
    html += `<th style="padding: 12px; text-align: right; font-weight: 600; border: 1px solid rgba(255,255,255,0.2);">$/SF</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;
    
    let totalAnnualRent = 0;
    const monthlyTotals = new Array(12).fill(0);
    
    leases.forEach(lease => {
        const tenant = tenants[lease.tenantId];
        const tenantName = tenant?.tenantName || 'Unknown Tenant';
        const unit = lease.unitId ? units[lease.unitId] : null;
        const suiteNumber = unit?.unitNumber || 'N/A';
        const squareFootage = unit?.squareFootage || null;
        
        let annualRent = 0;
        const monthlyRents = [];
        
        for (let month = 1; month <= 12; month++) {
            const result = calculateRentForMonth(lease, year, month);
            const rent = result.rent;
            monthlyRents.push(rent);
            annualRent += rent;
            monthlyTotals[month - 1] += rent;
        }
        
        totalAnnualRent += annualRent;
        const rentPerSqFt = squareFootage && squareFootage > 0 ? (annualRent / 12 / squareFootage) : null;
        
        html += `<tr style="border-bottom: 1px solid #e2e8f0;">`;
        html += `<td style="padding: 10px; font-weight: 600; position: sticky; left: 0; background: white; z-index: 5; border-right: 1px solid #e2e8f0;">${escapeHtml(tenantName)}</td>`;
        html += `<td style="padding: 10px; text-align: center; color: #64748b;">${escapeHtml(suiteNumber)}</td>`;
        html += `<td style="padding: 10px; text-align: right; color: #64748b; font-variant-numeric: tabular-nums;">${squareFootage ? squareFootage.toLocaleString() : '—'}</td>`;
        
        monthlyRents.forEach((rent, idx) => {
            const month = idx + 1;
            const result = calculateRentForMonth(lease, year, month);
            
            // Determine if escalation indicator should be shown
            let hasEscalation = false;
            if (rent > 0) {
                if (idx > 0) {
                    // Compare with previous month
                    const prevRent = monthlyRents[idx - 1];
                    if (prevRent > 0 && Math.abs(rent - prevRent) > 0.01) {
                        hasEscalation = true;
                    }
                } else {
                    // January - compare with December of previous year
                    const prevResult = calculateRentForMonth(lease, year - 1, 12);
                    const prevRent = prevResult.rent;
                    if (prevRent > 0 && Math.abs(rent - prevRent) > 0.01) {
                        hasEscalation = true;
                    }
                }
            }
            
            const rentDisplay = rent > 0 ? `$${rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
            const cellColor = rent > 0 ? '#1e293b' : '#cbd5e1';
            
            html += `<td style="padding: 10px; text-align: right; font-variant-numeric: tabular-nums; color: ${cellColor}; position: relative;">`;
            if (hasEscalation && rent > 0) {
                html += `<span style="position: absolute; top: 2px; right: 4px; color: #10b981; font-size: 0.75em; font-weight: bold;" title="Rent escalation applied">↑</span>`;
            }
            html += `<span style="display: block; padding-right: ${hasEscalation ? '12px' : '0'};">${rentDisplay}</span>`;
            html += `</td>`;
        });
        
        html += `<td style="padding: 10px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; color: #667eea;">$${annualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
        const ppfDisplay = rentPerSqFt ? `$${rentPerSqFt.toFixed(2)}` : '—';
        html += `<td style="padding: 10px; text-align: right; font-variant-numeric: tabular-nums; color: #7c3aed;">${ppfDisplay}</td>`;
        html += `</tr>`;
    });
    
    // Total row
    html += `<tr style="background: #f8f9fa; font-weight: 600; border-top: 2px solid #667eea;">`;
    html += `<td style="padding: 12px; position: sticky; left: 0; background: #f8f9fa; z-index: 5; border-right: 1px solid #e2e8f0;">TOTAL</td>`;
    html += `<td style="padding: 12px; text-align: center;"></td>`;
    html += `<td style="padding: 12px; text-align: right;"></td>`;
    
    monthlyTotals.forEach(total => {
        html += `<td style="padding: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #667eea;">$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    });
    
    html += `<td style="padding: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #667eea; font-size: 1.1em;">$${totalAnnualRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
    html += `<td style="padding: 12px; text-align: right;"></td>`;
    html += `</tr>`;
    
    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;
    
    return html;
}
