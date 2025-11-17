const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const StockMovement = require('../models/StockMovement');
const { protect } = require('../middleware/auth');

// Get comprehensive dashboard analytics
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get all products with populated data
    const products = await Product.find()
      .populate('category', 'name');
    
    // Basic inventory stats
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalCost = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.quantity), 0);
    const totalProfit = totalValue - totalCost;
    
    // Low stock products
    const lowStockProducts = products.filter(p => p.quantity < p.lowStockThreshold);
    
    // Out of stock products
    const outOfStockProducts = products.filter(p => p.quantity === 0);
    
    // Expiring products
    const expiringProducts = products.filter(p => {
      if (!p.hasExpiry || !p.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });
    
    // Expired products
    const expiredProducts = products.filter(p => {
      if (!p.hasExpiry || !p.expiryDate) return false;
      return new Date(p.expiryDate) < new Date();
    });
    
    // Value by category
    const categories = await Category.find();
    const categoryData = categories.map(cat => {
      const categoryProducts = products.filter(p => p.category && p.category._id.toString() === cat._id.toString());
      const value = categoryProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const quantity = categoryProducts.reduce((sum, p) => sum + p.quantity, 0);
      return {
        name: cat.name,
        productCount: categoryProducts.length,
        quantity,
        value
      };
    }).filter(c => c.productCount > 0);
    
    // Recent stock movements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMovements = await StockMovement.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('product', 'name');
    
    // Movement trends
    const movementsByType = {};
    recentMovements.forEach(movement => {
      if (!movementsByType[movement.type]) {
        movementsByType[movement.type] = { count: 0, totalQuantity: 0, totalValue: 0 };
      }
      movementsByType[movement.type].count++;
      movementsByType[movement.type].totalQuantity += movement.quantity;
      movementsByType[movement.type].totalValue += movement.totalValue || 0;
    });
    
    // Top products by value
    const topProductsByValue = [...products]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 10)
      .map(p => ({
        id: p._id,
        name: p.name,
        category: p.category?.name,
        quantity: p.quantity,
        value: p.price * p.quantity
      }));
    
    res.json({
      success: true,
      data: {
        inventory: {
          totalProducts,
          totalQuantity,
          totalValue,
          totalCost,
          totalProfit,
          profitMargin: totalValue > 0 ? ((totalProfit / totalValue) * 100).toFixed(2) : 0
        },
        alerts: {
          lowStock: lowStockProducts.length,
          outOfStock: outOfStockProducts.length,
          expiringSoon: expiringProducts.length,
          expired: expiredProducts.length
        },
        categoryBreakdown: categoryData,
        topProducts: topProductsByValue,
        recentActivity: {
          totalMovements: recentMovements.length,
          byType: movementsByType
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory valuation report
router.get('/valuation', protect, async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    
    const valuation = {
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
      totalStockValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      totalCostValue: products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.quantity), 0),
      totalProfit: 0,
      byCategory: []
    };
    
    valuation.totalProfit = valuation.totalStockValue - valuation.totalCostValue;
    valuation.profitMargin = valuation.totalStockValue > 0 
      ? ((valuation.totalProfit / valuation.totalStockValue) * 100).toFixed(2) 
      : 0;
    
    // Group by category
    const categoryMap = {};
    products.forEach(product => {
      const catName = product.category?.name || 'Uncategorized';
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          category: catName,
          productCount: 0,
          quantity: 0,
          stockValue: 0,
          costValue: 0,
          profit: 0
        };
      }
      categoryMap[catName].productCount++;
      categoryMap[catName].quantity += product.quantity;
      categoryMap[catName].stockValue += product.price * product.quantity;
      categoryMap[catName].costValue += (product.costPrice || 0) * product.quantity;
      categoryMap[catName].profit = categoryMap[catName].stockValue - categoryMap[catName].costValue;
    });
    
    valuation.byCategory = Object.values(categoryMap);
    
    res.json({ success: true, data: valuation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get low stock alert data
router.get('/alerts/low-stock', protect, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lt: ['$quantity', '$lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ quantity: 1 });
    
    res.json({ success: true, data: lowStockProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiry alerts
router.get('/alerts/expiry', protect, async (req, res) => {
  try {
    const products = await Product.find({ hasExpiry: true, expiryDate: { $exists: true } })
      .populate('category', 'name')
      .populate('warehouse', 'name');
    
    const now = new Date();
    const expiryAlerts = products.map(product => {
      const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return {
        ...product.toObject(),
        daysUntilExpiry,
        status: daysUntilExpiry < 0 ? 'expired' : 
                daysUntilExpiry <= 7 ? 'critical' : 
                daysUntilExpiry <= 30 ? 'warning' : 'ok'
      };
    }).filter(p => p.daysUntilExpiry <= 30)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    res.json({ success: true, data: expiryAlerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get AI-powered restock suggestions
router.get('/ai/restock-suggestions', protect, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name');
    
    // Get stock movements for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const movements = await StockMovement.find({
      createdAt: { $gte: ninetyDaysAgo },
      type: 'sale'
    });
    
    const suggestions = [];
    
    for (const product of products) {
      // Calculate sales velocity
      const productMovements = movements.filter(m => m.product.toString() === product._id.toString());
      const totalSold = productMovements.reduce((sum, m) => sum + m.quantity, 0);
      const averageDailySales = totalSold / 90;
      const daysOfStockRemaining = averageDailySales > 0 ? product.quantity / averageDailySales : 999;
      
      // Generate suggestion if running low
      if (daysOfStockRemaining < 30 || product.quantity < product.lowStockThreshold) {
        const suggestedOrderQuantity = Math.ceil(averageDailySales * 60); // 60 days worth
        const urgency = daysOfStockRemaining < 7 ? 'urgent' : 
                       daysOfStockRemaining < 14 ? 'high' : 
                       daysOfStockRemaining < 30 ? 'medium' : 'low';
        
        suggestions.push({
          product: {
            id: product._id,
            name: product.name,
            currentQuantity: product.quantity,
            category: product.category?.name
          },
          analytics: {
            averageDailySales: averageDailySales.toFixed(2),
            totalSoldLast90Days: totalSold,
            daysOfStockRemaining: Math.floor(daysOfStockRemaining)
          },
          suggestion: {
            recommendedOrderQuantity: suggestedOrderQuantity,
            urgency,
            estimatedCost: suggestedOrderQuantity * (product.costPrice || product.price * 0.6)
          }
        });
      }
    }
    
    // Sort by urgency and days remaining
    suggestions.sort((a, b) => {
      const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.suggestion.urgency] - urgencyOrder[b.suggestion.urgency];
    });
    
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

