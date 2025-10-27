# Design Guidelines: Infrared Thermography Renewal Tracking System

## Design Approach

**Selected Approach:** Design System-Inspired (Linear + Enterprise Productivity Tools)

Drawing inspiration from modern productivity tools like Linear, Notion, and traditional enterprise dashboards, this system prioritizes clarity, efficiency, and data density while maintaining a contemporary aesthetic. The design balances professional credibility with modern usability patterns.

**Core Principles:**
- Information clarity over visual flourish
- Efficient data scanning and quick decision-making
- Consistent, predictable interface patterns
- Professional credibility for business context
- Mobile-responsive for field salesperson access

---

## Typography

**Font Family:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for dates, intervals, technical data)

**Type Scale:**
- Page Headers: text-3xl, font-semibold (salespeople dashboard, admin panel)
- Section Headers: text-xl, font-semibold (renewal calendar, customer list)
- Card/Table Headers: text-base, font-medium
- Body Text: text-sm, font-normal
- Labels/Metadata: text-xs, font-medium, uppercase tracking-wide
- Data/Numbers: text-base, font-mono (dates, intervals)

**Hierarchy Application:**
- Dashboard titles use largest scale with generous bottom margin
- Data table headers use medium weight for scannability
- Form labels use uppercase small text for clear field identification
- Status indicators use bold text at small size

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (component internals): 2, 4
- Component spacing: 6, 8
- Section spacing: 12, 16
- Page margins: 8, 12

**Grid System:**
- Main layout: Sidebar (w-64) + Content area (flex-1)
- Sidebar remains fixed, content scrolls
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Data tables: Full-width with internal column distribution
- Forms: Single column max-w-2xl for focus, two-column grid for compact data entry

**Container Strategy:**
- Sidebar: Fixed width 256px (w-64), full height
- Content wrapper: p-8 for desktop, p-4 for mobile
- Cards/Panels: p-6 internal padding
- Modals: max-w-2xl for forms, max-w-4xl for detailed views

---

## Component Library

### Navigation & Structure

**Sidebar Navigation:**
- Fixed left sidebar with logo at top (h-16 header)
- Navigation items with icon (Heroicons) + label
- Active state: subtle indicator bar on left edge
- Grouped sections: Dashboard, Renewals, Customers, Notifications, Admin (role-based)
- User profile section at bottom with role badge

**Top Bar:**
- Sticky header with breadcrumb navigation
- Global search input (w-96)
- Notification bell icon with badge count
- User avatar dropdown with logout

### Data Display

**Calendar View:**
- Month/week toggle view
- Grid layout with renewal cards in date cells
- Card shows: Customer name, renewal type, salesperson assignment
- Hover reveals quick actions (view details, mark contacted)
- Color-coded by urgency proximity (no specific colors, but visual differentiation)
- Filter controls above calendar: date range picker, salesperson filter, status filter

**Data Tables:**
- Sticky header row with sortable columns
- Row height: py-3 for comfortable scanning
- Columns: Customer name, renewal date, interval type, status, assigned salesperson, actions
- Alternating row treatment for readability
- Inline action buttons (edit, view details, upload attachment)
- Pagination controls at bottom (showing 20 items per page)
- Empty state illustration with call-to-action

**Dashboard Cards:**
- Metric cards (h-32): Large number, label, trend indicator
- Quick stats: Total renewals, upcoming this month, overdue, conversion rate
- Urgent renewals list: Scrollable list of next 5 critical items
- Recent activity feed: Timeline of recent customer interactions

### Forms & Input

**Customer/Renewal Forms:**
- Clear field labels positioned above inputs
- Input fields: h-10, rounded-md, border treatment
- Grouped related fields with subtle section dividers
- Required field indicators (asterisk)
- Inline validation messages below inputs
- Date picker component for renewal dates
- Dropdown for interval selection (Annual, Bi-Annual, Custom)
- Multi-select for notification preferences (2 months, 1 month, 1 week)
- Textarea for notes (min-h-32)

**File Upload Zone:**
- Drag-and-drop area with dashed border
- Icon (upload cloud) + descriptive text
- Uploaded files list below with filename, size, remove action
- Supports multiple attachments per renewal

**Search & Filters:**
- Search input with magnifying glass icon prefix
- Filter dropdowns grouped logically
- Applied filters shown as removable chips below controls
- Clear all filters button

### Interactive Elements

**Buttons:**
- Primary action: px-4 py-2, rounded-md, font-medium
- Secondary action: border style, same padding
- Destructive action: visual differentiation (no color specified)
- Icon-only buttons: p-2, rounded-md (table actions)
- Button groups for related actions

**Status Badges:**
- Rounded-full, px-3 py-1, text-xs, font-medium
- States: Pending, Contacted, Completed, Renewed, Overdue
- Visual differentiation through distinct treatments

**Notification Cards:**
- Compact card design (p-4)
- Left accent border indicating priority
- Icon + renewal summary + customer name
- Time until due date (e.g., "Due in 14 days")
- Quick action buttons (Mark Contacted, View Details)

### Admin Components

**User Management Table:**
- Columns: Name, email, role, status (active/disabled), last login, actions
- Inline status toggle for enable/disable
- Action dropdown for edit/delete
- Invite user button (prominent placement)

**User Form Modal:**
- Fields: Name, email, role dropdown, initial password (for new users)
- Password requirements shown below field
- Role explanation helper text

### Overlays & Modals

**Modal Structure:**
- Centered overlay with backdrop
- Header with title + close button
- Content area with scroll if needed (max-h-96)
- Footer with action buttons (aligned right)

**Confirmation Dialogs:**
- Compact modal (max-w-md)
- Warning icon for destructive actions
- Clear action descriptions
- Primary + cancel buttons

**Toast Notifications:**
- Fixed position top-right
- Auto-dismiss after 5 seconds
- Icon + message + close button
- Slide-in animation on appear

### Specialized Components

**Renewal Detail Panel:**
- Sliding side panel from right (w-96 to w-1/2 depending on content)
- Sections: Customer info, renewal details, attachment list, notification history, activity log
- Sticky action bar at bottom (Update Status, Edit, Delete)

**Notification Preferences:**
- Checkbox list for default preferences (salesperson settings)
- Per-renewal override in renewal form
- Visual timeline showing when notifications will trigger

---

## Responsive Behavior

**Desktop (lg+):**
- Full sidebar visible
- Multi-column layouts for cards and tables
- Expansive calendar view

**Tablet (md):**
- Collapsible sidebar (hamburger menu)
- Two-column card grids
- Table scroll horizontal if needed

**Mobile (base):**
- Hidden sidebar, accessible via menu
- Single-column layouts
- Simplified table views (stacked card format)
- Bottom navigation bar for key actions

---

## Animations

Use sparingly and only for functional feedback:
- Modal fade-in (duration-200)
- Dropdown slide-down (duration-150)
- Toast notification slide-in (duration-300)
- Loading spinners for async operations
- No decorative animations

---

## Images

**No hero images required** - this is a productivity tool, not a marketing site. Focus remains on data and functionality throughout.