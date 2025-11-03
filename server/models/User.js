import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, required: true },
  phoneNumber: { type: String, unique: true, required: true },
  studentId: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 6},
});

export default mongoose.model("User", userSchema);
