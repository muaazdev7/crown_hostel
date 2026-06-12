# HOSTEL MANAGEMENT SYSTEM — TECHNICAL REPORT

> **Project Name:** Crown Hostel Management System
> **Stack:** MERN (MongoDB, Express.js, React.js, Node.js)
> **Frontend Port:** 3000 (Vite dev server) | **Backend Port:** 5000
> **Database:** MongoDB Atlas (Cloud)
> **Date Generated:** April 2026

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Analysis](#4-frontend-analysis)
5. [Backend Analysis](#5-backend-analysis)
6. [Database Design](#6-database-design)
7. [API Documentation](#7-api-documentation)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Key Functionalities](#9-key-functionalities)
10. [Code Explanation (File-by-File)](#10-code-explanation-file-by-file)
11. [UI/UX Design](#11-uiux-design)
12. [Deployment](#12-deployment)
13. [Strengths](#13-strengths)
14. [Limitations](#14-limitations)
15. [Future Improvements](#15-future-improvements)

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose

The Crown Hostel Management System is a comprehensive web-based application designed to digitize and automate all operational aspects of a student hostel. It replaces manual, paper-based hostel administration with a centralized online platform accessible to administrators, staff, and students.

### 1.2 Problem It Solves

Traditional hostel management faces several pain points:

- **Room allocation** is done manually on registers, causing data inconsistency and double-booking
- **Fee collection** has no real-time tracking; students lose receipts and admins lose records
- **Complaints** go unresolved because there is no system to track status or assign staff
- **Attendance and leave** are tracked on paper which is unreliable and difficult to audit
- **Inventory** (furniture, electronics, bedding) is not tracked per-room, leading to loss
- **Communication** between admin and students relies on physical notice boards

This system solves all of the above with a role-based digital platform.

### 1.3 Key Features

| Module | Features |
|--------|----------|
| **Admin Panel** | Dashboard analytics, student/staff CRUD, room/block management, fee structures & invoices, complaint management, inventory tracking, announcements, application review, revenue reports |
| **Staff Portal** | Attendance marking, complaint handling, inventory management, visitor logging, maintenance requests |
| **Student Portal** | Room application, room details view, fee payment history, complaint filing, leave requests, profile management, announcements |
| **Authentication** | JWT-based login, role-based registration, password reset via email, session persistence |
| **Landing Page** | Marketing website with hero, about, facilities, testimonials, CTA, and footer sections |

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend Technologies

| Technology | Version | Role |
|-----------|---------|------|
| **React** | 18.2.0 | Core UI library for building component-based single-page application |
| **Vite** | 7.3.1 | Build tool and development server; provides instant HMR (Hot Module Replacement) and fast production builds |
| **React Router DOM** | 6.30.3 | Client-side routing with nested routes, protected routes, and role-based navigation |
| **Tailwind CSS** | 3.4.19 | Utility-first CSS framework for rapid, consistent styling without writing custom CSS files |
| **Axios** | 1.13.6 | HTTP client for making API requests to the backend; supports interceptors for JWT injection |
| **Chart.js + react-chartjs-2** | 4.4.1 / 5.2.0 | Data visualization library for dashboard charts (bar, line, doughnut) |
| **Lucide React** | 1.7.0 | Modern SVG icon library used across all dashboard pages |
| **React Icons** | 4.12.0 | Additional icon library (Font Awesome icons) used in the landing page |
| **React Hot Toast** | 2.4.1 | Lightweight toast notification system for success/error messages |
| **Formik** | 2.4.9 | Form state management library (available but pages primarily use useState) |
| **Yup** | 1.7.1 | Schema-based validation library (available for form validation) |

### 2.2 Backend Technologies

| Technology | Version | Role |
|-----------|---------|------|
| **Node.js** | — | JavaScript runtime for executing server-side code |
| **Express.js** | 4.18.2 | Minimal web framework that handles routing, middleware, and HTTP request/response |
| **Mongoose** | 8.0.3 | MongoDB Object Data Modeling (ODM) library; defines schemas, validates data, manages relationships |
| **JSON Web Token (jsonwebtoken)** | 9.0.2 | Generates and verifies JWT tokens for stateless authentication |
| **bcryptjs** | 2.4.3 | Hashes passwords with salt rounds before storing in database |
| **Multer** | 1.4.5-lts.1 | Middleware for handling multipart/form-data (file uploads) |
| **express-validator** | 7.3.2 | Validation middleware for sanitizing and validating request data |
| **Nodemailer** | 8.0.4 | Email service for sending password reset emails (SMTP or Ethereal for dev) |
| **Cloudinary** | 1.41.0 | Cloud-based image storage service (configured but optional) |
| **dotenv** | 16.3.1 | Loads environment variables from .env file into process.env |
| **cors** | 2.8.5 | Enables Cross-Origin Resource Sharing for frontend-backend communication |
| **crypto-js** | 4.2.0 | Encryption utilities for generating secure tokens |
| **Nodemon** | 3.0.2 (dev) | Auto-restarts server on file changes during development |

### 2.3 Database

| Technology | Role |
|-----------|------|
| **MongoDB Atlas** | Cloud-hosted NoSQL database; stores all application data in flexible JSON-like documents |

### 2.4 Development Tools

| Tool | Role |
|------|------|
| **Vite** | Dev server with proxy to backend, instant HMR, optimized production builds |
| **PostCSS + Autoprefixer** | CSS processing pipeline for Tailwind compilation and vendor prefixing |
| **Git** | Version control |

---

## 3. PROJECT STRUCTURE

```
hostel-management/
│
├── backend/
│   ├── config/
│   │   └── db.js                          # MongoDB connection setup
│   │
│   ├── controllers/                       # Business logic for each module
│   │   ├── admin.controller.js            # Dashboard stats, announcements, applications
│   │   ├── application.controller.js      # Public hostel application submission
│   │   ├── attendance.controller.js       # Attendance marking and retrieval
│   │   ├── auth.controller.js             # Login, register, password reset
│   │   ├── complaint.controller.js        # Complaint CRUD and status updates
│   │   ├── fee.controller.js              # Fee structures, invoices, payments, reports
│   │   ├── inventory.controller.js        # Inventory CRUD, stock management
│   │   ├── leave.controller.js            # Leave application and approval
│   │   ├── room.controller.js             # Room/block CRUD, room allocation
│   │   ├── staff.controller.js            # Staff profile CRUD
│   │   └── student.controller.js          # Student profile CRUD, room unassignment
│   │
│   ├── middleware/                         # Express middleware functions
│   │   ├── auth.middleware.js             # JWT token verification (protect)
│   │   ├── role.middleware.js             # Role-based access control (authorize)
│   │   ├── upload.middleware.js           # General file upload (multer, 5MB)
│   │   ├── uploadBlock.middleware.js      # Block image upload (2MB)
│   │   ├── uploadRoom.middleware.js       # Room image upload (2MB)
│   │   ├── uploadInventory.middleware.js  # Inventory image upload (5MB)
│   │   ├── validate.middleware.js         # Express-validator error handler
│   │   └── validators/
│   │       └── application.validator.js   # Application form validation rules
│   │
│   ├── models/                            # Mongoose schemas (21 models)
│   │   ├── Admin.model.js
│   │   ├── Announcement.model.js
│   │   ├── Application.model.js
│   │   ├── Attendance.model.js
│   │   ├── Block.model.js
│   │   ├── Complaint.model.js
│   │   ├── FeeStructure.model.js
│   │   ├── Inventory.model.js
│   │   ├── InventoryAssignment.model.js
│   │   ├── Invoice.model.js
│   │   ├── Leave.model.js
│   │   ├── MaintenanceRequest.model.js
│   │   ├── Notification.model.js
│   │   ├── Payment.model.js
│   │   ├── Room.model.js
│   │   ├── RoomAllocation.model.js
│   │   ├── Staff.model.js
│   │   ├── Student.model.js
│   │   ├── StudentHistory.model.js
│   │   ├── User.model.js
│   │   └── Visitor.model.js
│   │
│   ├── routes/                            # Express route definitions (11 files)
│   │   ├── admin.routes.js
│   │   ├── application.routes.js
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   ├── fee.routes.js
│   │   ├── inventory.routes.js
│   │   ├── leave.routes.js
│   │   ├── room.routes.js
│   │   ├── staff.routes.js
│   │   └── student.routes.js
│   │
│   ├── uploads/                           # Local file storage for images
│   │   ├── blocks/
│   │   ├── inventory/
│   │   └── rooms/
│   │
│   ├── utils/                             # Helper utilities
│   │   ├── cloudinary.js                  # Cloudinary SDK configuration
│   │   ├── generateToken.js               # JWT token generator
│   │   └── sendEmail.js                   # Email service (SMTP/Ethereal/console)
│   │
│   ├── .env                               # Environment variables
│   ├── package.json                       # Backend dependencies
│   └── server.js                          # Express app entry point
│
├── frontend/
│   ├── public/                            # Static public assets
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js                   # Centralized Axios instance + all API functions
│   │   │
│   │   ├── assets/
│   │   │   └── landing/                   # Local images for landing page
│   │   │       ├── hero.jpg
│   │   │       ├── reception.jpg
│   │   │       ├── common-area.jpg
│   │   │       ├── room1.jpg – room6.jpg
│   │   │       ├── kitchen.jpg
│   │   │       ├── bathroom.jpg
│   │   │       └── washroom.jpg
│   │   │
│   │   ├── components/
│   │   │   ├── common/                    # Reusable UI components (11 files)
│   │   │   │   ├── Badge.jsx              # Status badges (pending, active, etc.)
│   │   │   │   ├── Button.jsx             # Configurable button with loading state
│   │   │   │   ├── ConfirmDialog.jsx      # Delete/action confirmation modal
│   │   │   │   ├── EmptyState.jsx         # Empty data placeholder
│   │   │   │   ├── Input.jsx              # Styled input with label and error
│   │   │   │   ├── Modal.jsx              # Reusable modal dialog
│   │   │   │   ├── Select.jsx             # Styled select dropdown
│   │   │   │   ├── Spinner.jsx            # Loading spinner
│   │   │   │   ├── StatsCard.jsx          # Dashboard stat card with icon
│   │   │   │   ├── Table.jsx              # Paginated data table
│   │   │   │   └── Textarea.jsx           # Multi-line text input
│   │   │   │
│   │   │   └── landing/                   # Landing page sections (7 files)
│   │   │       ├── Navbar.jsx
│   │   │       ├── Hero.jsx
│   │   │       ├── About.jsx
│   │   │       ├── Facilities.jsx
│   │   │       ├── Testimonials.jsx
│   │   │       ├── CallToAction.jsx
│   │   │       └── Footer.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # Global authentication state
│   │   │
│   │   ├── layouts/                       # Dashboard layouts with sidebars
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── StaffLayout.jsx
│   │   │   └── StudentLayout.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/                     # Admin pages (10 files)
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageStudents.jsx
│   │   │   │   ├── ManageStaff.jsx
│   │   │   │   ├── ManageRooms.jsx
│   │   │   │   ├── ManageFees.jsx
│   │   │   │   ├── ManageComplaints.jsx
│   │   │   │   ├── ManageInventory.jsx
│   │   │   │   ├── Applications.jsx
│   │   │   │   ├── Announcements.jsx
│   │   │   │   └── Reports.jsx
│   │   │   │
│   │   │   ├── auth/                      # Authentication pages (4 files)
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── ResetPassword.jsx
│   │   │   │
│   │   │   ├── staff/                     # Staff pages (6 files)
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── Complaints.jsx
│   │   │   │   ├── Inventory.jsx
│   │   │   │   ├── Maintenance.jsx
│   │   │   │   └── Visitors.jsx
│   │   │   │
│   │   │   ├── student/                   # Student pages (7 files)
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Application.jsx
│   │   │   │   ├── MyRoom.jsx
│   │   │   │   ├── Fees.jsx
│   │   │   │   ├── Complaints.jsx
│   │   │   │   ├── Leave.jsx
│   │   │   │   └── Profile.jsx
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   └── Announcements.jsx      # Shared across all roles
│   │   │   │
│   │   │   └── LandingPage.jsx            # Public marketing page
│   │   │
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx         # Role-based route guard
│   │   │
│   │   ├── App.jsx                        # Root component with all routes
│   │   ├── main.jsx                       # React DOM entry point
│   │   └── index.css                      # Global styles + Tailwind directives
│   │
│   ├── package.json                       # Frontend dependencies
│   └── vite.config.js                     # Vite configuration with proxy
│
└── TECHNICAL_REPORT.md                    # This file
```

### 3.1 Folder Purpose Summary

| Folder | Purpose |
|--------|---------|
| `backend/config/` | Database connection configuration |
| `backend/controllers/` | Business logic — each controller handles one domain (fees, rooms, etc.) |
| `backend/middleware/` | Reusable Express middleware for auth, validation, and file uploads |
| `backend/models/` | Mongoose schema definitions — 21 data models |
| `backend/routes/` | API endpoint definitions — maps HTTP verbs to controller functions |
| `backend/uploads/` | Local file storage for uploaded images (blocks, rooms, inventory) |
| `backend/utils/` | Utility functions (JWT generation, email sending, Cloudinary config) |
| `frontend/src/api/` | Centralized Axios client with all API function exports |
| `frontend/src/assets/` | Static images (landing page photos) |
| `frontend/src/components/common/` | Reusable UI building blocks (Button, Modal, Table, etc.) |
| `frontend/src/components/landing/` | Landing page section components |
| `frontend/src/context/` | React Context for global state (authentication) |
| `frontend/src/layouts/` | Dashboard shell layouts with sidebar navigation |
| `frontend/src/pages/` | Full page components organized by role (admin, staff, student, auth) |
| `frontend/src/routes/` | Route protection component |

---

## 4. FRONTEND ANALYSIS

### 4.1 Component Inventory

#### Common Components (11 files)

| Component | File | Purpose |
|-----------|------|---------|
| Badge | `Badge.jsx` | Renders colored status pills (e.g., "Pending" in amber, "Active" in green) |
| Button | `Button.jsx` | Configurable button with variants (primary, outline, danger), loading spinner, icon support |
| ConfirmDialog | `ConfirmDialog.jsx` | Modal dialog for destructive action confirmation (delete, unassign) |
| EmptyState | `EmptyState.jsx` | Illustrated placeholder when data tables have no results |
| Input | `Input.jsx` | Text input with label, error message, and Tailwind styling |
| Modal | `Modal.jsx` | Reusable overlay dialog with close button and size variants (sm, md, lg, xl) |
| Select | `Select.jsx` | Styled dropdown select with label support |
| Spinner | `Spinner.jsx` | CSS loading animation |
| StatsCard | `StatsCard.jsx` | Dashboard metric card showing icon, value, and label with color variants |
| Table | `Table.jsx` | Full-featured data table with column definitions, custom renderers, pagination, loading skeleton |
| Textarea | `Textarea.jsx` | Multi-line input with label and error support |

#### Landing Components (7 files)

| Component | File | Purpose |
|-----------|------|---------|
| Navbar | `Navbar.jsx` | Fixed navigation bar with scroll detection, active section highlighting, mobile drawer |
| Hero | `Hero.jsx` | Full-screen hero with background image slideshow, parallax scroll, stats row, CTA buttons |
| About | `About.jsx` | Split-layout section with image collage, achievement counters, promise list, pillar cards |
| Facilities | `Facilities.jsx` | Featured facility hero card + 8-card grid with images, icons, and descriptions |
| Testimonials | `Testimonials.jsx` | Auto-rotating carousel with 6 student testimonials, 3-column desktop layout |
| CallToAction | `CallToAction.jsx` | Gallery strip + two-column CTA section with image collage and perks list |
| Footer | `Footer.jsx` | 4-column footer with brand, links, contact info, office hours, social icons |

### 4.2 Page Analysis

#### Admin Pages (10 files)

| Page | File | Key State | API Calls | Description |
|------|------|-----------|-----------|-------------|
| Dashboard | `Dashboard.jsx` | stats, revenueData, revenueYear | `getDashboardStats()`, `getMonthlyRevenue()` | Overview with stat cards, revenue bar/line charts (real data from Payment collection), room status doughnut chart, recent complaints/applications lists, quick action links |
| Manage Students | `ManageStudents.jsx` | students, form, selected, imageFile | `getStudents()`, `createStudent()`, `updateStudent()`, `deleteStudent()`, `unassignStudentRoom()` | Full CRUD with search, department/year filters, pagination. Add/edit modal with image upload, FormData for multipart. View modal with unassign room button |
| Manage Staff | `ManageStaff.jsx` | staff, form, selected | `getStaffList()`, `createStaff()`, `updateStaff()`, `deleteStaff()` | Full CRUD with search and filters. Image upload support via FormData |
| Manage Rooms | `ManageRooms.jsx` | rooms, blocks, tab, roomForm, blockForm | `getRooms()`, `getRoom()`, `createRoom()`, `updateRoom()`, `deleteRoom()`, `allocateRoom()`, `getBlocks()`, `createBlock()`, `updateBlock()`, `deleteBlock()`, `unassignStudentRoom()` | Two-tab layout (Rooms + Blocks). Room table with allocate button, view modal showing assigned students with unassign. Block card grid with images |
| Manage Fees | `ManageFees.jsx` | tab (structures/invoices/payments/reports) | `getFeeStructures()`, `createFeeStructure()`, `getInvoices()`, `createInvoice()`, `getPayments()`, `recordPayment()`, `getFeeSummary()`, `getPendingDues()` | 4-tab interface: Fee Structures (with late fine rules), Invoices (auto-fill from structure), Payments (modal breakdown), Reports (summary cards, status breakdown, pending dues table) |
| Manage Complaints | `ManageComplaints.jsx` | complaints, filterStatus | `getComplaints()`, `updateComplaintStatus()`, `deleteComplaint()` | Inline status dropdown in table rows, filter by status, delete with confirmation |
| Manage Inventory | `ManageInventory.jsx` | inventory, form | `getInventory()`, `createInventoryItem()`, `updateInventoryItem()`, `useInventoryItem()`, `addStockInventoryItem()`, `deleteInventoryItem()` | CRUD with image upload, use/add-stock modals, category/condition filters |
| Applications | `Applications.jsx` | applications, filterStatus, search | `getApplications()`, `approveApplication()`, `rejectApplication()`, `assignApplicationRoom()`, `deleteApplication()`, `getRooms()` | Review pending applications, approve/reject with remarks, assign room to approved apps, delete applications |
| Announcements | `Announcements.jsx` | announcements, form, editing | `getAnnouncements()`, `createAnnouncement()`, `updateAnnouncement()`, `deleteAnnouncement()` | Create/edit/delete announcements targeted to all, students, or staff. Filter by target role |
| Reports | `Reports.jsx` | — | — | Reports and analytics page |

#### Student Pages (7 files)

| Page | File | Key State | API Calls | Description |
|------|------|-----------|-----------|-------------|
| Dashboard | `Dashboard.jsx` | notifs | Uses `useStudentData()` hook | Stats cards (room number, outstanding fee, open complaints, attendance %), notifications panel, quick actions |
| Application | `Application.jsx` | form, myApplications | `submitApplication()`, `getMyApplications()` | Multi-section form (personal, contact, guardian, preferences, medical, terms). Shows existing applications with status badges |
| My Room | `MyRoom.jsx` | room, allocation | Uses `useStudentData()` hook | Room details with image, facilities list, roommates, inventory, allocation sidebar |
| Fees | `Fees.jsx` | invoices, payments, structures | `getInvoices()`, `getPayments()`, `getFeeStructures()` | View invoices with status, payment history, fee structure details |
| Complaints | `Complaints.jsx` | complaints, form, filterStatus | `getComplaints()`, `createComplaint()` | File new complaints with category/priority, view existing with status filters, expandable details |
| Leave | `Leave.jsx` | leaves, attendance, form | Uses `useStudentData()` hook | Apply for leave (home visit, medical, personal, academic), attendance calendar grid |
| Profile | `Profile.jsx` | profile, form, editing | Uses `useStudentData()` hook | View/edit contact info, read-only academic/guardian details, profile photo |

#### Staff Pages (6 files)

| Page | File | Description |
|------|------|-------------|
| Dashboard | `Dashboard.jsx` | Overview with complaint/maintenance/inventory stats and recent activity |
| Attendance | `Attendance.jsx` | Bulk attendance marking for students |
| Complaints | `Complaints.jsx` | View and manage assigned complaints |
| Inventory | `Inventory.jsx` | View and manage hostel inventory |
| Maintenance | `Maintenance.jsx` | Track and resolve maintenance requests |
| Visitors | `Visitors.jsx` | Log and manage visitor records |

#### Auth Pages (4 files)

| Page | File | Description |
|------|------|-------------|
| Login | `Login.jsx` | Two-panel design (hero left, form right), email/password with validation, show/hide password toggle |
| Register | `Register.jsx` | Role selector (Admin/Staff/Student), full form with validation, password confirmation |
| Forgot Password | `ForgotPassword.jsx` | Email input form, sends reset link via backend email service |
| Reset Password | `ResetPassword.jsx` | New password form using token from URL params |

### 4.3 Routing Architecture

**Router:** React Router DOM v6 with nested routes

```
/                          → LandingPage (public)
/login                     → Login (public)
/register                  → Register (public)
/forgot-password           → ForgotPassword (public)
/reset-password/:token     → ResetPassword (public)

/admin/*                   → ProtectedRoute(admin) → AdminLayout
  /admin                   → Dashboard
  /admin/students          → ManageStudents
  /admin/staff             → ManageStaff
  /admin/rooms             → ManageRooms
  /admin/fees              → ManageFees
  /admin/complaints        → ManageComplaints
  /admin/inventory         → ManageInventory
  /admin/applications      → Applications
  /admin/announcements     → Announcements
  /admin/reports           → Reports

/staff/*                   → ProtectedRoute(staff) → StaffLayout
  /staff                   → Dashboard
  /staff/attendance        → Attendance
  /staff/complaints        → Complaints
  /staff/inventory         → Inventory
  /staff/visitors          → Visitors
  /staff/maintenance       → Maintenance
  /staff/announcements     → Announcements (shared)

/student/*                 → ProtectedRoute(student) → StudentLayout
  /student                 → Dashboard
  /student/application     → Application
  /student/room            → MyRoom
  /student/fees            → Fees
  /student/complaints      → Complaints
  /student/leave           → Leave
  /student/profile         → Profile
  /student/announcements   → Announcements (shared)
```

### 4.4 State Management

The application uses a **lightweight state management** approach:

- **Global State:** React Context API via `AuthContext` — stores current user object and token
- **Local State:** `useState` hooks within each page component for form data, loading states, modal visibility, pagination, and filters
- **Memoized Fetches:** `useCallback` wraps data-fetching functions to prevent unnecessary re-renders and duplicate API calls in React StrictMode
- **Effect-Driven Data:** `useEffect` triggers data fetching when dependencies change (page number, filters, search terms)
- **Persistence:** `localStorage` stores JWT token and user object for session persistence across browser refreshes

### 4.5 Styling Approach

- **Framework:** Tailwind CSS 3.4 with utility-first classes
- **Custom Theme:** Extended color palette (`primary`, `accent`, `dark`) via Tailwind config
- **Global Styles:** `index.css` defines reusable component classes using `@apply` directive:
  - `.card` — White card with border and shadow
  - `.btn`, `.btn-primary`, `.btn-danger` — Button variants
  - `.input` — Styled form input
  - `.badge`, `.badge-success`, `.badge-warning` — Status badges
  - `.sidebar-link` — Navigation items
  - `.page-header`, `.page-title` — Page layouts
- **Animations:** Custom keyframe animations for landing page (fadeInUp, fadeInLeft, zoomIn, float)
- **Glass Effect:** Backdrop-blur glass morphism for landing page elements
- **Responsive:** Mobile-first approach with `sm:`, `md:`, `lg:`, `xl:` breakpoints

### 4.6 Assets Usage

- **Landing page images:** 12 local JPEG images in `src/assets/landing/` (hostel rooms, reception, kitchen, bathroom)
- **Icons:** Lucide React for dashboard pages, React Icons (Font Awesome) for landing page
- **No external image URLs** in dashboard components (user-uploaded images served from `/uploads/`)

---

## 5. BACKEND ANALYSIS

### 5.1 Server Setup (`server.js`)

```
1. Load environment variables (dotenv)
2. Initialize Express application
3. Configure middleware:
   - CORS (cross-origin requests)
   - express.json() (parse JSON bodies)
   - express.urlencoded() (parse form data)
   - Static file serving (/uploads directory)
4. Connect to MongoDB (config/db.js)
5. Mount 11 route modules:
   /api/auth          → auth.routes.js
   /api/applications  → application.routes.js
   /api/admin         → admin.routes.js
   /api/students      → student.routes.js
   /api/staff         → staff.routes.js
   /api/rooms         → room.routes.js
   /api/fees          → fee.routes.js
   /api/complaints    → complaint.routes.js
   /api/inventory     → inventory.routes.js
   /api/attendance    → attendance.routes.js
   /api/leaves        → leave.routes.js
6. Health check endpoint (GET /)
7. Global error handler (catch-all)
8. Start listening on PORT (default 5000)
```

### 5.2 Database Connection (`config/db.js`)

- Uses `mongoose.connect()` with connection string from `MONGO_URI` environment variable
- Logs the connected host on success
- Calls `process.exit(1)` on connection failure to prevent running without a database

### 5.3 Middleware Stack

#### Authentication Chain

```
Request → protect (verify JWT) → authorize(roles...) → Controller
```

**protect** (`auth.middleware.js`):
- Extracts Bearer token from `Authorization` header
- Verifies token signature using `JWT_SECRET`
- Populates `req.user` with full User document (password excluded)
- Returns 401 if token is missing or invalid

**authorize** (`role.middleware.js`):
- Accepts variable number of role strings (e.g., `authorize('admin', 'staff')`)
- Checks `req.user.role` against allowed roles
- Returns 403 if role is not permitted

#### Validation Chain

```
Request → validationRules[] → validate → Controller
```

**Validation rules** (`validators/application.validator.js`):
- `submitApplicationRules` — Validates name, email, department, phone, guardian, gender, room type, terms
- `assignRoomRules` — Validates roomId in request body
- `getApplicationsRules` — Validates pagination and filter query parameters

**validate** (`validate.middleware.js`):
- Runs express-validator result check
- Returns 400 with array of `{ field, message }` objects if validation fails

#### File Upload Middleware

| Middleware | Directory | Max Size | Allowed Types |
|-----------|-----------|----------|---------------|
| `upload.middleware.js` | `/uploads/` | 5 MB | jpeg, jpg, png, webp |
| `uploadBlock.middleware.js` | `/uploads/blocks/` | 2 MB | jpeg, jpg, png |
| `uploadRoom.middleware.js` | `/uploads/rooms/` | 2 MB | jpeg, jpg, png |
| `uploadInventory.middleware.js` | `/uploads/inventory/` | 5 MB | jpeg, jpg, png, webp |

All use Multer with disk storage, unique filenames (timestamp + random number).

### 5.4 Utility Functions

**generateToken.js:**
- `generateToken(userId, role)` — Creates JWT with user ID and role, expires per `JWT_EXPIRE` env var

**sendEmail.js:**
- `sendEmail({ to, subject, html, devResetUrl })` — Sends email via SMTP in production; uses Ethereal test email or console fallback in development

**cloudinary.js:**
- Configures Cloudinary SDK with credentials from environment variables for optional cloud image storage

---

## 6. DATABASE DESIGN

### 6.1 Collections Overview (21 Models)

```
┌──────────────────────────────────────────────────┐
│                    USER SYSTEM                     │
│  User ──→ Admin | Staff | Student (polymorphic)   │
└──────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │  Admin   │  │  Staff   │  │   Student    │
   │ (perms)  │  │ (shifts) │  │ (academic)   │
   └──────────┘  └──────────┘  └──────┬───────┘
                      │                │
         ┌────────────┼────────────────┼───────────┐
         ▼            ▼                ▼           ▼
   ┌──────────┐ ┌──────────┐  ┌────────────┐ ┌────────┐
   │ Visitor  │ │Complaint │  │ Attendance │ │ Leave  │
   └──────────┘ └──────────┘  └────────────┘ └────────┘
                                    │
┌───────────────────────────────────┼──────────────┐
│              ROOM SYSTEM          │              │
│  Block ──→ Room ──→ RoomAllocation│              │
│                  ──→ Occupants[]  │              │
└───────────────────────────────────┼──────────────┘
         │                          │
         ▼                          ▼
   ┌──────────────┐          ┌──────────────┐
   │  Application │          │  Inventory   │
   │  (admission) │          │ Assignment   │
   └──────────────┘          └──────────────┘

┌──────────────────────────────────────────────────┐
│                  FEE SYSTEM                       │
│  FeeStructure ──→ Invoice ──→ Payment            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              SUPPORT SYSTEMS                      │
│  Announcement | Notification | MaintenanceRequest │
│  StudentHistory                                   │
└──────────────────────────────────────────────────┘
```

### 6.2 Schema Details

#### User (Base Authentication Model)
| Field | Type | Details |
|-------|------|---------|
| name | String | Required, max 100 chars |
| email | String | Required, unique, lowercase, regex validated |
| password | String | Required, min 6 chars, `select: false` (hidden by default), bcrypt hashed |
| role | String | Enum: `admin`, `staff`, `student` |
| phone | String | Optional |
| status | String | Enum: `active`, `inactive`, default: `active` |
| profileRef | ObjectId | References Admin, Staff, or Student model |
| profileModel | String | Enum: `Admin`, `Staff`, `Student` |
| lastLogin | Date | Updated on each login |
| resetPasswordToken | String | SHA256 hash of reset token, `select: false` |
| resetPasswordExpire | Date | Token expiration, `select: false` |

**Pre-save hook:** Hashes password with bcrypt (12 salt rounds) before saving.
**Instance method:** `matchPassword(entered)` — Compares entered password against hash.

#### Student
| Field | Type | Details |
|-------|------|---------|
| user | ObjectId → User | Required, unique |
| rollNumber | String | Required, unique |
| department | String | Required |
| year | Number | 1–6 |
| semester | Number | 1–12 |
| gender | String | Enum: `male`, `female`, `other` |
| bloodGroup | String | |
| contactInfo | Object | phone, alternatePhone, address (street, city, state, pincode) |
| guardianDetails | Object | name, phone, email, relation |
| profileImage | String | File path |
| room | ObjectId → Room | Currently assigned room |
| block | ObjectId → Block | Currently assigned block |
| status | String | Enum: `active`, `checked_out`, `suspended` |

#### Staff
| Field | Type | Details |
|-------|------|---------|
| user | ObjectId → User | Required, unique |
| employeeId | String | Required, unique |
| designation | String | Required |
| department | String | |
| gender | String | Enum: `male`, `female`, `other` |
| shift | String | Enum: `morning`, `evening`, `night`, `general` |
| assignedBlock | ObjectId → Block | |
| assignedTasks | Array | Objects with title, description, status, dueDate |
| salary | Number | Min 0 |
| profileImage | String | |
| joiningDate | Date | Default: now |

#### Admin
| Field | Type | Details |
|-------|------|---------|
| user | ObjectId → User | Required, unique |
| employeeId | String | Required, unique |
| designation | String | Default: "Hostel Administrator" |
| permissions | Object | manageStudents, manageStaff, manageRooms, manageFees, manageComplaints, manageInventory, viewReports — all Boolean, default true |

#### Block
| Field | Type | Details |
|-------|------|---------|
| name | String | Required, unique |
| type | String | Enum: `boys`, `girls`, `mixed` |
| totalFloors | Number | Required, min 1 |
| warden | ObjectId → Staff | |
| facilities | [String] | |
| image | String | |
| totalRooms | Number | Default 0 |
| isActive | Boolean | Default true |

#### Room
| Field | Type | Details |
|-------|------|---------|
| roomNumber | String | Required (unique per block) |
| block | ObjectId → Block | Required |
| floor | Number | Required, min 0 |
| type | String | Enum: `single`, `double`, `triple`, `dormitory` |
| capacity | Number | Required, min 1 |
| currentOccupancy | Number | Default 0 |
| occupants | [ObjectId → Student] | Array of assigned students |
| facilities | [String] | |
| monthlyRent | Number | |
| status | String | Enum: `available`, `full` |
| image | String | |

**Pre-save hook:** Validates occupancy <= capacity, auto-calculates status.
**Virtual:** `availableBeds` = capacity - currentOccupancy.
**Indexes:** Unique compound on (roomNumber, block).

#### RoomAllocation
| Field | Type | Details |
|-------|------|---------|
| student | ObjectId → Student | Required |
| room | ObjectId → Room | Required |
| application | ObjectId → Application | |
| allocatedBy | ObjectId → User | |
| startDate | Date | Default now |
| endDate | Date | |
| status | String | Enum: `active`, `vacated`, `transferred` |
| vacatedAt | Date | |
| bedNumber | String | |

#### Application (Hostel Admission)
| Field | Type | Details |
|-------|------|---------|
| student | ObjectId → Student | Linked after approval |
| registrationNo | String | Required |
| applicantName | String | Required |
| applicantEmail | String | Required, lowercase |
| department | String | Required |
| semester | Number | 1–12 |
| gender | String | Enum: `male`, `female`, `other` |
| contactInfo | Object | phone (required), alternatePhone, address |
| guardianDetails | Object | name (required), phone (required), relation |
| preferredRoomType | String | Enum: `single`, `double`, `triple` |
| preferredBlock | ObjectId → Block | |
| medicalInfo | Object | hasCondition (Boolean), details (String) |
| documents | [String] | |
| termsAccepted | Boolean | Required |
| status | String | Enum: `pending`, `approved`, `rejected` |
| assignedRoom | ObjectId → Room | Set when room is assigned |
| remarks | String | Admin notes |
| reviewedBy | ObjectId → User | |
| reviewedAt | Date | |
| appliedAt | Date | Default now |

#### FeeStructure
| Field | Type | Details |
|-------|------|---------|
| name | String | Required |
| type | String | Enum: `monthly`, `semester`, `yearly` |
| roomType | String | Enum: `single`, `double`, `triple`, `dormitory` |
| baseFee | Number | Required, min 0 |
| securityDeposit | Number | Default 0 |
| lateFineRules | Object | finePerDay, gracePeriodDays, maxFine |
| additionalCharges | Mixed | Flexible key-value |
| components | Array | Objects with name + amount |
| academicYear | String | Required |
| isActive | Boolean | Default true |

**Virtual:** `totalFee` = baseFee + securityDeposit + sum(components.amount).

#### Invoice
| Field | Type | Details |
|-------|------|---------|
| invoiceNumber | String | Unique, required |
| student | ObjectId → Student | Required |
| feeStructure | ObjectId → FeeStructure | |
| totalAmount | Number | Required |
| discount | Number | Default 0 |
| fine | Number | Default 0 |
| paidAmount | Number | Default 0 |
| dueDate | Date | Required |
| status | String | Enum: `pending`, `partial`, `paid`, `overdue` |
| generatedBy | ObjectId → User | |

**Virtual:** `outstandingBalance` = totalAmount + fine - discount - paidAmount.

#### Payment
| Field | Type | Details |
|-------|------|---------|
| receiptNumber | String | Unique, required |
| invoice | ObjectId → Invoice | Required |
| student | ObjectId → Student | Required |
| amountPaid | Number | Required, min 1 |
| paymentDate | Date | Default now |
| method | String | Enum: `cash`, `online`, `cheque`, `dd`, `upi` |
| transactionId | String | |
| recordedBy | ObjectId → User | |

#### Complaint
| Field | Type | Details |
|-------|------|---------|
| student | ObjectId → Student | Required |
| assignedStaff | ObjectId → User | |
| title | String | Required |
| description | String | Required |
| category | String | Enum: `room`, `plumbing`, `electrical`, `cleanliness`, `food`, `security`, `other` |
| priority | String | Enum: `low`, `medium`, `high` |
| status | String | Enum: `pending`, `in_progress`, `resolved`, `closed` |
| block | ObjectId → Block | |
| room | ObjectId → Room | |
| remarks | String | |
| resolvedAt | Date | |
| images | [String] | |

#### Attendance
| Field | Type | Details |
|-------|------|---------|
| student | ObjectId → Student | Required |
| date | Date | Required |
| status | String | Enum: `present`, `absent` |
| markedBy | ObjectId → User | |
| checkIn | Date | |
| checkOut | Date | |

**Index:** Unique compound on (student, date) — prevents duplicate records.

#### Leave
| Field | Type | Details |
|-------|------|---------|
| student | ObjectId → Student | Required |
| fromDate | Date | Required |
| toDate | Date | Required |
| reason | String | Required |
| leaveType | String | Enum: `home_visit`, `medical`, `personal`, `academic` |
| status | String | Enum: `pending`, `approved`, `rejected`, `cancelled` |
| approvedBy | ObjectId → User | |

**Pre-save hook:** Validates toDate > fromDate.

#### Inventory
| Field | Type | Details |
|-------|------|---------|
| name | String | Required |
| category | String | Enum: `furniture`, `electronics`, `bedding`, `cleaning`, `kitchen`, `sports`, `stationery`, `other` |
| totalQuantity | Number | Required, min 0 |
| availableQuantity | Number | Default 0 |
| unit | String | Default "pcs" |
| condition | String | Enum: `new`, `good`, `fair`, `poor`, `damaged` |
| status | String | Enum: `available`, `assigned`, `repair`, `disposed` |
| image | String | |
| block | ObjectId → Block | |
| lowStockThreshold | Number | Default 5 |

**Virtual:** `isLowStock` = availableQuantity <= lowStockThreshold.

#### Additional Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| InventoryAssignment | Tracks inventory assigned to rooms | inventory, room, quantity, status |
| MaintenanceRequest | Maintenance tickets | room, issue, type, priority, status, assignedTo, cost |
| Notification | User notifications | recipient, title, message, type, isRead |
| StudentHistory | Tracks room changes | student, previousRoom, newRoom, action |
| Visitor | Visitor log | name, phone, visitingStudent, checkIn, checkOut |
| Announcement | System announcements | title, content, targetRole, isPinned, expiresAt |

### 6.3 Key Relationships

```
User (1) ──── (1) Admin/Staff/Student    [Polymorphic via profileRef]
Block (1) ──── (N) Room                  [room.block → Block]
Room (1) ──── (N) Student                [student.room → Room, room.occupants → [Student]]
Student (1) ──── (N) Invoice             [invoice.student → Student]
Invoice (1) ──── (N) Payment             [payment.invoice → Invoice]
Student (1) ──── (N) Complaint           [complaint.student → Student]
Student (1) ──── (N) Application         [application.student → Student]
Student (1) ──── (N) Attendance          [attendance.student → Student]
Student (1) ──── (N) Leave               [leave.student → Student]
Room (1) ──── (N) InventoryAssignment    [assignment.room → Room]
```

---

## 7. API DOCUMENTATION

### 7.1 Authentication APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user (admin/staff/student). Creates User + role-specific profile. Returns JWT token |
| POST | `/api/auth/login` | Public | Login with email + password. Returns JWT token + user object |
| POST | `/api/auth/logout` | Protected | Logout (client discards token) |
| GET | `/api/auth/me` | Protected | Get current authenticated user profile |
| POST | `/api/auth/forgot-password` | Public | Send password reset email. Returns 200 regardless (prevents email enumeration) |
| PUT | `/api/auth/reset-password/:token` | Public | Reset password using token from email link |

### 7.2 Student APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | Admin, Staff | List students with pagination, search, department/year filters |
| GET | `/api/students/:id` | Admin, Staff | Get single student with populated user, room, block |
| POST | `/api/students` | Admin | Create student + user account. Supports image upload (multipart) |
| PUT | `/api/students/:id` | Admin | Update student + user fields. Supports image upload |
| DELETE | `/api/students/:id` | Admin | Delete student, free room, clear applications, delete user account |
| POST | `/api/students/:id/unassign-room` | Admin | Unassign room — syncs Student, Room, Application, RoomAllocation |

### 7.3 Staff APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/staff` | Admin, Staff | List staff with pagination and filters |
| GET | `/api/staff/:id` | Admin, Staff | Get single staff member |
| POST | `/api/staff` | Admin | Create staff + user account |
| PUT | `/api/staff/:id` | Admin | Update staff profile |
| DELETE | `/api/staff/:id` | Admin | Delete staff and user account |

### 7.4 Room APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/rooms` | Admin, Staff | List rooms with block/status/type filters, pagination |
| GET | `/api/rooms/:id` | Admin, Staff | Get room with populated block and occupants (with user names) |
| POST | `/api/rooms` | Admin | Create room with image upload |
| PUT | `/api/rooms/:id` | Admin | Update room (type, capacity, rent, facilities, image) |
| DELETE | `/api/rooms/:id` | Admin | Delete room (must have 0 occupants) |
| POST | `/api/rooms/allocate` | Admin | Allocate student to room — syncs Room, Student, Application, RoomAllocation |

### 7.5 Block APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/rooms/blocks` | Admin, Staff | List all active blocks |
| GET | `/api/rooms/blocks/:id` | Admin, Staff | Get single block |
| POST | `/api/rooms/blocks` | Admin | Create block with image upload |
| PUT | `/api/rooms/blocks/:id` | Admin | Update block |
| DELETE | `/api/rooms/blocks/:id` | Admin | Delete block (must have 0 rooms) |

### 7.6 Fee APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fees/structures` | All roles | List fee structures |
| POST | `/api/fees/structures` | Admin | Create fee structure with components and late fine rules |
| PUT | `/api/fees/structures/:id` | Admin | Update fee structure |
| DELETE | `/api/fees/structures/:id` | Admin | Delete fee structure |
| GET | `/api/fees/invoices` | All roles | List invoices (students see only their own) |
| POST | `/api/fees/invoices` | Admin | Generate invoice for student |
| PUT | `/api/fees/invoices/:id` | Admin | Update invoice |
| DELETE | `/api/fees/invoices/:id` | Admin | Delete invoice |
| GET | `/api/fees/payments` | All roles | List payments (students see only their own) |
| POST | `/api/fees/payments` | Admin | Record payment against invoice. Auto-calculates late fines |
| POST | `/api/fees/apply-late-fines` | Admin | Bulk apply late fines to overdue invoices |
| GET | `/api/fees/reports/summary` | Admin, Staff | Aggregated fee summary (total billed, collected, pending, overdue) |
| GET | `/api/fees/reports/pending-dues` | Admin, Staff | Students with outstanding balances |
| GET | `/api/fees/reports/monthly-revenue` | Admin, Staff | Monthly revenue aggregation from Payment collection |
| GET | `/api/fees/reports/student/:studentId` | Admin, Staff | Individual student fee report |

### 7.7 Complaint APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/complaints` | All roles | List complaints with filters. Students see only their own |
| GET | `/api/complaints/:id` | All roles | Get single complaint |
| POST | `/api/complaints` | All roles | File new complaint |
| PUT | `/api/complaints/:id` | All roles | Update complaint |
| PUT | `/api/complaints/:id/status` | All roles | Update complaint status with remarks |
| DELETE | `/api/complaints/:id` | All roles | Delete complaint |

### 7.8 Application APIs (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/applications` | Admin | List all applications with search, status filter, pagination |
| GET | `/api/admin/applications/history` | Admin | View processed (non-pending) applications |
| PUT | `/api/admin/applications/:id` | Admin | Generic update |
| PUT | `/api/admin/applications/:id/approve` | Admin | Approve pending application |
| PUT | `/api/admin/applications/:id/reject` | Admin | Reject pending application |
| PUT | `/api/admin/applications/:id/assign-room` | Admin | Assign room — syncs Application, Student, Room (3-way) |
| DELETE | `/api/admin/applications/:id` | Admin | Delete application |

### 7.9 Application APIs (Student)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/applications` | Public | Submit new hostel application (validated) |
| GET | `/api/applications/my` | Student, Admin | Get logged-in student's applications |
| GET | `/api/applications/:id` | Public | Get application by ID |

### 7.10 Other APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | All roles | List attendance records |
| POST | `/api/attendance` | Admin, Staff | Bulk mark attendance |
| PUT | `/api/attendance/:id` | Admin, Staff | Update attendance record |
| GET | `/api/leaves` | All roles | List leave requests |
| POST | `/api/leaves` | Student | Apply for leave |
| PUT | `/api/leaves/:id` | All roles | Update/approve/reject leave |
| GET | `/api/inventory` | Admin, Staff | List inventory items |
| POST | `/api/inventory` | Admin | Create inventory item with image |
| PUT | `/api/inventory/:id` | Admin | Update inventory item |
| PUT | `/api/inventory/:id/use` | Admin, Staff | Decrement stock |
| PUT | `/api/inventory/:id/add-stock` | Admin | Add stock |
| DELETE | `/api/inventory/:id` | Admin | Delete inventory item |
| GET | `/api/admin/dashboard` | Admin | Dashboard statistics |
| GET/POST | `/api/admin/announcements` | Admin | List/create announcements |
| PUT/DELETE | `/api/admin/announcements/:id` | Admin | Update/delete announcement |
| GET | `/api/admin/announcements/public` | All roles | Get announcements for user's role |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/toggle` | Admin | Toggle user active/inactive |

**Total: 70+ API endpoints**

---

## 8. AUTHENTICATION & AUTHORIZATION

### 8.1 Authentication Flow

```
                   ┌─────────┐
                   │  Client  │
                   └────┬─────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     POST /login   POST /register   POST /forgot-password
          │             │             │
          ▼             ▼             ▼
    Validate        Create User    Generate reset token
    credentials     + Role profile  Hash with SHA256
          │             │           Store in DB
          ▼             ▼           Send email with link
    Generate JWT    Generate JWT        │
    (id + role)     (id + role)        ▼
          │             │         PUT /reset-password/:token
          ▼             ▼           Hash token, find user
    Return token    Return token    Update password
    + user obj      + user obj      Return new JWT
          │             │
          ▼             ▼
    Store in         Store in
    localStorage     localStorage
```

### 8.2 JWT Token Structure

```javascript
{
  header: { alg: "HS256", typ: "JWT" },
  payload: {
    id: "MongoDB ObjectId",  // User document ID
    role: "admin|staff|student",
    iat: 1234567890,         // Issued at timestamp
    exp: 1235172690          // Expires in 7 days (configurable)
  },
  signature: HMAC-SHA256(header + payload, JWT_SECRET)
}
```

### 8.3 Request Authentication

Every protected API request includes:
```
Authorization: Bearer <jwt_token>
```

The `protect` middleware:
1. Extracts token from header
2. Verifies signature with `JWT_SECRET`
3. Finds user by decoded `id`
4. Attaches user to `req.user`
5. Rejects with 401 if token is invalid or user not found

### 8.4 Role-Based Access Control

The `authorize(roles...)` middleware checks `req.user.role`:

| Role | Accessible Modules |
|------|--------------------|
| **admin** | Everything — full CRUD on all modules, dashboard, reports, user management |
| **staff** | Attendance, complaints (assigned), inventory, visitors, maintenance, announcements |
| **student** | Own profile, own complaints, own fees, own leave, room application, announcements |

### 8.5 Frontend Route Protection

`ProtectedRoute.jsx` component:
1. Shows spinner while auth context loads
2. Redirects to `/login` if not authenticated
3. Redirects to role dashboard if role not in `allowedRoles`
4. Renders child routes if authorized

### 8.6 Session Persistence

- Token and user object stored in `localStorage`
- On app load, `AuthContext` reads localStorage and validates token via `GET /api/auth/me`
- If token is expired or invalid, 401 interceptor clears localStorage and redirects to `/login`

### 8.7 Axios Interceptors

```javascript
// Request interceptor — auto-attach JWT
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle expired sessions
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 9. KEY FUNCTIONALITIES

### 9.1 Room Assignment & Unassignment (3-Way Sync)

The system ensures Application, Student, and Room stay synchronized.

**Assign Room** (`PUT /api/admin/applications/:id/assign-room`):
1. Validate application is "approved" and has no room yet
2. Find matching Student record (by registrationNo or email)
3. If student already has a room, remove them from old room first
4. Update Application: `assignedRoom = room._id`
5. Update Student: `room = room._id`, `block = room.block`
6. Update Room: `occupants.push(student._id)`, `currentOccupancy += 1`
7. Room pre-save hook auto-calculates status (available/full)
8. Save all three documents

**Unassign Room** (`POST /api/students/:id/unassign-room`):
1. Remove student from Room's occupants array, decrement occupancy
2. Clear Application's `assignedRoom`
3. Vacate RoomAllocation records
4. Clear Student's `room` and `block`
5. Room pre-save hook auto-calculates status

### 9.2 Fee Management Pipeline

```
FeeStructure (template) → Invoice (per student) → Payment (partial/full)
```

- **Fee Structures** define base fee, security deposit, components, and late fine rules
- **Invoices** are generated per student referencing a fee structure, with discount and fine fields
- **Payments** are recorded against invoices; multiple partial payments allowed
- **Late Fine Auto-Calculation:** When a payment is recorded after the due date, the system calculates `finePerDay × daysLate` (capped at `maxFine`)
- **Bulk Late Fines:** `POST /api/fees/apply-late-fines` applies fines to all overdue invoices
- **Revenue Reports:** MongoDB aggregation pipeline groups payments by month for dashboard chart

### 9.3 Complaint Lifecycle

```
Student files complaint (pending)
  → Admin/Staff reviews
    → In Progress (assigned to staff)
      → Resolved (resolvedAt timestamp set)
        → Closed
```

### 9.4 Application Workflow

```
Student submits application (pending)
  → Admin reviews
    → Approved (ready for room assignment)
      → Room assigned (3-way sync)
    → Rejected (with remarks)
```

Business rules:
- Only one active (pending/approved) application per registration number
- Only approved applications can be assigned rooms
- Cannot re-process already processed applications

### 9.5 Dashboard Analytics

The admin dashboard displays real-time data:
- **Stats cards:** totalStudents, totalStaff, totalRooms, availableRooms, fullRooms, pendingFees, openComplaints, pendingApplications
- **Revenue bar chart:** Monthly payment totals from MongoDB aggregation (with year selector)
- **Revenue line chart:** Trend visualization of the same data
- **Room status doughnut:** Available vs. full rooms
- **Recent complaints and applications:** Latest 5 items

---

## 10. CODE EXPLANATION (FILE-BY-FILE)

### 10.1 Backend Files

#### `server.js` — Application Entry Point
- Loads environment variables with `dotenv.config()`
- Creates Express app instance
- Enables CORS for cross-origin frontend requests
- Parses JSON and URL-encoded request bodies
- Serves `/uploads` directory as static files
- Connects to MongoDB via `connectDB()`
- Mounts all 11 route modules under `/api/` prefix
- Provides health-check endpoint at root (`/`)
- Starts HTTP server on configured PORT

#### `config/db.js` — Database Connection
- Exports `connectDB()` async function
- Calls `mongoose.connect(MONGO_URI)` to establish connection
- Logs connected host on success
- Exits process on failure (prevents running without database)

#### `controllers/auth.controller.js` — Authentication Logic
- **register:** Creates User document, auto-creates role-specific profile (Admin/Staff/Student), generates JWT
- **login:** Finds user by email (case-insensitive), validates password with bcrypt, checks active status, returns JWT
- **getMe:** Returns `req.user` (populated by protect middleware)
- **forgotPassword:** Generates crypto-random token, hashes with SHA256, stores in DB with 30-min expiry, sends email
- **resetPassword:** Hashes incoming token, finds matching user, updates password, clears reset fields

#### `controllers/admin.controller.js` — Admin Operations
- **getDashboardStats:** Runs 8 parallel `countDocuments()` queries + fetches recent complaints/applications
- **getApplications:** Paginated list with search (name/registration) and status filter
- **approveApplication / rejectApplication:** Status transition with business rule enforcement
- **assignRoom:** 3-way sync between Application, Student, and Room
- **deleteApplication:** Permanent delete
- **Announcement CRUD:** Full create/read/update/delete for system announcements
- **getUsers / toggleUserStatus:** User management

#### `controllers/student.controller.js` — Student Management
- **getStudents:** Paginated list with search (queries User model for name match), department/year filters
- **createStudent:** Creates User (with password) + Student profile, handles image upload via FormData
- **updateStudent:** Updates both User fields (name, email, phone) and Student fields, handles image replacement
- **deleteStudent:** Frees room (syncs Room + Application), vacates allocations, deletes User + Student
- **unassignRoom:** Removes student from room occupants, clears application assignment, vacates allocations

#### `controllers/room.controller.js` — Room & Block Management
- **getRooms / getRoom:** List/detail with populate (block, occupants with user names)
- **createRoom / updateRoom / deleteRoom:** CRUD with image upload, room number uniqueness per block
- **allocateRoom:** Assigns student to room with full sync (old room cleanup, new room update, application sync)
- **Block CRUD:** Create/read/update/delete hostel blocks with image upload

#### `controllers/fee.controller.js` — Financial Management
- **Fee Structure CRUD:** Templates with components and late fine rules
- **Invoice CRUD:** Per-student invoices with auto-fill from structure, discount support
- **recordPayment:** Creates payment record, updates invoice paidAmount and status, auto-calculates late fines
- **applyLateFines:** Bulk operation on all overdue unpaid invoices
- **getFeeSummary:** MongoDB aggregation for total billed, collected, pending, overdue
- **getPendingDues:** Students with outstanding balances
- **getMonthlyRevenue:** Aggregation on Payment collection by month for dashboard chart

#### `controllers/complaint.controller.js` — Complaint Handling
- **getComplaints:** Paginated with status/category/priority filters, student scoping
- **createComplaint:** Files complaint linked to student
- **updateComplaint:** General update
- **updateComplaintStatus:** Dedicated status endpoint, sets `resolvedAt` when resolved/closed
- **deleteComplaint:** Permanent delete

#### `controllers/application.controller.js` — Public Applications
- **submitApplication:** Creates hostel application with business rule (one active per registration)
- **getMyApplications:** Returns applications matching logged-in student's email
- **getApplicationById:** Public access to check application status

#### `controllers/attendance.controller.js` — Attendance Tracking
- **getAttendance:** Paginated with date/student/status filters, student scoping
- **markAttendance:** Bulk upsert — takes array of records, upserts by (student, date) combination
- **updateAttendance:** Single record update

#### `controllers/leave.controller.js` — Leave Management
- **getLeaves:** Paginated with status/type filters, student scoping
- **applyLeave:** Creates leave request (students only)
- **updateLeave:** Approve/reject with approvedBy and approvedAt fields

#### `controllers/inventory.controller.js` — Inventory Management
- **getInventory:** Paginated with category/block filters
- **createInventoryItem:** Creates item with image, sets availableQuantity = totalQuantity
- **updateInventoryItem:** Whitelist update, validates totalQuantity >= availableQuantity
- **useInventoryItem:** Decrements available stock
- **addStockInventoryItem:** Increments available stock (capped at total)
- **deleteInventoryItem:** Deletes item and associated image file

### 10.2 Frontend Files

#### `main.jsx` — React Entry Point
- Wraps app in `React.StrictMode`, `BrowserRouter`, and `AuthProvider`
- Renders `App` component and `Toaster` for notifications

#### `App.jsx` — Route Configuration
- Defines all public routes (login, register, forgot/reset password, landing)
- Defines role-protected route groups (admin/*, staff/*, student/*)
- Each group wraps routes in `ProtectedRoute` and role-specific `Layout`

#### `context/AuthContext.jsx` — Global Auth State
- Creates React Context with `user`, `loading`, `login`, `register`, `logout`
- On mount, reads token/user from localStorage and validates with `getMe()` API
- Login/register functions call API, store token in localStorage, navigate to role dashboard
- Includes mock credential fallback for offline development
- 401 interceptor clears session and redirects to login

#### `api/index.js` — Centralized API Client
- Creates Axios instance with `/api` base URL
- Request interceptor: Attaches JWT from localStorage to all requests
- Response interceptor: Redirects to login on 401 errors
- Exports 70+ named functions for every API endpoint
- Uses `API.get/post/put/delete` with proper paths and params

#### `routes/ProtectedRoute.jsx` — Route Guard
- Checks auth loading state (shows spinner)
- Redirects unauthenticated users to `/login`
- Redirects wrong-role users to their role dashboard
- Renders children if all checks pass

#### `layouts/AdminLayout.jsx` — Admin Shell
- Two-column layout: collapsible sidebar (left) + content area (right)
- Sidebar: 9 navigation items with Lucide icons, active state highlighting
- Header: User avatar, role badge, logout button
- Content: `<Outlet />` for nested routes
- Responsive: Sidebar hidden on mobile, hamburger toggle

#### `layouts/StaffLayout.jsx` — Staff Shell
- Same structure as AdminLayout with 7 staff-specific navigation items
- Uses accent color scheme (orange/amber tones)

#### `layouts/StudentLayout.jsx` — Student Shell
- Same structure with 8 student-specific navigation items
- Uses indigo color scheme

#### `pages/admin/Dashboard.jsx` — Admin Home
- Fetches dashboard stats and monthly revenue on mount
- 8 stat cards (students, staff, rooms, fees, complaints, applications)
- Revenue bar chart with year selector (real Payment data via aggregation)
- Revenue trend line chart
- Room status doughnut chart
- Recent complaints and applications lists
- Quick action links (add student, manage rooms, generate invoice, view complaints)

#### `pages/admin/ManageStudents.jsx` — Student CRUD
- Paginated table with search, department/year filters
- Add modal: Full form with image upload via FormData
- Edit modal: Pre-filled form, password optional
- View modal: Detailed profile with unassign room button
- Delete confirmation dialog

#### `pages/admin/ManageRooms.jsx` — Room & Block Management
- Two-tab layout: Rooms (table) + Blocks (card grid)
- Room table: View (with occupant list + unassign), Edit, Allocate, Delete
- Allocate modal: Student search → select → allocate
- Block cards: Image, type, floors, actions

#### `pages/admin/ManageFees.jsx` — Fee Management
- Four-tab layout: Structures, Invoices, Payments, Reports
- Structures: CRUD with late fine rules and additional charges
- Invoices: Create with auto-fill from structure, edit, delete
- Payments: Record against invoice, view breakdown in modal
- Reports: Summary cards, status breakdown, pending dues table

#### `pages/admin/Applications.jsx` — Application Review
- Paginated table with search and status filter
- Actions: View details, Approve, Reject, Assign Room, Delete
- Review modal: Approve/Reject with remarks
- Assign Room modal: Select from available rooms

#### `pages/student/Application.jsx` — Hostel Application Form
- Multi-section form: Personal, Contact, Guardian, Preferences, Medical, Terms
- Validates required fields before submission
- Shows existing applications with status badges
- Sends properly nested payload matching backend validator

#### `pages/student/Complaints.jsx` — Student Complaints
- File new complaint with category, priority, description
- View existing complaints with status filter tabs
- Expandable details showing full complaint info and staff remarks
- Direct API calls (getComplaints, createComplaint)

#### `index.css` — Global Stylesheet
- Tailwind CSS directives (@tailwind base, components, utilities)
- Custom scrollbar styling
- Reusable component classes: `.card`, `.btn`, `.input`, `.badge`, `.sidebar-link`
- Landing page animations: fadeInUp, fadeInLeft, fadeInRight, zoomIn, float
- Glass morphism effect (`.glass`)
- Image hover zoom effect (`.img-hover`)
- Gradient text effect (`.gradient-text`)

---

## 11. UI/UX DESIGN

### 11.1 Pages Summary

| Category | Pages |
|----------|-------|
| **Public** | Landing Page (marketing), Login, Register, Forgot Password, Reset Password |
| **Admin** | Dashboard, Students, Staff, Rooms, Fees, Complaints, Inventory, Applications, Announcements, Reports |
| **Staff** | Dashboard, Attendance, Complaints, Inventory, Maintenance, Visitors, Announcements |
| **Student** | Dashboard, Application, My Room, Fees, Complaints, Leave, Profile, Announcements |
| **Total** | ~30 unique pages |

### 11.2 Component Reuse

The 11 common components are reused across all pages:

- **Table** — Used in every list page (students, rooms, invoices, complaints, etc.)
- **Modal** — Used for all add/edit/view dialogs
- **Button** — Used everywhere with consistent loading states
- **Badge** — Used in every table and detail view for status display
- **ConfirmDialog** — Used for all delete operations
- **Input/Select/Textarea** — Used in every form
- **StatsCard** — Used in all three dashboards

### 11.3 Design System

- **Color Palette:** Primary (indigo), Accent (orange), Emerald (success), Amber (warning), Red (danger)
- **Typography:** Inter font family, system-ui fallback
- **Spacing:** Tailwind's default 4px grid system
- **Border Radius:** Rounded-lg (8px) for inputs, rounded-xl (12px) for cards, rounded-2xl (16px) for modals
- **Shadows:** sm for cards (hover: md), lg for modals, 2xl for featured elements

### 11.4 Responsiveness

- **Mobile-first** approach using Tailwind breakpoints
- **Sidebar:** Hidden on mobile with hamburger toggle, visible on `lg:` screens
- **Grid layouts:** `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-4` for stat cards
- **Tables:** Horizontal scroll on small screens via `overflow-x-auto`
- **Forms:** Single column on mobile, 2-column grid on desktop
- **Landing page:** Full-width sections with responsive text sizes and image layouts

---

## 12. DEPLOYMENT

### 12.1 Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

### 12.2 Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hostel_management
JWT_SECRET=your_secure_random_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name    # Optional
CLOUDINARY_API_KEY=your_api_key          # Optional
CLOUDINARY_API_SECRET=your_api_secret    # Optional
EMAIL_HOST=smtp.gmail.com               # Optional (blank for dev mode)
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:3000
```

### 12.3 Running the Backend

```bash
cd backend
npm install
npm run dev      # Development (nodemon auto-restart)
# or
node server.js   # Production
```

Server starts on `http://localhost:5000`.

### 12.4 Running the Frontend

```bash
cd frontend
npm install
npm run dev      # Development (Vite HMR)
```

Frontend starts on `http://localhost:3000` with proxy to backend.

### 12.5 Vite Proxy Configuration

`vite.config.js` proxies API calls to backend:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true },
    '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
  },
}
```

### 12.6 Production Build

```bash
cd frontend
npm run build    # Outputs to dist/ folder
```

The built `dist/` folder can be served by Express in production:

```javascript
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
```

---

## 13. STRENGTHS

1. **Comprehensive Feature Set** — Covers room management, fees, complaints, inventory, attendance, leave, announcements, and applications in a single system

2. **Role-Based Architecture** — Clean separation of admin, staff, and student functionality at both frontend (layouts, routes) and backend (middleware) levels

3. **3-Way Data Synchronization** — Room assignment keeps Application, Student, and Room models in sync, preventing stale or inconsistent data

4. **Real-Time Dashboard** — Admin dashboard uses actual MongoDB aggregation on Payment collection for revenue charts, not dummy data

5. **Reusable Component Library** — 11 common components (Table, Modal, Button, Badge, etc.) ensure UI consistency and reduce code duplication

6. **Secure Authentication** — JWT tokens, bcrypt password hashing, role-based middleware, 401 interceptors, password reset with hashed tokens

7. **Production-Ready Error Handling** — Try-catch in all controllers, proper HTTP status codes, user-friendly error messages

8. **File Upload System** — Multer-based with size limits, type validation, separate directories per entity

9. **Responsive Design** — Works across desktop, tablet, and mobile with Tailwind's responsive utilities

10. **Modern Development Stack** — Vite for fast builds, Tailwind for utility-first CSS, Chart.js for data visualization

11. **21 Data Models** — Comprehensive schema design with indexes, virtuals, pre-save hooks, and validation

12. **70+ API Endpoints** — Complete REST API covering all CRUD operations and business logic

13. **Clean Code Organization** — Consistent file naming (model.js, controller.js, routes.js), MVC-like pattern

14. **Offline Development Support** — Mock login credentials in AuthContext allow frontend development without backend

---

## 14. LIMITATIONS

1. **No Real-Time Updates** — Uses polling/refetch rather than WebSockets; complaint status changes require page refresh

2. **No Payment Gateway** — Payment recording is manual (admin enters cash/cheque/UPI details); no integrated online payment like Razorpay or Stripe

3. **Limited Email Service** — Password reset emails work, but no email notifications for complaint updates, fee reminders, or leave approvals

4. **Some Mock Data Remains** — Staff dashboard and some student pages still use mock data from custom hooks rather than real API calls

5. **No Automated Testing** — No unit tests, integration tests, or end-to-end tests

6. **No Rate Limiting** — API endpoints lack rate limiting, making them vulnerable to brute-force or abuse

7. **No Input Sanitization** — While express-validator is used for applications, other endpoints rely on Mongoose schema validation only

8. **Single-File Uploads** — Each entity supports only one image; no multi-image upload for complaints or rooms

9. **No Audit Trail** — Beyond StudentHistory, there is no comprehensive audit log for admin actions

10. **No Data Export** — No CSV/PDF export functionality for reports, fee invoices, or attendance records

11. **No Notifications System (Frontend)** — Notification model exists in the backend but is not implemented in the frontend

12. **No Pagination on Some Endpoints** — Announcements and blocks return all records without pagination

---

## 15. FUTURE IMPROVEMENTS

1. **Real-Time Features** — Implement Socket.IO for live complaint status updates, new announcement alerts, and chat between students and wardens

2. **Online Payment Integration** — Add Razorpay/Stripe for students to pay fees directly from the portal

3. **Push Notifications** — Browser push notifications for fee reminders, complaint updates, and leave approvals

4. **Email Notifications Pipeline** — Automated emails for: application approval, room assignment, invoice generation, complaint resolution

5. **PDF Generation** — Fee receipts, invoice PDFs, and attendance reports downloadable as PDF

6. **Advanced Reporting** — Exportable CSV/Excel reports, date-range filters, department-wise analytics

7. **Mobile App** — React Native companion app for students (attendance, complaints, fees on the go)

8. **Testing Suite** — Jest + Supertest for backend API tests, React Testing Library for frontend components

9. **Rate Limiting & Security** — Add express-rate-limit, helmet for HTTP headers, and input sanitization with DOMPurify

10. **Biometric/QR Attendance** — QR code check-in system or biometric integration for attendance marking

11. **Room Swap Requests** — Allow students to request room transfers/swaps

12. **Mess Menu Management** — Weekly menu planning with meal preference tracking

13. **Visitor Pre-Registration** — Allow students to pre-register expected visitors

14. **Full Notification System** — Implement the existing Notification model with in-app notification center, read/unread tracking

15. **Dark Mode** — Add theme toggle using Tailwind's dark mode classes

16. **Multi-Language Support** — i18n for Urdu/English toggle

17. **Docker Deployment** — Dockerfile and docker-compose for one-command deployment

18. **CI/CD Pipeline** — GitHub Actions for automated testing, linting, and deployment

---

## FILE COUNT SUMMARY

| Category | Files |
|----------|-------|
| Backend Models | 21 |
| Backend Controllers | 11 |
| Backend Routes | 11 |
| Backend Middleware | 8 |
| Backend Config/Utils | 4 |
| Backend Entry | 1 (server.js) |
| Frontend Pages | 28 |
| Frontend Components | 18 |
| Frontend Layouts | 3 |
| Frontend Context/Routes | 2 |
| Frontend Entry/Config | 4 (main.jsx, App.jsx, api/index.js, vite.config.js) |
| Frontend Styles | 1 (index.css) |
| **Total Source Files** | **~112** |
| **API Endpoints** | **70+** |
| **Database Collections** | **21** |

---

*Report generated by automated project analysis. All information is derived from actual source code inspection.*
