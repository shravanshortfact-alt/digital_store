"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { config } from "../../lib/config";
import "./checkout.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  video_url_1?: string;
  video_url_2?: string;
  video_url_3?: string;
  product_type?: string;
  instagram_service_type?: string;
  instagram_quantity?: number;
}

const isUrl = (str: string) => {
  if (!str) return false;
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/") || str.startsWith("data:");
};

function CheckoutForm() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const qtyParam = searchParams.get("qty");

  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");

  const [email, setEmail] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Instagram properties checkout state
  const [instagramLink, setInstagramLink] = useState("");
  const [instagramQuantity, setInstagramQuantity] = useState<number | "">(100);
  const [settings, setSettings] = useState({
    website_name: "Shravan Vault",
    upi_id: "",
    qr_code: "",
  });

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{
    code: string;
    discount_amount: number;
    final_price: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Video custom controls state
  const [videoPaused, setVideoPaused] = useState([false, false, false]);
  const [videoMuted, setVideoMuted] = useState([true, true, true]);
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const videoRefs = [videoRef0, videoRef1, videoRef2];

  const togglePlay = (idx: number) => {
    const vid = videoRefs[idx].current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setVideoPaused(p => p.map((v,i) => i===idx ? false : v)); }
    else { vid.pause(); setVideoPaused(p => p.map((v,i) => i===idx ? true : v)); }
  };

  const toggleMute = (idx: number) => {
    const vid = videoRefs[idx].current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setVideoMuted(p => p.map((v,i) => i===idx ? vid.muted : v));
  };

  // Fetch settings
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
    loadSettings();
  }, []);

  // Fetch product details
  useEffect(() => {
    if (!productId) {
      setProductError("No product selected. Please choose a product from the home page.");
      setProductLoading(false);
      return;
    }

    async function loadProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = (await response.json()) as Product;
          setProduct(data);
          if (data.product_type === "instagram") {
            const minQty = Math.max(25, data.instagram_quantity || 0);
            const urlQty = qtyParam ? parseInt(qtyParam) : 0;
            setInstagramQuantity(urlQty >= minQty ? urlQty : minQty);
          }
        } else {
          setProductError("Product not found. Please verify your link.");
        }
      } catch (err) {
        console.error(err);
        setProductError("Failed to connect to server. Please refresh.");
      } finally {
        setProductLoading(false);
      }
    }

    loadProduct();
  }, [productId, qtyParam]);

  // Reset coupon if quantity changes
  useEffect(() => {
    if (appliedCouponInfo) {
      setAppliedCouponInfo(null);
      setCouponInput("");
      setCouponError("");
    }
  }, [instagramQuantity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.upi_id || config.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Screenshot image file is too large. Please select an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        setScreenshot(compressedBase64);
        setError("");
      };
      img.onerror = () => {
        setError("Invalid image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: couponInput, productId, quantity: Number(instagramQuantity) || 0 }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setAppliedCouponInfo({
          code: data.code,
          discount_amount: data.discount_amount,
          final_price: data.final_price,
        });
        setCouponError("");
      } else {
        setAppliedCouponInfo(null);
        setCouponError(data.error || "Invalid coupon code.");
      }
    } catch (err) {
      console.error(err);
      setCouponError("Failed to validate coupon code.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInput("");
    setAppliedCouponInfo(null);
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (product?.product_type === "instagram") {
      if (!instagramLink.trim()) {
        setError("Please enter your Instagram Link.");
        setLoading(false);
        return;
      }
      const parsedQty = Number(instagramQuantity);
      if (!instagramQuantity || isNaN(parsedQty) || parsedQty < 1) {
        setError("Please enter a valid quantity of 1 or more.");
        setLoading(false);
        return;
      }
      if (parsedQty < minQty) {
        setError(`Minimum order quantity is ${minQty} ${product.instagram_service_type || 'units'}.`);
        setLoading(false);
        return;
      }
    }

    const cleanPaymentName = product?.product_type === "instagram" ? "Instagram Order" : paymentName.trim();
    if (product?.product_type !== "instagram" && !cleanPaymentName) {
      setError("Please enter your Payment Name.");
      setLoading(false);
      return;
    }

    if (!screenshot) {
      setError("Please upload your payment receipt screenshot.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/submit-utr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          paymentName: cleanPaymentName, 
          screenshot, 
          productId,
          couponCode: appliedCouponInfo ? appliedCouponInfo.code : undefined,
          instagramLink: product?.product_type === "instagram" ? instagramLink.trim() : undefined,
          instagramQuantity: product?.product_type === "instagram" ? Number(instagramQuantity) : undefined,
        }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please check your inputs and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (productLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid var(--accent-light)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading checkout details...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container checkout-container animate-fade-in" style={{ maxWidth: "600px" }}>
        <div className="glass-card success-state" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
          <div className="success-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--error)" }}>!</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Checkout Error</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "8px" }}>
            {productError || "Unable to proceed to checkout."}
          </p>
          <div style={{ marginTop: "24px" }}>
            <Link href="/" className="btn-primary">
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate UPI pay URL dynamically based on the fetched product details
  const currentUpiId = settings.upi_id || config.upiId;
  const isInstagramProduct = product.product_type === "instagram";
  const basePrice = isInstagramProduct
    ? Math.round((Number(instagramQuantity) || 0) * product.price * 100) / 100
    : product.price;
  const currentPrice = appliedCouponInfo ? appliedCouponInfo.final_price : basePrice;
  const upiPayUrl = `upi://pay?pa=${currentUpiId}&pn=${encodeURIComponent(product.title)}&am=${currentPrice}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`;

  if (success) {
    const isInsta = product.product_type === "instagram";
    return (
      <div className="container checkout-container animate-fade-in" style={{ maxWidth: "600px" }}>
        <div className="glass-card success-state">
          <div className="success-icon">✓</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.025em" }}>Order Submitted!</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {isInsta ? (
              <>An order confirmation email has been sent to <strong>{email}</strong>!</>
            ) : (
              <>An automated email containing your download link has been sent to <strong>{email}</strong>!</>
            )}
          </p>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "15px" }}>
            {isInsta ? (
              <>Please check your inbox (including your spam and promotion folders) for details. Our team is verifying your payment screenshot under payer name <strong>{paymentName}</strong> and will start delivering the service to your Instagram target link shortly.</>
            ) : (
              <>Please check your inbox (including your spam and promotion folders) for the download link for <strong>{product.title}</strong>. Your transaction has been registered under the payer name <strong>{paymentName}</strong>.</>
            )}
          </p>
          <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
            <Link href="/" className="btn-secondary" style={{ fontSize: "14px", padding: "10px 20px" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const minQty = product ? Math.max(25, product.instagram_quantity || 0) : 25;
  const videos = [product.video_url_1, product.video_url_2, product.video_url_3].filter(Boolean) as string[];

  return (
    <div className="container checkout-container animate-fade-in">
      <Link href="/" className="back-link">
        ← Back to catalog
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.15) 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "28px", flexShrink: 0, border: "1px solid var(--glass-border)" }}>
            {isUrl(product.icon) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={product.icon} 
                alt={product.title} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              product.icon || (product.product_type === "instagram" ? (product.instagram_service_type === "followers" ? "👥" : product.instagram_service_type === "likes" ? "❤️" : "👁️") : "📦")
            )}
          </div>
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Checkout
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Complete payment for <strong>{product.title}</strong>
            </p>
          </div>
        </div>
        
      </div>

      <div className="checkout-grid">
        {/* Left Column: QR Code */}
        <div className="glass-card payment-card">
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Step 1: Scan & Pay</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "-10px" }}>
            Scan the code below with GPay, PhonePe, Paytm, or BHIM.
          </p>
          
          <div className="amount-badge">
            {appliedCouponInfo ? (
              <>
                <span style={{ textDecoration: "line-through", fontSize: "18px", marginRight: "10px", opacity: 0.6 }}>₹{basePrice}</span>
                <span>₹{appliedCouponInfo.final_price}</span>
              </>
            ) : (
              `₹${basePrice}`
            )}
          </div>

          <div className="qr-wrapper" style={{ overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={settings.qr_code || qrCodeUrl} 
              alt="UPI QR Code" 
              width={220} 
              height={220}
              style={{ display: "block", objectFit: "contain", borderRadius: "12px" }}
            />
          </div>

          <div className="upi-info">
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Or transfer directly to UPI ID:
            </p>
            <div className="upi-id-box">
              <span>{currentUpiId}</span>
              <button type="button" onClick={handleCopy} className="copy-btn">
                {copied ? "Copied!" : "Copy ID"}
              </button>
            </div>
          </div>

          {/* Inline Sample Video Previews */}
          {videos.length > 0 && (
            <div style={{ width: "100%", marginTop: "8px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "center", marginBottom: "12px" }}>
                🎬 Sample Reels Preview
              </p>
              <div style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "center", alignItems: "flex-start" }}>
                {videos.map((videoSrc, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: "1",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      Clip {idx + 1}
                    </span>
                    {/* Video container with custom controls */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "9/16",
                        borderRadius: "14px",
                        overflow: "hidden",
                        backgroundColor: "#000",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                        border: "1px solid var(--glass-border)",
                        position: "relative"
                      }}
                    >
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        ref={videoRefs[idx]}
                        src={videoSrc}
                        autoPlay
                        muted
                        playsInline
                        loop
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      {/* Custom Controls Overlay */}
                      <div style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: "8px",
                        zIndex: 10
                      }}>
                        {/* Play/Pause */}
                        <button
                          type="button"
                          onClick={() => togglePlay(idx)}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                          aria-label={videoPaused[idx] ? "Play" : "Pause"}
                        >
                          {videoPaused[idx] ? "▶" : "⏸"}
                        </button>
                        {/* Mute/Unmute */}
                        <button
                          type="button"
                          onClick={() => toggleMute(idx)}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                          aria-label={videoMuted[idx] ? "Unmute" : "Mute"}
                        >
                          {videoMuted[idx] ? "🔇" : "🔊"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Form */}
        <form onSubmit={handleSubmit} className="glass-card form-card">
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Step 2: Submit Details</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "-10px" }}>
            {product.product_type === "instagram" ? "Provide your target details and receipt to complete your order." : "Provide your receipt details to receive your download link."}
          </p>

          {error && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--error)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 500 }}>
              {error}
            </div>
          )}

          {product.product_type === "instagram" && (
            <>
              <div className="form-group animate-fade-in">
                <label htmlFor="instagramLink">
                  {product.instagram_service_type === "followers" ? "Instagram Profile URL / Link" : "Instagram Post / Reel URL"}
                </label>
                <input 
                  type="url" 
                  id="instagramLink" 
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  className="glass-input" 
                  placeholder={product.instagram_service_type === "followers" ? "https://instagram.com/your_username" : "https://instagram.com/p/your_post_id"}
                  required={product.product_type === "instagram"} 
                />
                <span className="input-note">
                  {product.instagram_service_type === "followers" 
                    ? "Enter your exact profile link. Your account MUST be Public (not private) during delivery." 
                    : "Enter the link of the exact post or reel you want likes/views delivered on."}
                </span>
              </div>

              <div className="form-group animate-fade-in">
                <label htmlFor="instagramQuantity">Quantity (Kitne chye?)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <input 
                    type="number" 
                    id="instagramQuantity" 
                    value={instagramQuantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setInstagramQuantity("");
                      } else {
                        const parsed = parseInt(val);
                        setInstagramQuantity(isNaN(parsed) ? "" : parsed);
                      }
                    }}
                    className="glass-input" 
                    min={minQty}
                    required={product.product_type === "instagram"} 
                    style={{ maxWidth: "160px" }}
                  />
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Total {product.instagram_service_type || "items"}: <span style={{ color: "var(--accent-primary)", fontSize: "16px", fontWeight: 700 }}>{instagramQuantity ? Number(instagramQuantity).toLocaleString() : "0"}</span>
                  </div>
                </div>
                {(Number(instagramQuantity) > 0 && Number(instagramQuantity) < minQty) && (
                  <span className="input-note" style={{ color: "var(--error)", fontWeight: 600 }}>⚠️ Minimum {minQty} {product.instagram_service_type || "units"} required</span>
                )}
                <span className="input-note">₹{product.price} per {product.instagram_service_type === "followers" ? "follower" : product.instagram_service_type === "likes" ? "like" : product.instagram_service_type === "views" ? "view" : "unit"}. Minimum: {minQty}</span>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input" 
              placeholder="you@example.com"
              required 
            />
            <span className="input-note">
              {product.product_type === "instagram" ? "We will send your order details and processing status to this email." : "The download link will be emailed to this address."}
            </span>
          </div>

          {product.product_type !== "instagram" && (
            <div className="form-group animate-fade-in">
              <label>Coupon Code (Optional)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={appliedCouponInfo !== null}
                  className="glass-input" 
                  placeholder="e.g. SAVE50"
                  style={{ textTransform: "uppercase" }}
                />
                {appliedCouponInfo ? (
                  <button type="button" onClick={handleRemoveCoupon} className="btn-secondary" style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    Remove
                  </button>
                ) : (
                  <button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon} className="btn-primary" style={{ padding: "10px 24px", whiteSpace: "nowrap" }}>
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                )}
              </div>
              {couponError && <span className="input-note" style={{ color: "var(--error)" }}>{couponError}</span>}
              {appliedCouponInfo && <span className="input-note" style={{ color: "var(--success)", fontWeight: 600 }}>Discount of ₹{appliedCouponInfo.discount_amount} applied!</span>}
            </div>
          )}

          {product.product_type !== "instagram" && (
            <div className="form-group animate-fade-in">
              <label htmlFor="paymentName">Sender Payer Name (jis name se payment hua h)</label>
              <input 
                type="text" 
                id="paymentName" 
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                className="glass-input" 
                placeholder="e.g. Rahul Kumar"
                required={product.product_type !== "instagram"} 
              />
              <span className="input-note">Enter the exact name shown on your UPI app profile/bank account used for the transfer.</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="screenshot">Upload Payment Receipt Screenshot</label>
            <input 
              type="file" 
              id="screenshot" 
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="glass-input" 
              style={{ padding: "10px 14px" }}
              required 
            />
            <span className="input-note">Upload a screenshot of the successful payment receipt.</span>
            {screenshot && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: 600 }}>✓ Screenshot uploaded successfully</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={screenshot} 
                  alt="Receipt Preview" 
                  style={{ width: "120px", height: "auto", maxHeight: "150px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--glass-border)" }} 
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "12px", width: "100%" }}>
            {loading ? "Submitting..." : `Submit & Verify Payment`}
          </button>
        </form>
      </div>


    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid var(--accent-light)", borderTopColor: "var(--accent-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading page context...</p>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
