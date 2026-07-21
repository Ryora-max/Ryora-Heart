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
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        return NextResponse.json({ user: session.user, token: session.token });
      }
      case "logout": {
        await authLogout(params.token);
        return NextResponse.json({ success: true });
      }
      case "verify": {
        const session = await getSession(params.token);
        if (!session) {
          return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }
        return NextResponse.json({ user: session.user });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
