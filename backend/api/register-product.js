const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

async function handler(req, res) {
  // POST /api/register-product - Register a product (paid feature)
  if (req.method === 'POST') {
    const { name, description, price, category, imageUrl } = req.body;
    const registrationFee = 29.90;
    
    // Simulate payment (in real app, you'd process payment here)
    // For demo, we'll just check if user has enough "balance"
    // In production, integrate with Stripe/PayPal
    
    // Create product
    const product = {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl: imageUrl || 'https://via.placeholder.com/300x200',
      ownerId: req.user.id,
      isUserProduct: true
    };
    
    const newProduct = db.createProduct(product);
    
    // Record the registration fee as a sale for admin
    const feeSale = {
      productId: 'registration_fee',
      ownerId: 'admin',
      affiliateId: null,
      sellerId: req.user.id,
      amount: registrationFee,
      ownerCommission: registrationFee,
      affiliateCommission: 0,
      sellerCommission: 0,
      status: 'completed',
      isRegistrationFee: true
    };
    
    db.createSale(feeSale);
    
    res.status(201).json({ 
      product: newProduct, 
      message: 'Produto cadastrado com sucesso! Taxa de cadastro: R$ ' + registrationFee 
    });
  }
  
  else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

module.exports = authMiddleware(handler);
