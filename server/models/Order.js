import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  item_name: String,
  quantity: Number,
  total_price: Number,
  final_amount: Number,
  status: String,
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
