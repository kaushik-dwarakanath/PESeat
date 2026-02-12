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

router.get("/staff", verifyJWT, async (req, res) => {
  try {
    if (!req.user?.staff) return res.status(403).json({ message: "Forbidden" });
    const orders = await Order.find({ status: "placed" }).sort({ pickupTime: 1, createdAt: 1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching staff orders', error);
    res.status(500).json({ message: "Error fetching staff orders" });
  }
});

router.put('/:id/ready', verifyJWT, async (req, res) => {
  try {
    if (!req.user?.staff) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'placed') return res.status(400).json({ message: 'Order is not in placed status' });
    if (order.fulfillmentStatus === 'ready') return res.status(400).json({ message: 'Order already marked ready' });

    order.fulfillmentStatus = 'ready';
    await order.save();
    res.status(200).json({ message: 'Order marked ready', order });
  } catch (err) {
    console.error('Error marking order ready', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/collect', verifyJWT, async (req, res) => {
  try {
    if (!req.user?.staff) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'placed') return res.status(400).json({ message: 'Order is not in placed status' });
    if (order.fulfillmentStatus !== 'ready') return res.status(400).json({ message: 'Order must be ready before marking collected' });

    order.fulfillmentStatus = 'collected';
    order.status = 'completed';
    await order.save();
    res.status(200).json({ message: 'Order marked collected', order });
  } catch (err) {
    console.error('Error marking order collected', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/checkout", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pickupTime } = req.body;
    const cart = await Order.findOne({ userId, status: "cart" });
    const activeOrder = await Order.findOne({
      userId,
      status: "placed",
      fulfillmentStatus: { $in: ["making", "ready"] },
    });
    if (activeOrder) {
      return res.status(400).json({ message: "You already have an active order. Please collect it before placing a new one." });
    }

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!pickupTime) {
      return res.status(400).json({ message: "Pickup time is required" });
    }

    const now = new Date();
    const selectedPickupTime = new Date(pickupTime);

    if (isNaN(selectedPickupTime.getTime())) {
      return res.status(400).json({ message: "Invalid pickup time format" });
    }

    const minPickupTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (selectedPickupTime < minPickupTime) {
      return res.status(400).json({ 
        message: "Pickup time must be at least 30 minutes from the time of ordering" 
      });
    }

    const openTime = new Date(selectedPickupTime);
    openTime.setHours(8, 0, 0, 0);
    const closeTime = new Date(selectedPickupTime);
    closeTime.setHours(17, 0, 0, 0);

    const pickupDate = new Date(selectedPickupTime);
    pickupDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate.getTime() !== today.getTime()) {
      return res.status(400).json({ 
        message: "Pickup time must be on the same day as the order" 
      });
    }

    const pickupHour = selectedPickupTime.getHours();
    const pickupMinutes = selectedPickupTime.getMinutes();
    const pickupTimeMinutes = pickupHour * 60 + pickupMinutes;
    const openTimeMinutes = 8 * 60;
    const closeTimeMinutes = 17 * 60;

    if (pickupTimeMinutes < openTimeMinutes || pickupTimeMinutes > closeTimeMinutes) {
      return res.status(400).json({ 
        message: "Pickup time must be between 8:00 AM and 5:00 PM" 
      });
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
    cart.pickupTime = selectedPickupTime;
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
