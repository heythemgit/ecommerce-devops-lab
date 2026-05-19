const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/ecommerce';
let dbStatus = 'Connecting...';

// ================================================================
// MONGOOSE SCHEMA
// ================================================================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'Electronics' },
  rating: { type: Number, default: 4.5 }
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// ================================================================
// FALLBACK DATA (used if MongoDB is not available)
// ================================================================
const fallbackProducts = [
  { name: 'MacBook Pro', price: 2499, image: '💻', category: 'Laptops', rating: 4.9 },
  { name: 'iPhone 15 Pro', price: 1199, image: '📱', category: 'Phones', rating: 4.8 },
  { name: 'AirPods Max', price: 549, image: '🎧', category: 'Audio', rating: 4.7 },
  { name: 'iPad Pro', price: 1099, image: '📲', category: 'Tablets', rating: 4.8 },
  { name: 'Apple Watch', price: 399, image: '⌚', category: 'Wearables', rating: 4.6 },
  { name: 'Magic Keyboard', price: 299, image: '⌨️', category: 'Accessories', rating: 4.5 }
];

// ================================================================
// CONNECT TO MONGODB + SEED DATA
// ================================================================
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    dbStatus = 'Connected';
    console.log('✅ MongoDB connected successfully');

    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(fallbackProducts);
      console.log('🌱 Products seeded to MongoDB');
    } else {
      console.log(`📦 Found ${count} products in MongoDB`);
    }
  } catch (err) {
    dbStatus = 'Offline (using fallback)';
    console.log('⚠️ MongoDB not ready:', err.message);
    console.log('📦 Using fallback product data');
  }
}

connectDB();

// ================================================================
// ROUTES
// ================================================================

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/products', async (req, res) => {
  try {
    if (dbStatus === 'Connected') {
      const products = await Product.find().lean();
      return res.json(products);
    }
    throw new Error('Database not connected');
  } catch (err) {
    res.json(fallbackProducts);
  }
});

