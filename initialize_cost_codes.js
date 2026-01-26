// Script to initialize cost codes in Firestore from the constant
// Run with: node initialize_cost_codes.js
// Requires: Firebase Admin SDK credentials (serviceAccountKey.json or GOOGLE_APPLICATION_CREDENTIALS env var)

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Cost codes constant (copied from app.js)
const COST_CODES_BY_COMPANY = {
    "JLC": [
        {"code": "031s", "description": "Carpentry"},
        {"code": "1001", "description": "Customer Deposit.."},
        {"code": "135s", "description": "Trash Hauling"},
        {"code": "001", "description": "Beginning Balance"},
        {"code": "005", "description": "Lot Cost"},
        {"code": "006", "description": "Engineering"},
        {"code": "009", "description": "Fill"},
        {"code": "010", "description": "Legal Fees"},
        {"code": "011", "description": "Surveying"},
        {"code": "012", "description": "Clearing & Fill"},
        {"code": "013", "description": "Water Meters"},
        {"code": "014", "description": "Permit Fees"},
        {"code": "015", "description": "Underground Electric"},
        {"code": "016", "description": "Electric Meters"},
        {"code": "017", "description": "Fence & Gates"},
        {"code": "018", "description": "Inspections"},
        {"code": "019", "description": "Drainage"},
        {"code": "021", "description": "Piling & Layout"},
        {"code": "021B", "description": "Test Item"},
        {"code": "022", "description": "Forming"},
        {"code": "023", "description": "Digging & Steel"},
        {"code": "024", "description": "Termite Treatment"},
        {"code": "025", "description": "Pour Slab"},
        {"code": "026", "description": "Concrete Pump"},
        {"code": "027", "description": "Retainer Wall"},
        {"code": "031", "description": "Carpentry"},
        {"code": "032", "description": "Lumber,Nails,Hardware"},
        {"code": "033", "description": "Exterior Trim & Doors"},
        {"code": "034", "description": "Aluminum Window & Doors"},
        {"code": "035", "description": "Structural Steel, FI Beam"},
        {"code": "036", "description": "Equipment Rental"},
        {"code": "041", "description": "Plumbing Sub & Drainage"},
        {"code": "042", "description": "Bath Tops & Alcove"},
        {"code": "043", "description": "Tubs & Shower Bases"},
        {"code": "044", "description": "Miscellaneous Plumbing"},
        {"code": "045", "description": "Lawn Sprinklers"},
        {"code": "046", "description": "Sewer Line"},
        {"code": "048", "description": "Ph.III & IV-Engineering"},
        {"code": "051", "description": "A/C Subcontractor"},
        {"code": "06", "description": "Streets"},
        {"code": "061", "description": "Electrical Subcontractor"},
        {"code": "062", "description": "Light Fixtures"},
        {"code": "063", "description": "Phone Prewire,Conduit"},
        {"code": "064", "description": "Intercom,Video,Cent.Vac."},
        {"code": "065", "description": "Burglar Alarm Prewire"},
        {"code": "066", "description": "Appliances"},
        {"code": "07", "description": "Water Line"},
        {"code": "071", "description": "Brick Work"},
        {"code": "072", "description": "Stucco"},
        {"code": "073", "description": "Block Work"},
        {"code": "075", "description": "Vinyl Siding & Facia"},
        {"code": "076", "description": "Shutter, Pediments, Column"},
        {"code": "08", "description": "Clearing Contract"},
        {"code": "081", "description": "Interior Trim"},
        {"code": "082", "description": "Cabinets"},
        {"code": "083", "description": "Kitchen Tops"},
        {"code": "084", "description": "Interior Hardware"},
        {"code": "085", "description": "Closet Shelving"},
        {"code": "086", "description": "Fire Door"},
        {"code": "090", "description": "Painting Materials"},
        {"code": "091", "description": "Interior Painting"},
        {"code": "092", "description": "Exterior Painting"},
        {"code": "093", "description": "Wallpaper"},
        {"code": "094", "description": "Mold Remediation"},
        {"code": "101", "description": "Carpet/Wood/Marble"},
        {"code": "102", "description": "Visqueen & Cardboard"},
        {"code": "103", "description": "Ceramic Tile"},
        {"code": "104", "description": "Patio & Porch Tile/Brick"},
        {"code": "105", "description": "Vinyl Floors"},
        {"code": "111", "description": "Insulation"},
        {"code": "112", "description": "Light Weight Concrete"},
        {"code": "113", "description": "Drywall & Soundboard"},
        {"code": "121", "description": "Roofing & Balconies"},
        {"code": "122", "description": "Gutters"},
        {"code": "123", "description": "Roof Vents"},
        {"code": "130", "description": "Trash Haul Dirt.."},
        {"code": "131", "description": "Walk, Parking, Patio, Drives"},
        {"code": "132", "description": "Garage Doors & Openers"},
        {"code": "133", "description": "Iron Work & Spiral Stairs"},
        {"code": "134", "description": "Landscaping"},
        {"code": "135", "description": "Trash Hauling Vegetation"},
        {"code": "136", "description": "Pool, Spa"},
        {"code": "137", "description": "Sprinkler System"},
        {"code": "138", "description": "Window Cleaning"},
        {"code": "140", "description": "Fireplaces"},
        {"code": "141", "description": "Elevators"},
        {"code": "142", "description": "Tennis Court"},
        {"code": "143", "description": "Mirrors"},
        {"code": "144", "description": "Bath Accessories"},
        {"code": "145", "description": "Fine Clean"},
        {"code": "146", "description": "Shower Enclosures"},
        {"code": "147", "description": "Furniture"},
        {"code": "148", "description": "Street Signs"},
        {"code": "149", "description": "Mailboxes & House #'s"},
        {"code": "150", "description": "Specialties"},
        {"code": "151", "description": "Port-O-Let"},
        {"code": "206", "description": "Marketing"},
        {"code": "207", "description": "Parking Lot"},
        {"code": "208", "description": "Miscellaneous"},
        {"code": "210", "description": "Incidentals & Touch Up"},
        {"code": "400", "description": "Sales Tax"},
        {"code": "401", "description": "Association Fees"},
        {"code": "402", "description": "Commission & Advertising"},
        {"code": "403", "description": "Interest"},
        {"code": "404", "description": "Insurance"},
        {"code": "406", "description": "Property Taxes"},
        {"code": "408", "description": "Repairs & Maintenance"},
        {"code": "409", "description": "Utilities"},
        {"code": "410", "description": "Rent"},
        {"code": "411", "description": "Design Services"},
        {"code": "412", "description": "Security"},
        {"code": "414", "description": "Interior Design"},
        {"code": "417", "description": "Travel Expenses"},
        {"code": "418", "description": "Auto Expense"},
        {"code": "419", "description": "Moving Expense"},
        {"code": "420", "description": "Deposit Refund"},
        {"code": "421", "description": "Management Fee"},
        {"code": "422", "description": "RV Propane"},
        {"code": "500", "description": "Tent Installation"},
        {"code": "62B", "description": "Exterior Light Fixtures"}
    ],
    "SHOA": [
        {"code": "Generator", "description": "Expense"},
        {"code": "Clubhouse upgrades", "description": "Expense"},
        {"code": "Resident Dumpsters", "description": "Expense"},
        {"code": "Merchant deposit fees", "description": "Expense"},
        {"code": "Operating Expenses", "description": "Expense"},
        {"code": "Operating Expenses: Accounting & Software", "description": "Expense"},
        {"code": "Operating Expenses: Bank Service Charges", "description": "Expense"},
        {"code": "Operating Expenses: Decorations", "description": "Expense"},
        {"code": "Operating Expenses: Dues and Subscriptions", "description": "Expense"},
        {"code": "Operating Expenses: Guard Service", "description": "Expense"},
        {"code": "Operating Expenses: Insurance", "description": "Expense"},
        {"code": "Operating Expenses: Legal Fees", "description": "Expense"},
        {"code": "Operating Expenses: Licenses and Permits", "description": "Expense"},
        {"code": "Operating Expenses: Lifeguards", "description": "Expense"},
        {"code": "Operating Expenses: Management Expenses", "description": "Expense"},
        {"code": "Operating Expenses: Office Supplies", "description": "Expense"},
        {"code": "Operating Expenses: Police Detail", "description": "Expense"},
        {"code": "Operating Expenses: Printing, Postage and Delivery", "description": "Expense"},
        {"code": "Operating Expenses: Social Functions", "description": "Expense"},
        {"code": "Operating Expenses: Website", "description": "Expense"},
        {"code": "Amenities Maintenance", "description": "Expense"},
        {"code": "Amenities Maintenance: Bird Houses", "description": "Expense"},
        {"code": "Amenities Maintenance: Crystal Lake", "description": "Expense"},
        {"code": "Amenities Maintenance: Nature Trail", "description": "Expense"},
        {"code": "Clubhouse Maintenance", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Ballfield", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Exercise Equipment", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Furniture (Clubhouse)", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Furniture (Pool)", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Janitorial Expenses", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Parking Area", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Party Cleaning", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Playground Equipment", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Repairs & Maintenance", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Swimming Pool", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Tennis Courts", "description": "Expense"},
        {"code": "Clubhouse Maintenance: Termite Treatment/Pest Control", "description": "Expense"},
        {"code": "Common Area Maintenance", "description": "Expense"},
        {"code": "Common Area Maintenance: Fence Repair", "description": "Expense"},
        {"code": "Common Area Maintenance: Fountain Maintenance", "description": "Expense"},
        {"code": "Common Area Maintenance: Lighting", "description": "Expense"},
        {"code": "Common Area Maintenance: Mailbox Repair", "description": "Expense"},
        {"code": "Common Area Maintenance: Sign Repairs", "description": "Expense"},
        {"code": "Common Area Maintenance: Wildlife Management", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: 7 Cardinal Lane", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Grass Cutting & Landscaping", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Landscape Upgrades & Flowers", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Powerline Grass Cutting", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Storm Cleanup", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Tree Removal", "description": "Expense"},
        {"code": "Grounds & Landscape Maintenance: Undeveloped Lot Cutting", "description": "Expense"},
        {"code": "Security", "description": "Expense"},
        {"code": "Security: New Guard House", "description": "Expense"},
        {"code": "Security: Cameras", "description": "Expense"},
        {"code": "Security: Entry Cards/Remotes", "description": "Expense"},
        {"code": "Security: Gate Maintenance & Repair", "description": "Expense"},
        {"code": "Security: Guardhouse Maintenance", "description": "Expense"},
        {"code": "Security: Parade Security (Lights)", "description": "Expense"},
        {"code": "Streets & Drainage", "description": "Expense"},
        {"code": "Streets & Drainage: Brick Headwalls", "description": "Expense"},
        {"code": "Streets & Drainage: Street Maintenance", "description": "Expense"},
        {"code": "Streets & Drainage: Drainage Repairs", "description": "Expense"},
        {"code": "Taxes", "description": "Expense"},
        {"code": "Taxes: Federal", "description": "Expense"},
        {"code": "Taxes: Local", "description": "Expense"},
        {"code": "Taxes: Property", "description": "Expense"},
        {"code": "Taxes: State", "description": "Expense"},
        {"code": "Utilities", "description": "Expense"},
        {"code": "Utilities: Charter Communications", "description": "Expense"},
        {"code": "Utilities: Electric", "description": "Expense"},
        {"code": "Utilities: Gas", "description": "Expense"},
        {"code": "Utilities: Telephone", "description": "Expense"},
        {"code": "Utilities: Water", "description": "Expense"}
    ],
    "CDC": [
        {"code": "001", "description": "Beginning Balance"},
        {"code": "002", "description": "Land Cost"},
        {"code": "009", "description": "Phase 4-A streets.."},
        {"code": "010", "description": "Legal Fees"},
        {"code": "011", "description": "Surveying"},
        {"code": "012", "description": "Engineering"},
        {"code": "013", "description": "Tree Removal"},
        {"code": "014", "description": "Permits"},
        {"code": "015", "description": "Clearing & Fill"},
        {"code": "017", "description": "Fences"},
        {"code": "032", "description": "Lumber"},
        {"code": "036", "description": "Equipment Rental"},
        {"code": "061", "description": "Electrical.."},
        {"code": "062", "description": "Lighting"},
        {"code": "066", "description": "Appliances"},
        {"code": "091", "description": "Interior Painting.."},
        {"code": "101", "description": "Construction Payments"},
        {"code": "102", "description": "Customer Refunds"},
        {"code": "103", "description": "Commission"},
        {"code": "104", "description": "Builder Rebate"},
        {"code": "133", "description": "Street Signs"},
        {"code": "135", "description": "Landscaping"},
        {"code": "136", "description": "Trash Hauling"},
        {"code": "137", "description": "Sprinkler system"},
        {"code": "138", "description": "Phase 4A"},
        {"code": "143", "description": "Mirrors.."},
        {"code": "206", "description": "Marketing"},
        {"code": "208", "description": "Miscellaneous"},
        {"code": "400", "description": "Site Improvement Allowance"},
        {"code": "401", "description": "Association Fees"},
        {"code": "402", "description": "Mitigation"},
        {"code": "404", "description": "Insurance"},
        {"code": "404A", "description": "JLC Personal Insurance"},
        {"code": "405", "description": "Management Fees"},
        {"code": "406", "description": "Property Taxes"},
        {"code": "408", "description": "Repairs & Maintenance"},
        {"code": "409", "description": "Utilities"},
        {"code": "410", "description": "Closing Costs"},
        {"code": "411", "description": "Design Services"},
        {"code": "412", "description": "Equipment Expense"},
        {"code": "415", "description": "Furniture"},
        {"code": "416", "description": "Security"},
        {"code": "417", "description": "Travel Expense"},
        {"code": "418", "description": "Auto Expense"},
        {"code": "419", "description": "Price Fundraiser"},
        {"code": "420", "description": "Interest Expense"},
        {"code": "421", "description": "Interest Expense (Land Inventory)"},
        {"code": "444", "description": "Phase 4"},
        {"code": "445", "description": "Payment to Bernard Smith"},
        {"code": "1000", "description": "Rental Income"},
        {"code": "1000:1", "description": "January Rent"},
        {"code": "1000:2", "description": "February Rent"},
        {"code": "1000:3", "description": "March Rent"},
        {"code": "1000:4", "description": "April Rent"},
        {"code": "1000:5", "description": "May Rent"},
        {"code": "1000:6", "description": "June Rent"},
        {"code": "1000:7", "description": "July Rent"},
        {"code": "1000:8", "description": "August Rent"},
        {"code": "1000:9", "description": "September Rent"},
        {"code": "1000:10", "description": "October Rent"},
        {"code": "1000:11", "description": "November Rent"},
        {"code": "1000:12", "description": "December Rent"},
        {"code": "1001", "description": "Interest"},
        {"code": "1003", "description": "Property Tax"},
        {"code": "R401", "description": "Interior Remodeling"},
        {"code": "R402", "description": "Commissions"},
        {"code": "R403", "description": "Moving Allowance"},
        {"code": "R404", "description": "Legal Fees"},
        {"code": "R405", "description": "Swimming Pool"},
        {"code": "R408", "description": "Repairs & Maintenance"},
        {"code": "R409", "description": "Utilities"},
        {"code": "R411", "description": "Insurance"},
        {"code": "R412", "description": "Janitorial"},
        {"code": "R413", "description": "Landscape Maintenance"},
        {"code": "R414", "description": "Telephone Expense"},
        {"code": "R415", "description": "Property Tax"},
        {"code": "R416", "description": "Tax & License.."},
        {"code": "R417", "description": "Rent Refund"},
        {"code": "R418", "description": "Advertising.."},
        {"code": "R500", "description": "Office Rental Distributions"},
        {"code": "R501", "description": "Office Rental Distributions.."}
    ]
};

async function initializeCostCodes() {
    try {
        // Initialize Firebase Admin SDK
        // Try Firebase CLI credentials first (application default credentials)
        let initialized = false;
        
        try {
            console.log('Attempting to use Firebase CLI credentials...');
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            console.log('✅ Firebase Admin initialized with application default credentials');
            initialized = true;
        } catch (cliError) {
            console.log('Firebase CLI credentials not available, trying service account file...');
        }
        
        // If CLI credentials didn't work, try service account file
        if (!initialized) {
            const serviceAccountPath = path.join(__dirname, 'dest-service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('✅ Firebase Admin initialized with service account');
                initialized = true;
            } else {
                console.error(`Error: Could not initialize Firebase Admin SDK.`);
                console.error('Options:');
                console.error('  1. Run: gcloud auth application-default login');
                console.error('  2. Or place dest-service-account.json in project root');
                console.error('  3. Or use initialize_cost_codes_browser.html in your browser');
                process.exit(1);
            }
        }

        const db = admin.firestore();
        const batch = db.batch();
        let count = 0;
        const batchSize = 500; // Firestore batch limit
        let currentBatch = db.batch();
        let currentBatchCount = 0;
        let totalAdded = 0;
        let totalSkipped = 0;

        console.log('Starting cost code initialization...');

        for (const [company, codes] of Object.entries(COST_CODES_BY_COMPANY)) {
            console.log(`Processing ${company}: ${codes.length} cost codes`);
            
            for (const codeObj of codes) {
                // Check if code already exists
                const existing = await db.collection('costCodes')
                    .where('company', '==', company)
                    .where('code', '==', codeObj.code)
                    .limit(1)
                    .get();
                
                if (existing.empty) {
                    const ref = db.collection('costCodes').doc();
                    currentBatch.set(ref, {
                        company: company,
                        code: codeObj.code,
                        description: codeObj.description || '',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    totalAdded++;
                    currentBatchCount++;
                    
                    // Commit batch if we hit the limit
                    if (currentBatchCount >= batchSize) {
                        await currentBatch.commit();
                        console.log(`  Committed batch of ${currentBatchCount} cost codes`);
                        currentBatch = db.batch();
                        currentBatchCount = 0;
                    }
                } else {
                    totalSkipped++;
                }
            }
        }
        
        // Commit remaining items
        if (currentBatchCount > 0) {
            await currentBatch.commit();
            console.log(`  Committed final batch of ${currentBatchCount} cost codes`);
        }
        
        console.log(`\nInitialization complete!`);
        console.log(`  Added: ${totalAdded} cost codes`);
        console.log(`  Skipped: ${totalSkipped} cost codes (already exist)`);
        console.log(`  Total: ${totalAdded + totalSkipped} cost codes processed`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error initializing cost codes:', error);
        process.exit(1);
    }
}

initializeCostCodes();
