import { OwnershipRequest } from "../models/ownershipRequestModel.js";
import db from "../config/db.js";

export const AdminController = {
  // ==================== GET ALL PENDING REQUESTS ====================
  async getPendingRequests(req, res) {
    try {
      const requests = await OwnershipRequest.getPendingRequests();
      console.log(
        "🔵 [AdminController] Pending requests found:",
        requests.length,
      );
      res.json(requests);
    } catch (err) {
      console.error("🔴 [AdminController] Error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET ALL REQUESTS ====================
  async getAllRequests(req, res) {
    try {
      const requests = await OwnershipRequest.getPendingRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET PENDING REQUESTS COUNT ====================
  async getPendingCount(req, res) {
    try {
      const count = await OwnershipRequest.getPendingCount();
      res.json({ count });
    } catch (err) {
      console.error("🔴 [AdminController] Get pending count error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== APPROVE/STATUS REQUEST (ATOMIC TRANSACTION) ====================
  async approveRequest(req, res) {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;
      const { store_id, status } = req.body;

      console.log("🔴🔴🔴 [BACKEND] approveRequest called");
      console.log("🔴🔴🔴 [BACKEND] req.params.id:", id);
      console.log("🔴🔴🔴 [BACKEND] req.body:", req.body);
      console.log("🔴🔴🔴 [BACKEND] store_id:", store_id);
      console.log("🔴🔴🔴 [BACKEND] status:", status);

      // --- HANDLE REJECTION BRANCH ---
      if (status === "rejected") {
        await db.execute(
          "UPDATE ownership_requests SET status = 'rejected', notified = FALSE WHERE id = ?",
          [id]
        );
        return res.json({ message: "Request rejected successfully" });
      }

      // --- HANDLE APPROVAL BRANCH ---
      const request = await OwnershipRequest.getById(id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      console.log("🔴🔴🔴 [BACKEND] request.user_id:", request.user_id);
      console.log("🔴🔴🔴 [BACKEND] request.store_name:", request.store_name);

      const finalStoreId = store_id;
      if (!finalStoreId) {
        return res
          .status(400)
          .json({ error: "No Store ID provided for approval" });
      }

      console.log("🔴🔴🔴 [BACKEND] finalStoreId:", finalStoreId);
      console.log("🔴🔴🔴 [BACKEND] About to check if store exists...");

      // Check if store exists before updating
      const [storeCheck] = await connection.execute(
        "SELECT id, name FROM stores WHERE id = ?",
        [finalStoreId]
      );
      console.log("🔴🔴🔴 [BACKEND] Store check result:", storeCheck);

      if (storeCheck.length === 0) {
        console.log("🔴🔴🔴 [BACKEND] ERROR: Store ID", finalStoreId, "does not exist!");
        return res.status(400).json({ error: "Store ID does not exist" });
      }

      await connection.beginTransaction();

      // A. Promote User to Owner (always do this)
      const [userUpdateResult] = await connection.execute(
        "UPDATE users SET role = 'owner' WHERE id = ?",
        [request.user_id]
      );
      console.log("🔴🔴🔴 [BACKEND] User update result:", userUpdateResult);

      // B. Check if this store already has a primary owner
      const [existingOwner] = await connection.execute(
        "SELECT owner_id FROM stores WHERE id = ?",
        [finalStoreId]
      );
      const hasPrimaryOwner = existingOwner[0]?.owner_id !== null;
      console.log("🔴🔴🔴 [BACKEND] Store has primary owner?", hasPrimaryOwner);

      // B1. Only update stores.owner_id if NO primary owner exists
      if (!hasPrimaryOwner) {
        const [storeUpdateResult] = await connection.execute(
          "UPDATE stores SET owner_id = ? WHERE id = ?",
          [request.user_id, finalStoreId]
        );
        console.log("🔴🔴🔴 [BACKEND] Store update result (primary owner):", storeUpdateResult);
      } else {
        console.log("🔴🔴🔴 [BACKEND] Skipping store.owner_id update (co-owner case)");
      }

      // B2. ALWAYS add to store_owners bridge table (for both primary and co-owners)
      const [existingBridge] = await connection.execute(
        "SELECT id FROM store_owners WHERE user_id = ? AND store_id = ?",
        [request.user_id, finalStoreId]
      );
      
      if (existingBridge.length === 0) {
        const [bridgeInsertResult] = await connection.execute(
          `INSERT INTO store_owners (user_id, store_id, is_approved, approved_at) 
           VALUES (?, ?, TRUE, NOW())`,
          [request.user_id, finalStoreId]
        );
        console.log("🔴🔴🔴 [BACKEND] Bridge table insert result:", bridgeInsertResult);
      } else {
        console.log("🔴🔴🔴 [BACKEND] User already in store_owners, skipping insert");
      }

      // C. Update ownership_requests status with notified = FALSE
      const [requestUpdateResult] = await connection.execute(
        "UPDATE ownership_requests SET status = 'approved', notified = FALSE WHERE id = ?",
        [id]
      );
      console.log("🔴🔴🔴 [BACKEND] Request update result:", requestUpdateResult);

      await connection.commit();

      console.log("🔴🔴🔴 [BACKEND] Transaction COMMITTED successfully");

      return res.json({
        message: "One-Click Approval successful",
        store_id: finalStoreId,
      });
    } catch (err) {
      if (connection) await connection.rollback();
      console.error("Approve Error:", err);
      return res.status(500).json({ error: "Database transaction failed" });
    } finally {
      if (connection) connection.release();
    }
  },

  // ==================== REJECT REQUEST ====================
  async rejectRequest(req, res) {
    try {
      const { id } = req.params;
      await db.execute(
        'UPDATE ownership_requests SET status = "rejected", notified = FALSE WHERE id = ?',
        [id],
      );
      res.json({ message: "Request rejected successfully" });
    } catch (err) {
      console.error("Reject Error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};