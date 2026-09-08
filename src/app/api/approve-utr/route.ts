import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../lib/config";
import { sendFulfillmentEmail } from "../../../lib/email";

export const runtime = "edge";

interface TransactionDetails {
  id: string;
  email: string;
  payment_name: string;
  status: string;
  product_title: string;
  download_link: string;
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

    // Fetch the target transaction details joined with product details
    const transaction = await db
      .prepare(`
        SELECT 
          t.id, 
          t.email, 
          t.payment_name, 
          t.status, 
          p.title as product_title, 
          p.download_link
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
      // Trigger the Resend email fulfillment with product download link
      const emailResult = await sendFulfillmentEmail(
        transaction.email,
        transaction.payment_name,
        transaction.product_title,
        transaction.download_link
      );

      if (!emailResult.success) {
        return Response.json(
          { success: false, error: "Failed to dispatch fulfillment email. Transaction not approved." },
          { status: 500 }
        );
      }

      // Update database status to approved
      await db
        .prepare(`
          UPDATE transactions 
          SET status = 'approved', 
              updated_at = ? 
          WHERE id = ?
        `)
        .bind(now, id)
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
