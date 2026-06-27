"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./page.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  icon: string;
  product_type?: string;
  instagram_service_type?: string;
  instagram_quantity?: number;
}

const isUrl = (str: string) => {
  if (!str) return false;
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/") || str.startsWith("data:");
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    website_name: "Shravan Vault",
    website_logo: "",
  });
  const [notification, setNotification] = useState<{ name: string; time: string } | null>(null);
  const [activeInstaTab, setActiveInstaTab] = useState<"followers" | "likes" | "views">("followers");
  const [instaOrderQty, setInstaOrderQty] = useState<{ [key: string]: number | "" }>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = (await response.json()) as Product[];
          setProducts(data);
        } else {
          setError("Failed to load products. Please refresh.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading catalog.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
    loadProducts();
  }, []);

  useEffect(() => {
    const indianNames = [
      "Amit Sharma", "Priya Patel", "Vikram Singh", "Rahul Verma", 
      "Sneha Rao", "Aniket Gupta", "Neha Joshi", "Deepak Kumar", 
      "Rohan Mehta", "Aishwarya Sen", "Manish Mishra", "Karan Johar",
      "Siddharth Roy", "Kriti Sanon", "Aarav Singhal"
    ];
    
    function triggerNotification() {
      const randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
      const times = ["just now", "30 seconds ago", "45 seconds ago", "1 minute ago"];
      const randomTime = times[Math.floor(Math.random() * times.length)];
      
      setNotification({ name: randomName, time: randomTime });
      
      // Hide after 6 seconds
      setTimeout(() => {
        setNotification(null);
      }, 6000);
    }
    
    // Initial delay of 6s before first popup
    const firstTrigger = setTimeout(triggerNotification, 6000);
    
    // Trigger every 30 seconds
    const interval = setInterval(triggerNotification, 30000);
    
    return () => {
      clearTimeout(firstTrigger);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="animate-fade-in">
      <header className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 12px", borderBottom: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "22px", background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {settings.website_name}
          </div>
        </div>
        <nav style={{ display: "flex", gap: "24px", fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>
          <a href="#catalog">Browse Catalog</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>
 
      <main>
        {/* Hero Section */}
        <section className="container hero" style={{ padding: "80px 0 0 0" }}>
          <div className="hero-badge">
            Creator Marketplace 🚀
          </div>
          <h1>
            Creator Resources That Save Time & <span className="gradient-text">Drive Results</span>
          </h1>
          <p style={{ fontWeight: 600, fontSize: "18px", color: "var(--text-secondary)" }}>
            Reels Bundles • AI Prompts • Digital Courses • Instant Delivery 🚀
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
            <a href="#catalog" className="btn-primary">
              Explore Products ↓
            </a>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="catalog" className="container" style={{ padding: "20px 0 30px 0" }}>
          
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <div style={{ width: "32px", height: "32px", border: "3px solid var(--accent-light)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", color: "var(--error)", padding: "20px" }}>{error}</div>
          ) : (
            <>
              {/* Subdivision 1: Instagram Growth Services */}
              <div style={{ marginBottom: "60px", borderBottom: "1px dashed var(--glass-border)", paddingBottom: "40px" }}>
                <h2 className="section-title" style={{ marginTop: "0", marginBottom: "12px" }}>Instagram Growth Services 🚀</h2>
                <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "30px" }}>
                  Boost your Instagram presence instantly. Premium drops with organic drop protection.
                </p>

                {/* Tabs selection */}
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "32px", width: "100%", flexWrap: "wrap" }}>
                  <button 
                    onClick={() => setActiveInstaTab("followers")}
                    className={`tab-btn ${activeInstaTab === "followers" ? "active" : ""}`}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "12px 24px", 
                      borderRadius: "999px", 
                      fontSize: "14px",
                      fontWeight: 600, 
                      border: "1px solid var(--glass-border)", 
                      cursor: "pointer", 
                      transition: "all var(--transition-fast)", 
                      backgroundColor: activeInstaTab === "followers" ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.75)", 
                      color: activeInstaTab === "followers" ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: activeInstaTab === "followers" ? "0 4px 14px rgba(79, 70, 229, 0.25)" : "none"
                    }}
                  >
                    👥 Followers
                  </button>
                  <button 
                    onClick={() => setActiveInstaTab("likes")}
                    className={`tab-btn ${activeInstaTab === "likes" ? "active" : ""}`}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "12px 24px", 
                      borderRadius: "999px", 
                      fontSize: "14px",
                      fontWeight: 600, 
                      border: "1px solid var(--glass-border)", 
                      cursor: "pointer", 
                      transition: "all var(--transition-fast)", 
                      backgroundColor: activeInstaTab === "likes" ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.75)", 
                      color: activeInstaTab === "likes" ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: activeInstaTab === "likes" ? "0 4px 14px rgba(79, 70, 229, 0.25)" : "none"
                    }}
                  >
                    ❤️ Likes
                  </button>
                  <button 
                    onClick={() => setActiveInstaTab("views")}
                    className={`tab-btn ${activeInstaTab === "views" ? "active" : ""}`}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "12px 24px", 
                      borderRadius: "999px", 
                      fontSize: "14px",
                      fontWeight: 600, 
                      border: "1px solid var(--glass-border)", 
                      cursor: "pointer", 
                      transition: "all var(--transition-fast)", 
                      backgroundColor: activeInstaTab === "views" ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.75)", 
                      color: activeInstaTab === "views" ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: activeInstaTab === "views" ? "0 4px 14px rgba(79, 70, 229, 0.25)" : "none"
                    }}
                  >
                    👁️ Views
                  </button>
                </div>

                {/* Instagram interactive order card */}
                {(() => {
                  const serviceProducts = products.filter(p => p.product_type === "instagram" && p.instagram_service_type === activeInstaTab);
                  const product = serviceProducts[0]; // Use first product for this service type
                  
                  if (!product) {
                    return (
                      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "18px", border: "1px dashed var(--glass-border)" }}>
                        No Instagram {activeInstaTab} service published yet. Check back soon!
                      </div>
                    );
                  }

                  const minQty = product.instagram_quantity || 1;
                  const currentQty = instaOrderQty[product.id] ?? minQty;
                  const numericQty = Number(currentQty) || 0;
                  const totalPrice = Math.round(numericQty * product.price * 100) / 100;
                  const isBelowMin = numericQty > 0 && numericQty < minQty;

                  return (
                    <div className="glass-card animate-fade-in" style={{ maxWidth: "520px", margin: "0 auto", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
                      {/* Large Product Image */}
                      <div style={{ width: "160px", height: "160px", borderRadius: "24px", background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.15) 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "72px", flexShrink: 0, border: "1px solid var(--glass-border)", boxShadow: "0 8px 32px rgba(79, 70, 229, 0.15)" }}>
                        {isUrl(product.icon) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={product.icon} 
                            alt={product.title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          product.icon || (activeInstaTab === "followers" ? "👥" : activeInstaTab === "likes" ? "❤️" : "👁️")
                        )}
                      </div>

                      {/* Title Only */}
                      <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.3 }}>{product.title}</h3>

                      {/* Order Now button */}
                      <Link
                        href={`/checkout?productId=${product.id}`}
                        className="btn-primary"
                        style={{
                          textAlign: "center",
                          fontSize: "16px",
                          fontWeight: 700,
                          padding: "14px 32px",
                          width: "100%"
                        }}
                      >
                        Order your {activeInstaTab}
                      </Link>
                    </div>
                  );
                })()}
              </div>

              {/* Subdivision 2: Creator Bundles */}
              <div>
                <h2 className="section-title" style={{ marginTop: "0", marginBottom: "12px" }}>Best Selling Creator Bundles 🎬</h2>
                <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "30px" }}>
                  Choose your pack and start publishing content instantly.
                </p>

                {products.filter(p => p.product_type === "bundle" || !p.product_type).length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    No bundles available. Check back soon!
                  </div>
                ) : (
                  <div className="product-catalog-grid">
                    {products
                      .filter(p => p.product_type === "bundle" || !p.product_type)
                      .map((product) => {
                        const comparePrice = product.compare_at_price || Math.round(product.price * 5);
                        const discountPct = Math.round(((comparePrice - product.price) / comparePrice) * 100);

                        return (
                          <Link 
                            key={product.id} 
                            href={`/checkout?productId=${product.id}`} 
                            className="glass-card product-item-card animate-fade-in"
                          >
                            <div className="product-image-container">
                              {isUrl(product.icon) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={product.icon} 
                                  alt={product.title} 
                                  className="product-cover-image"
                                />
                              ) : (
                                <div className="product-fallback-icon">
                                  {product.icon || "📦"}
                                </div>
                              )}
                              {discountPct > 0 && (
                                <div className="discount-badge">
                                  -{discountPct}%
                                </div>
                              )}
                            </div>
                            
                            <div className="product-details-content">
                              <h3 className="product-item-title">{product.title}</h3>
                              <div className="product-item-category">Digital Bundle</div>
                              
                              <div className="product-item-price-row">
                                <span className="compare-price">₹{comparePrice}</span>
                                <span className="current-price">₹{product.price}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>



        {/* Customer Reviews Section */}
        <section id="reviews" className="container" style={{ padding: "20px 0 20px 0" }}>
          {/* Bundle Content Details Section */}
          <div style={{ maxWidth: "800px", margin: "0 auto 48px auto", textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
              📦 What you will get (Bundle Me Kya Milega)
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <span className="glass-card" style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderRadius: "999px" }}>
                ✓ 1000+ Viral Reels
              </span>
              <span className="glass-card" style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderRadius: "999px" }}>
                ✓ HD Quality
              </span>
              <span className="glass-card" style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderRadius: "999px" }}>
                ✓ Copyright Free
              </span>
              <span className="glass-card" style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderRadius: "999px" }}>
                ✓ Instant Download
              </span>
              <span className="glass-card" style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", borderRadius: "999px" }}>
                ✓ Ready To Post
              </span>
            </div>
          </div>

          <h2 className="section-title">Customer Reviews</h2>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "32px" }}>
            {/* Review 1 */}
            <div className="glass-card" style={{ padding: "12px", width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "4px", color: "#fbbf24" }}>
                {"★★★★★".split("").map((s, idx) => <span key={idx} style={{ fontSize: "14px" }}>★</span>)}
              </div>
              <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                &ldquo;Faceless pages ke liye best bundle hai.&rdquo;
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>— Aman Yadav</div>
            </div>
            {/* Review 2 (Shifted Up) */}
            <div className="glass-card" style={{ padding: "12px", width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "4px", color: "#fbbf24" }}>
                {"★★★★★".split("").map((s, idx) => <span key={idx} style={{ fontSize: "14px" }}>★</span>)}
              </div>
              <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                &ldquo;Likes aur views bohot jaldi badh gaye, highly recommend!&rdquo;
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>— Riya Sharma</div>
            </div>
            {/* Review 3 */}
            <div className="glass-card" style={{ padding: "12px", width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "4px", color: "#fbbf24" }}>
                {"★★★★★".split("").map((s, idx) => <span key={idx} style={{ fontSize: "14px" }}>★</span>)}
              </div>
              <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                &ldquo;Bohot hi kamaal ka engagement mila!&rdquo;
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>— Neha Patel</div>
            </div>
            {/* Review 4 */}
            <div className="glass-card" style={{ padding: "12px", width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "4px", color: "#fbbf24" }}>
                {"★★★★★".split("").map((s, idx) => <span key={idx} style={{ fontSize: "14px" }}>★</span>)}
              </div>
              <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                &ldquo;Ek ek paisa vasool product hai.&rdquo;
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>— Rohan Verma</div>
            </div>
            {/* Review 5 */}
            <div className="glass-card" style={{ padding: "12px", width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "4px", color: "#fbbf24" }}>
                {"★★★★★".split("").map((s, idx) => <span key={idx} style={{ fontSize: "14px" }}>★</span>)}
              </div>
              <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, margin: 0 }}>
                &ldquo;Followers bohot fast increase ho gaye, trusted service hai!&rdquo;
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>— Vikram Singh</div>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section id="faq" className="container faq-section" style={{ paddingTop: "20px", paddingBottom: "40px" }}>
          <h2 className="section-title" style={{ marginTop: "0", marginBottom: "30px" }}>Frequently Asked Questions</h2>
          <div className="faq-list">
            <details className="glass-card faq-item">
              <summary>Will I get instant access after payment?</summary>
              <p>Yes! Once you submit the payment screenshot on the checkout page, it is registered. Our system automatically sends an email with your download link immediately.</p>
            </details>
            <details className="glass-card faq-item">
              <summary>Which payment apps can I use?</summary>
              <p>You can use any UPI-enabled app in India, such as Google Pay, PhonePe, Paytm, Amazon Pay, or BHIM UPI.</p>
            </details>
            <details className="glass-card faq-item">
              <summary>Are these reels copy-paste friendly?</summary>
              <p>Absolutely. All reels and guides in our catalog are watermark-free and copyright-free. You can directly upload them to Instagram Reels, YouTube Shorts, or TikTok.</p>
            </details>
            <details className="glass-card faq-item">
              <summary>What if I don&apos;t receive the email?</summary>
              <p>First, please check your spam or promotion folder. If it&apos;s still not there, feel free to contact support with your payment details, and we will send the link to you manually.</p>
            </details>
          </div>
        </section>

      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} {settings.website_name}. All rights reserved.</p>
          <p style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
            For support or questions, contact us via email. UPI payment is secure and processed through standard merchant gateways.
          </p>
        </div>
      </footer>



      {/* Live Purchase Notification Toast */}
      {notification && (
        <div className="popup-notification">
          <div style={{ fontSize: "20px" }}>🎉</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              {notification.name} purchased!
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Bought the Reels Bundle {notification.time}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
