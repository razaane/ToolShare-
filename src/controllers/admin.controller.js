const adminService = require("../services/admin.service");

const listReservations = async (req, res, next) => {
  try {
    const data = await adminService.listAllReservations(req.query);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await adminService.getStats() });
  } catch (err) { next(err); }
};

module.exports = { listReservations, getStats };