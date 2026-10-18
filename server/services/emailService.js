import nodemailer from 'nodemailer';
import dns from 'dns';

// Ensure IPv4 lookup takes precedence on Windows to prevent ENETUNREACH / ETIMEDOUT on IPv6
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Service to handle sending emails (e.g. 2FA verification codes, password resets)
 */

export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  return Boolean(user && pass);
};

export const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // Gmail SMTP with explicit port 587 and IPv4
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

/**
 * Send 2FA Verification code to user's email
 * @param {string} toEmail - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - Optional user display name
 * @returns {Promise<{ sent: boolean, error?: string, simulated?: boolean }>}
 */
export const send2FACode = async (toEmail, code, userName = '') => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const fromAddress = process.env.EMAIL_FROM || (user ? `"Threadly Security" <${user}>` : '"Threadly" <no-reply@threadly.local>');

  if (!isEmailConfigured()) {
    console.log(`\n======================================================`);
    console.log(`[EMAIL NOTICE] SMTP not configured in .env`);
    console.log(`[2FA Security Code for ${toEmail}]: ====> ${code} <====`);
    console.log(`======================================================\n`);
    return {
      sent: false,
      simulated: true,
      error: 'SMTP not configured in .env. Code displayed on screen.',
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return {
        sent: false,
        simulated: true,
        error: 'Transporter creation failed',
      };
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #1e3a2f; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0;">Threadly</h1>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Clothing Business Management Assistant</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Two-Factor Verification Code</p>
          <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #14532d; font-family: 'Courier New', Courier, monospace; background: #ffffff; padding: 12px 24px; border-radius: 10px; display: inline-block; border: 2px dashed #86efac;">
            ${code}
          </div>
          <p style="color: #15803d; font-size: 12px; margin: 12px 0 0;">This code is valid for 10 minutes.</p>
        </div>

        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Hello <strong>${userName || 'User'}</strong>,<br/>
          A sign-in request was made for your Threadly account (${toEmail}). Please enter this code on the verification screen to proceed.
        </p>

        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; border-top: 1px solid #f3f4f6; padding-top: 16px; margin: 0;">
          If you did not attempt to log in, someone may know your password. Please sign in and update your security settings immediately.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your Threadly Verification Code: ${code}`,
      text: `Your Threadly verification code is: ${code}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[Email Service] Successfully sent 2FA code to ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Service] Failed to send email to ${toEmail}:`, err.message);
    return {
      sent: false,
      simulated: true,
      error: `Failed to send email: ${err.message}`,
    };
  }
};
