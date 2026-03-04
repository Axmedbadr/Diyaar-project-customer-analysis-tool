const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String },
  type: { type: String, required: true }, // Individuals, Shops, Supermarkets, Pre-Urban, SOFHA Health Centers
  items: [{
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
    // No price field
  }]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);