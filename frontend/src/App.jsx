import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { WardenRoute } from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import StudentLayout from './layouts/StudentLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyNotice from './pages/auth/VerifyNotice';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageStaff from './pages/admin/ManageStaff';
import ManageRooms from './pages/admin/ManageRooms';
import ManageFees from './pages/admin/ManageFees';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageInventory from './pages/admin/ManageInventory';
import ManageMaintenance from './pages/admin/ManageMaintenance';
import ManageVisitors from './pages/admin/ManageVisitors';
import ManageSalaries from './pages/admin/ManageSalaries';
import Applications from './pages/admin/Applications';
import Announcements from './pages/admin/Announcements';

// Billing (shared by Warden + Admin)
import BillingDashboard from './pages/billing/BillingDashboard';
import BillsList from './pages/billing/BillsList';
import BillMonthlyReport from './pages/billing/MonthlyReport';
import BillYearlyReport from './pages/billing/YearlyReport';


// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffComplaints from './pages/staff/Complaints';
import StaffInventory from './pages/staff/Inventory';
import StaffVisitors from './pages/staff/Visitors';
import StaffMaintenance from './pages/staff/Maintenance';
import StaffSalary from './pages/staff/Salary';
import StaffProfile from './pages/staff/Profile';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentApplication from './pages/student/Application';
import StudentRoom from './pages/student/MyRoom';
import StudentFees from './pages/student/Fees';
import StudentComplaints from './pages/student/Complaints';
import StudentLeave from './pages/student/Leave';
import StudentMaintenance from './pages/student/Maintenance';
import StudentVisitorRequests from './pages/student/VisitorRequests';
import StudentProfile from './pages/student/Profile';

// Shared Pages
import SharedAnnouncements from './pages/shared/Announcements';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}`} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/verify-notice" element={<VerifyNotice />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="staff" element={<ManageStaff />} />
        <Route path="rooms" element={<ManageRooms />} />
        <Route path="fees" element={<ManageFees />} />
        <Route path="complaints" element={<ManageComplaints />} />
        <Route path="inventory" element={<ManageInventory />} />
        <Route path="maintenance" element={<ManageMaintenance />} />
        <Route path="visitors" element={<ManageVisitors />} />
        <Route path="salaries" element={<ManageSalaries />} />
        <Route path="billing" element={<BillingDashboard />} />
        <Route path="billing/bills" element={<BillsList />} />
        <Route path="billing/monthly" element={<BillMonthlyReport />} />
        <Route path="billing/yearly" element={<BillYearlyReport />} />
        <Route path="applications" element={<Applications />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
        <Route index element={<StaffDashboard />} />
        <Route path="attendance" element={<WardenRoute><StaffAttendance /></WardenRoute>} />
        <Route path="complaints" element={<StaffComplaints />} />
        <Route path="inventory" element={<StaffInventory />} />
        <Route path="visitors" element={<WardenRoute><StaffVisitors /></WardenRoute>} />
        <Route path="billing" element={<WardenRoute><BillingDashboard /></WardenRoute>} />
        <Route path="billing/bills" element={<WardenRoute><BillsList /></WardenRoute>} />
        <Route path="maintenance" element={<StaffMaintenance />} />
        <Route path="salary" element={<StaffSalary />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="announcements" element={<SharedAnnouncements />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="application" element={<StudentApplication />} />
        <Route path="room" element={<StudentRoom />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="leave" element={<StudentLeave />} />
        <Route path="maintenance" element={<StudentMaintenance />} />
        <Route path="visitors" element={<StudentVisitorRequests />} />
        <Route path="announcements" element={<SharedAnnouncements />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Landing Page */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to={`/${user.role}`} />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
