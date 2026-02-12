import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  dateKey: { type: String, required: true, unique: true }, // e.g., YYYYMMDD
  seq: { type: Number, required: true, default: 0 },
});

export default mongoose.model("Counter", counterSchema);


