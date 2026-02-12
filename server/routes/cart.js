import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Item from "../models/MenuItems.js";

const router = express.Router();

async function getOrCreateCart(userId) {
  // Allow users to add items to cart even if they have an active order
  // The checkout route will prevent placing a new order if there's an active one
  let cart = await Order.findOne({ userId, status: "cart" });
  if (!cart) {
    cart = await Order.create({ userId, status: "cart", items: [], subtotal: 0, tax: 0, total: 0 });
  }
  return cart;
}

function recomputeTotals(cart) {
  cart.items.forEach((li) => {
    li.lineTotal = li.unitPrice * li.quantity;
  });
  const subtotal = cart.items.reduce((sum, li) => sum + li.lineTotal, 0);
  const tax = 0;
  cart.subtotal = subtotal;
  cart.tax = tax;
  cart.total = subtotal + tax;
}

router.get("/", verifyJWT, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(500).json({ message: "Error fetching cart" });
  }
});

router.post("/items", verifyJWT, async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body || {};
    if (!itemId) return res.status(400).json({ message: "itemId required" });
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const cart = await getOrCreateCart(req.user.id);
    const existing = cart.items.find((li) => String(li.item) === String(itemId));
    if (existing) {
      existing.quantity += Number(quantity) || 1;
    } else {
      cart.items.push({
        item: item._id,
        name: item.name,
        unitPrice: item.price,
        quantity: Number(quantity) || 1,
        lineTotal: item.price * (Number(quantity) || 1),
        image_url: item.image_url,
      });
    }
    recomputeTotals(cart);
    await cart.save();
    res.json(cart);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(500).json({ message: "Error adding item to cart" });
  }
});

router.patch("/items/:itemId", verifyJWT, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body || {};
  const cart = await getOrCreateCart(req.user.id);
    const idx = cart.items.findIndex((li) => String(li.item) === String(itemId));
    if (idx === -1) return res.status(404).json({ message: "Item not in cart" });
    if (!quantity || quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Number(quantity);
    }
    recomputeTotals(cart);
    await cart.save();
    res.json(cart);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(500).json({ message: "Error updating cart item" });
  }
});

router.delete("/items/:itemId", verifyJWT, async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter((li) => String(li.item) !== String(itemId));
    recomputeTotals(cart);
    await cart.save();
    res.json(cart);
  } catch (err) {
    if (err && err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    res.status(500).json({ message: "Error removing cart item" });
  }
});

export default router;


