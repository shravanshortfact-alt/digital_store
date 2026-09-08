export const runtime = "edge";

export async function GET() {
  return Response.json({ error: "SMM functionality has been disabled." }, { status: 410 });
}

export async function POST() {
  return Response.json({ error: "SMM functionality has been disabled." }, { status: 410 });
}
