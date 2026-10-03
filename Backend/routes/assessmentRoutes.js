const express = require("express");
const { authCustomer } = require("../Middlewares/authMiddleware");
const { assessShops } = require("../Controllers/assessmentController");

const router = express.Router();

router.post("/shops", authCustomer, assessShops);

module.exports = router;
