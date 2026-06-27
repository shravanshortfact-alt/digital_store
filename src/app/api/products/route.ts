import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding missing." },
        { status: 500 }
      );
    }

    const db = context.env.DB;

    // Dynamic schema migrations for products table
    try {
      await db.prepare("ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'bundle'").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE products ADD COLUMN instagram_service_type TEXT DEFAULT NULL").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE products ADD COLUMN instagram_quantity INTEGER DEFAULT 0").run();
    } catch (e) {}

    const { results } = await db
      .prepare("SELECT * FROM products ORDER BY created_at DESC")
      .all();

    return Response.json(results);
  } catch (error) {
    console.error("Error retrieving products catalog:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
