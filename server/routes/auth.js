import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Otp from "../models/Otp.js";

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

router.post('/staff/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    const cleaned = String(phone).replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(cleaned)) return res.status(400).json({ message: 'Invalid phone number' });

    const staff = await Staff.findOne({ phone: cleaned });
    if (!staff) return res.status(400).json({ message: 'No staff account found for this phone' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({ phone: cleaned, code, expiresAt });

    let toNumber;
    if (cleaned.length === 10) toNumber = '+91' + cleaned;
    else if (cleaned.startsWith('0')) toNumber = '+' + cleaned.replace(/^0+/, '');
    else toNumber = '+' + cleaned;

    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (sid && token && from) {
      try {
        const twilioModule = await import('twilio');
        const client = twilioModule.default(sid, token);
        await client.messages.create({ body: `Your PESeat staff OTP is ${code}`, from, to: toNumber });
      } catch (err) {
        console.error('Twilio send error:', err.message || err);
        return res.status(500).json({ message: 'Failed to send OTP via SMS' });
      }
    } else {
      console.log(`DEV OTP for ${cleaned}: ${code}`);
    }

    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/staff/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and otp are required' });

    const cleaned = String(phone).replace(/\D/g, '');

    const record = await Otp.findOne({ phone: cleaned, code: String(otp), used: false }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const staff = await Staff.findOne({ phone: cleaned });
    if (!staff) return res.status(400).json({ message: 'No staff account found for this phone' });

    record.used = true;
    await record.save();

    const token = jwt.sign({ id: staff._id, staff: true }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'OTP verified', token, user: { id: staff._id, name: staff.name, phone: staff.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
