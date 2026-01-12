# Phase 2 PRD: Leasing Center

**Version:** 1.0  
**Date:** 2024  
**Status:** Ready for Development  
**Priority:** High  
**Dependencies:** Phase 1 (Enhanced Property & Tenant Foundation)

---

## 1. Executive Summary

This document details the requirements for Phase 2 of the Property Management Platform, focusing on the Leasing Center - a comprehensive system for managing the entire tenant acquisition lifecycle from lead generation through lease execution. This phase transforms vacant units into occupied spaces by providing tools for marketing, lead management, application processing, showing coordination, and lease negotiation.

---

## 2. Objectives

### 2.1 Primary Goals
- Streamline the tenant acquisition process from lead to lease
- Centralize all leasing activities in a dedicated workspace
- Automate lead tracking and follow-up workflows
- Enable efficient application processing and screening
- Facilitate showing scheduling and coordination
- Support lease negotiation and approval workflows
- Provide marketing tools for property listings
- Track leasing performance metrics

### 2.2 Success Criteria
- All leads are captured and tracked in the system
- Application processing time is reduced by 40%
- Showing scheduling is automated and coordinated
- 100% of approved applications result in executed leases
- Leasing team can manage multiple properties and units simultaneously
- Marketing materials are centralized and accessible
- Leasing performance metrics are tracked and reported

---

## 3. Leasing Center Overview

### 3.1 Core Concept

The Leasing Center is a dedicated module that provides a unified workspace for all leasing activities. It serves as the central hub where property managers, leasing agents, and administrators manage the complete tenant acquisition process.

### 3.2 Key Workflows

1. **Lead Management:** Capture, qualify, and nurture leads
2. **Application Processing:** Collect, review, and approve tenant applications
3. **Showing Management:** Schedule and coordinate property showings
4. **Lease Negotiation:** Manage lease terms and approval workflows
5. **Marketing:** Create and manage property listings

---

## 4. Lead Management

### 4.1 Lead Capture

#### 4.1.1 Lead Sources
- **Manual Entry:** Leasing agents can manually create leads
- **Website Forms:** Leads from property website contact forms
- **Phone Inquiries:** Leads captured from phone calls
- **Walk-ins:** Leads from in-person visits
- **Referrals:** Leads from existing tenants or partners
- **Online Listings:** Leads from third-party listing sites (Zillow, Apartments.com, etc.)
- **Social Media:** Leads from social media inquiries
- **Email Inquiries:** Leads from email communications

#### 4.1.2 Lead Information Fields

**Required Fields:**
- Lead Name (text) - Individual or company name
- Lead Type (dropdown: Commercial, Residential)
- Lead Source (dropdown: Manual Entry, Website, Phone, Walk-in, Referral, Online Listing, Social Media, Email, Other)
- Contact Method (dropdown: Email, Phone, In-Person, Other)
- Primary Contact Email (email, required if contact method includes email)
- Primary Contact Phone (text, required if contact method includes phone)
- Property of Interest (dropdown: Select property)
- Unit of Interest (dropdown: Select unit, optional - can be "Any Available Unit")

**Optional Fields:**
- Secondary Contact Name (text)
- Secondary Contact Email (email)
- Secondary Contact Phone (text)
- Preferred Move-in Date (date)
- Budget/Rent Range (text or number range)
- Number of Occupants (number, for residential)
- Business Type (text, for commercial)
- Notes (textarea) - Initial inquiry notes
- Lead Status (dropdown: New, Contacted, Qualified, Not Qualified, Converted, Lost)
- Assigned Agent (dropdown: Select leasing agent/user)
- Follow-up Date (date)
- Follow-up Notes (textarea)

#### 4.1.3 Lead Status Workflow

**Status Definitions:**
- **New:** Lead just created, not yet contacted
- **Contacted:** Initial contact made, awaiting response
- **Qualified:** Lead meets basic criteria and is interested
- **Not Qualified:** Lead does not meet criteria or is not interested
- **Converted:** Lead has submitted an application
- **Lost:** Lead is no longer interested or unresponsive

