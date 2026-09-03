const nodemailer = require('nodemailer');

// Tạo transporter với Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gửi email xác thực OTP
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP 6 số
 * @param {string} username - Tên người dùng
 */
async function sendVerificationEmail(email, otp, username) {
  const mailOptions = {
    from: `"Unmatched System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Xác thực tài khoản Unmatched',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #F5C34B;">⚔️ Unmatched</h1>
        <p>Xin chào <strong>${username}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống quản lý giải đấu Unmatched.</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; color: #333;">
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Không thể gửi email xác thực. Vui lòng thử lại sau.');
  }
}

module.exports = { sendVerificationEmail };