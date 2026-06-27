import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  return Response.json(
    { error: "Local file uploads are not supported on Cloudflare Edge. Please use external URLs for now." }, 
    { status: 501 }
  );
}
