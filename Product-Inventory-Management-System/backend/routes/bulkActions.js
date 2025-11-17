const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// Bulk update products
router.post('/products/update', protect, async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Updates are required' });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates }
    );
    
    // Log activity
    await new ActivityLog({
      user: req.user.id,
      action: 'bulk-action',
      entity: 'product',
      description: `Bulk updated ${result.modifiedCount} products`,
      metadata: { productIds, updates }
    }).save();
    
    res.json({ 
      success: true, 
      message: `Successfully updated ${result.modifiedCount} products`,
      data: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk delete products
router.post('/products/delete', protect, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }
    
    const result = await Product.deleteMany({ _id: { $in: productIds } });
    
    // Log activity
    await new ActivityLog({
      user: req.user.id,
      action: 'bulk-action',
      entity: 'product',
      description: `Bulk deleted ${result.deletedCount} products`,
      metadata: { productIds }
    }).save();
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} products`,
      data: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk price adjustment
router.post('/products/adjust-price', protect, async (req, res) => {
  try {
    const { productIds, adjustmentType, value } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }
    
    if (!adjustmentType || !['percentage', 'fixed'].includes(adjustmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }
    
    if (!value || isNaN(value)) {
      return res.status(400).json({ success: false, message: 'Valid adjustment value is required' });
    }
    
    const products = await Product.find({ _id: { $in: productIds } });
    let updatedCount = 0;
    
    for (const product of products) {
      if (adjustmentType === 'percentage') {
        product.price = product.price * (1 + value / 100);
      } else {
        product.price = product.price + value;
      }
      
      if (product.price < 0) product.price = 0;
      await product.save();
      updatedCount++;
    }
    
    // Log activity
    await new ActivityLog({
      user: req.user.id,
      action: 'bulk-action',
      entity: 'product',
      description: `Bulk price adjustment: ${adjustmentType} ${value}${adjustmentType === 'percentage' ? '%' : '$'} on ${updatedCount} products`,
      metadata: { productIds, adjustmentType, value }
    }).save();
    
    res.json({ 
      success: true, 
      message: `Successfully adjusted prices for ${updatedCount} products`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk category change
router.post('/products/change-category', protect, async (req, res) => {
  try {
    const { productIds, categoryId } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }
    
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }
    
    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { category: categoryId } }
    );
    
    // Log activity
    await new ActivityLog({
      user: req.user.id,
      action: 'bulk-action',
      entity: 'product',
      description: `Moved ${result.modifiedCount} products to category "${category.name}"`,
      metadata: { productIds, categoryId, categoryName: category.name }
    }).save();
    
    res.json({ 
      success: true, 
      message: `Successfully moved ${result.modifiedCount} products to "${category.name}"`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk export products to CSV
router.post('/products/export-csv', protect, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    let query = {};
    if (productIds && productIds.length > 0) {
      query._id = { $in: productIds };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name');
    
    // Generate CSV with custom format
    const headers = [
      'Product ID', 
      'Name', 
      'Category', 
      'Supplier', 
      'Price (₹)', 
      'Quantity', 
      'Total Value (₹)', 
      'Low Stock Alert', 
      'Status', 
      'Date Added', 
      'Last Updated'
    ];
    
    const rows = products.map(p => {
      const totalValue = (p.price * p.quantity).toFixed(2);
      const lowStockAlert = p.quantity < 10 ? 'Yes' : 'No';
      
      // Determine status
      let status = 'Active';
      if (p.quantity === 0) {
        status = 'Out of Stock';
      } else if (p.discontinued) {
        status = 'Discontinued';
      }
      
      return [
        p._id,
        p.name,
        p.category?.name || 'N/A',
        p.supplier || 'N/A',
        p.price.toFixed(2),
        p.quantity,
        totalValue,
        lowStockAlert,
        status,
        new Date(p.createdAt).toLocaleDateString('en-GB'), // DD/MM/YYYY
        new Date(p.updatedAt).toLocaleDateString('en-GB')  // DD/MM/YYYY
      ];
    });
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Log activity
    await new ActivityLog({
      user: req.user.id,
      action: 'export',
      entity: 'product',
      description: `Exported ${products.length} products to CSV`
    }).save();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

