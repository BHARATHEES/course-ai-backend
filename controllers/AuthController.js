import User from "../models/User.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Update Password from Profile
 */
export const updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date(); 

    const user = await User.findOneAndUpdate(
      { email },
      { 
        password: hashedPassword,
        passwordLastChanged: now 
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ 
      message: "Success", 
      passwordLastChanged: user.passwordLastChanged 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle Standard Username/Password Login
 */
export const handleAuth = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { email: { $regex: new RegExp(`^${identifier}$`, "i") } }
      ]
    });

    if (!user) return res.status(404).json({ message: "Account not found!" });

    if (user.password === "GOOGLE_ACCOUNT_NO_PASSWORD") {
      return res.status(400).json({ 
        message: "Please login with Google to finish setting up your account." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

    res.status(200).json({ 
      _id: user._id, // ADDED THIS
      name: user.name,
      username: user.username, 
      email: user.email, 
      picture: user.picture,
      passwordLastChanged: user.passwordLastChanged 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle Google Auth
 */
export const handleGoogleAuth = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (!user) {
      const suggestedUsername = (name || "user").replace(/\s+/g, '').toLowerCase() + Math.floor(1000 + Math.random() * 9000);
      
      user = new User({
        name: name,
        username: suggestedUsername,
        email: email,
        picture: picture,
        password: "GOOGLE_ACCOUNT_NO_PASSWORD"
      });
      await user.save();
    } else {
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    const needsPassword = user.password === "GOOGLE_ACCOUNT_NO_PASSWORD";

    res.status(200).json({ 
      _id: user._id, // ADDED THIS
      name: user.name,
      username: user.username, 
      email: user.email, 
      picture: user.picture,
      passwordLastChanged: user.passwordLastChanged,
      needsPassword 
    });
  } catch (error) {
    res.status(400).json({ message: "Google Auth Failed", error: error.message });
  }
};

/**
 * Set Custom Username & Password (Initial Setup)
 */
export const setAccountPassword = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    if (!username || username.length < 3) return res.status(400).json({ message: "Username must be at least 3 characters." });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const lowerUsername = username.toLowerCase().trim();
    
    const existingUser = await User.findOne({ 
      username: lowerUsername, 
      email: { $ne: email } 
    });

    if (existingUser) return res.status(400).json({ message: "This username is already taken. Try another!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.findOneAndUpdate(
      { email },
      { 
        username: lowerUsername, 
        password: hashedPassword,
        passwordLastChanged: new Date() 
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User record not found." });

    res.status(200).json({ 
      _id: user._id,
      message: "Profile finalized!",
      name: user.name,
      username: user.username,
      email: user.email,
      picture: user.picture,
      passwordLastChanged: user.passwordLastChanged
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};