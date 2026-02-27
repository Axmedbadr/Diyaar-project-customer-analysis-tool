const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String },
  type: { type: String, required: true } // Individuals, Shops, Supermarkets, Pre-Urban
});

module.exports = mongoose.model("Order", orderSchema);