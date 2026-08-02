import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ryora-dev-secret-change-me";
const useMock = !process.env.DATABASE_URL;

function verifyJWT(token: string): { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const token = formData.get("token") as string;

    if (!file || !token) {
      return NextResponse.json({ error: "Missing file or token" }, { status: 400 });
    }

    if (useMock) {
      const decoded = verifyJWT(token);
      if (!decoded) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const { getSession } = await import("@/app/actions/auth");
      const session = await getSession(token);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
