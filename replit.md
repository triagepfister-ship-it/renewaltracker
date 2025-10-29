# Infrared Thermography Renewal Tracking System

## Overview

This is a professional renewal tracking system designed for managing infrared thermography service renewals. The application helps businesses track customer service intervals, automate renewal notifications, and manage the complete lifecycle of thermography service contracts. It features role-based access for administrators and salespeople, with capabilities for customer management, renewal tracking, calendar views, document attachment handling, and bulk Excel import for renewals.

## Recent Changes (October 29, 2025)

### Renewal Status System
- Current renewal statuses: "Pending", "Contacted", "Completed", "Dead"
- Dashboard filters exclude "Dead" status from upcoming and overdue renewals sections
- Added MessageCircle icon indicator for "Contacted" status in upcoming renewals
- Calendar view color scheme: Yellow=Pending, Blue=Contacted, Green=Completed, Red=Dead
- Updated all status dropdowns and filters across the application
- Default status for new renewals: "Contacted"

### Site Location Field Migration
- Moved Site Location (address) field from customers table to renewals table
- REMOVED address field from Customer form (no longer stored at customer level)
- ADDED Site Location field to Renewal form (now stored per renewal/site)
- Updated dashboard to display renewal.address in upcoming and overdue sections
- Updated calendar to display renewal.address on renewal cards
- Updated renewals page table to display renewal.address below company name
- Updated customers page nested renewals to display site location field
- Enabled search by site location on renewals page
- Location consistently displayed in small, muted text below company name across all views
- Production database migration needed: See SQL commands in scratchpad

### Branding Updates
- Rebranded application as "ELSE Renewals Tracker - Advisory Services"
- Changed app icon from generic document to ScanLine icon (infrared camera representation)
- Updated browser window title to reflect ELSE branding

## Previous Changes (October 28, 2025)

### ABB Industrial Design System
- Redesigned application with ABB LTD branding and industrial aesthetic
- Implemented ABB's distinctive red (#FF000F) and white color scheme
- Updated design guidelines to reflect Swiss precision and industrial engineering focus
- Clean, professional interface prioritizing data clarity and enterprise credibility
- Maintained dark mode support with industrial gray palette and red accents
- Design philosophy: Grid-based precision, industrial credibility, data supremacy

### Extended Renewal Tracking Fields and Intervals
- Added Site Code field to renewals (stored as 5-digit number, displayed with "S-" prefix format)
- Added Reference ID field to renewals for tracking internal reference numbers
- Added Salesforce Opportunity URL fields to both customers and renewals for CRM integration
- Extended renewal intervals to support 2-year, 3-year, and 5-year options in addition to annual, bi-annual, and custom
- Salesforce URLs displayed as embedded clickable links in forms and detail views

### Salesperson Filtering
- Added salesperson filter dropdown on Renewals page to filter by assigned salesperson
- Added salesperson filter dropdown on Customers page to filter by assigned salesperson
- Filters dynamically load active salespeople and support "All Salespeople" option
- Empty states updated to reflect active filters

### Bulk Salesperson Reassignment
- Added bulk reassignment functionality on Settings page
- Allows administrators to reassign all customers and renewals from one salesperson to another
- Backend validation ensures both users are active salespeople (not admins or disabled accounts)
- API endpoint at POST `/api/users/bulk-reassign` with fromSalespersonId and toSalespersonId
- Confirmation dialog shows salesperson names and provides clear feedback
- Success toast displays count of customers and renewals updated
- Storage layer updates both tables atomically and returns counts

### Bulk Upload Feature (Previous)
- Added Excel-based bulk import functionality for renewals
- Template download endpoint at GET `/api/renewals/bulk-upload/template`
- Bulk upload processing endpoint at POST `/api/renewals/bulk-upload`
- Frontend UI with dialog for template download, file selection, and upload results display
- Automatic customer creation for new companies found in Excel uploads
- Detailed error reporting for failed rows with row numbers and specific error messages
- Increased JSON body limit to 10MB to support larger Excel files
- Customer cache optimization to prevent duplicate creation during same upload session
- Library: xlsx package for Excel file parsing (.xls and .xlsx formats)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod for form validation

