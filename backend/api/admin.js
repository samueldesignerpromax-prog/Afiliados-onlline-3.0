const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

async function handler(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  // GET /api/admin/users - Get all users
  if (req.method === 'GET' && req.query.users === 'true') {
    const users = db.readData().users.map(({ password, ...user }) => user);
    return res.json(users);
  }
  
  // GET /api/admin/stats - Get admin statistics
  else if (req.method === 'GET' && req.query.stats === 'true') {
    const data = db.readData();
    const totalSales = data.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCommission = data.sales.reduce((sum, sale) => sum + sale.ownerCommission, 0);
    
    res.json({
      totalUsers: data.users.length,
      totalProducts: data.products.length,
      totalSales: data.sales.length,
      totalRevenue: totalSales,
      totalCommission: totalCommission,
      salesByUser: data.sales.reduce((acc, sale) => {
        acc[sale.sellerId] = (acc[sale.sellerId] || 0) + 1;
        return acc;
      }, {})
    });
  }
  
  // PUT /api/admin/users/:id/ban - Ban/unban user
  else if (req.method === 'PUT' && req.query.ban === 'true') {
    const { userId, isActive } = req.body;
    const user = db.updateUser(userId, { isActive });
    res.json(user);
  }
  
  else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

module.exports = authMiddleware(handler);
