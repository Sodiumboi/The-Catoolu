// ============================================================
// Email Transport — Nodemailer via Resend SMTP
// Resend provides a standard SMTP endpoint we connect to
// using our API key as the password
// ============================================================

const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');
require('dotenv').config();

const LOGO_BASE64 = (() => {
  try {
    const logoPath = path.join(__dirname, '../../../frontend/src/assets/vault-logo.png');
    return fs.readFileSync(logoPath).toString('base64');
  } catch {
    return null;
  }
})();

const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,           // TLS
  auth: {
    user: 'resend',       // always literally "resend"
    pass: process.env.RESEND_API_KEY,
  },
});

// ── Verify connection on startup ───────────────────────────
transporter.verify((err) => {
  if (err) {
    console.error('❌ Email transport error:', err.message);
    console.error('   Check RESEND_API_KEY in your .env file');
  } else {
    console.log('✅ Email transport ready (Resend)');
  }
});

// ── Email template ─────────────────────────────────────────
// CSS vars don't work in email clients — all values are hardcoded CI hex.
// @import for DM Serif Display / DM Sans works in Gmail & Apple Mail;
// Outlook ignores it and falls back to the Georgia/Arial stack.
function buildResetEmailHtml(username, resetUrl) {
  // Table-cell circle guarantees the portrait image (711×837) fits fully inside.
  // Image at 44×52 → diagonal ≈ 34px; circle radius = 42px → 8px clearance on all corners.
  const logoTag = LOGO_BASE64
    ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;"><tr>
        <td width="84" height="84" style="background:#FAFAF7;border-radius:42px;text-align:center;vertical-align:middle;line-height:0;">
          <img src="data:image/png;base64,${LOGO_BASE64}" alt="The Catoolu" width="44" height="52" style="display:inline-block;vertical-align:middle;" />
        </td></tr></table>`
    : `<div style="font-size:40px;line-height:1;margin-bottom:16px;">🐙</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#E8E4DA;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E4DA;padding:40px 16px;">
  <tr><td align="center">

    <table width="100%" style="max-width:480px;background:#FAFAF7;border:0.5px solid #E8E4DA;border-radius:12px;box-shadow:0 4px 16px rgba(28,28,26,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#2D4A1E;padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
          ${logoTag}
          <p style="margin:0;color:#EAF3DE;font-family:'DM Serif Display',Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.05em;font-weight:normal;">The Catoolu</p>
          <p style="margin:6px 0 0;color:rgba(192,221,151,0.65);font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">Call of Cthulhu Character Manager</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 28px;">
          <p style="margin:0 0 10px;color:#1C1C1A;font-family:'DM Sans',Arial,sans-serif;font-size:15px;">Hello, <strong>${username}</strong>.</p>
          <p style="margin:0 0 32px;color:#3A3A37;font-family:'DM Sans',Arial,sans-serif;line-height:1.65;font-size:14px;">
            A password reset was requested for your account.
            Click the button below to set a new password.
            This link expires in <strong style="color:#1C1C1A;">1 hour</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-bottom:32px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#3B6D11;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:500;letter-spacing:0.04em;">
                  Reset My Password
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#888780;font-family:'DM Sans',Arial,sans-serif;font-size:12px;line-height:1.65;">
            If you did not request this reset, you can safely ignore this email.
            Your password will not change.
          </p>
        </td>
      </tr>

      <!-- Fallback link -->
      <tr>
        <td style="padding:0 40px 32px;border-top:0.5px solid #E8E4DA;border-radius:0 0 12px 12px;">
          <p style="margin:20px 0 0;color:#888780;font-family:'DM Sans',Arial,sans-serif;font-size:11px;text-align:center;line-height:1.6;">
            If the button doesn't work, copy this link:<br/>
            <a href="${resetUrl}" style="color:#3B6D11;word-break:break-all;">${resetUrl}</a>
          </p>
        </td>
      </tr>

    </table>

    <p style="margin:14px 0 0;color:#888780;font-family:'DM Sans',Arial,sans-serif;font-size:10px;text-align:center;">
      The Catoolu &middot; V1.6 Atlach-Nacha
    </p>

  </td></tr>
</table>
</body>
</html>`;
}

// ── Send password reset email ──────────────────────────────
async function sendPasswordResetEmail(toEmail, resetToken, username) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from:    `"The Catoolu" <${process.env.EMAIL_FROM}>`,
    to:      toEmail,
    subject: 'Reset your The Catoolu password',
    html:    buildResetEmailHtml(username, resetUrl),
  });
}

module.exports = { transporter, sendPasswordResetEmail, buildResetEmailHtml };