app.get('/', async (req, res) => {
  let products = fallbackProducts;

  try {
    if (dbStatus === 'Connected') {
      products = await Product.find().lean();
    }
  } catch (err) {
    console.log('Using fallback data for homepage');
  }

  const productCards = products.map((p, index) => `
    <div class="product-card" style="animation-delay: ${index * 0.1}s">
      <div class="product-image">${p.image}</div>
      <div class="product-category">${p.category}</div>
      <h3 class="product-name">${p.name}</h3>
      <div class="product-rating">
        ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
        <span class="rating-value">${p.rating}</span>
      </div>
      <div class="product-price">$${p.price.toLocaleString()}</div>
      <button class="add-to-cart">
        <span class="cart-icon">🛒</span>
        Add to Cart
      </button>
    </div>
  `).join('');

  const dbIndicator = dbStatus === 'Connected' 
    ? '<span class="status-indicator online"></span>Database Connected'
    : '<span class="status-indicator offline"></span>Database Offline';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LUXE | Premium Electronics</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #1a1a2e;
          --secondary: #16213e;
          --accent: #c9a962;
          --accent-hover: #b8944f;
          --text-primary: #2d3436;
          --text-secondary: #636e72;
          --text-light: #b2bec3;
          --bg-primary: #faf9f6;
          --bg-secondary: #ffffff;
          --bg-dark: #1a1a2e;
          --border: #e8e8e8;
          --shadow-sm: 0 2px 8px rgba(0,0,0,0.04);
          --shadow-md: 0 8px 30px rgba(0,0,0,0.08);
          --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        /* Navigation */
        .navbar {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .logo span {
          color: var(--accent);
        }

        .nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: var(--transition);
          position: relative;
        }

        .nav-links a:hover {
          color: var(--primary);
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--accent);
          transition: var(--transition);
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .search-box {
          position: relative;
        }

        .search-box input {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 30px;
          padding: 10px 16px 10px 40px;
          width: 220px;
          font-size: 14px;
          transition: var(--transition);
          outline: none;
        }

        .search-box input:focus {
          border-color: var(--accent);
          width: 260px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-light);
          font-size: 14px;
        }

        .cart-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          position: relative;
          padding: 8px;
        }

        .cart-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 600;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: white;
          padding: 100px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(201,169,98,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(201,169,98,0.2);
          border: 1px solid rgba(201,169,98,0.3);
          color: var(--accent);
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .hero p {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          max-width: 500px;
          margin: 0 auto 40px;
          font-weight: 300;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--accent);
          color: white;
          padding: 16px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.5px;
          transition: var(--transition);
          box-shadow: 0 4px 20px rgba(201,169,98,0.4);
        }

        .hero-cta:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(201,169,98,0.5);
        }

        /* Status Bar */
        .status-bar {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 12px 24px;
        }

        .status-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-indicator.online {
          background: #00b894;
          box-shadow: 0 0 0 3px rgba(0,184,148,0.2);
        }

        .status-indicator.offline {
          background: #e17055;
          box-shadow: 0 0 0 3px rgba(225,112,85,0.2);
        }

        /* Products Section */
        .products-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-label {
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .section-subtitle {
          color: var(--text-secondary);
          font-size: 16px;
          max-width: 500px;
          margin: 0 auto;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 32px;
        }

        /* Product Card */
        .product-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--border);
          transition: var(--transition);
          cursor: pointer;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: transparent;
        }

        .product-image {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          transition: var(--transition);
        }

        .product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-info {
          padding: 24px;
        }

        .product-category {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }

        .product-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #f39c12;
        }

        .rating-value {
          color: var(--text-secondary);
          font-size: 13px;
          margin-left: 4px;
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .product-price {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          font-family: 'Inter', sans-serif;
        }

        .add-to-cart {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .add-to-cart:hover {
          background: var(--accent);
          transform: scale(1.05);
        }

        .cart-icon {
          font-size: 14px;
        }

        /* Features Section */
        .features {
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          padding: 60px 24px;
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
        }

        .feature {
          text-align: center;
          padding: 20px;
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: var(--accent);
        }

        .feature h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          margin-bottom: 8px;
          color: var(--primary);
        }

        .feature p {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          background: var(--bg-dark);
          color: white;
          padding: 60px 24px 30px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-brand .logo {
          color: white;
          margin-bottom: 16px;
          display: inline-block;
        }

        .footer-brand p {
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          line-height: 1.7;
          max-width: 300px;
        }

        .footer-links h4 {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          margin-bottom: 20px;
          color: white;
        }

        .footer-links ul {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 14px;
          transition: var(--transition);
        }

        .footer-links a:hover {
          color: var(--accent);
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }

        .footer-social {
          display: flex;
          gap: 16px;
        }

        .footer-social a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 18px;
          transition: var(--transition);
        }

        .footer-social a:hover {
          color: var(--accent);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 36px;
          }
          
          .nav-links {
            display: none;
          }
          
          .search-box input {
            width: 150px;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          
          .footer-bottom {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }

        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Selection color */
        ::selection {
          background: var(--accent);
          color: white;
        }
      </style>
    </head>
    <body>
      <!-- Navigation -->
      <nav class="navbar">
        <div class="nav-container">
          <a href="/" class="logo">LUXE<span>.</span></a>
          <ul class="nav-links">
            <li><a href="#products">Products</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div class="nav-actions">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" placeholder="Search products...">
            </div>
            <button class="cart-btn">
              🛒
              <span class="cart-badge">0</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Status Bar -->
      <div class="status-bar">
        <div class="status-container">
          <div class="status-item">
            <span class="status-indicator online"></span>
            Server: Online
          </div>
          <div class="status-item">
            ${dbIndicator}
          </div>
          <div class="status-item">
            🚀 DevOps CI/CD Lab — Terraform · Ansible · Docker · MongoDB
          </div>
        </div>
      </div>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">Premium Collection 2026</div>
          <h1>Elevate Your<br>Digital Experience</h1>
          <p>Discover our curated selection of premium electronics, crafted for those who demand excellence in every detail.</p>
          <a href="#products" class="hero-cta">
            Explore Collection
            <span>→</span>
          </a>
        </div>
      </section>

      <!-- Products Section -->
      <section class="products-section" id="products">
        <div class="section-header">
          <div class="section-label">Curated Selection</div>
          <h2 class="section-title">Featured Products</h2>
          <p class="section-subtitle">Hand-picked premium devices that combine cutting-edge technology with timeless design.</p>
        </div>
        <div class="products-grid">
          ${productCards}
        </div>
      </section>

      <!-- Features Section -->
      <section class="features" id="features">
        <div class="features-grid">
          <div class="feature">
            <div class="feature-icon">🚀</div>
            <h3>Fast Shipping</h3>
            <p>Complimentary express delivery on all orders over $500. Track your package in real-time.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">🛡️</div>
            <h3>Extended Warranty</h3>
            <p>Every product includes our premium 3-year warranty with 24/7 technical support.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">↩️</div>
            <h3>Easy Returns</h3>
            <p>30-day hassle-free return policy. Full refund, no questions asked.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">🔒</div>
            <h3>Secure Checkout</h3>
            <p>Bank-level encryption protects your data. We never store your payment details.</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer" id="contact">
        <div class="footer-content">
          <div class="footer-brand">
            <a href="/" class="logo">LUXE<span>.</span></a>
            <p>Redefining luxury electronics since 2026. We believe technology should be both powerful and beautiful.</p>
          </div>
          <div class="footer-links">
            <h4>Shop</h4>
            <ul>
              <li><a href="#">Laptops</a></li>
              <li><a href="#">Phones</a></li>
              <li><a href="#">Audio</a></li>
              <li><a href="#">Accessories</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Sustainability</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Order Status</a></li>
              <li><a href="#">Returns</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p> 2026 LUXE Inc. All rights reserved.</p>
          <div class="footer-social">
            <a href="#">𝕏</a>
            <a href="#">📷</a>
            <a href="#">💼</a>
            <a href="#">▶️</a>
          </div>
        </div>
      </footer>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LUXE E-commerce app running on port ${PORT}`);
});