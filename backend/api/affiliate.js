const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

async function handler(req, res) {
  // GET /api/affiliate/links - Get user's affiliate links
  if (req.method === 'GET') {
    const links = db.getAffiliateLinks(req.user.id);
    return res.json(links);
  }
  
  // POST /api/affiliate/links - Create affiliate link
  if (req.method === 'POST') {
    const linkCode = `${req.user.id}_${Date.now()}`;
    const link = {
      userId: req.user.id,
      code: linkCode,
      url: `https://${req.headers.host}/?ref=${linkCode}`
    };
    
    const newLink = db.createAffiliateLink(link);
    res.status(201).json(newLink);
  }
  
  // GET /api/affiliate/stats - Get affiliate statistics
  else if (req.method === 'GET' && req.query.stats === 'true') {
    const sales = db.getSalesByUser(req.user.id);
    const affiliateSales = sales.filter(s => s.affiliateId === req.user.id);
    const totalCommission = affiliateSales.reduce((sum, sale) => sum + sale.affiliateCommission, 0);
    const referredUsers = db.getAllUsers().filter(u => u.referredBy === req.user.id);
    
    res.json({
      totalSales: affiliateSales.length,
      totalCommission,
      referredCount: referredUsers.length,
      sales: affiliateSales
    });
  }
  
  else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

module.exports = authMiddleware(handler);
