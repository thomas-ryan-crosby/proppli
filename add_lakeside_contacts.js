// Script to add contacts to Lakeside Village - Property Management
// Run this in the browser console on the maintenance tracker page

(async function() {
    console.log('=== ADDING CONTACTS TO LAKESIDE VILLAGE ===');
    
    // Contact data from user
    const contactsData = [
        {
            primary: { lastName: 'Coffey', firstName: 'Nancy', phone: '5046506406', email: 'coffeynancy504@gmail.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Delesdernier', firstName: 'Marshall', phone: '5044323387', email: 'Marshall.delesdernier@yahoo.com' },
            secondary: { lastName: 'Delesdernier', firstName: 'Renee', phone: '5049200240', email: 'rdel2715@yahoo.com' }
        },
        {
            primary: { lastName: 'Keith', firstName: 'Kris', phone: '8043567348', email: 'podleshs3@yahoo.com' },
            secondary: { lastName: 'Keith', firstName: 'Sarah', phone: '8048229484', email: null }
        },
        {
            primary: { lastName: 'Mack-Grey', firstName: 'Shermetrius', phone: '9857072571', email: 'smackgray@gmail.com' },
            secondary: { lastName: null, firstName: null, phone: '5043557915', email: null }
        },
        {
            primary: { lastName: 'Fontenot', firstName: 'Kasey', phone: '9857783148', email: 'kasey.fontenot@yahoo.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Kite', firstName: 'Karla', phone: '9852318865', email: 'ammiekite@gmail.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Vaughn', firstName: 'Chet', phone: '5045599928', email: 'Vaughn.chester@gmail.com' },
            secondary: { lastName: 'Vaughn', firstName: 'Annie', phone: '8474208760', email: 'Holmberg.annie@gmail.com' }
        },
        {
            primary: { lastName: 'Lecocq', firstName: 'Shane', phone: '9852153645', email: 'shanelecocq@yahoo.com' },
            secondary: { lastName: 'Lecocq', firstName: 'Letizia', phone: '9857738733', email: null }
        },
        {
            primary: { lastName: 'Anderson', firstName: 'Jeff', phone: '5046168055', email: 'jeff.business@icloud.com' },
            secondary: { lastName: 'Anderson', firstName: 'Chris', phone: '5043765694', email: 'Chranderson27@gmail.com' }
        },
        {
            primary: { lastName: 'Dipol', firstName: 'Daniel', phone: '9857786782', email: 'danieldipol6782@gmail.com' },
            secondary: { lastName: 'Grieco', firstName: 'Tori', phone: '9857787992', email: null }
        },
        {
            primary: { lastName: 'Jackson', firstName: 'Rosalyn', phone: '8325630976', email: 'jrosalyn54@gmail.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Morgan', firstName: 'Scott', phone: '3144979281', email: 'morgans68@gmail.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Groves', firstName: 'Allison', phone: '4153850386', email: 'Littlestar.alg@gmail.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Sperry', firstName: 'Paula', phone: '9853029646', email: 'paula.sperry@yahoo.com' },
            secondary: null
        },
        {
            primary: { lastName: 'Westenberger', firstName: 'Eric', phone: '5048587643', email: 'emwest@bellsouth.net' },
            secondary: null
        }
    ];
    
    try {
        // Get Firebase instance
        const db = firebase.firestore();
        
        // Find Lakeside Village - Property Management property
        const propertiesSnapshot = await db.collection('properties')
            .where('name', '==', 'Lakeside Village - Property Management')
            .get();
        
        if (propertiesSnapshot.empty) {
            console.error('❌ Property "Lakeside Village - Property Management" not found!');
            return;
        }
        
        const property = propertiesSnapshot.docs[0];
        const propertyId = property.id;
        console.log(`✓ Found property: ${property.data().name} (ID: ${propertyId})`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Process each contact
        for (const contactData of contactsData) {
            try {
                const primary = contactData.primary;
                const tenantName = `${primary.firstName} ${primary.lastName}`;
                
                // Check if tenant already exists
                let tenantRef;
                const existingTenants = await db.collection('tenants')
                    .where('tenantName', '==', tenantName)
                    .get();
                
                if (!existingTenants.empty) {
                    tenantRef = existingTenants.docs[0].ref;
                    console.log(`  ✓ Found existing tenant: ${tenantName}`);
                } else {
                    // Create tenant
                    const tenantDoc = {
                        tenantName: tenantName,
                        tenantType: 'Residential',
                        status: 'Active',
                        propertyId: propertyId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    tenantRef = await db.collection('tenants').add(tenantDoc);
                    console.log(`  ✓ Created tenant: ${tenantName} (ID: ${tenantRef.id})`);
                }
                
                // Create primary contact
                // Handle phone numbers that might have multiple values (take first one)
                const primaryPhone = primary.phone ? primary.phone.split('\n')[0].trim() : null;
                
                const primaryContactDoc = {
                    tenantId: tenantRef.id,
                    contactName: tenantName,
                    contactEmail: primary.email || null,
                    contactPhone: primaryPhone,
                    classifications: ['Primary'],
                    propertyId: propertyId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Check if primary contact already exists
                const existingPrimaryContacts = await db.collection('tenantContacts')
                    .where('tenantId', '==', tenantRef.id)
                    .where('contactName', '==', tenantName)
                    .get();
                
                if (existingPrimaryContacts.empty) {
                    await db.collection('tenantContacts').add(primaryContactDoc);
                    console.log(`    ✓ Created primary contact: ${tenantName}`);
                } else {
                    console.log(`    - Primary contact already exists: ${tenantName}`);
                }
                
                // Create secondary contact if provided
                if (contactData.secondary) {
                    const secondary = contactData.secondary;
                    let secondaryName;
                    
                    if (secondary.firstName && secondary.lastName) {
                        secondaryName = `${secondary.firstName} ${secondary.lastName}`;
                    } else if (secondary.firstName) {
                        secondaryName = secondary.firstName;
                    } else if (secondary.lastName) {
                        secondaryName = secondary.lastName;
                    } else if (secondary.phone) {
                        // Handle phone numbers that might have multiple values (take first one)
                        const secondaryPhone = secondary.phone.split('\n')[0].trim();
                        secondaryName = `Contact - ${secondaryPhone}`;
                    } else {
                        continue; // Skip if no valid secondary contact info
                    }
                    
                    // Handle phone numbers that might have multiple values (take first one)
                    const secondaryPhone = secondary.phone ? secondary.phone.split('\n')[0].trim() : null;
                    
                    const secondaryContactDoc = {
                        tenantId: tenantRef.id,
                        contactName: secondaryName,
                        contactEmail: secondary.email || null,
                        contactPhone: secondaryPhone,
                        classifications: ['Secondary'],
                        propertyId: propertyId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // Check if secondary contact already exists
                    const existingSecondaryContacts = await db.collection('tenantContacts')
                        .where('tenantId', '==', tenantRef.id)
                        .where('contactName', '==', secondaryName)
                        .get();
                    
                    if (existingSecondaryContacts.empty) {
                        await db.collection('tenantContacts').add(secondaryContactDoc);
                        console.log(`    ✓ Created secondary contact: ${secondaryName}`);
                    } else {
                        console.log(`    - Secondary contact already exists: ${secondaryName}`);
                    }
                }
                
                successCount++;
            } catch (error) {
                console.error(`  ❌ Error processing contact:`, error);
                errorCount++;
            }
        }
        
        console.log(`\n=== SUMMARY ===`);
        console.log(`✓ Successfully processed: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log('\n✅ Done! Refresh the page to see the new contacts.');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
})();
