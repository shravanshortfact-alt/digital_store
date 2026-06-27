import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../../lib/config";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding error." },
        { status: 500 }
      );
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    // Verify authentication
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = context.env.DB;

    // Run dynamic schema migrations for SMM features
    try {
      await db.prepare("ALTER TABLE products ADD COLUMN smm_service_id INTEGER DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN smm_order_id INTEGER DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN smm_order_status TEXT DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN smm_order_error TEXT DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN instagram_link TEXT DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE transactions ADD COLUMN instagram_quantity INTEGER DEFAULT NULL").run();
    } catch (e) {}

    // Query transactions with a JOIN to get the product title and Instagram details
    const { results } = await db
      .prepare(`
        SELECT 
          t.id, 
          t.email, 
          t.payment_name, 
          t.screenshot, 
          t.amount, 
          t.status, 
          t.coupon_code,
          t.created_at, 
          t.instagram_link,
          t.instagram_quantity,
          t.smm_order_id,
          t.smm_order_status,
          t.smm_order_error,
          p.title as product_title,
          p.product_type,
          p.instagram_quantity as base_quantity,
          p.instagram_service_type,
          p.smm_service_id
        FROM transactions t
        LEFT JOIN products p ON t.product_id = p.id
        ORDER BY t.created_at DESC
      `)
      .all();

    return Response.json(results);
  } catch (error) {
    console.error("Error fetching transactions list for admin:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
