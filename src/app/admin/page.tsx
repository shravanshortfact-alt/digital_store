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
  product_type?: string;
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
  
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"payments" | "products" | "settings" | "coupons">("payments");

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Search, Filter & Bulk Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Product Catalog CRUD State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newComparePrice, setNewComparePrice] = useState("");
  const [newDownloadLink, setNewDownloadLink] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);
  const [videoUrl1, setVideoUrl1] = useState("");
  const [videoUrl2, setVideoUrl2] = useState("");
  const [videoUrl3, setVideoUrl3] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uiProductType, setUiProductType] = useState<"digital_file" | "reels_bundle">("digital_file");

  // Settings State
  const [siteName, setSiteName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");
  const [newCouponValue, setNewCouponValue] = useState("");
  const [addingCoupon, setAddingCoupon] = useState(false);
  
  const [error, setError] = useState("");
  const [productMessage, setProductMessage] = useState("");

  // Check saved session password
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin_session_pwd");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Image file is too large. Please select an image under 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setNewIcon(compressedBase64);
        setError("");
      };
      img.onerror = () => {
        setError("Invalid image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (index: 1 | 2 | 3) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        headers: { Authorization: password },
        body: formData,
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Video upload failed.");
        return;
      }
      if (index === 1) setVideoUrl1(data.url);
      else if (index === 2) setVideoUrl2(data.url);
      else if (index === 3) setVideoUrl3(data.url);
    } catch {
      setError("Video upload failed. Please try again.");
    }
  };

  const fetchTransactions = useCallback(async (authPassword = password) => {
    if (!authPassword) return;
    setLoadingTransactions(true);
    setError("");
    try {
      const response = await fetch("/api/admin/transactions", {
        headers: {
          "Authorization": authPassword,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as Transaction[];
        setTransactions(data);
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to fetch transactions");
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("admin_session_pwd");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setLoadingTransactions(false);
    }
  }, [password]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = (await response.json()) as Product[];
        setProducts(data);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSiteName(data.website_name || "");
        setUpiId(data.upi_id || "");
        setQrCode(data.qr_code || "");
        setSiteLogo(data.website_logo || "");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    if (!password) return;
    setLoadingCoupons(true);
    setError("");
    try {
      const response = await fetch("/api/admin/coupons", {
        headers: {
          "Authorization": password,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as Coupon[];
        setCoupons(data);
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to fetch coupons");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setLoadingCoupons(false);
    }
  }, [password]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "payments") {
        fetchTransactions();
      } else if (activeTab === "products") {
        fetchProducts();
      } else if (activeTab === "settings") {
        fetchSettings();
      } else if (activeTab === "coupons") {
        fetchCoupons();
      }
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
    setTransactions([]);
    setProducts([]);
    setCoupons([]);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!password) return;
    setActionId(id);
    setError("");
    setProductMessage("");
    try {
      const response = await fetch("/api/approve-utr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id, action }),
      });

      if (response.ok) {
        setProductMessage(`Transaction ${action === 'approve' ? 'Approved & Delivery Email Sent!' : 'Rejected'}`);
        await fetchTransactions();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || `Failed to ${action} transaction.`);
      }
    } catch (err) {
      console.error(err);
      setError("Connection error during verification.");
    } finally {
      setActionId(null);
    }
  };

  // Delete Individual Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!password) return;
    if (!confirm("Are you sure you want to delete this transaction record? This cannot be undone.")) return;
    
    setDeletingTxId(id);
    setError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/admin/transactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setProductMessage("Transaction deleted successfully.");
        setSelectedTxIds(prev => prev.filter(i => i !== id));
        await fetchTransactions();
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to delete transaction.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error while deleting transaction.");
    } finally {
      setDeletingTxId(null);
    }
  };

  // Bulk Select & Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTxIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleToggleTxSelect = (id: string) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: "bulk-approve" | "bulk-reject" | "bulk-delete") => {
    if (selectedTxIds.length === 0 || !password) return;
    
    let confirmText = "";
    if (action === "bulk-approve") {
      confirmText = `Are you sure you want to APPROVE ${selectedTxIds.length} selected transaction(s)? Fulfillment emails will be dispatched to customers.`;
    } else if (action === "bulk-reject") {
      confirmText = `Are you sure you want to REJECT ${selectedTxIds.length} selected transaction(s)?`;
    } else {
      confirmText = `Are you sure you want to DELETE ${selectedTxIds.length} selected transaction(s)? This action cannot be undone!`;
    }

    if (!confirm(confirmText)) return;

    setIsBulkProcessing(true);
    setError("");
    setProductMessage("");

    try {
      let endpoint = "/api/admin/bulk-transactions";
      let options: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ action, ids: selectedTxIds }),
      };

      const res = await fetch(endpoint, options);
      if (res.ok) {
        const data = await res.json();
        if (action === "bulk-delete") {
          setProductMessage(`${data.deletedCount || selectedTxIds.length} transaction(s) deleted successfully.`);
        } else {
          setProductMessage(`Bulk action processed successfully! (Success: ${data.successCount || 0}, Failed: ${data.failCount || 0})`);
        }
        setSelectedTxIds([]);
        await fetchTransactions();
      } else {
        const errData = await res.json();
        setError(errData.error || "Bulk action failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Error executing bulk action.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // CSV Export
  const exportTransactionsToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Date & Time", "Transaction ID", "Email", "Payer Name", "Product Title", "Product Type", "Coupon Code", "Amount (INR)", "Status"];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      `"${tx.id}"`,
      `"${tx.email}"`,
      `"${tx.payment_name.replace(/"/g, '""')}"`,
      `"${(tx.product_title || "").replace(/"/g, '""')}"`,
      `"${tx.product_type || "bundle"}"`,
      `"${tx.coupon_code || ""}"`,
      tx.amount,
      tx.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Product CRUD
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAddingProduct(true);
    setError("");
    setProductMessage("");

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid positive price.");
      setAddingProduct(false);
      return;
    }

    const comparePriceNum = newComparePrice ? parseFloat(newComparePrice) : 0;

    try {
      const url = "/api/admin/products";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          id: editingId || undefined,
          title: newTitle.trim(),
          description: newDescription.trim(),
          price: priceNum,
          compare_at_price: comparePriceNum,
          download_link: newDownloadLink.trim(),
          icon: newIcon.trim(),
          video_url_1: videoUrl1.trim(),
          video_url_2: videoUrl2.trim(),
          video_url_3: videoUrl3.trim(),
          product_type: uiProductType === "reels_bundle" ? "reels_bundle" : "bundle",
        }),
      });

      if (response.ok) {
        setProductMessage(editingId ? "Product updated successfully!" : "Product added successfully!");
        setNewTitle("");
        setNewDescription("");
        setNewPrice("");
        setNewComparePrice("");
        setNewDownloadLink("");
        setNewIcon("");
        setVideoUrl1("");
        setVideoUrl2("");
        setVideoUrl3("");
        setUiProductType("digital_file");
        setEditingId(null);
        await fetchProducts();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || `Failed to ${editingId ? "update" : "create"} product.`);
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setAddingProduct(false);
    }
  };

  const handleEditClick = (prod: Product) => {
    setEditingId(prod.id);
    setNewTitle(prod.title);
    setNewDescription(prod.description);
    setNewPrice(prod.price.toString());
    setNewComparePrice(prod.compare_at_price ? prod.compare_at_price.toString() : "");
    setNewDownloadLink(prod.download_link);
    setNewIcon(prod.icon);
    setVideoUrl1(prod.video_url_1 || "");
    setVideoUrl2(prod.video_url_2 || "");
    setVideoUrl3(prod.video_url_3 || "");
    setUiProductType(prod.video_url_1 || prod.video_url_2 || prod.video_url_3 ? "reels_bundle" : "digital_file");
    
    document.getElementById("prod-title")?.focus();
  };

  const handleCancelEdit = () => {
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
    setUiProductType("digital_file");
  };

  const handleDeleteProduct = async (id: string) => {
    if (!password) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setProductMessage("Product deleted successfully!");
        await fetchProducts();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error during delete.");
    }
  };

  // Settings & Coupons Handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSavingSettings(true);
    setError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          website_name: siteName.trim(),
          upi_id: upiId.trim(),
          qr_code: qrCode.trim(),
          website_logo: siteLogo.trim(),
        }),
      });

      if (response.ok) {
        setProductMessage("Settings saved successfully!");
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAddingCoupon(true);
    setError("");
    setProductMessage("");

    const valNum = parseFloat(newCouponValue);
    if (isNaN(valNum) || valNum <= 0) {
      setError("Please enter a valid positive discount value.");
      setAddingCoupon(false);
      return;
    }

    if (newCouponType === "percentage" && valNum > 100) {
      setError("Percentage discount cannot be greater than 100%.");
      setAddingCoupon(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({
          code: newCouponCode.trim(),
          discount_type: newCouponType,
          discount_value: valNum,
        }),
      });

      if (response.ok) {
        setProductMessage("Coupon added successfully!");
        setNewCouponCode("");
        setNewCouponValue("");
        await fetchCoupons();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to create coupon.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!password) return;
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    setError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        setProductMessage("Coupon deleted successfully!");
        await fetchCoupons();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || "Failed to delete coupon.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error during delete.");
    }
  };

  // Filtering transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesEmail = tx.email.toLowerCase().includes(q);
      const matchesName = tx.payment_name.toLowerCase().includes(q);
      const matchesId = tx.id.toLowerCase().includes(q);
      const matchesProduct = (tx.product_title || "").toLowerCase().includes(q);
      const matchesCoupon = (tx.coupon_code || "").toLowerCase().includes(q);
      if (!matchesEmail && !matchesName && !matchesId && !matchesProduct && !matchesCoupon) {
        return false;
      }
    }
    if (statusFilter !== "all" && tx.status !== statusFilter) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "oldest") return a.created_at - b.created_at;
    if (sortBy === "amount_high") return b.amount - a.amount;
    if (sortBy === "amount_low") return a.amount - b.amount;
    return b.created_at - a.created_at;
  });

  // Calculate statistics
  const totalCount = transactions.length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const approvedCount = transactions.filter((t) => t.status === "approved").length;
  const rejectedCount = transactions.filter((t) => t.status === "rejected").length;
  const totalRevenue = transactions
    .filter((t) => t.status === "approved")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} className="glass-card login-wrapper animate-fade-in">
          <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em" }}>Admin Login</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "-10px" }}>
            Enter your secret admin password to access digital product sales.
          </p>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="glass-input" 
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "8px" }}>
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container admin-container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.025em" }}>Digital Store Admin Panel</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage Digital Products, Reels Bundles & Payment Verifications</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px", borderColor: "rgba(239, 68, 68, 0.3)", color: "var(--error)" }}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--error)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
          {error}
        </div>
      )}

      {productMessage && (
        <div style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
          {productMessage}
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="tabs-header">
        <button 
          onClick={() => setActiveTab("payments")} 
          className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
        >
          Verify Payments ({pendingCount})
        </button>
        <button 
          onClick={() => setActiveTab("products")} 
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
        >
          Products & Reels Bundles
        </button>
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
        >
          Store Settings
        </button>
        <button 
          onClick={() => setActiveTab("coupons")} 
          className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
        >
          Discount Coupons
        </button>
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === "payments" && (
        <div>
          {/* Stats overview */}
          <div className="admin-stats">
            <div className="glass-card stat-card" style={{ borderColor: "rgba(99, 102, 241, 0.3)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Total Revenue</p>
              <div className="stat-val" style={{ color: "#6366f1" }}>₹{totalRevenue.toLocaleString("en-IN")}</div>
            </div>
            <div className="glass-card stat-card">
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Total Orders</p>
              <div className="stat-val">{totalCount}</div>
            </div>
            <div className="glass-card stat-card" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Pending Verification</p>
              <div className="stat-val" style={{ color: "#fbbf24" }}>{pendingCount}</div>
            </div>
            <div className="glass-card stat-card" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Approved Sales</p>
              <div className="stat-val" style={{ color: "#34d399" }}>{approvedCount}</div>
            </div>
          </div>

          {/* Search, Filter & Actions Control Bar */}
          <div className="admin-filter-bar">
            <div className="search-input-group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search by Email, Name, UTR, Product..."
                className="search-input"
                style={{ width: "100%" }}
              />
            </div>

            <div className="filter-group">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="filter-select"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="amount_high">Sort: Highest Amount</option>
                <option value="amount_low">Sort: Lowest Amount</option>
              </select>

              <button
                onClick={exportTransactionsToCSV}
                disabled={filteredTransactions.length === 0}
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: "12px", background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#34d399" }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Bulk Selection Toolbar */}
          {selectedTxIds.length > 0 && (
            <div className="bulk-toolbar">
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                ✓ {selectedTxIds.length} item(s) selected
              </span>
              <div className="bulk-actions">
                <button
                  onClick={() => handleBulkAction("bulk-approve")}
                  disabled={isBulkProcessing}
                  className="btn-approve"
                  style={{ padding: "8px 14px" }}
                >
                  Approve Selected ({selectedTxIds.length})
                </button>
                <button
                  onClick={() => handleBulkAction("bulk-reject")}
                  disabled={isBulkProcessing}
                  className="btn-reject"
                  style={{ padding: "8px 14px" }}
                >
                  Reject Selected ({selectedTxIds.length})
                </button>
                <button
                  onClick={() => handleBulkAction("bulk-delete")}
                  disabled={isBulkProcessing}
                  style={{ padding: "8px 14px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  🗑️ Delete Selected ({selectedTxIds.length})
                </button>
              </div>
            </div>
          )}

          {/* Transactions list card */}
          <div className="glass-card table-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Recent Orders & Payments ({filteredTransactions.length})</h2>
              <button 
                onClick={() => fetchTransactions()} 
                disabled={loadingTransactions} 
                className="btn-secondary" 
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                {loadingTransactions ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            <div className="table-responsive">
              {filteredTransactions.length === 0 ? (
                <div className="no-transactions">
                  {loadingTransactions ? "Fetching records..." : "No matching transactions found."}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <input 
                          type="checkbox"
                          checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Date & Time</th>
                      <th>Customer Email</th>
                      <th>Payer Name</th>
                      <th>Screenshot</th>
                      <th>Product</th>
                      <th>Coupon</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isSelected = selectedTxIds.includes(tx.id);
                      return (
                        <tr key={tx.id} className={isSelected ? "selected-row" : ""}>
                          <td>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTxSelect(tx.id)}
                            />
                          </td>
                          <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap", fontSize: "13px" }}>
                            {new Date(tx.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.email}</td>
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tx.payment_name}</td>
                          <td>
                            {tx.screenshot ? (
                              <button
                                type="button"
                                onClick={() => setSelectedScreenshot(tx.screenshot)}
                                className="btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                              >
                                🖼️ View Payment QR
                              </button>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>No Screenshot</span>
                            )}
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontWeight: 500, minWidth: "180px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{tx.product_title || "Digital Product"}</div>
                            {tx.product_type && (
                              <span style={{ fontSize: "11px", color: "#818cf8", fontWeight: 600, textTransform: "capitalize" }}>
                                {tx.product_type === "reels_bundle" ? "🎬 Reels Video Bundle" : "📁 Digital File Product"}
                              </span>
                            )}
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent-primary)" }}>{tx.coupon_code || "-"}</td>
                          <td style={{ fontWeight: 800, fontSize: "15px" }}>₹{tx.amount}</td>
                          <td>
                            <span className={`badge-status badge-${tx.status}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                              {tx.status === "pending" && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => handleAction(tx.id, "approve")} 
                                    disabled={actionId !== null}
                                    className="btn-approve"
                                  >
                                    {actionId === tx.id ? "..." : "Approve"}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleAction(tx.id, "reject")} 
                                    disabled={actionId !== null}
                                    className="btn-reject"
                                  >
                                    {actionId === tx.id ? "..." : "Reject"}
                                  </button>
                                </>
                              )}

                              {/* DELETE BUTTON for individual row */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(tx.id)}
                                disabled={deletingTxId === tx.id}
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                                title="Delete transaction record"
                              >
                                {deletingTxId === tx.id ? "..." : "🗑️ Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & REELS BUNDLES CATALOG MANAGER */}
      {activeTab === "products" && (
        <div className="admin-grid-layout">
          {/* Left Form Card */}
          <form onSubmit={handleAddProduct} className="glass-card form-card admin-form-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "-12px", marginBottom: "8px" }}>
              Publish high quality digital products & reels video bundles.
            </p>

            <div className="form-group">
              <label htmlFor="prod-type">Product Category</label>
              <select 
                id="prod-type" 
                value={uiProductType}
                onChange={(e) => setUiProductType(e.target.value as any)}
                className="glass-input"
                style={{ appearance: "auto", background: "rgba(255,255,255,0.9)", color: "#000" }}
              >
                <option value="digital_file">📁 Digital Product / File (Google Drive / Direct Download link)</option>
                <option value="reels_bundle">🎬 Reels Video Bundle (With HD Clipping Samples)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prod-title">Product Title</label>
              <input 
                type="text" 
                id="prod-title" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="glass-input" 
                placeholder={uiProductType === 'reels_bundle' ? "e.g. 1000+ High Quality Motivational Reels Bundle" : "e.g. Complete E-book & Digital Template Pack"}
                required 
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="prod-price">Price (₹)</label>
                <input 
                  type="number" 
                  id="prod-price" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="glass-input" 
                  placeholder="e.g. 199"
                  step="1"
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="prod-compare-price">Compare-at / Original Price (₹)</label>
                <input 
                  type="number" 
                  id="prod-compare-price" 
                  value={newComparePrice}
                  onChange={(e) => setNewComparePrice(e.target.value)}
                  className="glass-input" 
                  placeholder="e.g. 1499"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="download-link">Google Drive / Download Link (Sent automatically after payment)</label>
              <input 
                type="url" 
                id="download-link" 
                value={newDownloadLink}
                onChange={(e) => setNewDownloadLink(e.target.value)}
                className="glass-input" 
                placeholder="https://drive.google.com/drive/folders/..."
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="prod-image">Cover Thumbnail Image</label>
              <input 
                type="file" 
                id="prod-image" 
                accept="image/*"
                onChange={handleImageUpload}
                className="glass-input" 
                style={{ padding: "10px 14px" }}
                required={!newIcon}
              />
              {newIcon && (
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={newIcon} 
                    alt="Upload Preview" 
                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--glass-border)" }} 
                  />
                  <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>✓ Thumbnail ready</span>
                </div>
              )}
            </div>

            {/* HD Clipping Sample Videos for Reels Bundles */}
            {uiProductType === "reels_bundle" && (
              <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "12px", padding: "16px", marginTop: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#818cf8", marginBottom: "8px" }}>🎬 HD Sample Videos (Video Previews / Clipping)</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Upload up to 3 video clips to showcase video quality to customers.
                </p>

                <div className="form-group">
                  <label>Sample Video Clip 1</label>
                  <input type="file" accept="video/*" onChange={handleVideoUpload(1)} className="glass-input" style={{ padding: "8px" }} />
                  {videoUrl1 && <span style={{ fontSize: "11px", color: "#34d399" }}>✓ Sample 1 Uploaded</span>}
                </div>

                <div className="form-group">
                  <label>Sample Video Clip 2</label>
                  <input type="file" accept="video/*" onChange={handleVideoUpload(2)} className="glass-input" style={{ padding: "8px" }} />
                  {videoUrl2 && <span style={{ fontSize: "11px", color: "#34d399" }}>✓ Sample 2 Uploaded</span>}
                </div>

                <div className="form-group">
                  <label>Sample Video Clip 3</label>
                  <input type="file" accept="video/*" onChange={handleVideoUpload(3)} className="glass-input" style={{ padding: "8px" }} />
                  {videoUrl3 && <span style={{ fontSize: "11px", color: "#34d399" }}>✓ Sample 3 Uploaded</span>}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label htmlFor="prod-desc">Product Description & Included Features</label>
              <textarea 
                id="prod-desc" 
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="glass-input" 
                placeholder="Describe what the customer will receive in this bundle..."
                required 
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button type="submit" disabled={addingProduct} className="btn-primary" style={{ flex: 1 }}>
                {addingProduct ? (editingId ? "Saving..." : "Publishing...") : (editingId ? "Update Product" : "Publish Product")}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Right Product List */}
          <div className="glass-card table-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em", marginBottom: "16px" }}>
              Published Catalog Products ({products.length})
            </h2>

            {loadingProducts ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>Loading catalog...</p>
            ) : products.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>No products published yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {products.map((prod) => (
                  <div 
                    key={prod.id} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "16px", 
                      padding: "12px 16px", 
                      border: "1px solid var(--glass-border)", 
                      borderRadius: "12px", 
                      background: "rgba(255,255,255,0.02)" 
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={prod.icon || "/placeholder.png"} 
                      alt={prod.title} 
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} 
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{prod.title}</h4>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                        Price: ₹{prod.price} {prod.compare_at_price ? <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>₹{prod.compare_at_price}</span> : ""}
                      </p>
                      <span style={{ fontSize: "11px", color: "#818cf8", fontWeight: 600 }}>
                        {prod.video_url_1 || prod.video_url_2 || prod.video_url_3 ? "🎬 Reels Video Bundle" : "📁 Digital File Product"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        type="button" 
                        onClick={() => handleEditClick(prod)} 
                        className="btn-secondary" 
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteProduct(prod.id)} 
                        style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORE SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="glass-card form-card admin-form-card" style={{ maxWidth: "600px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Store Payment & Branding Settings</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
            Configure your UPI ID, QR code image, store logo, and site name.
          </p>

          <div className="form-group">
            <label htmlFor="site-name">Website / Store Name</label>
            <input 
              type="text" 
              id="site-name" 
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="glass-input" 
              placeholder="e.g. Shravana Store"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="upi-id">UPI ID (For manual QR payment verification)</label>
            <input 
              type="text" 
              id="upi-id" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="glass-input" 
              placeholder="e.g. username@upi or phonepe@ybl"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="qr-code">Payment QR Code Image</label>
            <input 
              type="file" 
              id="qr-code" 
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
              <div style={{ marginTop: "12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code" style={{ width: "140px", height: "140px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--glass-border)" }} />
              </div>
            )}
          </div>

          <button type="submit" disabled={savingSettings} className="btn-primary" style={{ marginTop: "16px", width: "100%" }}>
            {savingSettings ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === "coupons" && (
        <div className="admin-grid-layout">
          <form onSubmit={handleAddCoupon} className="glass-card form-card admin-form-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Add Discount Coupon</h2>
            <div className="form-group">
              <label htmlFor="coupon-code">Coupon Code</label>
              <input 
                type="text" 
                id="coupon-code" 
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="glass-input" 
                placeholder="e.g. SAVE20"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="coupon-type">Discount Type</label>
              <select 
                id="coupon-type" 
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as any)}
                className="glass-input"
                style={{ appearance: "auto", background: "rgba(255,255,255,0.9)", color: "#000" }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="coupon-val">Discount Value</label>
              <input 
                type="number" 
                id="coupon-val" 
                value={newCouponValue}
                onChange={(e) => setNewCouponValue(e.target.value)}
                className="glass-input" 
                placeholder={newCouponType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                required 
              />
            </div>

            <button type="submit" disabled={addingCoupon} className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
              {addingCoupon ? "Adding Coupon..." : "Create Coupon"}
            </button>
          </form>

          <div className="glass-card table-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Active Coupons ({coupons.length})</h2>
            {loadingCoupons ? (
              <p style={{ color: "var(--text-muted)" }}>Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No discount coupons created yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {coupons.map((c) => (
                  <div key={c.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid var(--glass-border)", borderRadius: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "16px", color: "var(--accent-primary)", letterSpacing: "0.05em" }}>{c.code}</strong>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteCoupon(c.code)}
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                    >
                      🗑️ Delete
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
        <div className="admin-modal-overlay" onClick={() => setSelectedScreenshot(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", textAlign: "center" }}>
            <h3 className="admin-modal-title">Payment Verification Screenshot</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedScreenshot} alt="Payment Receipt" style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px", marginTop: "12px" }} />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setSelectedScreenshot(null)} className="btn-primary" style={{ width: "100%" }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
