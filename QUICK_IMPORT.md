# QUICK IMPORT - Just Run This

## Step 1: Open Browser Console
1. Go to `http://localhost:8000` (your app)
2. Open browser console (F12)
3. Go to Console tab

## Step 2: Load the Import Script
Copy and paste the ENTIRE contents of `import_building1_tenants.js` into the console and press Enter.

## Step 3: Load Your CSV File
In the console, run:
```javascript
createCSVFileInput();
```
This will open a file picker. Select your CSV file from Downloads folder.

## Step 4: Run the Import
```javascript
CONFIG.performImport = true;
await importBuilding1Tenants();
```

That's it! The data will be imported to your development database.
