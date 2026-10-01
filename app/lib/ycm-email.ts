export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.YCM_FROM_EMAIL;

  if (!key || !from) {
    if (process.env.NODE_ENV !== 'production') return { sent: false, dev: true };
    throw new Error('PASSWORD_RESET_EMAIL_NOT_CONFIGURED');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'YCM One — Reset your password',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Yojana Connect Mitra</h2><p>Hi ${name.replace(/[<>]/g, '')},</p><p>We received a request to reset your YCM One password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#071a49;color:#fff;text-decoration:none;border-radius:10px">Reset Password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email.</p></div>`,
    }),
  });

  if (!response.ok) throw new Error('PASSWORD_RESET_EMAIL_FAILED');
  return { sent: true };
}
