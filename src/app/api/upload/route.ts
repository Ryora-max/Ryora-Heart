import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const token = formData.get("token") as string;

    if (!file || !token) {
      return NextResponse.json({ error: "Missing file or token" }, { status: 400 });
    }

    const { getSession } = await import("@/app/actions/auth");
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    mkdirSync(uploadDir, { recursive: true });

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    mkdirSync(path.join(uploadDir, session.user.id), { recursive: true });
    writeFileSync(filePath, buffer);

    const url = `/uploads/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
