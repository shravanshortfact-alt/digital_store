import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../../lib/config";
import { getSmmBalance, getSmmServices, getSmmOrderStatus, placeSmmOrder } from "../../../../lib/smm";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json({ error: "Database binding missing." }, { status: 500 });
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const db = context.env.DB;
    const env = context.env;

    if (action === "balance") {
      const balance = await getSmmBalance(env);
      return Response.json(balance);
    }

    if (action === "services") {
      const services = await getSmmServices(env);
      return Response.json(services);
    }

    if (action === "sync-order") {
      const transactionId = searchParams.get("transaction_id");
      if (!transactionId) {
        return Response.json({ error: "Transaction ID is required." }, { status: 400 });
      }

      const tx = await db
        .prepare("SELECT id, smm_order_id, status FROM transactions WHERE id = ?")
        .bind(transactionId)
        .first<{ id: string; smm_order_id: number | null; status: string }>();

      if (!tx) {
        return Response.json({ error: "Transaction not found." }, { status: 404 });
      }

      if (!tx.smm_order_id) {
        return Response.json({ error: "No SMM Order ID associated with this transaction." }, { status: 400 });
      }

      try {
        const orderStatus = await getSmmOrderStatus(tx.smm_order_id, env);
        const status = orderStatus.status || "Unknown";
        
        await db
          .prepare("UPDATE transactions SET smm_order_status = ?, smm_order_error = NULL, updated_at = ? WHERE id = ?")
          .bind(status, Date.now(), transactionId)
          .run();

        return Response.json({ success: true, status });
      } catch (err: any) {
        const errMsg = err.message || "Failed to fetch status from SMM API";
        await db
          .prepare("UPDATE transactions SET smm_order_error = ?, updated_at = ? WHERE id = ?")
          .bind(errMsg, Date.now(), transactionId)
          .run();

        return Response.json({ success: false, error: errMsg });
      }
    }

    return Response.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Error in SMM Admin GET endpoint:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json({ error: "Database binding missing." }, { status: 500 });
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, transaction_id, quantity } = (await request.json()) as { action?: string; transaction_id?: string; quantity?: number };
    const env = context.env;

    if (action === "retry") {
      if (!transaction_id) {
        return Response.json({ error: "Transaction ID is required." }, { status: 400 });
      }

      const db = context.env.DB;

      // Fetch transaction details joined with product
      const tx = await db
        .prepare(`
          SELECT 
            t.id, 
            t.instagram_link, 
            t.instagram_quantity, 
            t.smm_order_id, 
            t.status,
            p.smm_service_id,
            p.product_type
          FROM transactions t
          JOIN products p ON t.product_id = p.id
          WHERE t.id = ?
        `)
        .bind(transaction_id)
        .first<{
          id: string;
          instagram_link: string | null;
          instagram_quantity: number | null;
          smm_order_id: number | null;
          status: string;
          smm_service_id: number | null;
          product_type: string | null;
        }>();

      if (!tx) {
        return Response.json({ error: "Transaction not found." }, { status: 404 });
      }

      if (tx.status !== "approved") {
        return Response.json({ error: "Transaction must be approved before placing SMM order." }, { status: 400 });
      }

      if (tx.product_type !== "instagram" || !tx.smm_service_id) {
        return Response.json({ error: "Product is not an SMM service or is missing a service mapping ID." }, { status: 400 });
      }

      const qty = quantity || tx.instagram_quantity || 100;
      const link = tx.instagram_link || "";

      try {
        const orderResult = await placeSmmOrder(tx.smm_service_id, link, qty, env);
        if (orderResult && orderResult.order) {
          const orderId = orderResult.order;
          
          await db
            .prepare("UPDATE transactions SET smm_order_id = ?, smm_order_status = 'Pending', smm_order_error = NULL, updated_at = ? WHERE id = ?")
            .bind(orderId, Date.now(), transaction_id)
            .run();

          return Response.json({ success: true, orderId });
        } else {
          throw new Error("Empty response received from SMM panel.");
        }
      } catch (err: any) {
        const errMsg = err.message || "SMM API ordering failed";
        await db
          .prepare("UPDATE transactions SET smm_order_status = 'Failed', smm_order_error = ?, updated_at = ? WHERE id = ?")
          .bind(errMsg, Date.now(), transaction_id)
          .run();

        return Response.json({ success: false, error: errMsg });
      }
    }

    return Response.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Error in SMM Admin POST endpoint:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
