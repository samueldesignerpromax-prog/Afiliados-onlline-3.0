const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

async function handler(req, res) {
  // GET /api/products - Get all products
  if (req.method === 'GET') {
    const products = db.getAllProducts();
    return res.json(products);
  }
  
  // POST /api/products - Create product (admin only)
  if (req.method === 'POST') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { name, description, price, category, imageUrl } = req.body;
    
    const product = {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl: imageUrl || 'https://via.placeholder.com/300x200',
      ownerId: req.user.id
    };
    
    const newProduct = db.createProduct(product);
    res.status(201).json(newProduct);
  }
  
  else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

module.exports = authMiddleware(handler);
