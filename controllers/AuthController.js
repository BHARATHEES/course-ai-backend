import User    from "../models/User.js";
import bcrypt  from "bcrypt";
import jwt     from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import AppError from "../utils/AppError.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sign = (userId, email) =>
  jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || "change-this-secret",
    { expiresIn: "7d" }
  );

// ── POST /api/auth ────────────────────────────────────────────────────────────
export const handleAuth = async (req, res, next) => {
  const { identifier, password } = req.validatedData || req.body;
  try {
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { email:    { $regex: new RegExp(`^${identifier}$`, "i") } },
      ],
    });
    if (!user) return next(AppError.notFound("Account"));
    if (user.password === "GOOGLE_ACCOUNT_NO_PASSWORD")
      return next(new AppError("Please sign in with Google", 400));

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return next(new AppError("Invalid password", 400));

    res.json({
      success: true,
      _id: user._id, name: user.name, username: user.username,
      email: user.email, picture: user.picture,
      passwordLastChanged: user.passwordLastChanged,
      token: sign(user._id.toString(), user.email),
    });
  } catch (err) { next(err); }
};

// ── POST /api/google-auth ─────────────────────────────────────────────────────
export const handleGoogleAuth = async (req, res, next) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token, audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      const username = (name || "user").replace(/\s+/g, "").toLowerCase()
        + Math.floor(1000 + Math.random() * 9000);
      user = await new User({ name, username, email, picture, password: "GOOGLE_ACCOUNT_NO_PASSWORD" }).save();
    } else {
      user.name = name; user.picture = picture;
      await user.save();
    }

    const needsPassword = user.password === "GOOGLE_ACCOUNT_NO_PASSWORD";
    res.json({
      success: true,
      _id: user._id, name: user.name, username: user.username,
      email: user.email, picture: user.picture, needsPassword,
      passwordLastChanged: user.passwordLastChanged,
      token: sign(user._id.toString(), user.email),
    });
  } catch (err) {
    next(new AppError("Google authentication failed", 400));
  }
};

// ── POST /api/set-password ────────────────────────────────────────────────────
export const setAccountPassword = async (req, res, next) => {
  const { email, username, password } = req.body;
  try {
    if (!username || username.length < 3)
      return next(new AppError("Username must be at least 3 characters", 400));
    if (!password || password.length < 6)
      return next(new AppError("Password must be at least 6 characters", 400));

    const lower = username.toLowerCase().trim();
    const taken = await User.findOne({ username: lower, email: { $ne: email } });
    if (taken) return next(new AppError("Username already taken", 409));

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { username: lower, password: hashed, passwordLastChanged: new Date() },
      { new: true }
    );
    if (!user) return next(AppError.notFound("User"));

    res.json({
      success: true,
      _id: user._id, name: user.name, username: user.username,
      email: user.email, picture: user.picture,
      passwordLastChanged: user.passwordLastChanged,
      token: sign(user._id.toString(), user.email),
    });
  } catch (err) { next(err); }
};

// ── PUT /api/update-password  (authenticated) ─────────────────────────────────
export const updatePassword = async (req, res, next) => {
  const { newPassword } = req.validatedData || req.body;
  const userId = req.user.userId;
  try {
    if (!newPassword || newPassword.length < 6)
      return next(new AppError("Password must be at least 6 characters", 400));

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashed, passwordLastChanged: new Date() },
      { new: true }
    );
    if (!user) return next(AppError.notFound("User"));

    res.json({ success: true, message: "Password updated", passwordLastChanged: user.passwordLastChanged });
  } catch (err) { next(err); }
};

// ── PUT /api/update-profile  (authenticated) ──────────────────────────────────
export const updateProfile = async (req, res, next) => {
  const { name, username } = req.validatedData || req.body;
  const userId = req.user.userId;
  try {
    if (!name || name.trim().length < 2)
      return next(new AppError("Name must be at least 2 characters", 400));
    if (!username || username.length < 3)
      return next(new AppError("Username must be at least 3 characters", 400));

    const lower = username.toLowerCase().trim();
    const taken = await User.findOne({ username: lower, _id: { $ne: userId } });
    if (taken) return next(new AppError("Username already taken", 409));

    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim(), username: lower },
      { new: true }
    );
    if (!user) return next(AppError.notFound("User"));

    res.json({
      success: true,
      _id: user._id, name: user.name, username: user.username,
      email: user.email, picture: user.picture,
    });
  } catch (err) { next(err); }
};
