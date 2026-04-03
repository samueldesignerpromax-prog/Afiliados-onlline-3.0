// API Configuration
const API_URL = '/api';

// Auth functions
function setAuthToken(token) {
  localStorage.setItem('token', token);
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
  return !!getAuthToken();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// API calls
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    logout();
    throw new Error('Sessão expirada');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  
  return data;
}

// Redirect based on user role
function redirectToDashboard() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  switch(user.role) {
    case 'admin':
      window.location.href = '/admin-dashboard.html';
      break;
    case 'affiliate':
      window.location.href = '/affiliate-dashboard.html';
      break;
    case 'seller':
      window.location.href = '/seller-dashboard.html';
      break;
    default:
      window.location.href = '/login.html';
  }
}

// Load products
async function loadProducts(containerId) {
  try {
    const products = await apiCall('/products');
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    container.innerHTML = products.map(product => `
      <div class="product-card">
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p>${product.description || 'Descrição não disponível'}</p>
          <p class="product-price">R$ ${product.price.toFixed(2)}</p>
          <button onclick="buyProduct('${product.id}')" class="btn">Comprar</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Buy product
async function buyProduct(productId) {
  if (!isAuthenticated()) {
    if (confirm('Você precisa estar logado para comprar. Deseja fazer login?')) {
      window.location.href = '/login.html';
    }
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const affiliateCode = urlParams.get('ref');
  
  try {
    await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify({ productId, affiliateCode })
    });
    
    alert('Compra realizada com sucesso!');
    window.location.reload();
  } catch (error) {
    alert('Erro ao realizar compra: ' + error.message);
  }
}

// Export functions
window.buyProduct = buyProduct;
window.logout = logout;
