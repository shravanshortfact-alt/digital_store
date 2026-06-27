import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return Response.json(
        { error: "Database binding missing." },
        { status: 500 }
      );
    }

    const db = context.env.DB;
    const product = await db
      .prepare("SELECT * FROM products WHERE id = ?")
      .bind(id)
      .first();

    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("Error retrieving product details:", error);
    return Response.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
