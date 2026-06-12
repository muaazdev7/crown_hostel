/**
 * @deprecated
 * All student mock data has moved to src/data/mockStudentData.js
 * and is now consumed via the useStudentData() hook.
 *
 * This file re-exports the old named exports so any code that still
 * imports from here continues to work without modification.
 */

import { studentData, img } from '../data/mockStudentData';

export { img };

export const mockProfile       = studentData.profile;
export const mockRoom          = studentData.room;
export const mockAllocation    = studentData.allocation;
export const mockRoomInventory = studentData.roomInventory;
export const mockInvoices      = studentData.fees.invoices;
export const mockPayments      = studentData.fees.payments;
export const mockFeeStructures = studentData.fees.structures;
export const mockComplaints    = studentData.complaints;
export const mockLeaves        = studentData.leaveRequests;
export const mockAttendance    = studentData.attendance;
export const mockApplications  = studentData.applications;
export const mockNotifications = studentData.notifications;
