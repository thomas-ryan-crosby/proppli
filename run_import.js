/**
 * QUICK IMPORT RUNNER
 * Run this in browser console to import Building #1 data directly
 * 
 * Usage: Copy this entire file and paste into browser console, then run:
 * await quickImportBuilding1()
 */

async function quickImportBuilding1() {
    console.log('🚀 Starting quick import...');
    
    // Load CSV from the file path
    const csvPath = 'c:\\Users\\thoma\\Downloads\\Sanctuary Office Park_CONTROLLER_Source - Office Park Controller (3).csv';
    
    try {
        // Try to fetch the CSV (if served locally)
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error('Could not load CSV file. Please copy the CSV content and set CSV_CONTENT variable.');
        }
        CSV_CONTENT = await response.text();
        console.log('✓ CSV loaded');
    } catch (error) {
        console.error('Error loading CSV:', error);
        console.log('Please set CSV_CONTENT variable with the CSV content, then run: await importBuilding1Tenants()');
        return;
    }
    
    // Set config for direct import
    CONFIG.performImport = true;
    CONFIG.updateExisting = true;
    
    // Run the import
    await importBuilding1Tenants();
    
    console.log('\n✅ Import complete! Refresh the tenant page to see the data.');
}

// Make it available
window.quickImportBuilding1 = quickImportBuilding1;
