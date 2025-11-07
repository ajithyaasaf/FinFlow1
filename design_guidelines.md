# FinFLow Design Guidelines

## Design Approach

**System-Based Approach**: Drawing from Material Design for data-intensive components and modern SaaS applications (Linear, Notion) for clean hierarchy and professional aesthetics. This enterprise fintech application prioritizes clarity, efficiency, and trustworthy presentation of financial data.

---

## Core Design Principles

1. **Information Clarity**: Complex financial data must be immediately scannable
2. **Role-Appropriate Density**: Dense dashboards for MD/Admin, simplified mobile views for field agents
3. **Professional Trust**: Conservative, stable design patterns for financial credibility
4. **Responsive Efficiency**: Desktop-first for dashboards, mobile-optimized for agent workflows

---

## Typography

**Font Family**: 
- Primary: Inter (via Google Fonts) - for UI elements, data, and body text
- Secondary: DM Sans (via Google Fonts) - for headings and emphasis

**Hierarchy**:
- Page Titles: text-3xl font-bold (DM Sans)
- Section Headers: text-xl font-semibold (DM Sans)
- Card Titles: text-lg font-medium (Inter)
- Body Text: text-base font-normal (Inter)
- Captions/Meta: text-sm font-normal (Inter)
- Data/Numbers: text-base font-semibold tabular-nums (Inter) - always use tabular numerals for alignment

**Special Treatment**:
- Currency amounts: Always bold, tabular-nums, with proper INR formatting (₹10,00,000)
- Status badges: text-xs font-medium uppercase tracking-wide

---

## Layout System

**Spacing Units**: Use Tailwind units of **2, 4, 6, 8, 12, 16** exclusively
- Component padding: p-4 to p-6
- Card spacing: p-6
- Section gaps: gap-6 to gap-8
- Page margins: p-8 on desktop, p-4 on mobile

**Grid Systems**:
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Data tables: Full-width with horizontal scroll on mobile
- Form layouts: grid-cols-1 md:grid-cols-2 gap-6
- Agent mobile views: Single column, full-width cards

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Forms: max-w-4xl
- Modals: max-w-2xl

---

## Component Library

### Navigation

**Desktop Sidebar** (Admin/MD):
- Fixed left sidebar, w-64
- Logo at top (h-16)
- Navigation items with icons (Heroicons) + labels
- Active state: subtle background, bold text
- Collapsible sections for module groups
- Role indicator badge at bottom

**Mobile Navigation** (Agents):
- Bottom tab bar with 4-5 primary actions
- Icons only with labels
- Floating action button for quick client onboarding

**Top Bar**:
- User profile dropdown (right)
- Notification bell with badge count
- Breadcrumbs for navigation context (desktop only)

### Dashboard Cards

**Metric Cards**:
- Uniform height cards (h-32)
- Large number display (text-3xl font-bold tabular-nums)
- Label below (text-sm)
- Small trend indicator (↑ 12% badge)
- Optional icon in top-right corner

**High-Value Quotation Alert Card**:
- Prominent warning indicator (⚠️ icon)
- Client name, agent, amount in structured layout
- "View Details" link/button
- Timestamp in corner

### Data Tables

**Structure**:
- Sticky header row
- Alternating row background for readability
- Right-aligned numeric columns (amounts, percentages)
- Status badges in dedicated column
- Action dropdown (⋮) in last column
- Pagination at bottom (10/25/50 rows)

**Filters**:
- Horizontal filter bar above table
- Search input, date range picker, status dropdowns
- "Clear all" option
- Active filter count badge

### Forms

**Input Fields**:
- Consistent height (h-12)
- Clear labels above input
- Placeholder text for guidance
- Helper text below for format requirements
- Error states with red text and border
- Required field indicator (*)

**Document Upload**:
- Drag-and-drop zone with dashed border
- File type icons (PDF, JPG, PNG)
- Upload progress indicator
- Thumbnail preview for images
- Delete/replace options

