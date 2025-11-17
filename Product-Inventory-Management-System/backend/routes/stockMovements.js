const express = require('express');
const router = express.Router();
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Get all stock movements with filters
router.get('/', protect, async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = 50 } = req.query;
    
    let query = {};
    if (productId) query.product = productId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const movements = await StockMovement.find(query)
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stock movements for a specific product
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const movements = await StockMovement.find({ product: req.params.productId })
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record a stock movement (sale, purchase, adjustment, etc.)
router.post('/', protect, async (req, res) => {
  try {
    const { productId, type, quantity, notes, reference } = req.body;
    
    // Get current product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const previousQuantity = product.quantity;
    let newQuantity;
    
    // Calculate new quantity based on movement type
    switch(type) {
      case 'sale':
      case 'damage':
        newQuantity = previousQuantity - Math.abs(quantity);
        break;
      case 'purchase':
      case 'return':
        newQuantity = previousQuantity + Math.abs(quantity);
        break;
      case 'adjustment':
        newQuantity = quantity; // Direct set
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid movement type' });
    }
    
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }
    
    // Create stock movement record
    const movement = new StockMovement({
      product: productId,
      type,
      quantity: Math.abs(quantity),
      previousQuantity,
      newQuantity,
      unitPrice: product.price,
      totalValue: product.price * Math.abs(quantity),
      notes,
      reference,
      performedBy: req.user.id
    });
    
    await movement.save();
    
    // Update product quantity
    product.quantity = newQuantity;
    await product.save();
    
    res.status(201).json({ 
      success: true, 
      data: movement,
      product: {
        id: product._id,
        name: product.name,
        newQuantity
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get analytics for stock movements
router.get('/analytics/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const movements = await StockMovement.find(dateFilter);
    
    const summary = {
      totalMovements: movements.length,
      byType: {},
      totalValue: 0
    };
    
    movements.forEach(movement => {
      if (!summary.byType[movement.type]) {
        summary.byType[movement.type] = { count: 0, quantity: 0, value: 0 };
      }
      summary.byType[movement.type].count++;
      summary.byType[movement.type].quantity += movement.quantity;
      summary.byType[movement.type].value += movement.totalValue || 0;
      summary.totalValue += movement.totalValue || 0;
    });
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

