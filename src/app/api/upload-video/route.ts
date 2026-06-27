import { writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest } from "next/server";

// NOTE: This route uses Node.js runtime (not edge) so it can write to the filesystem
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = request.headers.get("Authorization");

    // Basic auth check
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";
    if (!password || password !== adminPassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!file) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }

    // 100MB hard cap (filesystem can handle it)
    if (file.size > 100 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 100MB)." }, { status: 400 });
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Invalid file type. Only video files are allowed." }, { status: 400 });
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop() || "mp4";
    const filename = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Save to public/videos/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const savePath = join(process.cwd(), "public", "videos", filename);
    await writeFile(savePath, buffer);

    // Return the public URL
    const url = `/videos/${filename}`;
    return Response.json({ success: true, url });
  } catch (error) {
    console.error("Video upload error:", error);
    return Response.json({ error: "Failed to save video file." }, { status: 500 });
  }
}
