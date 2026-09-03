// backend/src/services/emailService.js
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

async function sendVerificationEmail(email, otp, username) {
  const messageData = {
    from: `Unmatched <${process.env.MAILGUN_FROM_EMAIL}>`,
    to: [email],
    subject: '🔐 Xác thực tài khoản Unmatched',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #F5C34B;">⚔️ Unmatched</h1>
        <p>Xin chào <strong>${username}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống quản lý giải đấu Unmatched.</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
          ${otp}
        </div>
        <p>Mã xác thực có hiệu lực trong <strong>5 phút</strong>.</p>
        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">© 2026 Unmatched Tournament System</p>
      </div>
    `,
  };

  try {
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log(`✅ Email sent to ${email}. Message ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending email via Mailgun:', error);
    throw new Error('Không thể gửi email xác thực. Vui lòng thử lại sau.');
  }
}

async function sendResetPasswordEmail(email, resetLink, username) {
  const messageData = {
    from: `Unmatched <${process.env.MAILGUN_FROM_EMAIL}>`,
    to: [email],
    subject: '🔑 Đặt lại mật khẩu Unmatched',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #F5C34B;">⚔️ Unmatched</h1>
        <p>Xin chào <strong>${username}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng bấm vào nút bên dưới để đặt lại mật khẩu:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #F5C34B; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p>Link này có hiệu lực trong <strong>15 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">© 2026 Unmatched Tournament System</p>
      </div>
    `,
  };

  try {
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log(`✅ Reset password email sent to ${email}. Message ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending reset password email:', error);
    throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };