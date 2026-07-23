import { NextRequest, NextResponse } from "next/server";
import { login as authLogin, logout as authLogout, getSession } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "login": {
        const { username, password } = params;
        const session = await authLogin(username, password);
        if (!session) {
          return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
        }
        const response = NextResponse.json({ user: session.user, token: session.token });
        response.cookies.set("ryora-session", session.token, {
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
    return NextResponse.json({ error: "Kesalahan server" }, { status: 500 });
  }
}
