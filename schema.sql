DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL, -- For instagram services: per-unit price (e.g. 0.10 = ₹0.10/follower). For bundles: total price.
    compare_at_price REAL DEFAULT 0,
    download_link TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📦',
    video_url_1 TEXT DEFAULT '',
    video_url_2 TEXT DEFAULT '',
    video_url_3 TEXT DEFAULT '',
    product_type TEXT DEFAULT 'bundle', -- 'bundle' or 'instagram'
    instagram_service_type TEXT DEFAULT NULL, -- 'followers', 'likes', 'views'
    instagram_quantity INTEGER DEFAULT 0, -- For instagram services: minimum order quantity (e.g. 100 = min 100 followers)
    smm_service_id INTEGER DEFAULT NULL, -- Mapped SMM service package ID (e.g. 30067)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    payment_name TEXT NOT NULL,
    screenshot TEXT NOT NULL,
    amount REAL NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id),
    coupon_code TEXT,
    instagram_link TEXT DEFAULT NULL,
    instagram_quantity INTEGER DEFAULT NULL,
    smm_order_id INTEGER DEFAULT NULL, -- Returned SMM order number
    smm_order_status TEXT DEFAULT NULL, -- Status on SMM panel
    smm_order_error TEXT DEFAULT NULL, -- Error message if failed
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_name ON transactions(payment_name);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);

-- Seed with initial default Reels Bundle product
INSERT INTO products (id, title, description, price, compare_at_price, download_link, icon, video_url_1, video_url_2, video_url_3, created_at, updated_at)
VALUES (
  "default-reels-bundle",
  "Premium 1000+ Reels Bundle",
  "Get instant access to 1000+ premium, high-converting HD reels to grow your social media presence. Pre-edited, copyright-free, and ready to post.",
  299.00,
  1499.00,
  "https://drive.google.com/drive/folders/your-reels-bundle-google-drive-link",
  "🎬",
  "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-showing-a-social-media-feed-41484-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-in-a-rainy-night-41584-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-web-browsing-on-a-smartphone-at-night-41582-large.mp4",
  1719000000000,
  1719000000000
);

