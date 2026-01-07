# Maintenance Tracker System

A simple, user-friendly maintenance tracking system for HOA and Property Management. Built with vanilla JavaScript and Firebase, designed for easy deployment on GitHub Pages.

## Features

- ✅ **Multi-Property Management** - Create and manage multiple properties/HOAs
- ✅ **Simple Ticket Creation** - One-click ticket creation with all essential information
- ✅ **Personnel Tracking** - Track who requested, manages, and completes each ticket
- ✅ **Time Allocation** - Track allocated time for each maintenance task
- ✅ **Status Management** - Track ticket status (Not Started, In Progress, Completed)
- ✅ **Completed Work Repository** - Historical view of all completed maintenance work
- ✅ **Property Filtering** - View tickets by property or across all properties

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database**:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create Database"
   - Choose your preferred location
   - Start in **test mode** for initial setup (you can secure it later)

4. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Copy the Firebase configuration object

### 2. Configure Firebase in the Project

**IMPORTANT:** The Firebase config files are not included in the repository for security reasons. You must create them.

#### Production Database (for main branch)

1. Copy `firebase-config.example.js` to `firebase-config.js`:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```
   Or on Windows:
   ```bash
   copy firebase-config.example.js firebase-config.js
   ```

2. Open `firebase-config.js`

3. Replace the placeholder values with your **production Firebase project** configuration

#### Test Database (for development branch)

1. Copy `firebase-config.example.js` to `firebase-config.test.js`:
   ```bash
   cp firebase-config.example.js firebase-config.test.js
   ```

2. Open `firebase-config.test.js`

3. Replace the placeholder values with your **test Firebase project** configuration (`maintenance-tracker-test`)

4. Update the project ID and other values to match your test project

**Note:** See `DATABASE_SETUP.md` for detailed information about which database is used by which branch.

#### Configuration Values

Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Firebase Security Rules (Optional but Recommended)

In Firebase Console → Firestore Database → Rules, you can set up basic security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules allow read/write access to everyone. For production, you should implement authentication and restrict access appropriately.

### 4. Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Or use a local server (recommended):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (http-server)
   npx http-server
   ```
4. Navigate to `http://localhost:8000` (or the port your server uses)

### 5. GitHub Pages Deployment

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select your source branch (usually `main` or `master`)
4. Select the root folder
5. Click Save
6. Your site will be available at `https://[username].github.io/[repository-name]`

**Important:** Make sure your Firebase configuration is in `firebase-config.js` before deploying.

## Usage

### Creating Properties

1. Click "Manage Properties" button
2. Fill in the property form:
   - Property Name (required)
   - Address (optional)
   - Description (optional)
3. Click "Save Property"
4. Select the property from the dropdown to filter tickets

### Creating Tickets

1. Select a property (or create one first)
2. Click "Create New Ticket"
3. Fill in the form:
   - Property (auto-selected, can be changed)
   - Work Description (required)
   - Time Allocated in hours (required)
   - Requested By (required)
   - Managed By (required)
   - Status (defaults to "Not Started")
4. Click "Save Ticket"

### Managing Tickets

- **View Active Tickets**: See all incomplete tickets for the selected property
- **View Completed Tickets**: Switch to "Completed Tickets" view to see finished work
- **Mark as Complete**: Click "Mark as Complete" and enter who completed the work
- **Edit Ticket**: Click "Edit" to modify ticket details

## Project Structure

```
maintenance-tracker/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js              # Application logic
├── firebase-config.js  # Firebase configuration
└── README.md           # This file
```

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore
- **Hosting**: GitHub Pages
- **No build process required** - works directly in the browser

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Based on the PRD, potential future features include:
- User authentication
- Email notifications
- File attachments
- Advanced reporting and analytics
- Data export functionality
- Mobile app

## License

This project is open source and available for use.

## Support

For issues or questions, please refer to the PRD.md document or create an issue in the repository.

