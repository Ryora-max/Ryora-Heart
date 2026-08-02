import { NextRequest, NextResponse } from "next/server";
import { login as authLogin, logout as authLogout, getSession } from "@/app/actions/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ryora-dev-secret-change-me";
const useMock = !process.env.DATABASE_URL;

function createJWT(user: { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string }) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role, relationship: user.relationship, pair_id: user.pair_id },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyJWT(token: string): { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "login": {
        const { username, password } = params;
        if (!username || !password) {
          return NextResponse.json({ error: "Username dan password harus diisi" }, { status: 400 });
        }
        const session = await authLogin(username, password);
        if (!session) {
          return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
        }
        // Use JWT token for stateless auth (works across serverless instances)
        const token = useMock ? createJWT(session.user) : session.token;
        const response = NextResponse.json({ user: session.user, token });
        response.cookies.set("ryora-session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
        return response;
      }
      case "logout": {
        await authLogout(params.token);
        const logoutResponse = NextResponse.json({ success: true });
        logoutResponse.cookies.delete({ name: "ryora-session", path: "/" });
        return logoutResponse;
      }
      case "verify": {
        if (useMock) {
          // Stateless JWT verification — works across serverless instances
          const decoded = verifyJWT(params.token);
          if (!decoded) {
            const badResponse = NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
            badResponse.cookies.delete({ name: "ryora-session", path: "/" });
            return badResponse;
          }
          return NextResponse.json({
            user: {
              id: decoded.id,
              username: decoded.username,
              name: decoded.name,
              role: decoded.role,
              relationship: decoded.relationship,
              pair_id: decoded.pair_id,
            }
          });
        }
        const session = await getSession(params.token);
        if (!session) {
          const badResponse = NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
          badResponse.cookies.delete({ name: "ryora-session", path: "/" });
          return badResponse;
        }
        return NextResponse.json({ user: session.user });
      }
      default:
        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: "Kesalahan server, periksa DATABASE_URL" }, { status: 500 });
  }
}
