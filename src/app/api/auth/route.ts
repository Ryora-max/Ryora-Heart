import { NextRequest, NextResponse } from "next/server";
import { login as authLogin, logout as authLogout, getSession } from "@/app/actions/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ryora-dev-secret-change-me";

// Fallback users for when DB is unavailable (e.g. Supabase quota exceeded)
const FALLBACK_USERS = [
  { id: "user-1", username: "Ryo", password_hash: "$2a$10$placeholder", name: "Ahmad Rio Prawiro", role: "owner", relationship: "Cowo Ara ❤️", pair_id: "pair-1", plainPassword: "11122004" },
  { id: "user-2", username: "Ara", password_hash: "$2a$10$placeholder", name: "Tiara Pertiwi", role: "partner", relationship: "Cewe Rio ❤️", pair_id: "pair-1", plainPassword: "09062004" },
];

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

function fallbackLogin(username: string, password: string) {
  const user = FALLBACK_USERS.find((u) => u.username === username && u.plainPassword === password);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    relationship: user.relationship,
    pair_id: user.pair_id,
  };
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
        
        // Try DB login first, fall back to hardcoded users if DB fails
        let user: { id: string; username: string; name: string; role: string; relationship: string; pair_id?: string } | null = null;
        try {
          const session = await authLogin(username, password);
          if (session) user = session.user;
        } catch (e) {
          console.error("DB login failed, using fallback:", e);
        }
        
        // Fallback: check hardcoded users
        if (!user) {
          user = fallbackLogin(username, password);
        }
        
        if (!user) {
          return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
        }
        
        const token = createJWT(user);
        const response = NextResponse.json({ user, token });
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
        // Always try JWT first — works stateless across serverless instances
        const decoded = verifyJWT(params.token);
        if (decoded) {
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
        // Fall back to DB session if JWT fails and DB is available
        if (process.env.DATABASE_URL) {
          try {
            const session = await getSession(params.token);
            if (session) {
              return NextResponse.json({ user: session.user });
            }
          } catch (e) {
            console.error("DB verify failed:", e);
          }
        }
        const badResponse = NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
        badResponse.cookies.delete({ name: "ryora-session", path: "/" });
        return badResponse;
      }
      default:
        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: "Kesalahan server, periksa DATABASE_URL" }, { status: 500 });
  }
}
