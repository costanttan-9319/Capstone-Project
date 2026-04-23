import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js"; // Added to check DB connection
import storeRoutes from "./routes/storeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ownershipRoutes from "./routes/ownershipRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== MOUNTING CHARACTERS ROUTES====================
app.use("/api/stores", storeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ownership", ownershipRoutes);

// ==================== ROOT HEALTH CHECKS ====================
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EatWhere Backend is Live" });
});

// ==================== START SERVER WITH DB CHECKS ====================
const startServer = async () => {
  try {
    // ==================== CONNECTION VERIFICATION WITH DB ====================
    const connection = await pool.getConnection();
    console.log("MySQL Database connected successfully");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(
      "Database connection failed. Server not started:",
      err.message,
    );
  }
};

startServer();
