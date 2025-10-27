# Infrared Thermography Renewal Tracking System

## Overview

This is a professional renewal tracking system designed for managing infrared thermography service renewals. The application helps businesses track customer service intervals, automate renewal notifications, and manage the complete lifecycle of thermography service contracts. It features role-based access for administrators and salespeople, with capabilities for customer management, renewal tracking, calendar views, and document attachment handling.

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
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Typography: Inter for UI text, JetBrains Mono for dates and technical data
- Design philosophy inspired by Linear and modern enterprise productivity tools, prioritizing clarity and data density over visual flourish

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