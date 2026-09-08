import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../../lib/config";
import { sendFulfillmentEmail } from "../../../../lib/email";

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
    const body = await request.json() as {
      action?: "bulk-approve" | "bulk-reject" | "bulk-delete";
      ids?: string[];
    };

    const { action, ids } = body;

    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json({ success: false, error: "Database binding error." }, { status: 500 });
    }

    const adminPassword = context.env.ADMIN_PASSWORD || config.adminPassword;
    if (!authHeader || authHeader !== adminPassword) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = context.env.DB;
    const now = Date.now();

    if (action === "bulk-approve" || action === "bulk-reject") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return Response.json({ success: false, error: "No transaction IDs provided." }, { status: 400 });
      }

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const tx = await db
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

          if (!tx) {
            failCount++;
            errors.push(`Transaction ${id} not found`);
            continue;
          }

          if (tx.status !== "pending") {
            failCount++;
            errors.push(`Transaction ${id} is already ${tx.status}`);
            continue;
          }

          if (action === "bulk-approve") {
            const emailResult = await sendFulfillmentEmail(
              tx.email,
              tx.payment_name,
              tx.product_title,
              tx.download_link
            );

            if (!emailResult.success) {
              failCount++;
              errors.push(`Failed to send fulfillment email for ${id}`);
              continue;
            }

            await db
              .prepare(`
                UPDATE transactions 
                SET status = 'approved', 
                    updated_at = ? 
                WHERE id = ?
              `)
              .bind(now, id)
              .run();

            successCount++;
          } else {
            await db
              .prepare("UPDATE transactions SET status = 'rejected', updated_at = ? WHERE id = ?")
              .bind(now, id)
              .run();
            successCount++;
          }
        } catch (err: any) {
          failCount++;
          errors.push(`Error processing ${id}: ${err.message || err}`);
        }
      }

      return Response.json({
        success: true,
        successCount,
        failCount,
        errors,
      });
    }

    if (action === "bulk-delete") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return Response.json({ success: false, error: "No transaction IDs provided." }, { status: 400 });
      }

      let deletedCount = 0;
      for (const targetId of ids) {
        await db.prepare("DELETE FROM transactions WHERE id = ?").bind(targetId).run();
        deletedCount++;
      }

      return Response.json({
        success: true,
        deletedCount,
        message: `${deletedCount} transaction(s) deleted successfully.`
      });
    }

    return Response.json({ success: false, error: "Invalid bulk action." }, { status: 400 });
  } catch (error: any) {
    console.error("Error in bulk transactions API:", error);
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
