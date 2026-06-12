/**
 * @deprecated — This hook is no longer used.
 *
 * All student pages now fetch data directly from the backend via API calls:
 *   - Dashboard.jsx  → getStudentDashboard()
 *   - Profile.jsx    → getMyProfile()
 *   - MyRoom.jsx     → getMyRoom()
 *   - Leave.jsx      → getLeaves() + getAttendance()
 *   - Fees.jsx       → getInvoices() + getPayments() + getFeeStructures()
 *   - Complaints.jsx → getComplaints()
 *   - Application.jsx→ getMyApplications()
 *
 * This file is retained only for reference. It can be safely deleted.
 */

export const useStudentData = () => ({
  loading: false,
  error: null,
});
