const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const authMiddleware = require("../Middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName, gender, dob, country } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, email, password: hashedPassword, fullName, gender, dob, country });
    await user.save();
    
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
  
      console.log("Login request received for:", username);
  
      const user = await User.findOne({ username });
      if (!user) {
        console.log("User not found in the database.");
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      console.log("User found:", user);
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Password does not match.");
        return res.status(400).json({ error: "Invalid credentials" });
      }
  
      console.log("Password matched, generating token...");

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      
      console.log("Token generated successfully.");
      res.json({ token });
  
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error
    })
    }  
})

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const user = await User.findOne({ $or: [{ username: query }, { email: query }] });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving user" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving profile" });
  }
});

module.exports = router;
