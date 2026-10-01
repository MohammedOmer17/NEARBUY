const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const customerRoutes = require("./routes/CustomerRoutes");
const shopOwnerRoutes = require("./routes/shopOwnerRoutes");

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/User", customerRoutes);
app.use("/shop-owner", shopOwnerRoutes);


module.exports = app;