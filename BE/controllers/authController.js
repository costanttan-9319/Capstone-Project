import { User } from "../models/userModel.js";
import { sendResetEmail } from "../utils/emailService.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ==================== DATE HELPER FUNCTIONS ====================

// Convert DD/MM/YYYY to YYYY-MM-DD for MySQL storage
function convertToMySQLDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

// Convert YYYY-MM-DD to DD/MM/YYYY for API response
function formatDateToDMY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}/${year}`;
}

export const AuthController = {
 // ==================== SIGN UP ====================
  async signup(req, res) {
    try {
      let { email, username, date_of_birth, password } = req.body;

      // Validate required fields
      if (!email || !username || !date_of_birth || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 alphanumeric characters",
        });
      }

      // Convert date to MySQL format
      date_of_birth = convertToMySQLDate(date_of_birth);

      // Check if email already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check if username already exists
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Create user
      const userId = await User.create({
        email,
        username,
        date_of_birth,
        password,
      });

      // SURGERY: Added 'role: "user"' to the signup token so it matches login structure
      const token = jwt.sign({ id: userId, email, username, role: "user" }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        message: "User created successfully",
        token,
        user: { id: userId, email, username, role: "user" },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== LOGIN ====================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await User.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role, // This will now correctly pick up 'owner' from DB
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
 // ==================== UPDATE USER PROFILE ====================
  async updateProfile(req, res) {
    try {
      let { email, username, date_of_birth } = req.body;
      const userId = req.user.id;

      // Convert date to MySQL format
      const mysqlDate = convertToMySQLDate(date_of_birth);

      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({ error: "Email already taken" });
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        return res.status(400).json({ error: "Username already taken" });
      }

      await User.updateProfile(userId, {
        email,
        username,
        date_of_birth: mysqlDate,
      });

      res.json({
        message: "Profile updated successfully",
        user: { email, username, date_of_birth: formatDateToDMY(mysqlDate) },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== CHANGE PASSWORD ====================
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      const isValid = await User.verifyPassword(oldPassword, user.password);

      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await User.updatePassword(userId, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

 // ==================== GET CURRENT USER (PROTECTED) ====================
async getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format date if exists
    let formattedDate = null;
    if (user.date_of_birth) {
      const d = new Date(user.date_of_birth);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      formattedDate = `${day}/${month}/${year}`;
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      date_of_birth: formattedDate,
      role: user.role, // Correctly returns 'owner' or 'admin'
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: err.message });
  }
},

  // ==================== DELETE ACCOUNT ====================
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      await User.delete(userId);
      res.json({ message: "Account deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== FORGOT PASSWORD ====================
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Email not found" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await User.setResetToken(email, resetToken, expiresAt);
      await sendResetEmail(email, resetToken);

      res.json({ message: "Password reset link sent to your email" });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ error: "Failed to send reset email" });
    }
  },
// ==================== RESET PASSWORD ====================
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ error: "Token and new password required" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      // Optional: Add alphanumeric check
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
        return res
          .status(400)
          .json({ error: "Password must contain both letters and numbers" });
      }

      const user = await User.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      await User.updatePassword(user.id, newPassword);
      await User.clearResetToken(user.id);

      res.json({ message: "Password reset successful. Please login." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};