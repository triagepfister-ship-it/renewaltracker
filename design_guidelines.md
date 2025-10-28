# ABB Infrared Thermography Renewal Tracking System - Design Guidelines

## Design Approach
Industrial Enterprise Design System combining ABB brand precision with Linear-style productivity patterns. Swiss engineering aesthetic with data-dense interfaces for technical professionals.

**Core Principles:** Grid-based precision, industrial credibility, data supremacy, strategic brand expression, enterprise reliability.

---

## Color System

### Palette
- **ABB Red:** `#FF000F` - Primary accent, critical actions, urgent status
- **Pure White:** `#FFFFFF` - Primary background, cards, modals
- **Near Black:** `#1A1A1A` - Primary text, headings
- **Grays:** `#F5F5F5` (subtle BG), `#E0E0E0` (borders), `#666666` (secondary text), `#CCCCCC` (disabled)

### Application Rules
- **Sidebar:** White with 3px red vertical bar for active state
- **Primary buttons:** Red background, white text
- **Urgent/Overdue:** Red badges
- **Table headers:** `#F5F5F5` background
- **Borders:** `#E0E0E0` universally
- **Success states:** Dark gray (no green - industrial aesthetic)
- **Hover links:** Red
- **Disabled:** Light gray borders/text

---

## Typography

### Fonts
- **Primary:** Inter (body, UI)
- **Technical:** JetBrains Mono (dates, codes, metrics)
- **Source:** Google Fonts CDN

### Scale
```
Page Headers: text-3xl, font-semibold, tracking-tight
Section Headers: text-xl, font-semibold  
Card/Table Headers: text-sm, font-semibold, uppercase, tracking-wider
Body: text-sm, font-normal
Labels/Meta: text-xs, font-medium, uppercase, tracking-wide
Technical Data: text-sm, font-mono
Large Metrics: text-4xl, font-bold, font-mono (numbers)
```

**Rules:** Near-black headers, uppercase for engineering precision, monospace for all numerical data.

---

## Layout System

### Spacing
Tailwind units: 2, 4, 6, 8, 12, 16, 24
- Micro (buttons): 2, 4
- Component internals: 4, 6
- Component separation: 8, 12
- Sections: 16, 24
- Page margins: 8 (mobile), 12 (desktop)

### Grid Architecture
- **Sidebar:** Fixed `w-64`, white, 1px right border `#E0E0E0`
- **Content:** `flex-1`, `#F5F5F5` background
- **Dashboard:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- **Forms:** `max-w-3xl`, white cards, `p-8`
- **All cards:** White, 1px gray border, subtle shadow

---

## Components

### Navigation

**Sidebar:**
- ABB logo: `h-16`, `p-6`
- Nav items: Heroicons outline (20px) + label, `py-3 px-4`
- Active: 3px red left bar, red icon/text
- Hover: `#F5F5F5` background
- Bottom: User profile + role badge

**Top Bar:**
- White, sticky, bottom border
- Breadcrumbs (left), search `w-96` red focus border (center), notifications + avatar (right)

### Data Display

**Metric Cards:**
```
White, 1px border, h-40
Number: text-4xl, font-mono, font-bold (red for critical)
Label: text-xs, uppercase, tracking-wide, gray
Trend: text-sm, percentage
Hover: Shadow elevation
```

**Tables:**
- Header: `#F5F5F5` bg, text-xs uppercase
- Rows: `py-4`, alternating white/`#FAFAFA`
- Sticky header on scroll
- Status badges: Red (overdue), gray (pending/completed)
- Actions: Icon-only, gray with red hover
- Pagination: Bottom-right

**Calendar View:**
- White grid cells, gray borders
- Renewal cards: 3px red left bar
- Content: Customer (bold), type (gray, text-xs uppercase)
- Filters: Date picker, dropdowns, status chips

### Forms & Input

**Structure:**
- Labels: text-xs uppercase tracking-wide gray, above inputs
- Inputs: `h-11`, `rounded-md`, gray border, `focus:red`
- Required: Red asterisk
- Field groups: `mb-6`
- Validation: Red border + error text below

**Components:**
- Date picker: Calendar icon, monospace display
- Multi-select: Gray chips, red close icon
- Textarea: `min-h-32`
- Checkboxes/Radio: Red when checked
- File upload: Dashed border zone, "Drop files or click"

### Buttons

```css
Primary: Red bg, white text, px-6 py-2.5, rounded-md, font-medium
Secondary: White bg, gray border, dark text
Tertiary: Ghost, red text, no border
Icon: p-2, rounded-md, gray → red hover
Loading: Spinner, disabled cursor
```

### Status Badges

```
rounded-full, px-3 py-1, text-xs, font-semibold, uppercase
Overdue: Red bg, white text
Pending: Light gray bg, dark text  
Contacted/Completed: Gray bg, white text
Renewed: Dark gray + checkmark
```

### Notifications

**Cards:**
- White, 4px red left bar
- Layout: Icon (red) | Content | Actions
- Content: Customer (bold), summary, time due
- Actions: "Mark Contacted" (secondary), "View" (tertiary)

**Toasts:**
- Fixed top-right
- White, left accent bar (red=error, gray=success)
- Icon + message + close
- Auto-dismiss: 5s, slide-in from right

### Modals

**Structure:**
```
Backdrop: Semi-transparent dark
Modal: White, rounded-lg, shadow-2xl, max-w-2xl
Top: 1px red bar (h-1)
Header: text-xl semibold + close icon
Content: p-8, scrollable max-h-[80vh]
Footer: p-6, border-top, right-aligned buttons
```

**Confirmation Dialogs:**
- `max-w-md`, red warning icon
- Destructive (red) + Cancel buttons

### Specialized Components

**Renewal Detail Panel:**
- Slide-in right, `w-1/2`, white
- 3px red left bar
- Sections: Customer, Details, Attachments, History
- Sticky bottom: Actions bar with shadow

**Admin User Management:**
- Table format (Name, Email, Role, Status, Last Login, Actions)
- Status toggle: Red when active
- Action dropdown: Edit/disable/delete
- User form modal: Password requirements with red checkmarks

**Empty States:**
- Minimal gray line-art (industrial/thermography equipment)
- Center placement with descriptive text

**Avatars:**
- Circular: 32px (nav), 40px (profile)
- Fallback: Initials on gray

---

## Responsive Breakpoints

- **Desktop (lg+):** Full sidebar, 4-column grids, expansive calendar
- **Tablet (md):** Collapsible sidebar, 2-column grids, horizontal scroll tables
- **Mobile:** Hamburger menu, single-column, stacked cards, bottom nav

---

## Animations

Minimal only:
- Modal/dropdown: `duration-200` fade
- Sidebar: `duration-300` slide
- Toast: `duration-200` slide-in
- Loading: Continuous rotation
- **No decorative/scroll animations**

---

## Accessibility

- High contrast: Near-black text on white
- Focus states: Red border on all interactive elements
- Icon buttons: Proper ARIA labels
- Keyboard navigation: Full support
- Form validation: Visible error messages
- Status communication: Text + color (not color alone)

---

## Image Guidelines

- **ABB logo:** Sidebar header, login, footer
- **Avatars:** Circular with initials fallback
- **Empty states:** Functional gray illustrations only
- **Thermal images:** Grid thumbnails, lightbox expansion
- **No hero images** - Functional only