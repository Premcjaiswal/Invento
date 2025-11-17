const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['sale', 'purchase', 'return', 'adjustment', 'damage', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number
  },
  totalValue: {
    type: Number
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StockMovement', StockMovementSchema);

