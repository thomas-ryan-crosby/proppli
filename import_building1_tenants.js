/**
 * ONE-TIME IMPORT SCRIPT FOR BUILDING #1
 * 
 * This script imports tenants, contacts, units, and occupancies from the CSV file
 * for Building #1 only. It reconciles existing data and only creates/updates what's needed.
 * 
 * Usage:
 * 1. Open your app in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Update the CSV_PATH variable to point to your CSV file
 * 5. Run: await importBuilding1Tenants()
 * 
 * The script will:
 * - Find or create Building #1
 * - Parse CSV data for Building #1
 * - Reconcile existing tenants (by name)
 * - Create/update tenants, contacts, units, and occupancies
 */

// Configuration
const CONFIG = {
    propertyName: 'Sanctuary Office Park', // Property name to find
    buildingNumber: '1', // Building number
    performImport: true, // Set to true to actually import (false = dry run)
    updateExisting: true // Update existing tenants/contacts if found
};

// CSV content - paste your CSV content here as a string
// OR use the loadCSVFromFileInput function below
let CSV_CONTENT = null;

/**
 * Parse CSV text into rows - handles quoted fields with commas and newlines
 */
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Row separator (outside quotes)
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                currentField = '';
                rows.push(currentRow);
                currentRow = [];
            }
            // Skip \r\n combination
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }
    
    // Add last field and row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    
    return rows;
}

/**
 * Clean phone number
 */
function cleanPhone(phone) {
    if (!phone || phone === '-' || phone.trim() === '') return null;
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '').trim() || null;
}

/**
 * Clean email
 */
function cleanEmail(email) {
    if (!email || email === '-' || email.trim() === '') return null;
    const cleaned = email.trim().toLowerCase();
    return cleaned.includes('@') ? cleaned : null;
}

/**
 * Parse date string
 */
function parseDate(dateStr) {
    if (!dateStr || dateStr === '-' || dateStr === 'MONTH TO MONTH' || dateStr === 'N/A' || dateStr.trim() === '') {
        return null;
    }
    
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return firebase.firestore.Timestamp.fromDate(date);
    }
    return null;
}

/**
 * Clean currency value
 */
function cleanCurrency(value) {
    if (!value || value === '-') return null;
    const cleaned = value.toString().replace(/[^0-9.]/g, '');
    return cleaned ? parseFloat(cleaned) : null;
}

/**
 * Clean number
 */
function cleanNumber(value) {
    if (!value || value === '-') return null;
    const cleaned = value.toString().replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : null;
}

/**
 * Main import function
 */
