import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  const { tokens } = await oauth2Client.getToken(code);

  // Codificamos tokens en base64
  const encoded = Buffer.from(JSON.stringify(tokens)).toString("base64");

  const redirect = new URL("/process-login", req.url);
  redirect.searchParams.set("tokens", encoded);

  return NextResponse.redirect(redirect.toString());
}
