

/*
 * Send an email via SMTP.
 *
 * Config is pulled from environment variables:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
 *
 * Development (EMAIL_HOST is blank):
 *   1. Tries to create a free Ethereal test account so you can preview the
 *      actual email at https://ethereal.email.
 *   2. If Ethereal's API is unreachable (offline, firewall, rate-limit), falls
 *      back to console-only mode — the email is never "sent" but the full
 *      reset URL is printed to the terminal so you can test the flow instantly.
 *   In both cases the function resolves successfully, so the forgot-password
 *   token is NEVER rolled back due to an email-delivery failure in dev.
 *
 * Production (EMAIL_HOST is set, e.g. smtp.gmail.com):
 *   Uses the configured SMTP credentials; throws on failure so the controller
 *   can handle the error properly.
 * 
 */


const nodemailer = require('nodemailer');
/** 
*  @param {{ to: string, subject: string, html: string, devResetUrl?: string }} 
*/

const sendEmail = async ({ to, subject, html, devResetUrl }) => {
  /* ── Production SMTP ─────────────────────────────────────────────────────── */
  if (process.env.EMAIL_HOST) {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4, // force IPv4 — Render can't route outbound IPv6 (ENETUNREACH)
    });

    // Verify the connection config before trying to send
    await transporter.verify();

    const info = await transporter.sendMail({
      from:    `"Crown Hostel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent to ${to} — Message ID: ${info.messageId}`);
    return info;
  }

  /* ── Development: try Ethereal, fall back to console ────────────────────── */
  try {
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      // Give Ethereal's API 5 s before giving up
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ethereal API timeout')), 5000)
      ),
    ]);

    const transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from:    '"Crown Hostel" <noreply@crownhostel.com>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n[Email DEV — Ethereal]');
    console.log(`  To      : ${to}`);
    console.log(`  Subject : ${subject}`);
    if (previewUrl) console.log(`  Preview : ${previewUrl}`);
    if (devResetUrl) console.log(`  Reset URL: ${devResetUrl}`);
    console.log('');

    return info;
  } catch (etherealErr) {
    /* Ethereal unavailable — log everything to console so dev can still test */
    console.warn(`\n[Email DEV — Console fallback] (Ethereal unavailable: ${etherealErr.message})`);
    console.log('─'.repeat(60));
    console.log(`  To      : ${to}`);
    console.log(`  Subject : ${subject}`);
    if (devResetUrl) {
      console.log(`  Reset URL: ${devResetUrl}`);
      console.log('  ↑ Open this URL in your browser to reset the password.');
    }
    console.log('─'.repeat(60) + '\n');

    // Return a dummy info object so the controller treats this as a success
    return { messageId: `dev-console-${Date.now()}`, envelope: { to: [to] } };
  }
};

module.exports = sendEmail;
