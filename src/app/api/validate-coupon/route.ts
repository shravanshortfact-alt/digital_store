import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

interface Product {
  id: string;
  price: number;
  product_type?: string;
  instagram_quantity?: number;
}

interface Coupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

export async function POST(request: Request) {
  try {
    const { code, productId, quantity } = (await request.json()) as {
      code?: string;
      productId?: string;
      quantity?: number | string;
    };

    if (!code || !productId) {
      return Response.json(
        { valid: false, error: "Coupon code and Product ID are required." },
        { status: 400 }
      );
    }

    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { valid: false, error: "Database binding missing." },
        { status: 500 }
      );
    }

    const db = context.env.DB;

    // Ensure coupons table exists
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        created_at INTEGER NOT NULL
      )`
    ).run();

    // Fetch product
    const product = await db
      .prepare("SELECT id, price, product_type, instagram_quantity FROM products WHERE id = ?")
      .bind(productId)
      .first<Product>();

    if (!product) {
      return Response.json(
        { valid: false, error: "Invalid product selected." },
        { status: 400 }
      );
    }

    const isInstagram = product.product_type === "instagram";
    const minQty = product.instagram_quantity || 1;
    const orderQty = quantity ? parseInt(String(quantity)) : (isInstagram ? minQty : 1);
    
    // Per-unit pricing: quantity × per_unit_price
    const basePrice = isInstagram
      ? Math.round(orderQty * product.price * 100) / 100
      : product.price;

    // Fetch coupon
    const cleanCode = code.trim().toUpperCase();
    const coupon = await db
      .prepare("SELECT code, discount_type, discount_value FROM coupons WHERE code = ?")
      .bind(cleanCode)
      .first<Coupon>();

    if (!coupon) {
      return Response.json({
        valid: false,
        error: "Coupon code is invalid or expired.",
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = basePrice * (coupon.discount_value / 100);
    } else if (coupon.discount_type === "fixed") {
      discountAmount = coupon.discount_value;
    }

    // Round discount to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    
    // Final price cannot be negative
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return Response.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      original_price: basePrice,
      discount_amount: discountAmount,
      final_price: Math.round(finalPrice * 100) / 100,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return Response.json(
      { valid: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
