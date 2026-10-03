const assessmentService = require("../services/assessmentService");

const assessShops = async (req, res) => {
  try {
    const result = await assessmentService.assessShops(req.user._id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to assess shops",
    });
  }
};

module.exports = {
  assessShops,
};