async function importBuilding1Tenants() {
    console.log('=== BUILDING #1 TENANT IMPORT ===');
    console.log('CONFIG:', CONFIG);
    
    if (!CONFIG.performImport) {
        console.log('\n⚠️  DRY RUN MODE - No data will be imported');
        console.log('Set CONFIG.performImport = true to perform actual import\n');
    }
    
    try {
        // Step 1: Find or create property
        console.log('Step 1: Finding property...');
        let propertyId;
        const propertiesSnapshot = await db.collection('properties')
            .where('name', '==', CONFIG.propertyName)
            .get();
        
        if (propertiesSnapshot.empty) {
            console.log(`Property "${CONFIG.propertyName}" not found. Please create it first.`);
            return;
        }
        
        propertyId = propertiesSnapshot.docs[0].id;
        console.log(`✓ Found property: ${propertyId}`);
        
        // Step 2: Find or create Building #1
        console.log('\nStep 2: Finding or creating Building #1...');
        let buildingId;
        
        // First, let's check what buildings exist for this property
        const allBuildingsSnapshot = await db.collection('buildings')
            .where('propertyId', '==', propertyId)
            .get();
        
        console.log(`Found ${allBuildingsSnapshot.size} existing building(s) for this property:`);
        allBuildingsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.buildingName} (ID: ${doc.id})`);
        });
        
        // Try to find Building #1 (try different formats)
        const buildingNameVariants = [
            `Building ${CONFIG.buildingNumber}`,
            `Building #${CONFIG.buildingNumber}`,
            `Building${CONFIG.buildingNumber}`,
            `Building  ${CONFIG.buildingNumber}` // with extra space
        ];
        
        let foundBuilding = null;
        for (const variant of buildingNameVariants) {
            const buildingsSnapshot = await db.collection('buildings')
                .where('propertyId', '==', propertyId)
                .where('buildingName', '==', variant)
                .get();
            
            if (!buildingsSnapshot.empty) {
                foundBuilding = buildingsSnapshot.docs[0];
                console.log(`✓ Found Building #1 with name "${variant}": ${foundBuilding.id}`);
                break;
            }
        }
        
        if (foundBuilding) {
            buildingId = foundBuilding.id;
        } else {
            if (CONFIG.performImport) {
                const buildingRef = await db.collection('buildings').add({
                    propertyId: propertyId,
                    buildingName: `Building ${CONFIG.buildingNumber}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                buildingId = buildingRef.id;
                console.log(`✓ Created Building #1: ${buildingId}`);
            } else {
                console.log('Would create Building #1');
                buildingId = 'DRY_RUN_BUILDING_ID';
            }
        }
        
        // Step 3: Load and parse CSV
        console.log('\nStep 3: Loading CSV file...');
        let csvText = CSV_CONTENT;
        
        if (!csvText) {
            // Try to load from default path
            try {
                const csvPath = 'c:\\Users\\thoma\\Downloads\\Sanctuary Office Park_CONTROLLER_Source - Office Park Controller (3).csv';
                console.log('Attempting to load CSV from default path...');
                // Note: Browser can't directly read local files, but we can try fetch
                // For now, user needs to load it manually
                console.error('CSV content not found. Please either:');
                console.log('1. Use createCSVFileInput() to select the CSV file, OR');
                console.log('2. Set CSV_CONTENT variable with the CSV content');
                console.log('\nExample: CSV_CONTENT = `...paste CSV content here...`;');
                return;
            } catch (e) {
                console.error('CSV content not found. Please load the CSV file first.');
                return;
            }
        }
        
        const rows = parseCSV(csvText);
        console.log(`✓ Parsed ${rows.length} rows from CSV`);
        
        // Step 4: Find Building #1 section and parse tenants
        console.log('\nStep 4: Parsing Building #1 data...');
        const tenants = [];
        let inBuilding1 = false;
        let currentBuilding = null;
        let buildingHeaderFound = false;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0) continue;
            
            // Check for building header (more flexible matching)
            if (row[0] && row[0].toLowerCase().includes('building')) {
                const buildingMatch = row[0].match(/Building\s*#?\s*(\d+)/i);
                if (buildingMatch) {
                    currentBuilding = buildingMatch[1];
                    inBuilding1 = currentBuilding === CONFIG.buildingNumber;
                    if (inBuilding1) {
                        buildingHeaderFound = true;
                        console.log(`  → Found Building #${currentBuilding} header at row ${i + 1}: "${row[0]}"`);
                    }
                    continue;
                }
            }
            
            // Skip if not in Building #1
            if (!inBuilding1) continue;
            
            // Skip header rows and empty rows
            if (i < 5 || !row[0] || row[0].trim() === '' || row[0] === 'Company Name' || row[0].includes('Summary')) {
                continue;
            }
            
            const companyName = row[0]?.trim();
            if (!companyName || companyName === '-') continue;
            
            console.log(`  → Parsing tenant: ${companyName}`);
            
            // Parse tenant data
            const commonName = row[1]?.trim() || null;
            const notes = row[3]?.trim() || null;
            const suiteNumber = row[4]?.trim() || null;
            const rentableSF = cleanNumber(row[5]);
            const monthlyRent = cleanCurrency(row[6]);
            const pricePerSF = cleanCurrency(row[7]);
            const leaseCommencement = row[8]?.trim() || null;
            const leaseExpiration = row[9]?.trim() || null;
            const noticeDays = cleanNumber(row[10]);
            const noticeDate = row[11]?.trim() || null;
            const initialDateOccupied = row[13]?.trim() || null;
            const status = row[14]?.trim() || 'Occupied';
            
            // Parse contacts
            const contacts = [];
            
            // Contact #1
            if (row[18] && row[18].trim() !== '-' && row[18].trim() !== '') {
                contacts.push({
                    contactName: row[18].trim(),
                    contactPhone: cleanPhone(row[19]),
                    contactEmail: cleanEmail(row[20]),
                    classifications: ['Primary'],
                    isBroker: false
                });
            }
            
            // Contact #2
            if (row[21] && row[21].trim() !== '-' && row[21].trim() !== '') {
                contacts.push({
                    contactName: row[21].trim(),
                    contactPhone: cleanPhone(row[22]),
                    contactEmail: cleanEmail(row[23]),
                    classifications: ['Secondary'],
                    isBroker: false
                });
            }
            
            // Agent Contact #1 (Broker)
            if (row[30] && row[30].trim() !== '-' && row[30].trim() !== '') {
                contacts.push({
                    contactName: row[30].trim(),
                    contactPhone: cleanPhone(row[31]),
                    contactEmail: cleanEmail(row[32]),
                    classifications: ['Tenant Representative'],
                    isBroker: true
                });
            }
            
            // Agent Contact #2 (Broker)
            if (row[33] && row[33].trim() !== '-' && row[33].trim() !== '') {
                contacts.push({
                    contactName: row[33].trim(),
                    contactPhone: cleanPhone(row[34]),
                    contactEmail: cleanEmail(row[35]),
                    classifications: ['Tenant Representative'],
                    isBroker: true
                });
            }
            
            // Contact #3
            if (row[36] && row[36].trim() !== '-' && row[36].trim() !== '') {
                contacts.push({
                    contactName: row[36].trim(),
                    contactPhone: cleanPhone(row[37]),
                    contactEmail: cleanEmail(row[38]),
                    classifications: ['Secondary'],
                    isBroker: false
                });
            }
            
            // Contact #4
            if (row[39] && row[39].trim() !== '-' && row[39].trim() !== '') {
                contacts.push({
                    contactName: row[39].trim(),
                    contactPhone: cleanPhone(row[40]),
                    contactEmail: cleanEmail(row[41]),
                    classifications: ['Secondary'],
                    isBroker: false
                });
            }
            
            // Contact #5
            if (row[42] && row[42].trim() !== '-' && row[42].trim() !== '') {
                contacts.push({
                    contactName: row[42].trim(),
                    contactPhone: cleanPhone(row[43]),
                    contactEmail: cleanEmail(row[44]),
                    classifications: ['Secondary'],
                    isBroker: false
                });
            }
            
            tenants.push({
                tenantName: companyName,
                commonName: commonName,
                notes: notes,
                suiteNumber: suiteNumber,
                rentableSF: rentableSF,
                monthlyRent: monthlyRent,
                pricePerSF: pricePerSF,
                leaseCommencement: leaseCommencement,
                leaseExpiration: leaseExpiration,
                noticeDays: noticeDays,
                noticeDate: noticeDate,
                initialDateOccupied: initialDateOccupied,
                status: status,
                contacts: contacts
            });
        }
        
        console.log(`✓ Found ${tenants.length} tenants in Building #1`);
        
        // Step 5: Get existing tenants for reconciliation
        console.log('\nStep 5: Reconciling with existing data...');
        const existingTenantsSnapshot = await db.collection('tenants').get();
        const existingTenants = {};
        existingTenantsSnapshot.forEach(doc => {
            const data = doc.data();
            const key = data.tenantName?.toLowerCase().trim();
            if (key) {
                existingTenants[key] = {
                    id: doc.id,
                    ...data
                };
            }
        });
        console.log(`  → Found ${Object.keys(existingTenants).length} existing tenants in database`);
        
        // Get existing units
        const existingUnitsSnapshot = await db.collection('units')
            .where('propertyId', '==', propertyId)
            .where('buildingId', '==', buildingId)
            .get();
        const existingUnits = {};
        existingUnitsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.unitNumber) {
                existingUnits[data.unitNumber] = {
                    id: doc.id,
                    ...data
                };
            }
        });
        console.log(`  → Found ${Object.keys(existingUnits).length} existing units for Building #1`);
        
        // Step 6: Import tenants
        console.log('\nStep 6: Importing tenants, contacts, units, and occupancies...');
        let created = 0;
        let updated = 0;
        let errors = 0;
        
        for (let i = 0; i < tenants.length; i++) {
            const tenantData = tenants[i];
            const tenantNameKey = tenantData.tenantName.toLowerCase().trim();
            
            console.log(`\n[${i + 1}/${tenants.length}] Processing: ${tenantData.tenantName}`);
            
            try {
                // Find or create tenant
                let tenantId;
                const existingTenant = existingTenants[tenantNameKey];
                
                if (existingTenant) {
                    tenantId = existingTenant.id;
                    console.log(`  → Found existing tenant: ${tenantId}`);
                    
                    if (CONFIG.updateExisting && CONFIG.performImport) {
                        await db.collection('tenants').doc(tenantId).update({
                            tenantType: 'Commercial',
                            status: tenantData.status === 'Occupied' ? 'Active' : 'Past',
                            notes: tenantData.notes || existingTenant.notes || null,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        console.log(`  ✓ Updated tenant`);
                        updated++;
                    } else {
                        console.log(`  → Would update tenant`);
                    }
                } else {
                    if (CONFIG.performImport) {
                        const tenantRef = await db.collection('tenants').add({
                            tenantName: tenantData.tenantName,
                            tenantType: 'Commercial',
                            status: tenantData.status === 'Occupied' ? 'Active' : 'Past',
                            notes: tenantData.notes || null,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        tenantId = tenantRef.id;
                        console.log(`  ✓ Created tenant: ${tenantId}`);
                        created++;
                    } else {
                        tenantId = `DRY_RUN_TENANT_${i}`;
                        console.log(`  → Would create tenant`);
                    }
                }
                
                // Handle suite/unit
                if (tenantData.suiteNumber) {
                    // Parse suite number (could be "100", "302 + 303", "301A", etc.)
                    const suiteNumbers = tenantData.suiteNumber.split('+').map(s => s.trim());
                    
                    for (const suiteNum of suiteNumbers) {
                        let unitId;
                        const existingUnit = existingUnits[suiteNum];
                        
                        if (existingUnit) {
                            unitId = existingUnit.id;
                            console.log(`  → Found existing unit: ${suiteNum} (${unitId})`);
                        } else {
                            if (CONFIG.performImport) {
                                const unitRef = await db.collection('units').add({
                                    propertyId: propertyId,
                                    buildingId: buildingId,
                                    unitNumber: suiteNum,
                                    unitType: 'Office',
                                    squareFootage: tenantData.rentableSF,
                                    monthlyRent: tenantData.monthlyRent,
                                    status: tenantData.status === 'Occupied' ? 'Occupied' : 'Vacant',
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                unitId = unitRef.id;
                                existingUnits[suiteNum] = { id: unitId, unitNumber: suiteNum };
                                console.log(`  ✓ Created unit: ${suiteNum} (${unitId})`);
                            } else {
                                unitId = `DRY_RUN_UNIT_${i}`;
                                console.log(`  → Would create unit: ${suiteNum}`);
                            }
                        }
                        
                        // Create or update occupancy
                        if (CONFIG.performImport) {
                            const occupanciesSnapshot = await db.collection('occupancies')
                                .where('tenantId', '==', tenantId)
                                .where('unitId', '==', unitId)
                                .get();
                            
                            if (occupanciesSnapshot.empty) {
                                await db.collection('occupancies').add({
                                    tenantId: tenantId,
                                    propertyId: propertyId,
                                    unitId: unitId,
                                    moveInDate: parseDate(tenantData.initialDateOccupied) || parseDate(tenantData.leaseCommencement) || firebase.firestore.FieldValue.serverTimestamp(),
                                    moveOutDate: parseDate(tenantData.leaseExpiration),
                                    status: tenantData.status === 'Occupied' ? 'Active' : 'Past',
                                    notes: tenantData.notes || null,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                console.log(`  ✓ Created occupancy for unit ${suiteNum}`);
                            } else {
                                const occId = occupanciesSnapshot.docs[0].id;
                                if (CONFIG.updateExisting) {
                                    await db.collection('occupancies').doc(occId).update({
                                        moveInDate: parseDate(tenantData.initialDateOccupied) || parseDate(tenantData.leaseCommencement) || firebase.firestore.FieldValue.serverTimestamp(),
                                        moveOutDate: parseDate(tenantData.leaseExpiration),
                                        status: tenantData.status === 'Occupied' ? 'Active' : 'Past',
                                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                    console.log(`  ✓ Updated occupancy for unit ${suiteNum}`);
                                }
                            }
                        } else {
                            console.log(`  → Would create/update occupancy for unit ${suiteNum}`);
                        }
                    }
                }
                
                // Import contacts
                if (CONFIG.performImport) {
                    // Get existing contacts for this tenant
                    const existingContactsSnapshot = await db.collection('tenantContacts')
                        .where('tenantId', '==', tenantId)
                        .get();
                    
                    const existingContacts = {};
                    existingContactsSnapshot.forEach(doc => {
                        const data = doc.data();
                        const key = `${data.contactName?.toLowerCase()}_${data.contactEmail?.toLowerCase() || 'noemail'}`;
                        existingContacts[key] = doc.id;
                    });
                    
                    for (const contactData of tenantData.contacts) {
                        const contactKey = `${contactData.contactName.toLowerCase()}_${(contactData.contactEmail || 'noemail').toLowerCase()}`;
                        const existingContactId = existingContacts[contactKey];
                        
                        if (existingContactId) {
                            if (CONFIG.updateExisting) {
                                await db.collection('tenantContacts').doc(existingContactId).update({
                                    contactName: contactData.contactName,
                                    contactPhone: contactData.contactPhone,
                                    contactEmail: contactData.contactEmail,
                                    classifications: contactData.classifications,
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                                console.log(`  ✓ Updated contact: ${contactData.contactName}`);
                            }
                        } else {
                            await db.collection('tenantContacts').add({
                                tenantId: tenantId,
                                contactName: contactData.contactName,
                                contactPhone: contactData.contactPhone,
                                contactEmail: contactData.contactEmail,
                                classifications: contactData.classifications,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            console.log(`  ✓ Created contact: ${contactData.contactName}`);
                        }
                    }
                } else {
                    console.log(`  → Would import ${tenantData.contacts.length} contacts`);
                }
                
            } catch (error) {
                console.error(`  ✗ Error processing tenant:`, error);
                errors++;
            }
        }
        
        console.log('\n=== IMPORT SUMMARY ===');
        console.log(`Created: ${created}`);
        console.log(`Updated: ${updated}`);
        console.log(`Errors: ${errors}`);
        console.log(`Total processed: ${tenants.length}`);
        
        if (!CONFIG.performImport) {
            console.log('\n⚠️  This was a DRY RUN. Set CONFIG.performImport = true to perform actual import.');
        } else {
            console.log('\n✓ Import completed!');
        }
        
    } catch (error) {
        console.error('Import error:', error);
    }
}

/**
 * Helper function to load CSV from file input
 * Usage: Create a file input element, select the CSV file, then call this function
 */
async function loadCSVFromFileInput(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        console.error('No file selected');
        return;
    }
    
    const file = fileInput.files[0];
    const text = await file.text();
    CSV_CONTENT = text;
    console.log('✓ CSV file loaded. You can now run: await importBuilding1Tenants()');
    return text;
}

/**
 * Helper function to create a file input for CSV loading
 */
function createCSVFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
        await loadCSVFromFileInput(e.target);
    };
    input.click();
    return input;
}

// Make functions available globally
window.importBuilding1Tenants = importBuilding1Tenants;
window.loadCSVFromFileInput = loadCSVFromFileInput;
window.createCSVFileInput = createCSVFileInput;

console.log('Import script loaded.');
console.log('To use:');
console.log('1. Load CSV: createCSVFileInput() or set CSV_CONTENT variable');
console.log('2. Run import: await importBuilding1Tenants()');
