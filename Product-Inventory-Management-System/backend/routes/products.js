const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockProducts } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/low-stock')
  .get(getLowStockProducts);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;