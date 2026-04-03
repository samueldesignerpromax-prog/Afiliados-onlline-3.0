const bcrypt = require('bcryptjs');
const db = require('../utils/database');
const { generateToken } = require('../middleware/auth');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;

  // Register
  if (req.method === 'POST' && path === 'register') {
    const { name, email, password, role, affiliateCode } = req.body;
    
    // Check if user exists
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      name,
      email,
      password: hashedPassword,
      role: role || 'seller',
      referredBy: null
    };
    
    // If affiliate code is provided, set referrer
    if (affiliateCode) {
      const affiliateLink = db.getAffiliateLinkByCode(affiliateCode);
      if (affiliateLink) {
        user.referredBy = affiliateLink.userId;
      }
    }
    
    const newUser = db.createUser(user);
    
    // Create affiliate link if user is affiliate
    if (newUser.role === 'affiliate') {
      const linkCode = `${newUser.id}_${Date.now()}`;
      db.createAffiliateLink({
        userId: newUser.id,
        code: linkCode,
        url: `https://${req.headers.host}/?ref=${linkCode}`
      });
    }
    
    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ user: userWithoutPassword, token });
  }
  
  // Login
  else if (req.method === 'POST' && path === 'login') {
    const { email, password } = req.body;
    
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword, token });
  }
  
  else {
    res.status(404).json({ error: 'Rota não encontrada' });
  }
};
