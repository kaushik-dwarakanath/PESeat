import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true },
  studentId: { type: String, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model("User", userSchema);
