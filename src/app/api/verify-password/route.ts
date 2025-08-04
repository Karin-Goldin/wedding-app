import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "karin&sandy2024";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const isValid = password === ADMIN_PASSWORD;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
