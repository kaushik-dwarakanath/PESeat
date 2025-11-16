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
    const { pickupTime } = req.body;
    const cart = await Order.findOne({ userId, status: "cart" });
    
    //-------------------------------------------------------------------------------------------
    // Prevent multiple active orders: user may not place a new order
    // if they already have an order with status 'placed' that is not collected/cancelled.
    const activeOrder = await Order.findOne({
      userId,
      status: "placed",
      fulfillmentStatus: { $in: ["making", "ready"] },
    });
    if (activeOrder) {
      return res.status(400).json({ message: "You already have an active order. Please collect it before placing a new one." });
    }

    //-------------------------------------------------------------------------------------------
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate pickup time
    if (!pickupTime) {
      return res.status(400).json({ message: "Pickup time is required" });
    }

    const now = new Date();
    const selectedPickupTime = new Date(pickupTime);
    
    // Validate that pickup time is a valid date
    if (isNaN(selectedPickupTime.getTime())) {
      return res.status(400).json({ message: "Invalid pickup time format" });
    }

    // Validate minimum 30 minutes from now
    const minPickupTime = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 minutes
    if (selectedPickupTime < minPickupTime) {
      return res.status(400).json({ 
        message: "Pickup time must be at least 30 minutes from the time of ordering" 
      });
    }

    // Validate canteen hours: 8am to 5pm
    const openTime = new Date(selectedPickupTime);
    openTime.setHours(8, 0, 0, 0);
    const closeTime = new Date(selectedPickupTime);
    closeTime.setHours(17, 0, 0, 0);

    // Check if pickup time is on the same day
    const pickupDate = new Date(selectedPickupTime);
    pickupDate.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate.getTime() !== today.getTime()) {
      return res.status(400).json({ 
        message: "Pickup time must be on the same day as the order" 
      });
    }

    // Check if within canteen hours
    const pickupHour = selectedPickupTime.getHours();
    const pickupMinutes = selectedPickupTime.getMinutes();
    const pickupTimeMinutes = pickupHour * 60 + pickupMinutes;
    const openTimeMinutes = 8 * 60; // 8:00 AM
    const closeTimeMinutes = 17 * 60; // 5:00 PM (17:00)

    if (pickupTimeMinutes < openTimeMinutes || pickupTimeMinutes > closeTimeMinutes) {
      return res.status(400).json({ 
        message: "Pickup time must be between 8:00 AM and 5:00 PM" 
      });
    }

    //-------------------------------------------------------------------------------------------
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
