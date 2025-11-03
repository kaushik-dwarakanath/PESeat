import express from "express";
import Order from "../models/Order.js";
import { verifyJWT } from "../middleware/auth.js";

const router = express.Router();

// Get last order of authenticated user
router.get("/last", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const lastOrder = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);
    res.status(200).json(lastOrder);
  } catch (error) {
    res.status(500).json({ message: "Error fetching last order" });
  }
});

export default router;
