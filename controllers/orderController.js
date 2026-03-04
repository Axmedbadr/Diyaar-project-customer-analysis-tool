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

// POST route
router.post('/', addOrder);

// PUT route
router.put('/:id', updateOrder);

// DELETE route
router.delete('/:id', deleteOrder);

module.exports = router;