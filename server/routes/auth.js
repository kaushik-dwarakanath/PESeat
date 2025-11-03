import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, studentId } = req.body;

    // Basic validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    // Check for duplicates
    const [emailExists, phoneExists, studentExists] = await Promise.all([
      User.findOne({ email }),
      phoneNumber ? User.findOne({ phoneNumber }) : null,
      studentId ? User.findOne({ studentId }) : null,
    ]);

    if (emailExists) return res.status(400).json({ message: "Email already registered" });
    if (phoneExists) return res.status(400).json({ message: "Phone number already registered" });
    if (studentExists) return res.status(400).json({ message: "SRN already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      fullName,
      email,
      phoneNumber,
      studentId,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    if (error?.code === 11000) {
      // Duplicate key error from MongoDB
      const dupField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({ message: `${dupField} already exists` });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Success — send token and user info (no password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});


export default router;
