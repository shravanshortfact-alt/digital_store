"use client";

import { useState, useEffect, useCallback } from "react";
import "./admin.css";

interface Transaction {
  id: string;
  email: string;
  payment_name: string;
  screenshot: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  product_title: string;
  coupon_code?: string;
  created_at: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  download_link: string;
  icon: string;
  video_url_1?: string;
  video_url_2?: string;
  video_url_3?: string;
  product_type?: string;
  created_at: number;
}

interface Coupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  created_at: number;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Tabs: payments | products | settings | coupons
  const [activeTab, setActiveTab] = useState<"payments" | "products" | "settings" | "coupons">("payments");

  // State: Payments
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // State: Products Catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newComparePrice, setNewComparePrice] = useState("");
  const [newDownloadLink, setNewDownloadLink] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [videoUrl1, setVideoUrl1] = useState("");
  const [videoUrl2, setVideoUrl2] = useState("");
  const [videoUrl3, setVideoUrl3] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  // State: Settings & Coupons
  const [siteName, setSiteName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");
  const [newCouponValue, setNewCouponValue] = useState("");
  const [addingCoupon, setAddingCoupon] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Check saved session password
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin_session_pwd");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchTransactions = useCallback(async (authPwd = password) => {
    if (!authPwd) return;
    setLoadingTransactions(true);
    setError("");
    try {
      const res = await fetch("/api/admin/transactions", {
        headers: { "Authorization": authPwd },
      });
      if (res.ok) {
        const data = (await res.json()) as Transaction[];
        setTransactions(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to load transactions.");
        if (res.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("admin_session_pwd");
        }
      }
    } catch {
      setError("Error connecting to server.");
    } finally {
      setLoadingTransactions(false);
    }
  }, [password]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = (await res.json()) as Product[];
        setProducts(data);
      }
    } catch {
      console.error("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSiteName(data.website_name || "");
        setUpiId(data.upi_id || "");
        setQrCode(data.qr_code || "");
      }
    } catch {
      console.error("Failed to load settings.");
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    if (!password) return;
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        headers: { "Authorization": password },
      });
      if (res.ok) {
        const data = (await res.json()) as Coupon[];
        setCoupons(data);
      }
    } catch {
      console.error("Failed to load coupons.");
    } finally {
      setLoadingCoupons(false);
    }
  }, [password]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "payments") fetchTransactions();
      else if (activeTab === "products") fetchProducts();
      else if (activeTab === "settings") fetchSettings();
      else if (activeTab === "coupons") fetchCoupons();
    }
  }, [isAuthenticated, activeTab, fetchTransactions, fetchProducts, fetchSettings, fetchCoupons]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPassword) return;
    setPassword(tempPassword);
    setIsAuthenticated(true);
    localStorage.setItem("admin_session_pwd", tempPassword);
  };

  const handleLogout = () => {
    setPassword("");
    setTempPassword("");
    setIsAuthenticated(false);
    localStorage.removeItem("admin_session_pwd");
  };

  // Action: Approve / Reject Transaction
  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!password) return;
    setActionId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/approve-utr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setMessage(`Transaction ${action === "approve" ? "Approved! Download link emailed to customer." : "Rejected."}`);
        await fetchTransactions();
      } else {
        const errData = await res.json();
        setError(errData.error || "Action failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionId(null);
    }
  };

  // Action: Delete Individual Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!password) return;
    if (!confirm("Are you sure you want to delete this order record?")) return;
    
    setDeletingTxId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage("Order record deleted successfully.");
        await fetchTransactions();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete transaction.");
      }
    } catch {
      setError("Network error deleting order.");
    } finally {
      setDeletingTxId(null);
    }
  };

  // Product Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewIcon(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Product Add / Update
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAddingProduct(true);
    setError("");
    setMessage("");

    try {
      const url = "/api/admin/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          id: editingId || undefined,
          title: newTitle.trim(),
          description: newDescription.trim(),
          price: parseFloat(newPrice) || 0,
          compare_at_price: newComparePrice ? parseFloat(newComparePrice) : 0,
          download_link: newDownloadLink.trim(),
          icon: newIcon.trim(),
          video_url_1: videoUrl1.trim(),
          video_url_2: videoUrl2.trim(),
          video_url_3: videoUrl3.trim(),
          product_type: videoUrl1 || videoUrl2 || videoUrl3 ? "reels_bundle" : "bundle",
        }),
      });

      if (res.ok) {
        setMessage(editingId ? "Product updated successfully!" : "Product published successfully!");
        setEditingId(null);
        setNewTitle("");
        setNewDescription("");
        setNewPrice("");
        setNewComparePrice("");
        setNewDownloadLink("");
        setNewIcon("");
        setVideoUrl1("");
        setVideoUrl2("");
        setVideoUrl3("");
        await fetchProducts();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save product.");
      }
    } catch {
      setError("Error saving product.");
    } finally {
      setAddingProduct(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setNewTitle(p.title);
    setNewDescription(p.description);
    setNewPrice(p.price.toString());
    setNewComparePrice(p.compare_at_price ? p.compare_at_price.toString() : "");
    setNewDownloadLink(p.download_link);
    setNewIcon(p.icon);
    setVideoUrl1(p.video_url_1 || "");
    setVideoUrl2(p.video_url_2 || "");
    setVideoUrl3(p.video_url_3 || "");
  };

  const handleDeleteProduct = async (id: string) => {
    if (!password) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage("Product deleted successfully.");
        await fetchProducts();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete product.");
      }
    } catch {
      setError("Network error deleting product.");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSavingSettings(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          website_name: siteName.trim(),
          upi_id: upiId.trim(),
          qr_code: qrCode.trim(),
        }),
      });
      if (res.ok) {
        setMessage("Store settings updated successfully.");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save settings.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Coupons
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAddingCoupon(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discount_type: newCouponType,
          discount_value: parseFloat(newCouponValue) || 0,
        }),
      });
      if (res.ok) {
        setMessage("Coupon added.");
        setNewCouponCode("");
        setNewCouponValue("");
        await fetchCoupons();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to add coupon.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!password) return;
    if (!confirm(`Delete coupon ${code}?`)) return;
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setMessage("Coupon deleted.");
        await fetchCoupons();
      }
    } catch {
      setError("Network error.");
    }
  };

  // Filtered transactions
  const filteredTx = transactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.email.toLowerCase().includes(q) ||
      t.payment_name.toLowerCase().includes(q) ||
      (t.product_title || "").toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });

  const pendingCount = transactions.filter(t => t.status === "pending").length;
  const approvedCount = transactions.filter(t => t.status === "approved").length;
  const totalRevenue = transactions.filter(t => t.status === "approved").reduce((sum, t) => sum + (t.amount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} className="login-wrapper glass-card">
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Admin Login</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Enter admin password to continue.</p>
          <div className="form-group">
            <input 
              type="password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="glass-input"
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "8px" }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Top Header */}
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Store Admin Dashboard</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>Digital Products & Orders Verification Manager</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}>
          Logout
        </button>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}
      {message && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>{message}</div>}

      {/* Admin Navigation Tabs */}
      <div className="admin-nav">
        <button onClick={() => setActiveTab("payments")} className={`nav-btn ${activeTab === "payments" ? "active" : ""}`}>
          📋 Orders ({pendingCount})
        </button>
        <button onClick={() => setActiveTab("products")} className={`nav-btn ${activeTab === "products" ? "active" : ""}`}>
          📁 Products Catalog
        </button>
        <button onClick={() => setActiveTab("settings")} className={`nav-btn ${activeTab === "settings" ? "active" : ""}`}>
          ⚙️ Store Settings
        </button>
        <button onClick={() => setActiveTab("coupons")} className={`nav-btn ${activeTab === "coupons" ? "active" : ""}`}>
          🎟️ Coupons
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === "payments" && (
        <div>
          {/* Quick Stats */}
          <div className="stats-grid">
            <div className="simple-stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-number" style={{ color: "#818cf8" }}>₹{totalRevenue.toLocaleString("en-IN")}</div>
            </div>
            <div className="simple-stat-card">
              <div className="stat-label">Pending Verification</div>
              <div className="stat-number" style={{ color: "#fbbf24" }}>{pendingCount}</div>
            </div>
            <div className="simple-stat-card">
              <div className="stat-label">Approved Sales</div>
              <div className="stat-number" style={{ color: "#34d399" }}>{approvedCount}</div>
            </div>
          </div>

          <div className="simple-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Orders & Payment Verification</h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search orders..."
                  className="glass-input"
                  style={{ width: "220px", padding: "6px 12px", fontSize: "13px" }}
                />
                <button onClick={() => fetchTransactions()} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                  {loadingTransactions ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {filteredTx.length === 0 ? (
                <p style={{ color: "#94a3b8", padding: "24px 0", textAlign: "center" }}>No order records found.</p>
              ) : (
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer Email</th>
                      <th>Payer Name</th>
                      <th>Payment Screenshot</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map(t => (
                      <tr key={t.id}>
                        <td style={{ color: "#94a3b8", whiteSpace: "nowrap", fontSize: "12px" }}>
                          {new Date(t.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.email}</td>
                        <td style={{ fontWeight: 600 }}>{t.payment_name}</td>
                        <td>
                          {t.screenshot ? (
                            <button onClick={() => setSelectedScreenshot(t.screenshot)} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
                              View Image
                            </button>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "12px" }}>No Image</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.product_title || "Digital Product"}</td>
                        <td style={{ fontWeight: 700 }}>₹{t.amount}</td>
                        <td>
                          <span className={`badge badge-${t.status}`}>{t.status}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            {t.status === "pending" && (
                              <>
                                <button onClick={() => handleAction(t.id, "approve")} disabled={actionId === t.id} className="btn-approve">
                                  Approve
                                </button>
                                <button onClick={() => handleAction(t.id, "reject")} disabled={actionId === t.id} className="btn-reject">
                                  Reject
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDeleteTransaction(t.id)} disabled={deletingTxId === t.id} className="btn-delete" title="Delete record">
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {/* Add / Edit Form */}
          <form onSubmit={handleSaveProduct} className="simple-card">
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
              {editingId ? "Edit Product" : "Publish New Digital Product"}
            </h3>

            <div className="form-group">
              <label>Product Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="glass-input"
                placeholder="e.g. 1000+ HD Reels Bundle"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label>Price (₹)</label>
                <input 
                  type="number" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="glass-input"
                  placeholder="199"
                  required
                />
              </div>
              <div className="form-group">
                <label>Original Price (₹)</label>
                <input 
                  type="number" 
                  value={newComparePrice}
                  onChange={(e) => setNewComparePrice(e.target.value)}
                  className="glass-input"
                  placeholder="1499"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Google Drive / Download Link (Sent to customer after payment)</label>
              <input 
                type="url" 
                value={newDownloadLink}
                onChange={(e) => setNewDownloadLink(e.target.value)}
                className="glass-input"
                placeholder="https://drive.google.com/..."
                required
              />
            </div>

            <div className="form-group">
              <label>Cover Image (Thumbnail)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="glass-input" style={{ padding: "8px" }} />
              {newIcon && (
                <div style={{ marginTop: "8px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newIcon} alt="Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description & Features</label>
              <textarea 
                rows={3} 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="glass-input"
                placeholder="Details of what's included..."
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="submit" disabled={addingProduct} className="btn-primary" style={{ flex: 1 }}>
                {addingProduct ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
              </button>
              {editingId && (
                <button type="button" onClick={() => setEditingId(null)} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Published Products */}
          <div className="simple-card">
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Catalog ({products.length})</h3>
            {loadingProducts ? (
              <p style={{ color: "#94a3b8" }}>Loading catalog...</p>
            ) : products.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No products published yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {products.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.icon || "/placeholder.png"} alt={p.title} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "14px", color: "#fff" }}>{p.title}</strong>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>₹{p.price}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleEditProduct(p)} className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="btn-delete" style={{ padding: "4px 8px", fontSize: "11px" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="simple-card" style={{ maxWidth: "500px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Store Settings</h3>
          
          <div className="form-group">
            <label>Store / Website Name</label>
            <input 
              type="text" 
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="glass-input"
              placeholder="Shravana Store"
              required
            />
          </div>

          <div className="form-group">
            <label>UPI ID (For Payments)</label>
            <input 
              type="text" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="glass-input"
              placeholder="e.g. phonepe@ybl"
              required
            />
          </div>

          <div className="form-group">
            <label>UPI Payment QR Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => setQrCode(evt.target?.result as string);
                reader.readAsDataURL(file);
              }}
              className="glass-input"
            />
            {qrCode && (
              <div style={{ marginTop: "10px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code" style={{ width: "120px", height: "120px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            )}
          </div>

          <button type="submit" disabled={savingSettings} className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === "coupons" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <form onSubmit={handleAddCoupon} className="simple-card">
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px" }}>Add Coupon Code</h3>
            
            <div className="form-group">
              <label>Coupon Code</label>
              <input 
                type="text" 
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="glass-input"
                placeholder="SAVE20"
                required
              />
            </div>

            <div className="form-group">
              <label>Discount Type</label>
              <select 
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as any)}
                className="glass-input"
                style={{ appearance: "auto", color: "#000", background: "#fff" }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Discount Value</label>
              <input 
                type="number" 
                value={newCouponValue}
                onChange={(e) => setNewCouponValue(e.target.value)}
                className="glass-input"
                placeholder="20"
                required
              />
            </div>

            <button type="submit" disabled={addingCoupon} className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              {addingCoupon ? "Adding..." : "Add Coupon"}
            </button>
          </form>

          <div className="simple-card">
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px" }}>Active Coupons ({coupons.length})</h3>
            {loadingCoupons ? (
              <p style={{ color: "#94a3b8" }}>Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No coupons created yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {coupons.map(c => (
                  <div key={c.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
                    <div>
                      <strong style={{ color: "#818cf8", fontSize: "15px" }}>{c.code}</strong>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCoupon(c.code)} className="btn-delete" style={{ padding: "4px 8px", fontSize: "11px" }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div className="modal-backdrop" onClick={() => setSelectedScreenshot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Payment Screenshot</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedScreenshot} alt="Payment Receipt" style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }} />
            <button onClick={() => setSelectedScreenshot(null)} className="btn-primary" style={{ width: "100%", marginTop: "16px" }}>
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
