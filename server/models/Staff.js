import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: false, default: "Staff" },
  phone: { type: String, required: true, unique: true },
  role: { type: String, required: false, default: "staff" },
}, { timestamps: true });

export default mongoose.model("Staff", staffSchema);