**UI Design System**
- ABB industrial design aesthetic with red (#FF000F) and white color scheme
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with ABB-branded design tokens
- Typography: Inter for UI text, JetBrains Mono for dates and technical data
- Design philosophy: Swiss precision, industrial credibility, grid-based layouts
- Clean, functional interface reflecting ABB's engineering heritage and modern technological leadership

**Component Architecture**
- Atomic design pattern with reusable UI components in `client/src/components/ui/`
- Feature-specific components (forms, panels) in `client/src/components/`
- Page-level components in `client/src/pages/`
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

### Backend Architecture

**Runtime & Framework**
- Node.js with Express.js REST API
- TypeScript throughout with ESM module system
- Development server uses tsx for hot reloading

**Authentication & Authorization**
- JWT-based authentication with bcrypt password hashing
- Role-based access control (admin vs salesperson)
- Session tokens stored in localStorage on client
- Protected routes using middleware (`authenticateToken`, `requireAdmin`)

**Data Layer**
- Drizzle ORM for type-safe database queries
- Schema-first approach with shared type definitions between client and server
- Database operations abstracted into a storage interface pattern

**API Design**
- RESTful endpoints under `/api/` prefix
- JSON request/response format
- Centralized error handling
- Request logging middleware for debugging

### Data Storage

**Database**
- PostgreSQL via Neon serverless driver
- WebSocket-based connection pooling for serverless compatibility
- Database schema defined in `shared/schema.ts` with Drizzle

**Core Data Models**
- **Users**: Admin and salesperson roles with status management (active/disabled)
- **Customers**: Company information with assigned salesperson relationships
- **Renewals**: Service records tracking last service date, next due date, interval types (annual, bi-annual, custom), and status workflow
- **Attachments**: File metadata linking to object storage
- **Notifications**: Automated notification records with timing types (2 months, 1 month, 1 week before renewal)
- **Notification Preferences**: User-specific settings for notification channels

**Relationships**
- Customers assigned to salespeople
- Renewals linked to customers and salespeople
- Attachments linked to renewals
- Notifications linked to renewals and salespeople

### Authentication & Authorization Mechanisms

**Authentication Flow**
1. User submits email/password to `/api/auth/login`
2. Server validates credentials against hashed passwords
3. JWT token generated with user ID, email, and role
4. Token returned to client and stored in localStorage
5. Subsequent requests include token in Authorization header

**Authorization Levels**
- **Public**: Login endpoint only
- **Authenticated**: All users can access dashboard, calendar, customers, renewals, notifications
- **Admin-only**: User management endpoints restricted via `requireAdmin` middleware

**Security Measures**
- Password hashing with bcrypt (10 rounds)
- JWT expiration set to 7 days
- Account status checks (active/disabled)
- Environment-based secret key configuration

**Test Users**
The following test users are created automatically via the seed script:
- **Admin**: admin@example.com / admin123 (Admin role)
- **Salesperson**: sales@example.com / sales123 (Salesperson role)
- **Stephen**: stephen@viewpoint.com / viewpoint (Admin role, hardcoded user)

## External Dependencies

### Cloud Services

**Google Cloud Storage**
- Object storage for file attachments (inspection reports, certificates, documents)
- Replit-specific authentication flow using sidecar endpoint
- ACL policy system for access control (planned public/private visibility)
- Integration via `@google-cloud/storage` SDK

**Neon Database**
- Serverless PostgreSQL hosting
- WebSocket-based connections for serverless compatibility
- Connection pooling through `@neondatabase/serverless`

### Third-Party Libraries

**UI Components & Styling**
- Radix UI component primitives for accessibility
- Tailwind CSS for utility-first styling
- Lucide React for iconography
- Uppy for file upload UI with AWS S3 multipart support

**Data Management**
- TanStack Query for async state management
- Drizzle ORM for database operations
- date-fns for date manipulation and formatting

**Authentication & Validation**
- jsonwebtoken for JWT handling
- bcrypt for password hashing
- Zod for runtime type validation
- @hookform/resolvers for form validation integration

**Development Tools**
- Vite for fast development builds
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development experience

### API Integrations

The application uses internal REST APIs only, with no direct third-party API integrations beyond the cloud infrastructure services (Google Cloud Storage, Neon Database).