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

    // Query transactions with a JOIN to get the product title and details
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
          p.title as product_title,
          p.product_type
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

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    
    if (!context || !context.env || !context.env.DB) {
      return Response.json({ error: "Database binding error." }, { status: 500 });
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ids } = (await request.json()) as { id?: string; ids?: string[] };
    const db = context.env.DB;

    if (id) {
      await db.prepare("DELETE FROM transactions WHERE id = ?").bind(id).run();
      return Response.json({ success: true, message: `Transaction deleted successfully.` });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      let deletedCount = 0;
      for (const targetId of ids) {
        await db.prepare("DELETE FROM transactions WHERE id = ?").bind(targetId).run();
        deletedCount++;
      }
      return Response.json({ success: true, deletedCount, message: `${deletedCount} transaction(s) deleted.` });
    }

    return Response.json({ error: "Transaction ID or IDs array is required." }, { status: 400 });
  } catch (error: any) {
    console.error("Error deleting transaction(s):", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
