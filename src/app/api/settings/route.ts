import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../lib/config";

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

    // Create table if not exists
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`
    ).run();

    // Fetch settings
    const { results } = await db
      .prepare("SELECT key, value FROM settings")
      .all<{ key: string; value: string }>();

    const settingsMap = new Map(results.map((r: { key: string; value: string }) => [r.key, r.value]));

    const website_name = settingsMap.get("website_name") ?? "Shravan Vault";
    const upi_id = settingsMap.get("upi_id") ?? config.upiId;
    const qr_code = settingsMap.get("qr_code") ?? "";
    const website_logo = settingsMap.get("website_logo") ?? "";

    return Response.json({
      website_name,
      upi_id,
      qr_code,
      website_logo,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
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

    const { website_name, upi_id, qr_code, website_logo } = (await request.json()) as {
      website_name?: string;
      upi_id?: string;
      qr_code?: string;
      website_logo?: string;
    };

    if (!website_name || !upi_id) {
      return Response.json(
        { error: "website_name and upi_id are required." },
        { status: 400 }
      );
    }

    const db = context.env.DB;

    // Create table if not exists
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`
    ).run();

    // Update settings in database
    await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('website_name', ?)")
      .bind(website_name.trim())
      .run();
      
    await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('upi_id', ?)")
      .bind(upi_id.trim())
      .run();
      
    await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('qr_code', ?)")
      .bind((qr_code ?? "").trim())
      .run();

    await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('website_logo', ?)")
      .bind((website_logo ?? "").trim())
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
