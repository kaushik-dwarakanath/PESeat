import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image_url: String,
  rating: Number,
  total_orders: Number,
});

export default mongoose.model("Item", itemSchema);
