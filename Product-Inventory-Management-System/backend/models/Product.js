const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  supplier: {
    type: String,
    trim: true
  },
  // Pricing
  costPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Inventory
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  // Location
  location: {
    type: String,
    default: 'Main Storage'
  },
  // Tracking
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  // Expiry tracking
  expiryDate: {
    type: Date
  },
  hasExpiry: {
    type: Boolean,
    default: false
  },
  // Status
  discontinued: {
    type: Boolean,
    default: false
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp on save
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total stock value (at selling price)
ProductSchema.virtual('stockValue').get(function() {
  return this.price * this.quantity;
});

// Virtual for profit per unit
ProductSchema.virtual('profitPerUnit').get(function() {
  return this.price - (this.costPrice || 0);
});

// Virtual for total profit
ProductSchema.virtual('totalProfit').get(function() {
  return (this.price - (this.costPrice || 0)) * this.quantity;
});

// Virtual for is low stock
ProductSchema.virtual('isLowStock').get(function() {
  return this.quantity < this.lowStockThreshold;
});

// Virtual for is expired or expiring soon
ProductSchema.virtual('expiryStatus').get(function() {
  if (!this.hasExpiry || !this.expiryDate) return 'none';
  const now = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'expiring-soon';
  if (daysUntilExpiry <= 30) return 'expiring-month';
  return 'fresh';
});

module.exports = mongoose.model('Product', ProductSchema);