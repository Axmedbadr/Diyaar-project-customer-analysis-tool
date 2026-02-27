const Order = require("../models/Order");

// GET all orders with optional filters
const getOrders = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let filter = {};

    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST a new order
const addOrder = async (req, res) => {
  try {
    const { orderDate, customerName, phoneNumber, type } = req.body;
    if (!orderDate || !customerName || !type) {
      return res.status(400).json({ error: "Order Date, Customer Name, and Type are required" });
    }
    const newOrder = new Order({ orderDate, customerName, phoneNumber, type });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE an order by ID
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE an order by ID
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET stats (number of orders per type)
const getStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getOrders, addOrder, updateOrder, deleteOrder, getStats };