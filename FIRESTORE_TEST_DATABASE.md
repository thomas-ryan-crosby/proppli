# Using a Test Firestore Database

## Current Setup

This project uses **two separate Firebase projects**:

1. **Production Database** (`maintenance-tracker-760ce`)
   - Used by: **main branch** (production deployment)
   - Config file: `firebase-config.js`
   - Purpose: Live production data

2. **Test/Development Database** (`maintenance-tracker-test`)
   - Used by: **phase1-development branch** and local development
   - Config file: `firebase-config.test.js`
   - Purpose: Testing new features without affecting production

## Branch-to-Database Mapping

| Branch | Database | Config File | Purpose |
|--------|----------|-------------|---------|
| `main` | `maintenance-tracker-760ce` (Production) | `firebase-config.js` | Live production data |
| `phase1-development` | `maintenance-tracker-test` (Test) | `firebase-config.test.js` | Development and testing |

## Best Practices for Development

When developing new features, it's recommended to use a **separate Firebase project** for testing to avoid affecting your production data.

## Option 1: Separate Firebase Project (Recommended)

### Setup Steps:

1. **Create a New Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Name it something like: `maintenance-tracker-dev` or `maintenance-tracker-test`
   - Follow the setup wizard

2. **Enable Firestore:**
   - In your new project, go to "Firestore Database"
   - Create database in test mode (for development)
   - Choose your preferred location

3. **Enable Storage (if needed):**
   - Go to "Storage"
   - Get started with default rules

4. **Get Configuration:**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Add a web app if needed
   - Copy the configuration

5. **Create Test Config File:**
   - Create `firebase-config.test.js` in your project
   - Paste the test project configuration
   - Update `index.html` to use test config during development:
     ```html
     <!-- For development -->
     <script src="firebase-config.test.js"></script>
     <!-- For production -->
     <!-- <script src="firebase-config.js"></script> -->
     ```

### Benefits:
- ✅ Complete isolation from production data
- ✅ Can test destructive operations safely
- ✅ Can reset test database anytime
- ✅ No risk of corrupting production data

## Option 2: Environment-Based Configuration

### Setup:

1. **Create separate config files:**
   - `firebase-config.js` (production)
   - `firebase-config.dev.js` (development)

2. **Use a simple environment switcher:**
   ```javascript
   // In index.html, before other scripts
   <script>
       const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
       const configFile = isDevelopment ? 'firebase-config.dev.js' : 'firebase-config.js';
       document.write('<script src="' + configFile + '"><\/script>');
   </script>
   ```

3. **Or use URL parameter:**
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const useTest = urlParams.get('test') === 'true';
   const configFile = useTest ? 'firebase-config.test.js' : 'firebase-config.js';
   ```

## Option 3: Firestore Emulator (Advanced)

For local development, you can use the Firebase Emulator Suite:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Emulator:**
   ```bash
   firebase init emulators
   ```

3. **Start Emulators:**
   ```bash
   firebase emulators:start
   ```

4. **Update firebase-config.js for emulator:**
   ```javascript
   if (window.location.hostname === 'localhost') {
       firebase.firestore().useEmulator('localhost', 8080);
       firebase.storage().useEmulator('localhost', 9199);
   }
   ```

## Recommended Approach for This Project

**For Phase 1 Development:**

1. **Create a separate Firebase project** called `maintenance-tracker-dev`
2. **Create `firebase-config.dev.js`** with the dev project config
3. **Switch between configs** using a simple method:
   - Add `?dev=true` to URL to use dev config
   - Or use localhost detection

4. **Before merging to main branch:**
   - Test with production config
   - Ensure everything works with real data structure
   - Update documentation

## Quick Setup Script

Add this to your `index.html` before the firebase-config script:

```html
<script>
    // Auto-detect environment and load appropriate config
    (function() {
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        const useDev = isLocal || new URLSearchParams(window.location.search).get('dev') === 'true';
        
        const script = document.createElement('script');
        script.src = useDev ? 'firebase-config.dev.js' : 'firebase-config.js';
        script.onerror = function() {
            console.error('Firebase config file not found. Using default.');
            // Fallback to production config
            const fallback = document.createElement('script');
            fallback.src = 'firebase-config.js';
            document.head.appendChild(fallback);
        };
        document.head.appendChild(script);
    })();
</script>
```

## Important Notes

⚠️ **Never commit `firebase-config.dev.js` or `firebase-config.test.js` to the repository** if they contain real credentials. Add them to `.gitignore`.

✅ **Best Practice:** Use environment variables or separate projects, not different config files in the same repo.

✅ **For GitHub Pages:** Since you can't use environment variables easily, using separate Firebase projects is the cleanest approach.

