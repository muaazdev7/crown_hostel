const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allowed frontend origins (local dev + production). CLIENT_URL lets you add
// the deployed frontend without editing code.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://crown-hostel.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser tools (no Origin header) and any allow-listed origin
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically at /uploads/*
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/applications", require("./routes/application.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/staff", require("./routes/staff.routes"));
app.use("/api/rooms", require("./routes/room.routes"));
app.use("/api/fees", require("./routes/fee.routes"));
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));
app.use("/api/maintenance", require("./routes/maintenance.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/visitors", require("./routes/visitor.routes"));
app.use("/api/visitor-requests", require("./routes/visitorRequest.routes"));
app.use("/api/bills", require("./routes/bill.routes"));
app.use("/api/salaries", require("./routes/salary.routes"));
app.use("/api/uploads", require("./routes/upload.routes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Hostel Management API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
