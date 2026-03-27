import Favorite from "../models/Favorite.js";
import AppError  from "../utils/AppError.js";

/** GET /api/favorites */
export const getFavorites = async (req, res, next) => {
  try {
    const data = await Favorite.find({ userId: req.user.userId }).sort({ addedAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/** POST /api/favorites */
export const addFavorite = async (req, res, next) => {
  const { courseName, analysisResult, notes } = req.body;
  if (!courseName) return next(new AppError("courseName is required", 400));
  try {
    const exists = await Favorite.findOne({ userId: req.user.userId, courseName });
    if (exists) return next(new AppError("Already in favorites", 409));
    const fav = await new Favorite({
      userId: req.user.userId,
      courseName,
      analysisResult: analysisResult || null,
      notes: notes || "",
    }).save();
    res.status(201).json({ success: true, data: fav });
  } catch (err) { next(err); }
};

/** DELETE /api/favorites  (body: { courseName }) */
export const removeFavorite = async (req, res, next) => {
  const { courseName } = req.body;
  if (!courseName) return next(new AppError("courseName is required", 400));
  try {
    const r = await Favorite.deleteOne({ userId: req.user.userId, courseName });
    if (r.deletedCount === 0) return next(AppError.notFound("Favorite"));
    res.json({ success: true });
  } catch (err) { next(err); }
};

/** PUT /api/favorites/:id */
export const updateFavorite = async (req, res, next) => {
  try {
    const fav = await Favorite.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { notes: req.body.notes, rating: req.body.rating },
      { new: true }
    );
    if (!fav) return next(AppError.notFound("Favorite"));
    res.json({ success: true, data: fav });
  } catch (err) { next(err); }
};

/** GET /api/favorites-check?courseName=... */
export const isFavorited = async (req, res, next) => {
  const { courseName } = req.query;
  if (!courseName) return next(new AppError("courseName is required", 400));
  try {
    const fav = await Favorite.findOne({ userId: req.user.userId, courseName });
    res.json({ success: true, isFavorited: !!fav });
  } catch (err) { next(err); }
};
