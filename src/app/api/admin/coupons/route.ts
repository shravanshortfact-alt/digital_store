import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../../lib/config";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding missing." },
        { status: 500 }
      );
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    // Verify authentication
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    const { results } = await db
      .prepare("SELECT * FROM coupons ORDER BY created_at DESC")
      .all();

    return Response.json(results);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding missing." },
        { status: 500 }
      );
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    // Verify authentication
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, discount_type, discount_value } = (await request.json()) as {
      code?: string;
      discount_type?: string;
      discount_value?: number | string;
    };

    if (!code || !discount_type || discount_value === undefined) {
      return Response.json(
        { error: "Coupon code, discount type, and discount value are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      return Response.json(
        { error: "Coupon code must only contain letters, numbers, hyphens, and underscores." },
        { status: 400 }
      );
    }

    if (discount_type !== "percentage" && discount_type !== "fixed") {
      return Response.json(
        { error: "Discount type must be either 'percentage' or 'fixed'." },
        { status: 400 }
      );
    }

    const parsedValue = parseFloat(String(discount_value));
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return Response.json(
        { error: "Discount value must be a valid positive number." },
        { status: 400 }
      );
    }

    if (discount_type === "percentage" && parsedValue > 100) {
      return Response.json(
        { error: "Percentage discount cannot be greater than 100%." },
        { status: 400 }
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

    const now = Date.now();

    await db
      .prepare(
        "INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, created_at) VALUES (?, ?, ?, ?)"
      )
      .bind(cleanCode, discount_type, parsedValue, now)
      .run();

    return Response.json({ success: true, code: cleanCode });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding missing." },
        { status: 500 }
      );
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    // Verify authentication
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = (await request.json()) as { code?: string };
    if (!code) {
      return Response.json(
        { error: "Coupon code is required." },
        { status: 400 }
      );
    }

    const db = context.env.DB;

    await db.prepare("DELETE FROM coupons WHERE code = ?").bind(code.toUpperCase().trim()).run();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
