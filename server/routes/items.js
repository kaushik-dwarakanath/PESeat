import express from "express";
import Item from "../models/MenuItems.js";

const router = express.Router();

// Trending items
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const items = await Item.find().sort({ total_orders: -1 }).limit(limit);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trending items" });
  }
});

export default router;
