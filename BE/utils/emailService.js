import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (to, resetToken) => {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  
  // Log to console as backup
  console.log('========================================');
  console.log(`📧 RESET EMAIL TO: ${to}`);
  console.log(`🔗 RESET LINK: ${resetLink}`);
  console.log('========================================');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'EatWhere - Password Reset Request',
    html: `
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (err) {
    console.log('❌ Email failed, but link is above in console');
  }
};