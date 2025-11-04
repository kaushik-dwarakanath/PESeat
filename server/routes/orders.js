import express from "express";
import Order from "../models/Order.js";
import Item from "../models/MenuItems.js";
import { verifyJWT } from "../middleware/auth.js";
import Counter from "../models/Counter.js";

const router = express.Router();

async function generateDailyOrderNumber() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;

  const doc = await Counter.findOneAndUpdate(
    { dateKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PES-${doc.seq}`;
}

router.get("/last", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const lastOrder = await Order.findOne({ userId, status: { $ne: "cart" } })
      .sort({ createdAt: -1 });
    res.status(200).json(lastOrder || null);
  } catch (error) {
    res.status(500).json({ message: "Error fetching last order" });
  }
});

router.get("/", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId, status: { $ne: "cart" } }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.post("/checkout", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Order.findOne({ userId, status: "cart" });
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    cart.items.forEach((li) => { li.lineTotal = (li.unitPrice || 0) * (li.quantity || 0); });
    const subtotal = cart.items.reduce((sum, li) => sum + (li.lineTotal || 0), 0);
    cart.subtotal = subtotal;
    cart.tax = 0;
    cart.total = subtotal;

    cart.status = "placed";
    cart.paymentStatus = "paid";
    cart.fulfillmentStatus = "making";
    cart.orderNumber = await generateDailyOrderNumber();
    await cart.save();

    await Promise.all(cart.items.map((li) =>
      Item.findByIdAndUpdate(li.item, { $inc: { total_orders: li.quantity } })
    ));

    res.status(200).json({ message: "Order placed", orderNumber: cart.orderNumber, order: cart });
  } catch (error) {
    res.status(500).json({ message: "Error during checkout" });
  }
});

export default router;
