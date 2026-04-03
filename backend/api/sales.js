const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

async function handler(req, res) {
  // GET /api/sales - Get sales based on user role
  if (req.method === 'GET') {
    let sales;
    
    if (req.user.role === 'admin') {
      // Admin sees all sales
      sales = db.getAllSales();
    } else {
      // Others see only their sales
      sales = db.getSalesByUser(req.user.id);
    }
    
    // Enrich sales with product and user details
    const enrichedSales = sales.map(sale => {
      const product = db.getProductById(sale.productId);
      return {
        ...sale,
        productName: product?.name || 'Produto desconhecido',
        productPrice: product?.price || 0
      };
    });
    
    return res.json(enrichedSales);
  }
  
  // POST /api/sales - Create a sale (simulate purchase)
  if (req.method === 'POST') {
    const { productId, affiliateCode } = req.body;
    
    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Find affiliate and seller
    let affiliateId = null;
    let sellerId = req.user.id; // Current user is the seller
    
    if (affiliateCode) {
      const affiliateLink = db.getAffiliateLinkByCode(affiliateCode);
      if (affiliateLink) {
        affiliateId = affiliateLink.userId;
      }
    }
    
    // Calculate commissions
    const totalPrice = product.price;
    const ownerCommission = totalPrice * 0.5; // 50%
    const affiliateCommission = affiliateId ? totalPrice * 0.3 : 0; // 30%
    const sellerCommission = totalPrice * 0.2; // 20%
    
    // Check if seller should become affiliate (goal: 5 sales)
    const seller = db.findUserById(sellerId);
    const sellerSales = db.getSalesByUser(sellerId);
    if (seller && seller.role === 'seller' && sellerSales.length + 1 >= 5) {
      // Promote to affiliate
      db.updateUser(sellerId, { role: 'affiliate' });
      // Create affiliate link for new affiliate
      const linkCode = `${sellerId}_${Date.now()}`;
      db.createAffiliateLink({
        userId: sellerId,
        code: linkCode,
        url: `https://${req.headers.host}/?ref=${linkCode}`
      });
    }
    
    const sale = {
      productId,
      ownerId: product.ownerId || 'admin',
      affiliateId,
      sellerId,
      amount: totalPrice,
      ownerCommission,
      affiliateCommission,
      sellerCommission,
      status: 'completed'
    };
    
    const newSale = db.createSale(sale);
    
    // Update product sales count
    db.updateProduct(productId, { salesCount: product.salesCount + 1 });
    
    res.status(201).json(newSale);
  }
  
  else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

module.exports = authMiddleware(handler);
