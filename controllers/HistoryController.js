import History  from "../models/History.js";
import AppError from "../utils/AppError.js";

/** GET /api/history */
export const getHistory = async (req, res, next) => {
  try {
    const data = await History.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/** POST /api/history */
export const saveSearch = async (req, res, next) => {
  const { courseName, analysisResult } = req.body;
  if (!courseName) return next(new AppError("courseName is required", 400));
  try {
    const entry = await new History({
      userId: req.user.userId,
      courseName,
      analysisResult: analysisResult || null,
    }).save();
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
};

/** DELETE /api/history/all */
export const deleteAllHistory = async (req, res, next) => {
  try {
    const r = await History.deleteMany({ userId: req.user.userId });
    res.json({ success: true, deletedCount: r.deletedCount });
  } catch (err) { next(err); }
};

/** DELETE /api/history/:id */
export const deleteHistoryItem = async (req, res, next) => {
  try {
    const r = await History.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!r) return next(AppError.notFound("History item"));
    res.json({ success: true });
  } catch (err) { next(err); }
};
