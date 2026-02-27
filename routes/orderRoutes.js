const express = require("express");
const router = express.Router();
const { getOrders, addOrder, updateOrder, deleteOrder, getStats } = require("../controllers/orderController");

// GET all orders, optional filter by type/date
router.get("/", getOrders);

// POST new order
router.post("/", addOrder);

// PUT update order by ID
router.put("/:id", updateOrder);

// DELETE order by ID
router.delete("/:id", deleteOrder);

// GET stats
router.get("/stats", getStats);

module.exports = router;