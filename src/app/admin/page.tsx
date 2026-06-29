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
  instagram_link?: string;
  instagram_quantity?: number;
  product_type?: string;
  base_quantity?: number;
  instagram_service_type?: string;
  smm_order_id?: number | null;
  smm_order_status?: string | null;
  smm_order_error?: string | null;
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
  instagram_service_type?: string;
  instagram_quantity?: number;
  smm_service_id?: number | null;
  created_at: number;
}

interface Coupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  created_at: number;
}

const isUrl = (str: string) => {
  if (!str) return false;
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/") || str.startsWith("data:");
};

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"payments" | "products" | "settings" | "coupons">("payments");

  // State: Payments
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // State: Catalog CRUD
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
  
  // Instagram properties state
  const [productType, setProductType] = useState<"bundle" | "instagram">("bundle");
  const [instagramServiceType, setInstagramServiceType] = useState<"followers" | "likes" | "views">("followers");
  const [instagramQuantity, setInstagramQuantity] = useState("100");
  const [smmServiceId, setSmmServiceId] = useState("");
  const [uiProductType, setUiProductType] = useState<"digital_file" | "reels_bundle" | "instagram_followers" | "instagram_likes" | "instagram_views">("digital_file");

  const handleUiProductTypeChange = (val: "digital_file" | "reels_bundle" | "instagram_followers" | "instagram_likes" | "instagram_views") => {
    setUiProductType(val);
    if (val === "digital_file" || val === "reels_bundle") {
      setProductType("bundle");
    } else if (val === "instagram_followers") {
      setProductType("instagram");
      setInstagramServiceType("followers");
    } else if (val === "instagram_likes") {
      setProductType("instagram");
      setInstagramServiceType("likes");
    } else if (val === "instagram_views") {
      setProductType("instagram");
      setInstagramServiceType("views");
    }
  };

  // SMM Aggregator State
  const [smmBalance, setSmmBalance] = useState<{ balance: string; currency: string } | null>(null);
  const [smmServices, setSmmServices] = useState<any[]>([]);
  const [showSmmBrowser, setShowSmmBrowser] = useState(false);
  const [searchSmmQuery, setSearchSmmQuery] = useState("");
  const [loadingSmmServices, setLoadingSmmServices] = useState(false);
  const [syncingSmmTxId, setSyncingSmmTxId] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showSmmBrowser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showSmmBrowser]);

  // State: Settings
  const [siteName, setSiteName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // State: Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");
  const [newCouponValue, setNewCouponValue] = useState("");
  const [addingCoupon, setAddingCoupon] = useState(false);
  
  const [error, setError] = useState("");
  const [productMessage, setProductMessage] = useState("");

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

    // Build form data and POST to the upload API
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

  // Check if session has stored password
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin_session_pwd");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

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

  const fetchSmmBalance = useCallback(async (authPassword = password) => {
    if (!authPassword) return;
    try {
      const response = await fetch("/api/admin/smm?action=balance", {
        headers: {
          "Authorization": authPassword,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSmmBalance(data);
      }
    } catch (err) {
      console.error("Error loading SMM balance:", err);
    }
  }, [password]);

  const handleSyncSmmStatus = async (txId: string) => {
    if (!password) return;
    setSyncingSmmTxId(txId);
    setError("");
    setProductMessage("");
    try {
      const response = await fetch(`/api/admin/smm?action=sync-order&transaction_id=${txId}`, {
        headers: {
          "Authorization": password,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductMessage(`SMM Status synced successfully: ${data.status}`);
          await fetchTransactions();
        } else {
          setError(data.error || "Failed to sync SMM status.");
        }
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to sync SMM status.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error syncing SMM status.");
    } finally {
      setSyncingSmmTxId(null);
    }
  };

  const handleRetrySmmOrder = async (txId: string, currentQty: number) => {
    if (!password) return;
    
    const qtyInput = prompt("Enter the quantity to send to the SMM panel (Service might have a minimum requirement):", currentQty.toString());
    if (qtyInput === null) return; // Cancelled
    
    const newQty = parseInt(qtyInput, 10);
    if (isNaN(newQty) || newQty <= 0) {
      alert("Invalid quantity.");
      return;
    }

    if (!confirm(`Are you sure you want to retry placing this SMM order with ${newQty} units?`)) return;
    
    setSyncingSmmTxId(txId);
    setError("");
    setProductMessage("");
    try {
      const response = await fetch("/api/admin/smm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": password,
        },
        body: JSON.stringify({ action: "retry", transaction_id: txId, quantity: newQty }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductMessage(`SMM Order placed successfully! Order ID: ${data.orderId}`);
          await fetchTransactions();
          await fetchSmmBalance();
        } else {
          setError(data.error || "Failed to place SMM order.");
        }
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to place SMM order.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error retrying SMM order.");
    } finally {
      setSyncingSmmTxId(null);
    }
  };

  const handleFetchSmmServices = async () => {
    if (!password) {
      setError("Please login to browse SMM services.");
      return;
    }
    setLoadingSmmServices(true);
    setShowSmmBrowser(true);
    setError("");
    try {
      const response = await fetch("/api/admin/smm?action=services", {
        headers: {
          "Authorization": password,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSmmServices(data || []);
      } else {
        const text = await response.text();
        let message = "Failed to fetch SMM services list.";
        try {
          const errData = JSON.parse(text);
          message = errData.error || message;
        } catch {
          message = text || message;
        }
        setError(message);
      }
    } catch (err) {
      console.error(err);
      setError("Connection error fetching SMM services.");
    } finally {
      setLoadingSmmServices(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "payments") {
        fetchTransactions();
        fetchSmmBalance();
      } else if (activeTab === "products") {
        fetchProducts();
      } else if (activeTab === "settings") {
        fetchSettings();
      } else if (activeTab === "coupons") {
        fetchCoupons();
      }
    }
  }, [isAuthenticated, activeTab, fetchTransactions, fetchProducts, fetchSettings, fetchCoupons, fetchSmmBalance]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("QR code image file is too large. Please select an image under 15MB.");
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setQrCode(compressedBase64);
        setError("");
      };
      img.onerror = () => {
        setError("Invalid QR code image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError("Failed to read QR code file.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Logo image file is too large. Please select an image under 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
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

        const compressedBase64 = canvas.toDataURL("image/png");
        setSiteLogo(compressedBase64);
        setError("");
      };
      img.onerror = () => {
        setError("Invalid logo image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError("Failed to read logo file.");
    };
    reader.readAsDataURL(file);
  };

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
    setSiteName("");
    setUpiId("");
    setQrCode("");
    setCoupons([]);
    setNewCouponCode("");
    setNewCouponValue("");
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (!password) return;
    setActionId(id);
    setError("");
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
        await fetchTransactions();
      } else {
        const errData = (await response.json()) as { error?: string };
        setError(errData.error || `Failed to ${action} transaction.`);
      }
    } catch (err) {
      console.error(err);
      setError("Connection error during approval.");
    } finally {
      setActionId(null);
    }
  };

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
          download_link: productType === 'instagram' ? 'instagram_service' : newDownloadLink.trim(),
          icon: newIcon.trim(),
          video_url_1: videoUrl1.trim(),
          video_url_2: videoUrl2.trim(),
          video_url_3: videoUrl3.trim(),
          product_type: productType,
          instagram_service_type: productType === 'instagram' ? instagramServiceType : undefined,
          instagram_quantity: productType === 'instagram' ? (parseInt(instagramQuantity) || 1) : undefined,
          smm_service_id: productType === 'instagram' && smmServiceId ? parseInt(smmServiceId) : undefined,
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
        setProductType("bundle");
        setInstagramServiceType("followers");
        setUiProductType("digital_file");
        setInstagramQuantity("100");
        setSmmServiceId("");
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
    setNewDownloadLink(prod.product_type === 'instagram' ? "" : prod.download_link);
    setNewIcon(prod.icon);
    setVideoUrl1(prod.video_url_1 || "");
    setVideoUrl2(prod.video_url_2 || "");
    setVideoUrl3(prod.video_url_3 || "");
    setProductType((prod.product_type as "bundle" | "instagram") || "bundle");
    setInstagramServiceType((prod.instagram_service_type as "followers" | "likes" | "views") || "followers");
    setInstagramQuantity(prod.instagram_quantity ? prod.instagram_quantity.toString() : "100");
    setSmmServiceId(prod.smm_service_id ? prod.smm_service_id.toString() : "");
    if (prod.product_type === "instagram") {
      if (prod.instagram_service_type === "likes") {
        setUiProductType("instagram_likes");
      } else if (prod.instagram_service_type === "views") {
        setUiProductType("instagram_views");
      } else {
        setUiProductType("instagram_followers");
      }
    } else {
      if (prod.video_url_1 || prod.video_url_2 || prod.video_url_3) {
        setUiProductType("reels_bundle");
      } else {
        setUiProductType("digital_file");
      }
    }
    
    // Scroll form into view
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
    setProductType("bundle");
    setInstagramServiceType("followers");
    setUiProductType("digital_file");
    setInstagramQuantity("100");
    setSmmServiceId("");
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

  // Stats calculation
  const totalCount = transactions.length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const approvedCount = transactions.filter((t) => t.status === "approved").length;
  const rejectedCount = transactions.filter((t) => t.status === "rejected").length;

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} className="glass-card login-wrapper animate-fade-in">
          <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em" }}>Admin Login</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "-10px" }}>
            Enter your secret admin password to access transaction records.
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
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.025em" }}>Admin Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Store verification and catalog manager</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {smmBalance && (
            <div style={{ backgroundColor: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.2)", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>💰 SMM Balance:</span>
              <strong style={{ color: "var(--text-primary)" }}>{smmBalance.currency === "USD" ? "$" : ""}{parseFloat(smmBalance.balance).toFixed(2)} {smmBalance.currency}</strong>
            </div>
          )}
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

      {/* Tabs System Header */}
      <div className="tabs-header">
        <button 
          onClick={() => setActiveTab("payments")} 
          className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
        >
          Verify Payments
        </button>
        <button 
          onClick={() => setActiveTab("products")} 
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
        >
          Manage Catalog Products
        </button>
        <button 
          onClick={() => setActiveTab("settings")} 
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
        >
          Settings
        </button>
        <button 
          onClick={() => setActiveTab("coupons")} 
          className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
        >
          Coupons
        </button>
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === "payments" && (
        <div>
          {/* Stats row */}
          <div className="admin-stats">
            <div className="glass-card stat-card">
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Total Inquiries</p>
              <div className="stat-val">{totalCount}</div>
            </div>
            <div className="glass-card stat-card" style={{ borderColor: "rgba(245, 158, 11, 0.2)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Pending Verification</p>
              <div className="stat-val" style={{ color: "var(--warning)" }}>{pendingCount}</div>
            </div>
            <div className="glass-card stat-card" style={{ borderColor: "rgba(16, 185, 129, 0.2)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Approved Sales</p>
              <div className="stat-val" style={{ color: "var(--success)" }}>{approvedCount}</div>
            </div>
            <div className="glass-card stat-card" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Rejected</p>
              <div className="stat-val" style={{ color: "var(--error)" }}>{rejectedCount}</div>
            </div>
          </div>

          {/* Transactions list card */}
          <div className="glass-card table-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Recent Transactions</h2>
              <button 
                onClick={() => fetchTransactions()} 
                disabled={loadingTransactions} 
                className="btn-secondary" 
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                {loadingTransactions ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="table-responsive">
              {transactions.length === 0 ? (
                <div className="no-transactions">
                  {loadingTransactions ? "Fetching transaction records..." : "No transactions recorded yet."}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Email Address</th>
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
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(tx.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </td>
                        <td style={{ fontWeight: 500 }}>{tx.email}</td>
                        <td style={{ fontWeight: 600 }}>{tx.payment_name}</td>
                        <td>
                          {tx.screenshot ? (
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot(tx.screenshot)}
                              className="btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                            >
                              View Image
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>No Image</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontWeight: 500, minWidth: "180px" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tx.product_title || "Unknown Product"}</div>
                          {tx.product_type === "instagram" && tx.instagram_link && (
                            <div style={{ marginTop: "6px", fontSize: "12px", borderLeft: "2px solid var(--accent-primary)", paddingLeft: "8px" }}>
                              <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, display: "block", color: "var(--accent-secondary)" }}>
                                Instagram {tx.instagram_service_type || "Service"}
                              </span>
                              <a href={tx.instagram_link} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--accent-primary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }} title={tx.instagram_link}>
                                {tx.instagram_link}
                              </a>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
                                Qty: {(tx.instagram_quantity || 1000).toLocaleString()} units
                              </span>

                              {/* SMM Order Details */}
                              {tx.status === "approved" && (
                                <div style={{ marginTop: "6px", fontSize: "11px", borderTop: "1px dashed rgba(0,0,0,0.06)", paddingTop: "4px" }}>
                                  {tx.smm_order_id ? (
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <strong style={{ color: "var(--text-muted)" }}>SMM:</strong>
                                        <span>#{tx.smm_order_id}</span>
                                        <span className={`badge badge-${tx.smm_order_status?.toLowerCase() || "pending"}`} style={{ fontSize: "9px", padding: "1px 4px", textTransform: "capitalize", height: "auto" }}>
                                          {tx.smm_order_status || "Pending"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleSyncSmmStatus(tx.id)}
                                        disabled={syncingSmmTxId === tx.id}
                                        style={{ background: "none", border: "none", color: "var(--accent-primary)", textDecoration: "underline", fontSize: "10px", padding: 0, marginTop: "2px", cursor: "pointer" }}
                                      >
                                        {syncingSmmTxId === tx.id ? "Syncing..." : "Sync Status"}
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      {tx.smm_order_error ? (
                                        <div style={{ color: "var(--error)", fontSize: "10px", lineHeight: 1.2 }} title={tx.smm_order_error}>
                                          Error: {tx.smm_order_error.length > 40 ? tx.smm_order_error.substring(0, 38) + "..." : tx.smm_order_error}
                                        </div>
                                      ) : (
                                        <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>Order not placed</div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRetrySmmOrder(tx.id, tx.instagram_quantity || 1000)}
                                        disabled={syncingSmmTxId === tx.id}
                                        style={{ background: "none", border: "none", color: "var(--accent-primary)", textDecoration: "underline", fontSize: "10px", padding: 0, marginTop: "2px", cursor: "pointer" }}
                                      >
                                        {syncingSmmTxId === tx.id ? "Placing..." : "Retry SMM Order"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent-primary)" }}>{tx.coupon_code || "-"}</td>
                        <td style={{ fontWeight: 600 }}>₹{tx.amount}</td>
                        <td>
                          <span className={`badge badge-${tx.status}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {tx.status === "pending" ? (
                            <div className="action-btns" style={{ justifyContent: "flex-end" }}>
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
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Verified</span>
                          )}
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

      {/* TAB 2: PRODUCTS CATALOG MANAGER */}
      {activeTab === "products" && (
        <div className="admin-grid-layout">
          {/* Left Form Card */}
          <form onSubmit={handleAddProduct} className="glass-card form-card admin-form-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "-12px", marginBottom: "8px" }}>
              Publish a new reels bundle or Instagram service package.
            </p>

            <div className="form-group">
              <label htmlFor="prod-type">Product Type (Product Ka Type)</label>
              <select 
                id="prod-type" 
                value={uiProductType}
                onChange={(e) => handleUiProductTypeChange(e.target.value as any)}
                className="glass-input"
                style={{ appearance: "auto", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(226, 232, 240, 0.9)" }}
              >
                <option value="digital_file">📁 Digital File (e.g. drive / download link)</option>
                <option value="reels_bundle">🎬 Reels Bundle (with video samples)</option>
                <option value="instagram_followers">👥 Instagram Followers</option>
                <option value="instagram_likes">❤️ Instagram Likes</option>
                <option value="instagram_views">👁️ Instagram Views</option>
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
                placeholder={productType === 'instagram' ? "e.g. 1000 High Quality Instagram Followers" : "e.g. Master Motivation Reels Bundle"}
                required 
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="prod-price">{productType === 'instagram' ? 'Per Unit Price (₹)' : 'Price (₹)'}</label>
                <input 
                  type="number" 
                  id="prod-price" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="glass-input" 
                  placeholder={productType === 'instagram' ? 'e.g. 0.10' : 'e.g. 199'}
                  step={productType === 'instagram' ? '0.001' : '1'}
                  required 
                />
                {productType === 'instagram' && (
                  <span className="input-note">Price for 1 follower/like/view. Example: 0.10 means ₹0.10 per follower</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="prod-compare-price">Original Price / Compare-at (₹)</label>
                <input 
                  type="number" 
                  id="prod-compare-price" 
                  value={newComparePrice}
                  onChange={(e) => setNewComparePrice(e.target.value)}
                  className="glass-input" 
                  placeholder="e.g. 1499 (Optional)"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prod-image">Product Cover Image</label>
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
                  <button 
                    type="button" 
                    onClick={() => setNewIcon("")} 
                    className="btn-secondary" 
                    style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="prod-desc">Description</label>
              <textarea 
                id="prod-desc" 
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="glass-input" 
                rows={3}
                placeholder={productType === 'instagram' ? "Explain the service details, delivery time, drop guarantee, etc..." : "Briefly describe what's included in this digital bundle..."}
                style={{ resize: "none" }}
                required 
              />
            </div>

            {productType === "instagram" && (
              <div style={{ border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px", backgroundColor: "rgba(79, 70, 229, 0.03)", marginBottom: "16px" }}>
                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="insta-service-type">Instagram Service Type</label>
                    <select
                      id="insta-service-type"
                      value={instagramServiceType}
                      onChange={(e) => setInstagramServiceType(e.target.value as "followers" | "likes" | "views")}
                      className="glass-input"
                      style={{ appearance: "auto", background: "#ffffff" }}
                    >
                      <option value="followers">Followers 👥</option>
                      <option value="likes">Likes ❤️</option>
                      <option value="views">Views 👁️</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="insta-qty">Minimum Order Quantity</label>
                    <input
                      type="number"
                      id="insta-qty"
                      value={instagramQuantity}
                      onChange={(e) => setInstagramQuantity(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 100"
                      min="1"
                    />
                    <span className="input-note">Customer ko kam se kam itne order karne padenge</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "12px", marginBottom: 0 }}>
                  <label htmlFor="smm-service-id">SMM Panel Package Service ID</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      id="smm-service-id"
                      value={smmServiceId}
                      onChange={(e) => setSmmServiceId(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 30067"
                      required={productType === "instagram"}
                    />
                    <button
                      type="button"
                      onClick={handleFetchSmmServices}
                      className="btn-secondary"
                      style={{ padding: "0 16px", whiteSpace: "nowrap", fontSize: "13px", height: "auto" }}
                    >
                      Browse SMM
                    </button>
                  </div>
                  <span className="input-note">Favoritesmm service package ID linked to this product (e.g. 101 or 30067)</span>
                </div>

                {/* Live Price Preview */}
                {newPrice && instagramQuantity && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "rgba(79, 70, 229, 0.06)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>💡</span>
                    <span>
                      {parseInt(instagramQuantity)} {instagramServiceType} = ₹{(parseFloat(newPrice) * parseInt(instagramQuantity)).toFixed(2)}
                      {' '}(₹{newPrice}/unit × {instagramQuantity} min qty)
                    </span>
                  </div>
                )}
              </div>
            )}

            {productType === "bundle" && (
              <div className="form-group">
                <label htmlFor="prod-link">Fulfillment Download Link</label>
                <input 
                  type="url" 
                  id="prod-link" 
                  value={newDownloadLink}
                  onChange={(e) => setNewDownloadLink(e.target.value)}
                  className="glass-input" 
                  placeholder="Google Drive / Dropbox folder link"
                  required={productType === "bundle"} 
                />
                <span className="input-note">This link will be emailed to verified buyers automatically.</span>
              </div>
            )}

            {uiProductType === "reels_bundle" && (
              <div className="form-group" style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "16px", marginTop: "8px" }}>
                <label style={{ fontWeight: 700, color: "var(--accent-primary)" }}>🎬 Product Sample Videos (Optional)</label>
                <span className="input-note" style={{ marginBottom: "8px" }}>
                  Upload video files to display as sample reels on the checkout page. Files are saved on the server — no size issues!
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Video 1 */}
                    <div style={{ border: "1px dashed var(--glass-border)", borderRadius: "8px", padding: "12px" }}>
                      <label htmlFor="video-file-1" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Sample Video 1</label>
                      <input 
                        type="file" 
                        id="video-file-1" 
                        accept="video/*"
                        onChange={handleVideoUpload(1)}
                        className="glass-input" 
                        style={{ padding: "8px 12px", marginTop: "6px" }}
                      />
                      {videoUrl1 && (
                        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <video src={videoUrl1} controls muted playsInline style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                          <button 
                            type="button" 
                            onClick={() => setVideoUrl1("")} 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "11px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                          >
                            Remove Video 1
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Video 2 */}
                    <div style={{ border: "1px dashed var(--glass-border)", borderRadius: "8px", padding: "12px" }}>
                      <label htmlFor="video-file-2" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Sample Video 2</label>
                      <input 
                        type="file" 
                        id="video-file-2" 
                        accept="video/*"
                        onChange={handleVideoUpload(2)}
                        className="glass-input" 
                        style={{ padding: "8px 12px", marginTop: "6px" }}
                      />
                      {videoUrl2 && (
                        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <video src={videoUrl2} controls muted playsInline style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                          <button 
                            type="button" 
                            onClick={() => setVideoUrl2("")} 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "11px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                          >
                            Remove Video 2
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Video 3 */}
                    <div style={{ border: "1px dashed var(--glass-border)", borderRadius: "8px", padding: "12px" }}>
                      <label htmlFor="video-file-3" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Sample Video 3</label>
                      <input 
                        type="file" 
                        id="video-file-3" 
                        accept="video/*"
                        onChange={handleVideoUpload(3)}
                        className="glass-input" 
                        style={{ padding: "8px 12px", marginTop: "6px" }}
                      />
                      {videoUrl3 && (
                        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <video src={videoUrl3} controls muted playsInline style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                          <button 
                            type="button" 
                            onClick={() => setVideoUrl3("")} 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "11px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                          >
                            Remove Video 3
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            )}



            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button type="submit" disabled={addingProduct} className="btn-primary" style={{ flexGrow: 1 }}>
                {addingProduct ? "Saving..." : editingId ? "Save Changes" : "Add Product to Store"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn-secondary" style={{ padding: "14px 20px" }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {/* Right Product List Card */}
          <div className="glass-card table-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Current Products Catalog</h2>
            <div className="table-responsive">
              {loadingProducts ? (
                <div className="no-transactions">Loading catalog...</div>
              ) : products.length === 0 ? (
                <div className="no-transactions">No products published yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Icon</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ fontSize: "20px" }}>
                          {isUrl(prod.icon) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={prod.icon} 
                              alt={prod.title} 
                              style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "6px", display: "inline-block" }} 
                            />
                          ) : (
                            prod.icon
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {prod.title}
                          {prod.product_type === 'instagram' ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', marginLeft: '8px' }}>
                              Insta {prod.instagram_service_type}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', marginLeft: '8px' }}>
                              Bundle
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {prod.product_type === 'instagram' ? (
                            <div>
                              <span>₹{prod.price}/unit</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                Min: {prod.instagram_quantity || 1}
                              </div>
                            </div>
                          ) : (
                            <>₹{prod.price}</>
                          )}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button 
                            type="button"
                            onClick={() => handleEditClick(prod)} 
                            className="btn-approve"
                            style={{ padding: "4px 8px", marginRight: "8px", backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)} 
                            className="btn-reject"
                            style={{ padding: "4px 8px" }}
                          >
                            Delete
                          </button>
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

      {/* TAB 3: SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <form onSubmit={handleSaveSettings} className="glass-card form-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Website Settings</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "-12px" }}>
              Configure your store name, payment UPI ID, and QR code.
            </p>

            {loadingSettings ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>Loading settings...</div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="settings-sitename">Website Name</label>
                  <input 
                    type="text" 
                    id="settings-sitename" 
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="glass-input" 
                    placeholder="e.g. ReelsStore"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-logo">Website Logo (Optional)</label>
                  <input 
                    type="file" 
                    id="settings-logo" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="glass-input" 
                    style={{ padding: "10px 14px" }}
                  />
                  <span className="input-note">Select a custom logo image for the website header.</span>
                  
                  {siteLogo && (
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={siteLogo} 
                        alt="Website Logo Preview" 
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "50%", border: "1px solid var(--glass-border)" }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setSiteLogo("")} 
                        className="btn-secondary" 
                        style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="settings-upiid">Merchant UPI ID</label>
                  <input 
                    type="text" 
                    id="settings-upiid" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="glass-input" 
                    placeholder="e.g. merchant@upi"
                    required 
                  />
                  <span className="input-note">UPI ID where customer payments will be routed.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="settings-qrcode">Custom static QR Code (Optional)</label>
                  <input 
                    type="file" 
                    id="settings-qrcode" 
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="glass-input" 
                    style={{ padding: "10px 14px" }}
                  />
                  <span className="input-note">If left blank, a dynamic UPI QR code containing the exact amount and product name will be automatically generated.</span>
                  
                  {qrCode && (
                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrCode} 
                        alt="Custom QR Code" 
                        style={{ width: "120px", height: "120px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--glass-border)", backgroundColor: "white", padding: "4px" }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setQrCode("")} 
                        className="btn-secondary" 
                        style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                      >
                        Remove QR Code
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={savingSettings} className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: COUPONS */}
      {activeTab === "coupons" && (
        <div className="admin-grid-layout">
          {/* Left Form Card */}
          <form onSubmit={handleAddCoupon} className="glass-card form-card admin-form-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Create Coupon</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "-12px", marginBottom: "8px" }}>
              Add a new promotional code for discounts.
            </p>

            <div className="form-group">
              <label htmlFor="coupon-code-input">Coupon Code</label>
              <input 
                type="text" 
                id="coupon-code-input" 
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="glass-input" 
                placeholder="e.g. VIRAL50"
                style={{ textTransform: "uppercase" }}
                required 
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="coupon-type-input">Discount Type</label>
                <select
                  id="coupon-type-input"
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as "percentage" | "fixed")}
                  className="glass-input"
                  style={{ background: "white", padding: "12px 14px", height: "48px", borderRadius: "10px" }}
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="coupon-value-input">Discount Value</label>
                <input 
                  type="number" 
                  id="coupon-value-input" 
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(e.target.value)}
                  className="glass-input" 
                  placeholder={newCouponType === "percentage" ? "e.g. 50" : "e.g. 100"}
                  required 
                />
              </div>
            </div>

            <button type="submit" disabled={addingCoupon} className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
              {addingCoupon ? "Creating..." : "Create Coupon"}
            </button>
          </form>

          {/* Right Coupon List Card */}
          <div className="glass-card table-card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.015em" }}>Active Coupons</h2>
            <div className="table-responsive">
              {loadingCoupons ? (
                <div className="no-transactions">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="no-transactions">No coupons active. Create one to get started!</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.code}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{coupon.code}</td>
                        <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{coupon.discount_type}</td>
                        <td style={{ fontWeight: 600 }}>
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.code)} 
                            className="btn-reject"
                            style={{ padding: "4px 8px" }}
                          >
                            Delete
                          </button>
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
      {/* Screenshot Modal Viewer */}
      {selectedScreenshot && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
          onClick={() => setSelectedScreenshot(null)}
        >
          <div 
            className="glass-card" 
            style={{ 
              maxWidth: "500px", 
              width: "100%", 
              padding: "20px", 
              backgroundColor: "#ffffff", 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Payment Receipt Screenshot</h3>
              <button 
                onClick={() => setSelectedScreenshot(null)} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "24px", 
                  cursor: "pointer", 
                  color: "var(--text-secondary)",
                  padding: "4px"
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", backgroundColor: "var(--bg-primary)", borderRadius: "8px", padding: "12px", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedScreenshot} 
                alt="Payment Receipt" 
                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "6px" }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* SMM Service Browser Modal */}
      {showSmmBrowser && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
          }}
          onClick={() => setShowSmmBrowser(false)}
        >
          <div 
            className="glass-card" 
            style={{ 
              maxWidth: "820px", 
              width: "100%", 
              maxHeight: "85vh",
              padding: "0", 
              backgroundColor: "#ffffff", 
              display: "flex", 
              flexDirection: "column",
              overflow: "hidden",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — sticky inside modal */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--glass-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>SMM Service Catalog</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
                  Only Instagram services shown. Rates in ₹ (INR) per 1,000 units.
                </p>
              </div>
              <button 
                onClick={() => setShowSmmBrowser(false)} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "28px", 
                  cursor: "pointer", 
                  color: "var(--text-secondary)",
                  padding: "4px",
                  flexShrink: 0
                }}
              >
                &times;
              </button>
            </div>

            {/* Search bar inside sticky header */}
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search Instagram services by ID or name..."
                value={searchSmmQuery}
                onChange={(e) => setSearchSmmQuery(e.target.value)}
                className="glass-input"
                style={{ flex: 1, padding: "10px 14px" }}
              />
              <button
                type="button"
                onClick={handleFetchSmmServices}
                disabled={loadingSmmServices}
                className="btn-secondary"
                style={{ padding: "0 16px" }}
              >
                {loadingSmmServices ? "Loading..." : "Refresh"}
              </button>
            </div>
            </div>{/* end sticky header */}

            {/* Scrollable services list */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(79,70,229,0.3) transparent" }}>
              {loadingSmmServices ? (
                <div style={{ padding: "40px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "center" }}>
                  Loading SMM Services...
                </div>
              ) : smmServices.length === 0 ? (
                <div style={{ padding: "40px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "center" }}>
                  No services found. Click Refresh to reload.
                </div>
              ) : (() => {
                const filtered = smmServices.filter(s => {
                  // Only show Instagram services
                  const isInsta =
                    (s.category || "").toLowerCase().includes("instagram") ||
                    (s.name || "").toLowerCase().includes("instagram");
                  if (!isInsta) return false;

                  // Then apply search query
                  const q = searchSmmQuery.toLowerCase();
                  if (!q) return true;
                  return (
                    s.service.toString().includes(q) ||
                    (s.name || "").toLowerCase().includes(q) ||
                    (s.category || "").toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: "40px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "center" }}>
                      No services match your search query.
                    </div>
                  );
                }

                // Group by Category
                const groups: Record<string, typeof smmServices> = {};
                filtered.forEach(s => {
                  const cat = s.category || "General Services";
                  if (!groups[cat]) groups[cat] = [];
                  groups[cat].push(s);
                });

                // Sort each category's items by rate ascending (cheapest first)
                Object.values(groups).forEach(items => {
                  items.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
                });

                // Priority sort: Instagram Followers > Likes > Views first, rest after
                const priorityOrder = (cat: string) => {
                  const c = cat.toLowerCase();
                  if (c.includes("follower")) return 0;
                  if (c.includes("like")) return 1;
                  if (c.includes("view") || c.includes("reel")) return 2;
                  if (c.includes("instagram")) return 3;
                  return 99;
                };

                const getCatIcon = (cat: string) => {
                  const c = cat.toLowerCase();
                  if (c.includes("follower")) return "👥";
                  if (c.includes("like")) return "❤️";
                  if (c.includes("view") || c.includes("reel")) return "👁️";
                  if (c.includes("instagram")) return "📸";
                  if (c.includes("youtube")) return "▶️";
                  if (c.includes("telegram")) return "✈️";
                  if (c.includes("twitter") || c.includes("x ")) return "𝕏";
                  if (c.includes("tiktok")) return "🎵";
                  return "📦";
                };

                const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
                  const pa = priorityOrder(a);
                  const pb = priorityOrder(b);
                  if (pa !== pb) return pa - pb;
                  return a.localeCompare(b);
                });

                return (
                  <div style={{ padding: "12px 16px" }}>
                    {sortedEntries.map(([category, items]) => (
                      <div key={category} style={{ marginBottom: "24px" }}>
                        {/* Category Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", marginTop: "10px" }}>
                          <span style={{ fontSize: "16px", flexShrink: 0 }}>{getCatIcon(category)}</span>
                          <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-primary)", margin: 0 }}>
                            {category}
                          </h4>
                          <div style={{ flex: 1, height: "1px", background: "rgba(79,70,229,0.1)" }} />
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, background: "rgba(79,70,229,0.07)", padding: "2px 8px", borderRadius: "999px" }}>{items.length} services</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {items.map(s => (
                            <div
                              key={s.service}
                              style={{
                                display: "flex",
                                alignItems: "stretch",
                                border: "1px solid rgba(79,70,229,0.12)",
                                borderRadius: "10px",
                                overflow: "hidden",
                                background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(249,247,255,0.95) 100%)",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                              }}
                            >
                              {/* Left Rate Column */}
                              <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px 14px",
                                background: "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.12) 100%)",
                                borderRight: "1px solid rgba(79,70,229,0.1)",
                                minWidth: "72px",
                                flexShrink: 0
                              }}>
                                <span style={{ fontSize: "10px", color: "var(--accent-primary)", fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</span>
                                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1.2, marginTop: "2px" }}>
                                  ₹{(parseFloat(s.rate) * 84).toFixed(0)}
                                </span>
                                <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: 600 }}>per 1k</span>
                              </div>

                              {/* Middle Content */}
                              <div style={{ flex: 1, minWidth: 0, padding: "10px 12px" }}>
                                {/* ID + Name row */}
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", flexWrap: "wrap" }}>
                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    backgroundColor: "rgba(79,70,229,0.1)",
                                    color: "var(--accent-primary)",
                                    padding: "1px 6px",
                                    borderRadius: "3px",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                    marginTop: "2px"
                                  }}>
                                    #{s.service}
                                  </span>
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35 }}>
                                    {s.name}
                                  </span>
                                </div>

                                {/* Stats chips */}
                                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}>
                                    Min: {Number(s.min).toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}>
                                    Max: {Number(s.max).toLocaleString()}
                                  </span>
                                  {s.refill && (
                                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                                      ♻ Refillable
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Select Button */}
                              <div style={{ display: "flex", alignItems: "center", padding: "10px 12px", flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSmmServiceId(s.service.toString());
                                    setShowSmmBrowser(false);
                                  }}
                                  style={{
                                    padding: "8px 14px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.02em"
                                  }}
                                >
                                  Select →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
