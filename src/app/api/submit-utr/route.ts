import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendFulfillmentEmail, sendInstagramOrderReceivedEmail } from "../../../lib/email";

export const runtime = "edge";

interface Product {
  id: string;
  title: string;
  price: number;
  download_link: string;
  product_type?: string;
  instagram_service_type?: string;
  instagram_quantity?: number;
}

interface Coupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

export async function POST(request: Request) {
  try {
    const { email, paymentName, screenshot, productId, couponCode, instagramLink, instagramQuantity } = (await request.json()) as { 
      email?: string; 
      paymentName?: string; 
      screenshot?: string; 
      productId?: string;
      couponCode?: string;
      instagramLink?: string;
      instagramQuantity?: number | string;
    };

    if (!email || !paymentName || !screenshot || !productId) {
      return Response.json(
        { success: false, error: "Email, Payment Name, Screenshot receipt, and Product ID are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPaymentName = paymentName.trim();
    const cleanScreenshot = screenshot.trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return Response.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (cleanPaymentName.length === 0) {
      return Response.json(
        { success: false, error: "Payment Name cannot be empty." },
        { status: 400 }
      );
    }

    if (!cleanScreenshot.startsWith("data:image/")) {
      return Response.json(
        { success: false, error: "Invalid screenshot file uploaded." },
        { status: 400 }
      );
    }

    // Access Cloudflare environment
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { success: false, error: "Database binding error. Check wrangler.toml." },
        { status: 500 }
      );
    }

    const db = context.env.DB;

    // Run schema migrations dynamically if needed
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        created_at INTEGER NOT NULL
      )`
    ).run();

    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN coupon_code TEXT").run();
    } catch (e) {
      // Column already exists
    }

    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN instagram_link TEXT DEFAULT NULL").run();
    } catch (e) {}

    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN instagram_quantity INTEGER DEFAULT NULL").run();
    } catch (e) {}

    // Check if the product exists
    const product = await db
      .prepare("SELECT title, price, download_link, product_type, instagram_service_type, instagram_quantity FROM products WHERE id = ?")
      .bind(productId)
      .first<Product>();

    if (!product) {
      return Response.json(
        { success: false, error: "Invalid product selected." },
        { status: 400 }
      );
    }

    const isInstagram = product.product_type === "instagram";
    let orderQuantity = 1;

    if (isInstagram) {
      if (!instagramLink || !instagramLink.trim()) {
        return Response.json(
          { success: false, error: "Instagram Profile/Post link is required for this service." },
          { status: 400 }
        );
      }
      orderQuantity = parseInt(String(instagramQuantity || product.instagram_quantity || 100));
      if (isNaN(orderQuantity) || orderQuantity < 1) {
        return Response.json(
          { success: false, error: "Please enter a valid order quantity." },
          { status: 400 }
        );
      }
      // Enforce minimum order quantity
      const minQty = product.instagram_quantity || 1;
      if (orderQuantity < minQty) {
        return Response.json(
          { success: false, error: `Minimum order quantity is ${minQty} ${product.instagram_service_type || 'units'}.` },
          { status: 400 }
        );
      }
    }

    // Calculate base amount: per-unit price × quantity
    let amount = isInstagram
      ? Math.round(orderQuantity * product.price * 100) / 100
      : product.price;
    let appliedCoupon = null;

    if (couponCode && couponCode.trim()) {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const coupon = await db
        .prepare("SELECT code, discount_type, discount_value FROM coupons WHERE code = ?")
        .bind(cleanCoupon)
        .first<Coupon>();

      if (coupon) {
        appliedCoupon = coupon.code;
        let discountAmount = 0;
        if (coupon.discount_type === "percentage") {
          discountAmount = amount * (coupon.discount_value / 100);
        } else if (coupon.discount_type === "fixed") {
          discountAmount = coupon.discount_value;
        }
        discountAmount = Math.round(discountAmount * 100) / 100;
        amount = Math.max(0, amount - discountAmount);
        amount = Math.round(amount * 100) / 100;
      }
    }

    // Send appropriate fulfillment/notification email
    let emailResult;
    if (isInstagram) {
      const totalDeliveryQuantity = orderQuantity;

      emailResult = await sendInstagramOrderReceivedEmail(
        cleanEmail,
        cleanPaymentName,
        product.title,
        instagramLink!.trim(),
        totalDeliveryQuantity,
        amount
      );
    } else {
      // Send auto fulfillment email immediately to digital bundle customer
      emailResult = await sendFulfillmentEmail(
        cleanEmail,
        cleanPaymentName,
        product.title,
        product.download_link
      );
    }

    if (!emailResult.success) {
      console.error("Auto notification email failed to send, but log will still record transaction.");
    }

    // Insert transaction record
    const id = crypto.randomUUID();
    const now = Date.now();
    const targetInstaLink = isInstagram ? instagramLink!.trim() : null;
    const targetInstaQty = isInstagram ? orderQuantity : null;

    await db
      .prepare(
        "INSERT INTO transactions (id, email, payment_name, screenshot, amount, product_id, coupon_code, instagram_link, instagram_quantity, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
      )
      .bind(id, cleanEmail, cleanPaymentName, cleanScreenshot, amount, productId, appliedCoupon, targetInstaLink, targetInstaQty, now, now)
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error submitting transaction reference:", error);
    return Response.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

