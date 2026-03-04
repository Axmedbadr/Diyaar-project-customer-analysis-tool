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
    
    console.log(`📦 Found ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST a new order with items
const addOrder = async (req, res) => {
  try {
    const { orderDate, customerName, phoneNumber, type, items } = req.body;
    
    // Validate required fields
    if (!orderDate || !customerName || !type) {
      return res.status(400).json({ error: "Order Date, Customer Name, and Type are required" });
    }
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must have at least one item" });
    }
    
    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName || !item.quantity) {
        return res.status(400).json({ 
          error: `Item at position ${i + 1} is missing name or quantity` 
        });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ 
          error: `Item at position ${i + 1} must have quantity greater than 0` 
        });
      }
    }
    
    // Create new order with items
    const newOrder = new Order({ 
      orderDate, 
      customerName, 
      phoneNumber, 
      type,
      items: items
    });
    
    await newOrder.save();
    console.log('✅ New order created:', {
      id: newOrder._id,
      customer: newOrder.customerName,
      itemsCount: newOrder.items.length
    });
    
    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Error adding order:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE an order by ID
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderDate, customerName, phoneNumber, type, items } = req.body;
    
    // Validate items if they are being updated
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must have at least one item" });
      }
      
      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.itemName || !item.quantity) {
          return res.status(400).json({ 
            error: `Item at position ${i + 1} is missing name or quantity` 
          });
        }
        if (item.quantity <= 0) {
          return res.status(400).json({ 
            error: `Item at position ${i + 1} must have quantity greater than 0` 
          });
        }
      }
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      { orderDate, customerName, phoneNumber, type, items }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    console.log('✅ Order updated:', {
      id: updatedOrder._id,
      customer: updatedOrder.customerName,
      itemsCount: updatedOrder.items?.length || 0
    });
    
    res.json(updatedOrder);
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE an order by ID
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    console.log('🗑️ Order deleted:', id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET stats (number of orders per type)
const getStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 Stats calculated:', stats);
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET popular items statistics
const getPopularItems = async (req, res) => {
  try {
    const popularItems = await Order.aggregate([
      // Unwind the items array to work with each item separately
      { $unwind: "$items" },
      
      // Group by item name and calculate totals
      { $group: {
          _id: "$items.itemName",
          totalQuantity: { $sum: "$items.quantity" },
          numberOfOrders: { $sum: 1 },
          // Get the first customer who ordered this item (optional)
          customers: { $addToSet: "$customerName" }
        }
      },
      
      // Sort by total quantity (most popular first)
      { $sort: { totalQuantity: -1 } },
      
      // Add a field for average quantity per order
      { $addFields: {
          avgPerOrder: { $divide: ["$totalQuantity", "$numberOfOrders"] }
        }
      }
    ]);
    
    console.log('📊 Popular items calculated:', popularItems.length);
    res.json(popularItems);
  } catch (err) {
    console.error("Error fetching popular items:", err);
    res.status(500).json({ error: err.message });
  }
};

// Search orders by item name
const searchOrdersByItem = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: "Item name is required" });
    }
    
    const orders = await Order.find({
      "items.itemName": { $regex: name, $options: 'i' }
    }).sort({ orderDate: -1 });
    
    console.log(`🔍 Found ${orders.length} orders containing "${name}"`);
    res.json(orders);
  } catch (err) {
    console.error("Error searching orders by item:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get customer order history by phone number
const getCustomerHistory = async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    
    const orders = await Order.find({ phoneNumber: phone })
      .sort({ orderDate: -1 });
    
    // Calculate total kg per item for this customer
    const itemSummary = {};
    let totalKg = 0;
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSummary[item.itemName]) {
          itemSummary[item.itemName] = 0;
        }
        itemSummary[item.itemName] += item.quantity;
        totalKg += item.quantity;
      });
    });
    
    // Format item summary for response
    const itemSummaryArray = Object.keys(itemSummary).map(itemName => ({
      itemName,
      totalQuantity: itemSummary[itemName]
    }));
    
    const response = {
      customer: orders.length > 0 ? orders[0].customerName : null,
      phoneNumber: phone,
      totalOrders: orders.length,
      totalKg: totalKg,
      orders: orders,
      itemSummary: itemSummaryArray
    };
    
    console.log(`📞 Customer history for ${phone}: ${orders.length} orders`);
    res.json(response);
  } catch (err) {
    console.error("Error fetching customer history:", err);
    res.status(500).json({ error: err.message });
  }
};

// Export all functions
module.exports = {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getStats,
  getPopularItems,
  searchOrdersByItem,
  getCustomerHistory
};