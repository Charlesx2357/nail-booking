import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  isValidAdminLogin,
} from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!isValidAdminLogin(username, password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createAdminSession();

    const res = NextResponse.json({ ok: true });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
