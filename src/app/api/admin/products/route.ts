import { getRequestContext } from "@cloudflare/next-on-pages";
import { config } from "../../../../lib/config";

export const runtime = "edge";

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

    const { title, description, price, compare_at_price, download_link, icon, video_url_1, video_url_2, video_url_3, product_type } = (await request.json()) as {
      title?: string;
      description?: string;
      price?: number | string;
      compare_at_price?: number | string;
      download_link?: string;
      icon?: string;
      video_url_1?: string;
      video_url_2?: string;
      video_url_3?: string;
      product_type?: string;
    };

    if (!title || !description || price === undefined || !download_link) {
      return Response.json(
        { error: "Title, description, price, and download link are required." },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(String(price));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return Response.json(
        { error: "Price must be a valid positive number." },
        { status: 400 }
      );
    }

    const parsedComparePrice = compare_at_price ? parseFloat(String(compare_at_price)) : 0;
    const cleanIcon = (icon || "📦").trim();
    const db = context.env.DB;
    
    const id = crypto.randomUUID();
    const now = Date.now();
    const cleanProductType = product_type || "bundle";

    await db
      .prepare(
        "INSERT INTO products (id, title, description, price, compare_at_price, download_link, icon, video_url_1, video_url_2, video_url_3, product_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        title.trim(),
        description.trim(),
        parsedPrice,
        parsedComparePrice,
        download_link.trim(),
        cleanIcon,
        (video_url_1 || "").trim(),
        (video_url_2 || "").trim(),
        (video_url_3 || "").trim(),
        cleanProductType,
        now,
        now
      )
      .run();

    return Response.json({ success: true, id });
  } catch (error) {
    console.error("Error creating product:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const { id, title, description, price, compare_at_price, download_link, icon, video_url_1, video_url_2, video_url_3, product_type } = (await request.json()) as {
      id?: string;
      title?: string;
      description?: string;
      price?: number | string;
      compare_at_price?: number | string;
      download_link?: string;
      icon?: string;
      video_url_1?: string;
      video_url_2?: string;
      video_url_3?: string;
      product_type?: string;
    };

    if (!id || !title || !description || price === undefined || !download_link) {
      return Response.json(
        { error: "Product ID, title, description, price, and download link are required." },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(String(price));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return Response.json(
        { error: "Price must be a valid positive number." },
        { status: 400 }
      );
    }

    const parsedComparePrice = compare_at_price ? parseFloat(String(compare_at_price)) : 0;
    const cleanIcon = (icon || "📦").trim();
    const db = context.env.DB;
    const now = Date.now();
    const cleanProductType = product_type || "bundle";

    await db
      .prepare(
        "UPDATE products SET title = ?, description = ?, price = ?, compare_at_price = ?, download_link = ?, icon = ?, video_url_1 = ?, video_url_2 = ?, video_url_3 = ?, product_type = ?, updated_at = ? WHERE id = ?"
      )
      .bind(
        title.trim(),
        description.trim(),
        parsedPrice,
        parsedComparePrice,
        download_link.trim(),
        cleanIcon,
        (video_url_1 || "").trim(),
        (video_url_2 || "").trim(),
        (video_url_3 || "").trim(),
        cleanProductType,
        now,
        id
      )
      .run();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
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

    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const db = context.env.DB;

    // Delete associated transactions or delete product
    await db.prepare("DELETE FROM transactions WHERE product_id = ?").bind(id).run();
    await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
