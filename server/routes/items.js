import express from "express";
import Item from "../models/MenuItems.js";

const router = express.Router();

// ✅ Fetch all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
});

// ✅ Fetch trending items
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const items = await Item.find().sort({ total_orders: -1 }).limit(limit);
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching trending items:", error);
    res.status(500).json({ message: "Error fetching trending items" });
  }
});

export default router;
