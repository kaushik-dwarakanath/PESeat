import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true },
  image_url: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  status: { type: String, enum: ["cart", "placed"], default: "cart", index: true },
  fulfillmentStatus: { type: String, enum: ["making", "ready", "collected", "cancelled"], default: "making" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  orderDayKey: { type: String },
  orderNumber: { type: String },
  items: { type: [lineItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
