const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

class Database {
  constructor() {
    this.initDB();
  }

  initDB() {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        users: [],
        products: [],
        sales: [],
        affiliateLinks: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
  }

  readData() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  }

  writeData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // User methods
  createUser(user) {
    const data = this.readData();
    user.id = Date.now().toString();
    user.createdAt = new Date().toISOString();
    user.commission = user.role === 'admin' ? 50 : (user.role === 'affiliate' ? 30 : 20);
    user.totalSales = 0;
    user.isActive = true;
    data.users.push(user);
    this.writeData(data);
    return user;
  }

  findUserByEmail(email) {
    const data = this.readData();
    return data.users.find(u => u.email === email);
  }

  findUserById(id) {
    const data = this.readData();
    return data.users.find(u => u.id === id);
  }

  updateUser(id, updates) {
    const data = this.readData();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      this.writeData(data);
      return data.users[index];
    }
    return null;
  }

  // Product methods
  createProduct(product) {
    const data = this.readData();
    product.id = Date.now().toString();
    product.createdAt = new Date().toISOString();
    product.salesCount = 0;
    product.ownerId = product.ownerId || null;
    data.products.push(product);
    this.writeData(data);
    return product;
  }

  getAllProducts() {
    const data = this.readData();
    return data.products;
  }

  getProductById(id) {
    const data = this.readData();
    return data.products.find(p => p.id === id);
  }

  updateProduct(id, updates) {
    const data = this.readData();
    const index = data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      data.products[index] = { ...data.products[index], ...updates };
      this.writeData(data);
      return data.products[index];
    }
    return null;
  }

  // Sales methods
  createSale(sale) {
    const data = this.readData();
    sale.id = Date.now().toString();
    sale.date = new Date().toISOString();
    data.sales.push(sale);
    
    // Update user commissions
    const owner = data.users.find(u => u.id === sale.ownerId);
    const affiliate = data.users.find(u => u.id === sale.affiliateId);
    const seller = data.users.find(u => u.id === sale.sellerId);
    
    if (owner) owner.totalSales += sale.ownerCommission;
    if (affiliate) affiliate.totalSales += sale.affiliateCommission;
    if (seller) seller.totalSales += sale.sellerCommission;
    
    this.writeData(data);
    return sale;
  }

  getAllSales() {
    const data = this.readData();
    return data.sales;
  }

  getSalesByUser(userId) {
    const data = this.readData();
    return data.sales.filter(s => 
      s.ownerId === userId || 
      s.affiliateId === userId || 
      s.sellerId === userId
    );
  }

  // Affiliate link methods
  createAffiliateLink(link) {
    const data = this.readData();
    link.id = Date.now().toString();
    link.clicks = 0;
    link.createdAt = new Date().toISOString();
    data.affiliateLinks.push(link);
    this.writeData(data);
    return link;
  }

  getAffiliateLinks(userId) {
    const data = this.readData();
    return data.affiliateLinks.filter(l => l.userId === userId);
  }

  getAffiliateLinkByCode(code) {
    const data = this.readData();
    return data.affiliateLinks.find(l => l.code === code);
  }
}

module.exports = new Database();
