import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../lib/config";
import { sendFulfillmentEmail, sendInstagramFulfillmentEmail } from "../../../lib/email";
import { placeSmmOrder } from "../../../lib/smm";

export const runtime = "edge";

interface TransactionDetails {
  id: string;
  email: string;
  payment_name: string;
  status: string;
  product_title: string;
  download_link: string;
  product_type?: string;
  instagram_link?: string;
  instagram_quantity?: number;
  base_quantity?: number;
  smm_service_id?: number;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const { id, action } = (await request.json()) as { id?: string; action?: "approve" | "reject" };

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return Response.json(
        { success: false, error: "Transaction ID and valid action (approve/reject) are required." },
        { status: 400 }
      );
    }

    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { success: false, error: "Database binding error." },
        { status: 500 }
      );
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;

    // Verify authentication
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = context.env.DB;
    const env = context.env;

    // Fetch the target transaction details joined with product details
    const transaction = await db
      .prepare(`
        SELECT 
          t.id, 
          t.email, 
          t.payment_name, 
          t.status, 
          t.instagram_link,
          t.instagram_quantity,
          p.title as product_title, 
          p.download_link,
          p.product_type,
          p.instagram_quantity as base_quantity,
          p.smm_service_id
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        WHERE t.id = ?
      `)
      .bind(id)
      .first<TransactionDetails>();

    if (!transaction) {
      return Response.json(
        { success: false, error: "Transaction record not found." },
        { status: 404 }
      );
    }

    if (transaction.status !== "pending") {
      return Response.json(
        { success: false, error: `This transaction has already been verified as '${transaction.status}'.` },
        { status: 400 }
      );
    }

    const now = Date.now();

    if (action === "approve") {
      let emailResult;
      let smmOrderId = null;
      let smmOrderStatus = null;
      let smmOrderError = null;

      if (transaction.product_type === "instagram") {
        const totalQty = transaction.instagram_quantity || 1000;

        // Auto place order on SMM Panel if smm_service_id is configured
        if (transaction.smm_service_id) {
          try {
            const orderResult = await placeSmmOrder(
              transaction.smm_service_id,
              transaction.instagram_link || "",
              totalQty,
              env
            );
            if (orderResult && orderResult.order) {
              smmOrderId = orderResult.order;
              smmOrderStatus = "Pending";
            } else {
              smmOrderError = "Failed to place SMM order (empty order response)";
              smmOrderStatus = "Failed";
            }
          } catch (err: any) {
            smmOrderError = err.message || "Failed to place SMM order";
            smmOrderStatus = "Failed";
          }
        }

        emailResult = await sendInstagramFulfillmentEmail(
          transaction.email,
          transaction.payment_name,
          transaction.product_title,
          transaction.instagram_link || "",
          totalQty
        );
      } else {
        // Trigger the Resend email fulfillment with custom product info
        emailResult = await sendFulfillmentEmail(
          transaction.email,
          transaction.payment_name,
          transaction.product_title,
          transaction.download_link
        );
      }

      if (!emailResult.success) {
        return Response.json(
          { success: false, error: "Failed to dispatch fulfillment email. Transaction not approved." },
          { status: 500 }
        );
      }

      // Update database status to approved along with SMM details
      await db
        .prepare(`
          UPDATE transactions 
          SET status = 'approved', 
              smm_order_id = ?, 
              smm_order_status = ?, 
              smm_order_error = ?, 
              updated_at = ? 
          WHERE id = ?
        `)
        .bind(smmOrderId, smmOrderStatus, smmOrderError, now, id)
        .run();
    } else {
      // Update database status to rejected
      await db
        .prepare("UPDATE transactions SET status = 'rejected', updated_at = ? WHERE id = ?")
        .bind(now, id)
        .run();
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing transaction verification action:", error);
    return Response.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