**Status Transitions:**
- New → Contacted (when first contact is made)
- Contacted → Qualified (when lead shows interest and meets criteria)
- Contacted → Not Qualified (when lead doesn't meet criteria)
- Qualified → Converted (when application is submitted)
- Any → Lost (when lead becomes unresponsive or explicitly declines)

### 4.2 Lead Qualification

#### 4.2.1 Qualification Criteria
- Budget/Rent Range matches available units
- Move-in timeline aligns with availability
- Property type matches lead needs (commercial vs residential)
- Unit size/features match requirements
- Lead responsiveness and engagement level

#### 4.2.2 Qualification Workflow
- Leasing agent reviews lead information
- Agent contacts lead to gather additional information
- Agent assesses qualification criteria
- Agent updates lead status and notes
- System tracks qualification date and agent

### 4.3 Lead Nurturing & Follow-up

#### 4.3.1 Automated Follow-up Reminders
- System generates follow-up reminders based on:
  - Last contact date
  - Lead status
  - Assigned agent preferences
  - Custom follow-up schedules
- Reminders appear in Leasing Center dashboard
- Email notifications to assigned agent (optional)

#### 4.3.2 Follow-up Actions
- Schedule showing
- Send property information
- Send application link
- Make phone call
- Send email
- Update lead status
- Add notes

#### 4.3.3 Lead Communication History
- Track all communications with lead:
  - Phone calls (date, time, duration, notes)
  - Emails (sent/received, subject, summary)
  - In-person meetings (date, time, location, notes)
  - Text messages (date, time, content)
- Communication log is visible in lead detail view
- Communication history is searchable

### 4.4 Lead Conversion

#### 4.4.1 Conversion Process
- Qualified lead expresses interest in applying
- Agent creates application from lead
- Lead status automatically updates to "Converted"
- Lead information pre-populates application form
- Lead record links to application record

#### 4.4.2 Conversion Tracking
- Track conversion rate by source
- Track time from lead creation to conversion
- Track conversion rate by agent
- Generate conversion reports

---

## 5. Application Processing

### 5.1 Application Creation

#### 5.1.1 Application Sources
- **From Lead:** Convert qualified lead to application
- **Direct Application:** Applicant applies without prior lead record
- **Referral:** Application from existing tenant referral

#### 5.1.2 Application Information

**Required Fields:**
- Applicant Name (text) - Individual or company name
- Applicant Type (dropdown: Commercial, Residential)
- Property Applied For (dropdown: Select property)
- Unit Applied For (dropdown: Select unit, or "Any Available Unit")
- Application Date (date, auto-filled)
- Application Status (dropdown: Pending, Under Review, Approved, Rejected, Withdrawn)
- Assigned Reviewer (dropdown: Select user/agent)

**Residential Application Fields:**
- Primary Applicant Information:
  - Full Name (text, required)
  - Date of Birth (date)
  - Social Security Number (text, encrypted, optional)
  - Email (email, required)
  - Phone (text, required)
  - Current Address (text)
  - Current Rent (number)
  - Employment Status (dropdown: Employed, Self-Employed, Unemployed, Student, Retired)
  - Employer Name (text)
  - Job Title (text)
  - Monthly Income (number)
  - Length of Employment (text)
- Additional Occupants:
  - Name (text)
  - Relationship (text)
  - Date of Birth (date)
  - Email (email)
  - Phone (text)
- References:
  - Previous Landlord Name (text)
  - Previous Landlord Phone (text)
  - Previous Landlord Email (email)
  - Personal Reference Name (text)
  - Personal Reference Phone (text)
  - Personal Reference Email (email)
  - Employer Reference Name (text)
  - Employer Reference Phone (text)
  - Employer Reference Email (email)

**Commercial Application Fields:**
- Business Information:
  - Business Name (text, required)
  - Business Type/Industry (text)
  - Tax ID/EIN (text)
  - Business Address (text)
  - Years in Business (number)
  - Number of Employees (number)
  - Annual Revenue (number)
  - Website (url)
- Primary Contact:
  - Contact Name (text, required)
  - Contact Title (text)
  - Contact Email (email, required)
  - Contact Phone (text, required)
- Business References:
  - Bank Reference Name (text)
  - Bank Reference Contact (text)
  - Bank Reference Phone (text)
  - Trade Reference Name (text)
  - Trade Reference Contact (text)
  - Trade Reference Phone (text)
  - Previous Landlord Name (text)
  - Previous Landlord Contact (text)
  - Previous Landlord Phone (text)

**Application Documents:**
- Photo ID (file upload)
- Proof of Income (file upload) - Pay stubs, tax returns, bank statements
- Credit Report (file upload or integration)
- Background Check (file upload or integration)
- Business License (file upload, for commercial)
- Financial Statements (file upload, for commercial)
- Additional Documents (file upload, multiple)

**Application Notes:**
- Internal Notes (textarea) - Notes visible only to staff
- Application Notes (textarea) - Notes visible to applicant (optional)

### 5.2 Application Status Management

#### 5.2.1 Status Definitions
- **Pending:** Application submitted, awaiting initial review
- **Under Review:** Application is being reviewed and screened
- **Approved:** Application approved, ready for lease negotiation
- **Rejected:** Application rejected, applicant notified
- **Withdrawn:** Applicant withdrew application

#### 5.2.2 Status Workflow
- Pending → Under Review (when reviewer starts review)
- Under Review → Approved (when screening passes)
- Under Review → Rejected (when screening fails)
- Any → Withdrawn (when applicant withdraws)

### 5.3 Application Screening

#### 5.3.1 Screening Criteria
- **Credit Check:**
  - Credit score threshold (configurable)
  - Credit history review
  - Credit report analysis
- **Background Check:**
  - Criminal history
  - Eviction history
  - Employment verification
  - Income verification
- **Reference Checks:**
  - Previous landlord reference
  - Employment reference
  - Personal reference
- **Income Verification:**
  - Income-to-rent ratio (typically 3:1)
  - Employment stability
  - Income source verification

#### 5.3.2 Screening Integration
- **Credit Screening Services:**
  - Integration with credit check APIs (e.g., Experian, TransUnion)
  - Automated credit score retrieval
  - Credit report storage
- **Background Check Services:**
  - Integration with background check APIs
  - Automated background check initiation
  - Background check report storage
- **Manual Screening:**
  - Manual review of documents
  - Manual reference checks
  - Manual income verification

#### 5.3.3 Screening Workflow
1. Application submitted
2. System initiates automated screening (if integrated)
3. Reviewer receives notification
4. Reviewer reviews application and screening results
5. Reviewer makes approval/rejection decision
6. System updates application status
7. Applicant receives notification

### 5.4 Application Review & Approval

#### 5.4.1 Review Interface
- Application detail view with all information
- Screening results display
- Document viewer for uploaded files
- Review checklist
- Approval/rejection actions
- Notes and comments section

#### 5.4.2 Approval Workflow
- Single approver (simple workflow)
- Multi-level approval (for high-value leases)
- Approval notifications
- Approval history tracking

#### 5.4.3 Rejection Process
- Rejection reason selection
- Rejection notification to applicant
- Rejection letter generation (optional)
- Rejection appeal process (optional)

---

## 6. Showing Management

### 6.1 Showing Scheduling

#### 6.1.1 Showing Creation
- **From Lead:** Schedule showing for qualified lead
- **From Application:** Schedule showing for applicant
- **Standalone:** Create showing without lead/application

#### 6.1.2 Showing Information

**Required Fields:**
- Showing Date (date)
- Showing Time (time)
- Property (dropdown: Select property)
- Unit(s) to Show (multi-select: Select units)
- Lead/Applicant (dropdown: Select lead or applicant, optional)
- Showing Type (dropdown: In-Person, Virtual, Self-Guided)
- Assigned Agent (dropdown: Select leasing agent)

**Optional Fields:**
- Showing Duration (number, minutes, default: 30)
- Meeting Location (text) - For in-person showings
- Virtual Meeting Link (url) - For virtual showings
- Access Instructions (textarea) - For self-guided showings
- Special Requests (textarea)
- Notes (textarea)
- Showing Status (dropdown: Scheduled, Confirmed, Completed, Cancelled, No-Show)
- Follow-up Required (checkbox)
- Follow-up Date (date)

#### 6.1.3 Showing Calendar
- Calendar view of all scheduled showings
- Filter by property, unit, agent, date range
- Color coding by status
- Quick actions (confirm, cancel, reschedule)
- Conflict detection (prevent double-booking)

#### 6.1.4 Showing Confirmation
- Automated confirmation email to lead/applicant
- Calendar invite generation (iCal)
- Reminder notifications (24 hours, 1 hour before)
- Confirmation status tracking

### 6.2 Showing Execution

#### 6.2.1 Pre-Showing Checklist
- Unit preparation checklist
- Key/access code preparation
- Marketing materials ready
- Agent preparation notes

#### 6.2.2 Showing Feedback
- **Post-Showing Information:**
  - Showing Completed (checkbox)
  - Applicant Interest Level (dropdown: Very Interested, Interested, Somewhat Interested, Not Interested)
  - Feedback Notes (textarea)
  - Follow-up Actions (checkboxes: Send Application, Schedule Second Showing, Send More Information, No Follow-up)
  - Next Steps (textarea)
- **No-Show Handling:**
  - Mark as No-Show
  - Automatic follow-up reminder
  - Reschedule option

### 6.3 Showing Analytics
- Showings per unit
- Showings per agent
- Conversion rate (showing to application)
- Average time from showing to application
- No-show rate
- Showing feedback trends

---

## 7. Lease Negotiation & Approval

### 7.1 Lease Offer Creation

#### 7.1.1 Offer from Approved Application
- Approved application automatically creates lease offer opportunity
- Application information pre-populates lease offer
- Lease terms can be customized

#### 7.1.2 Lease Offer Information

**Required Fields:**
- Applicant (dropdown: Select approved applicant)
- Property (dropdown: Select property, auto-filled from application)
- Unit (dropdown: Select unit, auto-filled from application)
- Lease Start Date (date)
- Lease End Date (date)
- Monthly Rent (number)
- Security Deposit (number)
- Offer Status (dropdown: Draft, Sent, Under Negotiation, Accepted, Rejected, Expired)
- Offer Expiration Date (date, optional)

**Optional Fields:**
- Lease Term (number, months, auto-calculated from dates)
- Additional Charges:
  - Utilities (number, monthly)
  - Parking (number, monthly)
  - Pet Fee (number, one-time or monthly)
  - Other Fees (text, number)
- Concessions:
  - Free Rent Period (number, months)
  - Reduced Rent (number, amount or percentage)
  - Other Concessions (text)
- Special Terms (textarea)
- Notes (textarea)

### 7.2 Lease Negotiation

#### 7.2.1 Negotiation Workflow
- Offer sent to applicant
- Applicant reviews offer
- Applicant can accept, reject, or counter-offer
- Counter-offers tracked in negotiation history
- Final terms agreed upon
- Offer status updated to "Accepted"

#### 7.2.2 Negotiation History
- Track all offer versions
- Track counter-offers
- Track negotiation notes
- Track communication during negotiation
- Timeline view of negotiation process

### 7.3 Lease Approval

#### 7.3.1 Approval Workflow
- Accepted offer requires approval (if configured)
- Approval can be:
  - Automatic (for standard terms)
  - Single approver (property manager)
  - Multi-level approval (for high-value or non-standard terms)
- Approval notifications
- Approval history tracking

#### 7.3.2 Lease Document Generation
- Generate lease document from approved offer
- Use lease templates (commercial, residential)
- Customize lease terms
- Include all negotiated terms
- Generate PDF for signature

---

## 8. Lease Management

### 8.1 Current Lease Tracking

#### 8.1.1 Active Lease Overview
- View all active leases in the system
- Filter by property, unit, tenant, lease status
- Quick view of key lease information:
  - Tenant name
  - Property and unit
  - Lease start and end dates
  - Monthly rent amount
  - Days until expiration
  - Lease status

#### 8.1.2 Lease Status Definitions
- **Active:** Lease is currently in effect
- **Expiring Soon:** Lease expires within 30/60/90 days (configurable)
- **Expired:** Lease end date has passed but tenant still occupying
- **Terminated:** Lease was terminated early
- **Renewed:** Lease has been renewed (previous lease archived)

#### 8.1.3 Lease Information Fields

**Required Fields:**
- Lease Number/ID (text, auto-generated or manual)
- Tenant (dropdown: Select tenant)
- Property (dropdown: Select property)
- Unit (dropdown: Select unit, optional if property-level lease)
- Lease Start Date (date)
- Lease End Date (date)
- Monthly Rent (number)
- Security Deposit (number)
- Lease Status (dropdown: Active, Expiring Soon, Expired, Terminated, Renewed)
- Lease Type (dropdown: Commercial, Residential)

**Optional Fields:**
- Lease Term (number, months, auto-calculated from dates)
- Additional Monthly Charges:
  - Utilities (number)
  - Parking (number)
  - Pet Fee (number)
  - CAM Charges (number, for commercial)
  - Other Fees (text, number)
- One-Time Fees:
  - Application Fee (number)
  - Admin Fee (number)
  - Other Fees (text, number)
- Rent Escalation:
  - Escalation Type (dropdown: None, Fixed Amount, Percentage, CPI)
  - Escalation Amount/Percentage (number)
  - Escalation Frequency (dropdown: Monthly, Quarterly, Annually)
  - First Escalation Date (date)
- Special Terms (textarea)
- Notes (textarea)
- Lease Document (file upload, PDF)
- Signed Date (date)
- Executed By (text, name of signer)

#### 8.1.4 Lease Renewal Tracking
- Track lease renewal history
- Link renewed leases to previous leases
- Renewal date and terms tracking
- Renewal offer tracking
- Renewal approval workflow

### 8.2 Previous Lease Tracking

#### 8.2.1 Lease History
- View all previous/expired leases
- Filter by property, unit, tenant, date range
- Archive expired leases automatically
- Maintain historical lease data for reporting

#### 8.2.2 Previous Lease Information
- All original lease information preserved
- Move-out date tracking
- Final rent amount
- Security deposit return status
- Lease termination reason (if applicable)
- Final inspection notes

#### 8.2.3 Lease Archive
- Expired leases automatically archived
- Archived leases remain accessible for historical reference
- Search and filter archived leases
- Export lease history reports

### 8.3 Lease Document Management

#### 8.3.1 Lease Document Storage
- Upload and store lease documents (PDF)
- Version control for lease amendments
- Document access controls
- Document search and retrieval

#### 8.3.2 Lease Amendments
- Track lease amendments and addendums
- Link amendments to original lease
- Amendment document storage
- Amendment effective dates
- Amendment terms tracking

### 8.4 Lease Expiration Management

#### 8.4.1 Expiration Alerts
- Automated alerts for upcoming lease expirations
- Configurable alert thresholds (30, 60, 90 days)
- Dashboard notifications
- Email notifications to property managers
- Alert for expired leases with active tenants

#### 8.4.2 Renewal Workflow
- Generate renewal offers from existing leases
- Track renewal negotiations
- Renewal approval process
- Create new lease from renewal

### 8.5 Lease Analytics & Reporting

#### 8.5.1 Lease Metrics
- Total active leases
- Total monthly rent roll
- Average lease term
- Lease expiration timeline
- Renewal rate
- Vacancy rate by property/unit

#### 8.5.2 Lease Reports
- **Active Lease Report:** All current leases with details
- **Expiring Lease Report:** Leases expiring in specified timeframe
- **Lease History Report:** Historical leases by property/tenant
- **Renewal Report:** Renewal rates and trends
- **Rent Roll Report:** All active leases with rent amounts
- **Lease Term Report:** Average lease terms by property type

---

## 9. Marketing & Listings

### 8.1 Property Listings

#### 8.1.1 Listing Creation
- Create listings for available units
- Listings can be:
  - Internal (visible only to leasing team)
  - External (published to websites, listing sites)

#### 8.1.2 Listing Information

**Required Fields:**
- Property (dropdown: Select property)
- Unit (dropdown: Select unit, or "Property Level" for entire property)
- Listing Title (text)
- Listing Description (textarea)
- Monthly Rent (number)
- Available Date (date)
- Listing Status (dropdown: Draft, Active, Pending, Leased, Expired)

**Optional Fields:**
- Square Footage (number)
- Number of Bedrooms (number, for residential)
- Number of Bathrooms (number, for residential)
- Unit Features (checkboxes: Parking, Balcony, Washer/Dryer, Dishwasher, Air Conditioning, Heating, etc.)
- Property Amenities (checkboxes: Pool, Gym, Parking, Security, etc.)
- Pet Policy (text)
- Lease Terms (text)
- Photos (file upload, multiple)
- Virtual Tour Link (url)
- Floor Plan (file upload)
- Listing URL (url) - For external listings

#### 8.1.3 Listing Photos
- Upload multiple photos per listing
- Photo ordering/drag-and-drop
- Photo captions
- Photo optimization for web
- Virtual tour integration

#### 8.1.4 Listing Syndication
- Publish to internal website
- Publish to third-party sites (Zillow, Apartments.com, etc.)
- Automated syndication (if API available)
- Manual syndication links

### 8.2 Marketing Materials

#### 8.2.1 Material Types
- Property flyers
- Unit brochures
- Virtual tour videos
- Floor plans
- Photo galleries
- Property websites

#### 8.2.2 Material Management
- Upload and store marketing materials
- Organize by property/unit
- Share materials with leads/applicants
- Track material usage

### 8.3 Marketing Analytics
- Listing views
- Lead source tracking
- Conversion rates by listing
- Most effective marketing channels
- Cost per lead
- Cost per lease

---

## 9. Leasing Dashboard & Analytics

### 9.1 Leasing Dashboard

#### 9.1.1 Key Metrics
- **Active Leads:** Number of leads in pipeline
- **Pending Applications:** Number of applications under review
- **Scheduled Showings:** Upcoming showings (next 7 days)
- **Vacant Units:** Number of available units
- **Lease Conversion Rate:** Percentage of leads that convert to leases
- **Average Time to Lease:** Average days from lead to lease execution
- **Application Approval Rate:** Percentage of applications approved

#### 9.1.2 Activity Feed
- Recent lead activity
- New applications
- Upcoming showings
- Lease approvals
- Status changes

#### 9.1.3 Quick Actions
- Create new lead
- Schedule showing
- Review applications
- Generate reports

### 9.2 Leasing Reports

#### 9.2.1 Report Types
- **Lead Pipeline Report:** Leads by status and source
- **Application Status Report:** Applications by status
- **Showing Report:** Showings by date, unit, agent
- **Conversion Report:** Lead to application to lease conversion rates
- **Agent Performance Report:** Performance metrics by agent
- **Property Performance Report:** Leasing metrics by property
- **Time-to-Lease Report:** Average time from lead to lease by property/unit

#### 9.2.2 Report Features
- Date range filtering
- Property/unit filtering
- Agent filtering
- Export to CSV/PDF
- Scheduled reports (email delivery)

---

## 10. User Interface Requirements

### 10.1 Leasing Center Navigation
- Dedicated "Leasing" section in main navigation
- Leasing Center dashboard as landing page
- Sub-navigation for:
  - Leads
  - Applications
  - Showings
  - Listings
  - Reports

### 10.2 Lead Management UI

#### 10.2.1 Lead List View
- Table/grid view of all leads
- Filter by status, source, property, agent, date range
- Search by name, email, phone
- Sort by date, status, property
- Quick actions (view, edit, convert to application, schedule showing)
- Bulk actions (update status, assign agent)

#### 10.2.2 Lead Detail View
- Complete lead information
- Communication history timeline
- Related applications
- Related showings
- Notes and follow-up reminders
- Quick actions (schedule showing, send application, update status)

#### 10.2.3 Lead Form
- Create/edit lead form
- Conditional fields based on lead type
- Source tracking
- Status management
- Agent assignment

### 10.3 Application Management UI

#### 10.3.1 Application List View
- Table/grid view of all applications
- Filter by status, property, unit, date range
- Search by applicant name, email, phone
- Sort by date, status, property
- Quick actions (view, review, approve, reject)
- Status indicators (color-coded)

#### 10.3.2 Application Detail View
- Complete application information
- Document viewer
- Screening results
- Review checklist
- Approval/rejection actions
- Notes and comments
- Related lead (if converted from lead)
- Related showings

#### 10.3.3 Application Form
- Multi-step form for application creation
- Document upload interface
- Progress indicator
- Save draft functionality
- Form validation

### 10.4 Showing Management UI

#### 10.4.1 Showing Calendar View
- Calendar interface (month, week, day views)
- Color-coded by status
- Click to view/edit showing
- Drag-and-drop to reschedule
- Filter by property, unit, agent

#### 10.4.2 Showing List View
- Table view of scheduled showings
- Filter by date, property, unit, agent, status
- Upcoming showings highlighted
- Quick actions (confirm, cancel, reschedule, complete)

#### 10.4.3 Showing Detail View
- Complete showing information
- Related lead/applicant
- Pre-showing checklist
- Post-showing feedback form
- Communication history

### 10.5 Listing Management UI

#### 10.5.1 Listing List View
- Grid/card view of listings
- Filter by property, unit, status
- Search by title, description
- Quick actions (edit, publish, deactivate)

#### 10.5.2 Listing Detail View
- Complete listing information
- Photo gallery
- Edit listing form
- Publish/unpublish actions
- View listing preview

### 10.6 Lease Management UI

#### 10.6.1 Lease List View
- Toggle between "Current Leases" and "Previous Leases" views
- Table/grid view of leases
- Filter by property, unit, tenant, status, date range
- Search by lease number, tenant name, property
- Sort by date, rent, expiration date
- Quick actions (view, edit, renew, terminate)
- Status indicators (color-coded)
- Days until expiration displayed prominently
- Expiring leases highlighted

#### 10.6.2 Lease Detail View
- Complete lease information
- Tenant information and contact details
- Property and unit details
- Lease terms and dates
- Rent and charges breakdown
- Lease document viewer/download
- Amendment history
- Renewal history (if applicable)
- Related application/lease offer (if applicable)
- Quick actions (edit, renew, terminate, add amendment)

#### 10.6.3 Lease Form
- Create/edit lease form
- Conditional fields based on lease type (commercial/residential)
- Tenant selection (with search)
- Property and unit selection
- Date pickers for start/end dates
- Rent and deposit fields
- Additional charges section
- Rent escalation configuration
- Document upload
- Special terms textarea
- Notes section

#### 10.6.4 Lease Renewal Form
- Pre-populated from existing lease
- Editable renewal terms
- Renewal date configuration
- Link to previous lease
- Renewal offer generation

---

## 11. Data Model

### 11.1 Lead Schema

```javascript
{
  id: string,
  leadName: string,
  leadType: 'Commercial' | 'Residential',
  leadSource: 'Manual Entry' | 'Website' | 'Phone' | 'Walk-in' | 'Referral' | 'Online Listing' | 'Social Media' | 'Email' | 'Other',
  contactMethod: 'Email' | 'Phone' | 'In-Person' | 'Other',
  primaryContactEmail: string,
  primaryContactPhone: string,
  secondaryContactName: string | null,
  secondaryContactEmail: string | null,
  secondaryContactPhone: string | null,
  propertyId: string,
  unitId: string | null, // null if "Any Available Unit"
  preferredMoveInDate: timestamp | null,
  budgetRentRange: string | null,
  numberOfOccupants: number | null,
  businessType: string | null,
  notes: string | null,
  status: 'New' | 'Contacted' | 'Qualified' | 'Not Qualified' | 'Converted' | 'Lost',
  assignedAgentId: string | null,
  followUpDate: timestamp | null,
  followUpNotes: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.2 Application Schema

```javascript
{
  id: string,
  applicantName: string,
  applicantType: 'Commercial' | 'Residential',
  propertyId: string,
  unitId: string | null,
  applicationDate: timestamp,
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Withdrawn',
  assignedReviewerId: string | null,
  leadId: string | null, // If converted from lead
  
  // Residential fields
  primaryApplicant: {
    fullName: string,
    dateOfBirth: timestamp | null,
    ssn: string | null, // Encrypted
    email: string,
    phone: string,
    currentAddress: string | null,
    currentRent: number | null,
    employmentStatus: string | null,
    employerName: string | null,
    jobTitle: string | null,
    monthlyIncome: number | null,
    lengthOfEmployment: string | null
  } | null,
  additionalOccupants: Array<{
    name: string,
    relationship: string,
    dateOfBirth: timestamp | null,
    email: string | null,
    phone: string | null
  }>,
  references: {
    previousLandlord: {
      name: string | null,
      phone: string | null,
      email: string | null
    },
    personalReference: {
      name: string | null,
      phone: string | null,
      email: string | null
    },
    employerReference: {
      name: string | null,
      phone: string | null,
      email: string | null
    }
  },
  
  // Commercial fields
  businessInfo: {
    businessName: string | null,
    businessType: string | null,
    taxId: string | null,
    businessAddress: string | null,
    yearsInBusiness: number | null,
    numberOfEmployees: number | null,
    annualRevenue: number | null,
    website: string | null
  } | null,
  primaryContact: {
    contactName: string | null,
    contactTitle: string | null,
    contactEmail: string | null,
    contactPhone: string | null
  } | null,
  businessReferences: {
    bankReference: {
      name: string | null,
      contact: string | null,
      phone: string | null
    },
    tradeReference: {
      name: string | null,
      contact: string | null,
      phone: string | null
    },
    previousLandlord: {
      name: string | null,
      contact: string | null,
      phone: string | null
    }
  } | null,
  
  // Documents
  documents: Array<{
    type: string, // 'Photo ID', 'Proof of Income', 'Credit Report', etc.
    fileName: string,
    fileUrl: string,
    uploadedAt: timestamp
  }>,
  
  // Screening results
  screeningResults: {
    creditScore: number | null,
    creditCheckDate: timestamp | null,
    backgroundCheckStatus: string | null,
    backgroundCheckDate: timestamp | null,
    employmentVerified: boolean | null,
    incomeVerified: boolean | null,
    referencesChecked: boolean | null,
    screeningNotes: string | null
  } | null,
  
  internalNotes: string | null,
  applicationNotes: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.3 Showing Schema

```javascript
{
  id: string,
  showingDate: timestamp,
  showingTime: string, // Time component
  propertyId: string,
  unitIds: string[], // Array of unit IDs
  leadId: string | null,
  applicationId: string | null,
  showingType: 'In-Person' | 'Virtual' | 'Self-Guided',
  assignedAgentId: string,
  duration: number, // Minutes, default 30
  meetingLocation: string | null,
  virtualMeetingLink: string | null,
  accessInstructions: string | null,
  notes: string | null,
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-Show',
  followUpRequired: boolean,
  followUpDate: timestamp | null,
  feedback: {
    completed: boolean,
    interestLevel: 'Very Interested' | 'Interested' | 'Somewhat Interested' | 'Not Interested' | null,
    feedbackNotes: string | null,
    followUpActions: string[], // Array of action strings
    nextSteps: string | null
  } | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.4 Lease Offer Schema

```javascript
{
  id: string,
  applicationId: string, // Links to approved application
  applicantId: string, // Links to tenant (if created)
  propertyId: string,
  unitId: string,
  leaseStartDate: timestamp,
  leaseEndDate: timestamp,
  monthlyRent: number,
  securityDeposit: number,
  leaseTerm: number, // Months, auto-calculated
  additionalCharges: {
    utilities: number | null,
    parking: number | null,
    petFee: number | null,
    otherFees: Array<{
      description: string,
      amount: number,
      frequency: 'One-Time' | 'Monthly' | 'Annual'
    }>
  },
  concessions: {
    freeRentMonths: number | null,
    reducedRent: {
      amount: number | null,
      percentage: number | null
    } | null,
    otherConcessions: string | null
  },
  specialTerms: string | null,
  notes: string | null,
  status: 'Draft' | 'Sent' | 'Under Negotiation' | 'Accepted' | 'Rejected' | 'Expired',
  offerExpirationDate: timestamp | null,
  negotiationHistory: Array<{
    date: timestamp,
    action: string, // 'Offer Sent', 'Counter-Offer', 'Accepted', etc.
    notes: string | null,
    userId: string
  }>,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.5 Lease Schema

```javascript
{
  id: string,
  leaseNumber: string, // Auto-generated or manual
  tenantId: string,
  propertyId: string,
  unitId: string | null, // null if property-level lease
  leaseStartDate: timestamp,
  leaseEndDate: timestamp,
  leaseTerm: number, // Months, auto-calculated
  monthlyRent: number,
  securityDeposit: number,
  leaseType: 'Commercial' | 'Residential',
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated' | 'Renewed',
  
  // Additional charges
  additionalMonthlyCharges: {
    utilities: number | null,
    parking: number | null,
    petFee: number | null,
    camCharges: number | null, // For commercial
    otherFees: Array<{
      description: string,
      amount: number
    }>
  },
  
  // One-time fees
  oneTimeFees: {
    applicationFee: number | null,
    adminFee: number | null,
    otherFees: Array<{
      description: string,
      amount: number
    }>
  },
  
  // Rent escalation
  rentEscalation: {
    escalationType: 'None' | 'Fixed Amount' | 'Percentage' | 'CPI' | null,
    escalationAmount: number | null,
    escalationPercentage: number | null,
    escalationFrequency: 'Monthly' | 'Quarterly' | 'Annually' | null,
    firstEscalationDate: timestamp | null
  },
  
  specialTerms: string | null,
  notes: string | null,
  
  // Document management
  leaseDocument: {
    fileName: string | null,
    fileUrl: string | null,
    uploadedAt: timestamp | null
  } | null,
  
  // Execution details
  signedDate: timestamp | null,
  executedBy: string | null, // Name of signer
  
  // Renewal tracking
  previousLeaseId: string | null, // If renewed from previous lease
  renewedLeaseId: string | null, // If this lease was renewed
  
  // Termination details (if applicable)
  terminationDate: timestamp | null,
  terminationReason: string | null,
  
  // Move-out details (for expired leases)
  moveOutDate: timestamp | null,
  securityDepositReturnStatus: 'Pending' | 'Returned' | 'Forfeited' | 'Partial' | null,
  securityDepositReturnAmount: number | null,
  finalInspectionNotes: string | null,
  
  // Amendments
  amendments: Array<{
    id: string,
    amendmentDate: timestamp,
    effectiveDate: timestamp,
    description: string,
    documentUrl: string | null,
    notes: string | null
  }>,
  
  // Links to leasing process
  applicationId: string | null, // If created from application
  leaseOfferId: string | null, // If created from lease offer
  
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.6 Listing Schema

```javascript
{
  id: string,
  propertyId: string,
  unitId: string | null, // null if property-level listing
  listingTitle: string,
  listingDescription: string,
  monthlyRent: number,
  availableDate: timestamp,
  status: 'Draft' | 'Active' | 'Pending' | 'Leased' | 'Expired',
  squareFootage: number | null,
  numberOfBedrooms: number | null,
  numberOfBathrooms: number | null,
  unitFeatures: string[], // Array of feature strings
  propertyAmenities: string[], // Array of amenity strings
  petPolicy: string | null,
  leaseTerms: string | null,
  photos: Array<{
    url: string,
    caption: string | null,
    order: number
  }>,
  virtualTourLink: string | null,
  floorPlanUrl: string | null,
  listingUrls: string[], // Array of external listing URLs
  views: number, // Track listing views
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 11.6 Communication Log Schema

```javascript
{
  id: string,
  leadId: string | null,
  applicationId: string | null,
  showingId: string | null,
  communicationType: 'Phone' | 'Email' | 'In-Person' | 'Text' | 'Other',
  communicationDate: timestamp,
  communicationTime: string | null, // For phone calls
  duration: number | null, // Minutes, for phone calls
  subject: string | null, // For emails
  content: string, // Summary or content
  direction: 'Inbound' | 'Outbound',
  userId: string, // User who logged or initiated communication
  notes: string | null,
  createdAt: timestamp,
  organizationId: string
}
```

---

## 12. Functional Requirements

### 12.1 Lead Management

**FR-L1.1: Create Lead**
- User can create a new lead with required information
- Lead source is tracked
- Lead is assigned to property and optionally unit
- Lead status defaults to "New"
- Lead can be assigned to specific agent

**FR-L1.2: Update Lead**
- User can update lead information
- User can change lead status
- User can assign/reassign lead to agent
- User can add notes and follow-up reminders
- Lead history is maintained

**FR-L1.3: Qualify Lead**
- User can mark lead as qualified or not qualified
- Qualification criteria can be documented
- Qualified leads can be converted to applications

**FR-L1.4: Convert Lead to Application**
- Qualified lead can be converted to application
- Lead information pre-populates application
- Lead status updates to "Converted"
- Lead record links to application

**FR-L1.5: Track Lead Communication**
- All communications with lead are logged
- Communication history is visible in lead detail view
- Communication types are tracked (phone, email, in-person, etc.)

**FR-L1.6: Lead Follow-up Management**
- System generates follow-up reminders
- User can schedule follow-up dates
- User can set follow-up actions
- Follow-up reminders appear in dashboard

### 12.2 Application Processing

**FR-A1.1: Create Application**
- User can create application from lead or standalone
- Application form adapts based on applicant type (commercial/residential)
- Required fields are validated
- Documents can be uploaded

**FR-A1.2: Submit Application**
- Applicant can submit application (if applicant portal exists)
- Staff can create application on behalf of applicant
- Application status is set to "Pending"
- Application is assigned to reviewer

**FR-A1.3: Review Application**
- Reviewer can view complete application
- Reviewer can view uploaded documents
- Reviewer can initiate screening (if integrated)
- Reviewer can view screening results

**FR-A1.4: Screen Application**
- System can initiate automated screening (if integrated)
- Reviewer can perform manual screening
- Screening results are stored
- Screening criteria are configurable

**FR-A1.5: Approve/Reject Application**
- Reviewer can approve application
- Reviewer can reject application with reason
- Approval workflow is followed (single or multi-level)
- Applicant is notified of decision

**FR-A1.6: Track Application Status**
- Application status is updated throughout process
- Status changes are logged
- Status history is visible

### 12.3 Showing Management

**FR-S1.1: Schedule Showing**
- User can schedule showing for lead or applicant
- Showing can be scheduled for single or multiple units
- Showing type can be selected (in-person, virtual, self-guided)
- Showing is assigned to agent
- Calendar conflicts are detected

**FR-S1.2: Confirm Showing**
- System sends confirmation to lead/applicant
- Calendar invite is generated
- Reminder notifications are sent
- Confirmation status is tracked

**FR-S1.3: Complete Showing**
- Agent can mark showing as completed
- Agent can provide feedback
- Agent can indicate interest level
- Follow-up actions can be set

**FR-S1.4: Manage Showing Calendar**
- Calendar view shows all scheduled showings
- Showings can be filtered and sorted
- Showings can be rescheduled
- Showings can be cancelled

### 12.4 Lease Negotiation

**FR-N1.1: Create Lease Offer**
- Approved application can generate lease offer
- Lease terms can be customized
- Offer can be sent to applicant
- Offer expiration date can be set

**FR-N1.2: Negotiate Lease Terms**
- Applicant can accept, reject, or counter-offer
- Counter-offers are tracked
- Negotiation history is maintained
- Final terms are agreed upon

**FR-N1.3: Approve Lease Offer**
- Accepted offer requires approval (if configured)
- Approval workflow is followed
- Approval history is tracked

**FR-N1.4: Generate Lease Document**
- Lease document is generated from approved offer
- Lease template is used
- All terms are included
- PDF is generated for signature

### 12.5 Lease Management

**FR-LE1.1: Create Lease**
- User can create a new lease record
- Lease can be created from approved lease offer
- Lease can be created manually
- Required fields are validated
- Lease number is auto-generated or manually entered
- Lease document can be uploaded

**FR-LE1.2: View Active Leases**
- User can view all active leases
- Leases can be filtered by property, unit, tenant, status
- Leases can be sorted by date, rent, expiration
- Quick view shows key lease information
- Days until expiration is calculated and displayed

**FR-LE1.3: View Previous Leases**
- User can view all previous/expired leases
- Previous leases are archived automatically
- Historical lease data is preserved
- Leases can be filtered and searched

**FR-LE1.4: Update Lease**
- User can update lease information
- Lease status can be changed
- Lease amendments can be added
- Lease history is maintained

**FR-LE1.5: Manage Lease Documents**
- Lease documents can be uploaded
- Multiple document versions can be stored
- Documents can be downloaded
- Document access is controlled

**FR-LE1.6: Track Lease Expiration**
- System calculates days until expiration
- Expiration alerts are generated (30, 60, 90 days)
- Dashboard shows expiring leases
- Email notifications are sent for expiring leases

**FR-LE1.7: Manage Lease Renewals**
- User can create renewal from existing lease
- Renewal links to previous lease
- Renewal terms can be customized
- Renewal workflow is tracked

**FR-LE1.8: Terminate Lease**
- User can terminate lease early
- Termination reason is recorded
- Termination date is set
- Lease status updates to "Terminated"

**FR-LE1.9: Complete Lease (Move-out)**
- User can record move-out date
- Security deposit return status can be tracked
- Final inspection notes can be added
- Lease status updates appropriately

**FR-LE1.10: Lease Amendments**
- User can add amendments to leases
- Amendment documents can be uploaded
- Amendment effective dates are tracked
- Amendment history is maintained

**FR-LE1.11: Lease Reports**
- Active lease report can be generated
- Expiring lease report can be generated
- Lease history report can be generated
- Rent roll report can be generated
- Reports can be filtered and exported

### 12.6 Marketing & Listings

**FR-M1.1: Create Listing**
- User can create listing for available unit
- Listing information is entered
- Photos can be uploaded
- Listing status is managed

**FR-M1.2: Publish Listing**
- Listing can be published internally
- Listing can be published to external sites
- Listing URLs are tracked
- Listing views are tracked

**FR-M1.3: Manage Marketing Materials**
- Marketing materials can be uploaded
- Materials are organized by property/unit
- Materials can be shared with leads/applicants

---

## 13. Technical Requirements

### 13.1 Database
- Firestore collections: `leads`, `applications`, `showings`, `leaseOffers`, `leases`, `listings`, `communicationLogs`
- Proper indexing for queries (by status, date, property, agent, tenant, etc.)
- Data validation rules
- Organization-level data isolation

### 13.2 Integrations
- **Credit Screening APIs:** Experian, TransUnion, or similar
- **Background Check APIs:** Checkr, GoodHire, or similar
- **Email Service:** For notifications and confirmations
- **Calendar Integration:** Google Calendar, Outlook (for showing invites)
- **Document Storage:** Firebase Storage for application documents
- **E-Signature Service:** DocuSign, HelloSign (for lease signatures, future)

### 13.3 Security
- Sensitive data encryption (SSN, financial information)
- Document access controls
- Audit logging for sensitive operations
- Data retention policies
- GDPR/privacy compliance considerations

### 13.4 Performance
- Efficient queries with proper indexes
- Pagination for large lists
- Lazy loading for documents
- Optimistic UI updates
- Caching for frequently accessed data

---

## 14. User Stories

### 14.1 Lead Management

**US-L1:** As a leasing agent, I want to create a lead from a phone inquiry so that I can track the prospect and follow up appropriately.

**US-L2:** As a leasing agent, I want to see all my active leads in one place so that I can prioritize my follow-up activities.

**US-L3:** As a leasing agent, I want to convert a qualified lead to an application so that I can begin the application process without re-entering information.

**US-L4:** As a leasing manager, I want to see lead conversion rates by source so that I can optimize marketing spend.

**US-L5:** As a leasing agent, I want to receive follow-up reminders so that I don't miss important follow-up opportunities.

### 14.2 Application Processing

**US-A1:** As an applicant, I want to submit an application online so that I can apply for a unit conveniently.

**US-A2:** As a leasing agent, I want to review applications with all documents in one place so that I can efficiently process applications.

**US-A3:** As a leasing agent, I want automated credit and background checks so that I can quickly screen applicants.

**US-A4:** As a leasing manager, I want to approve or reject applications with notes so that decisions are documented.

**US-A5:** As a leasing agent, I want to see application status at a glance so that I can provide updates to applicants.

### 14.3 Showing Management

**US-S1:** As a leasing agent, I want to schedule a showing from a lead record so that I can coordinate the showing efficiently.

**US-S2:** As a leasing agent, I want to see my showing calendar so that I can manage my schedule and avoid conflicts.

**US-S3:** As a lead, I want to receive showing confirmation and reminders so that I don't miss my appointment.

**US-S4:** As a leasing agent, I want to record showing feedback so that I can track applicant interest and follow up appropriately.

**US-S5:** As a leasing manager, I want to see showing conversion rates so that I can identify effective showing strategies.

### 14.4 Lease Negotiation

**US-N1:** As a leasing agent, I want to create a lease offer from an approved application so that I can present terms to the applicant.

**US-N2:** As an applicant, I want to review and respond to lease offers so that I can negotiate terms.

**US-N3:** As a leasing manager, I want to approve lease offers so that non-standard terms are reviewed.

**US-N4:** As a leasing agent, I want to generate lease documents from approved offers so that I can execute leases efficiently.

### 14.5 Marketing

**US-M1:** As a leasing agent, I want to create property listings so that I can market available units.

**US-M2:** As a leasing manager, I want to see which listings generate the most leads so that I can optimize marketing efforts.

**US-M3:** As a lead, I want to view property listings online so that I can learn about available units.

---

## 15. Acceptance Criteria

### 15.1 Lead Management
- ✅ Leads can be created with all required information
- ✅ Lead status workflow functions correctly
- ✅ Leads can be converted to applications
- ✅ Communication history is tracked
- ✅ Follow-up reminders are generated

### 15.2 Application Processing
- ✅ Applications can be created and submitted
- ✅ Documents can be uploaded
- ✅ Screening can be initiated (automated or manual)
- ✅ Applications can be approved or rejected
- ✅ Application status is tracked throughout process

### 15.3 Showing Management
- ✅ Showings can be scheduled
- ✅ Calendar conflicts are detected
- ✅ Confirmations and reminders are sent
- ✅ Showing feedback can be recorded
- ✅ Showing calendar is functional

### 15.4 Lease Negotiation
- ✅ Lease offers can be created from approved applications
- ✅ Offers can be sent and negotiated
- ✅ Approval workflow functions correctly
- ✅ Lease documents can be generated

### 15.5 Marketing
- ✅ Listings can be created and published
- ✅ Marketing materials can be managed
- ✅ Listing performance is tracked

---

## 16. Out of Scope (Phase 2)

- Tenant portal for application submission (future phase)
- Advanced marketing automation
- CRM integration
- Social media marketing tools
- Lease document e-signature (may be added if time permits)
- Advanced analytics and BI
- Mobile app for leasing agents
- Automated listing syndication (manual links only)
- Payment processing for application fees (future phase)

---

## 17. Implementation Notes

### 17.1 Data Migration
- No existing data to migrate (new feature)
- Consider importing historical leads/applications if available

### 17.2 UI/UX Considerations
- Maintain consistency with existing design
- Responsive design for mobile access
- Intuitive workflows for common tasks
- Clear status indicators
- Helpful tooltips and guidance

### 17.3 Integration Considerations
- Start with manual processes, add automation later
- Credit/background check integration is optional but recommended
- Email notifications are essential
- Calendar integration enhances user experience

### 17.4 Testing Requirements
- Unit tests for data models
- Integration tests for workflows
- User acceptance testing with leasing team
- Performance testing for large datasets

---

## 18. Success Metrics

- 100% of leads are captured in system
- Application processing time reduced by 40%
- Showing scheduling automated and coordinated
- 90% of approved applications result in executed leases
- Leasing team adoption rate >90%
- Lead conversion rate tracked and improved
- Average time-to-lease tracked and optimized

---

## 19. Next Steps

1. **Technical Design:** Create detailed technical specifications
2. **Database Schema:** Finalize Firestore collections and indexes
3. **UI Mockups:** Create wireframes for Leasing Center interfaces
4. **Integration Planning:** Identify and plan third-party integrations
5. **Development:** Begin implementation
6. **Testing:** User acceptance testing with leasing team
7. **Training:** Train leasing team on new system
8. **Deployment:** Roll out Leasing Center features

---

**Note:** This PRD focuses on the core features needed for a comprehensive Leasing Center. Additional features can be added in future iterations based on user feedback and business priorities.
