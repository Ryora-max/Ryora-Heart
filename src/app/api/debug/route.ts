import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { query, getOne } from "@/lib/db";

export async function GET(request: NextRequest) {
  const debug: Record<string, unknown> = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    useMock: !process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    await initializeDatabase();
    debug.initDone = true;

    if (process.env.DATABASE_URL) {
      const users = await query("SELECT id, username, name, role, pair_id FROM users");
      debug.users = users.rows;
      debug.userCount = users.rowCount;
    } else {
      debug.message = "No DATABASE_URL — using mock DB";
    }
  } catch (error) {
    debug.initError = String(error);
  }

  return NextResponse.json(debug);
}