**Quotation Generator**:
- Step-by-step wizard layout (1. Client → 2. Loan Details → 3. Review → 4. Generate)
- Progress indicator at top
- Auto-calculation fields
- High-value warning banner when thresholds exceeded
- "Download PDF" prominent button at final step

### Attendance Module

**Agent Check-in Card**:
- Large selfie preview area (square, centered)
- Camera capture button (no gallery option)
- GPS coordinates displayed
- Address auto-filled from coordinates
- Work description textarea
- Timestamp auto-captured
- Submit button at bottom

**Admin Attendance View**:
- Grid of attendance cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Each card shows: agent photo thumbnail, name, time, location snippet
- Edit/delete icons in corner (with confirmation modal)

### Loan Tracking

**6-Stage Progress Bar**:
- Horizontal stepper on desktop, vertical on mobile
- Completed stages: filled circles with checkmarks
- Current stage: pulsing indicator
- Future stages: outlined circles
- Each stage expandable to show date, remarks, documents

### Modals & Overlays

**Modal Structure**:
- Centered overlay with backdrop blur
- Header with title + close (X) button
- Content area with scrollable body
- Footer with action buttons (Cancel left, Primary right)
- Mobile: Full-screen on small devices

**Notifications/Toasts**:
- Top-right corner positioning
- Auto-dismiss after 5 seconds
- Success/warning/error states
- Icon + message + close button

---

## Agent Mobile Interface

**Key Principles**:
- Single-column layout throughout
- Large tap targets (min h-12)
- Bottom-anchored primary actions
- Minimal text input (use dropdowns/selectors)
- Camera integration prominent
- Offline-first considerations (show sync status)

**Client Onboarding Flow**:
- Full-screen wizard with progress bar
- One section per screen (Personal → Employment → Loan Preference → Documents)
- "Save Draft" option at each step
- Final review screen before submission

---

## MD Executive Dashboard

**Layout**:
- Hero metrics row: 4 large KPI cards across top
- Conversion funnel visualization (horizontal flow diagram)
- Agent leaderboard table (top 10)
- High-value quotations alert section
- Recent activity feed in sidebar

**Data Visualization**:
- Simple bar charts for trends (Chart.js or Recharts)
- Donut charts for conversion percentages
- Line graphs for disbursement trends
- Minimal decoration, focus on data clarity

---

## Animations

Use sparingly:
- Smooth page transitions (200ms ease)
- Loading spinners for async operations
- Toast slide-in/fade-out
- Modal fade + scale entrance

**No animations for**:
- Data table updates
- Form interactions
- Navigation changes

---

## Icons

**Library**: Heroicons (via CDN) exclusively

**Usage**:
- Navigation items: 20px icons
- Metric cards: 24px decorative icons
- Table actions: 16px icons
- Buttons: 16px icons inline with text
- File type indicators: 32px icons

---

## Images

**Profile Photos**:
- Circular avatars throughout (40px standard, 64px for profiles)
- Fallback to initials on solid background
- Agent attendance selfies: Square format, 200x200px minimum

**Document Previews**:
- PDF: Show first page thumbnail
- Images: Maintain aspect ratio in preview
- Standard placeholder for unsupported types

**No Hero Images**: This is an enterprise application, not a marketing site. Focus on functional UI.

---

## Responsive Breakpoints

- Mobile: < 768px (single column, bottom nav, full-width components)
- Tablet: 768px - 1024px (2-column grids, condensed sidebar)
- Desktop: > 1024px (full sidebar, 4-column metric grids, expanded tables)

---

## Special Considerations

**Indian Number Formatting**:
- Always display as ₹10,00,000 (Lakhs) or ₹1,00,00,000 (Crores)
- Use tabular-nums for alignment in tables
- Include thousand separators in Indian format

**Role-Based UI**:
- Admin: Full dashboard with editing capabilities
- Agent: Simplified mobile-first interface
- MD: Read-only executive views with advanced filtering

**Accessibility**:
- WCAG AA contrast ratios
- Keyboard navigation for all actions
- Screen reader labels for icons
- Focus indicators on interactive elements