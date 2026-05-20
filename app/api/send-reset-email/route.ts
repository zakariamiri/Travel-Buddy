import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error) {
    console.log("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const token_hash = data.properties.hashed_token;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const resetLink = `${siteUrl}/reset-password?token_hash=${token_hash}&type=recovery`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `Travel Buddy <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your password - Travel Buddy",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- HEADER -->
          <tr>
            <td style="background:#FFEFD4;padding:32px;text-align:center;">
              <img src="https://joarrnifvwioibmzqsvd.supabase.co/storage/v1/object/public/trip-covers/logo2.png" 
                  alt="Travel Buddy" 
                  style="height:60px;width:auto;" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1a1a1a;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                We received a request to reset the password for your Travel Buddy account. Click the button below to choose a new password.
              </p>

              <!-- BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}"
                       style="display:inline-block;background:#9f411d;color:#ffffff;
                              text-decoration:none;font-size:16px;font-weight:600;
                              padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- DIVIDER -->
              <hr style="border:none;border-top:1px solid #f0ebe6;margin:0 0 24px;">

              
            </td>
          </tr>

          <!-- EXPIRY NOTICE -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fff8f5;border:1px solid #fde8df;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#9f411d;">
                      ⏱ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#faf7f4;padding:20px 40px;border-top:1px solid #f0ebe6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                © 2026 Travel Buddy · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  return NextResponse.json({ success: true });
}
