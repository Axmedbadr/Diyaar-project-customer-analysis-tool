const express = require('express');
const router = express.Router();
const {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getStats,
  getPopularItems,
  searchOrdersByItem,
  getCustomerHistory
} = require('../controllers/orderController');

// GET routes
router.get('/', getOrders);
router.get('/stats', getStats);
router.get('/stats/items', getPopularItems);
router.get('/search/item', searchOrdersByItem);
router.get('/customer/:phone', getCustomerHistory);

// POST route - Create new order with items
router.post('/', addOrder);

// PUT route - Update order with items
router.put('/:id', updateOrder);

// DELETE route
router.delete('/:id', deleteOrder);

module.exports = router;