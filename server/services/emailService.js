/**
 * server/services/emailService.js
 * 
 * FoodWala Automated Email Subsystem:
 * - Powered by Gmail SMTP (using Google App Passwords)
 * - Sends branded OTP verification emails for authentication & password reset
 * - Sends rich, dual-recipient order confirmation receipts
 * - Graceful fallback to sandbox/console mode if SMTP credentials are temporarily unavailable
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '../.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  } catch (e) {}
}

class EmailService {
  constructor() {
    this.sendOtpEmail = this.sendOtpEmail.bind(this);
    this.sendOrderReceiptEmail = this.sendOrderReceiptEmail.bind(this);
    this.verifyConnection = this.verifyConnection.bind(this);
    this.getTransporter = this.getTransporter.bind(this);
    this.sendWelcomeEmail = this.sendWelcomeEmail.bind(this);
  }

  get user() {
    return process.env.GMAIL_USER || process.env.EMAIL_USER || 'foodorderdeliverybnglr@gmail.com';
  }

  get pass() {
    const raw = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || 'tqtb yddi fegd dami';
    return String(raw).replace(/\s+/g, '');
  }

  get fromAddress() {
    return process.env.EMAIL_FROM || `"FoodWala Online" <${this.user}>`;
  }

  getTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.user,
        pass: this.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async verifyConnection() {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log(`✅ [Email Service] Connected to Gmail SMTP for ${this.user}`);
      return { success: true };
    } catch (err) {
      console.warn(`⚠️ [Email Service] Gmail SMTP verification note (${this.user}):`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send 6-digit OTP verification email
   */
  async sendOtpEmail({ toEmail, otp, recipientName, purpose = 'Verification' }) {
    if (!toEmail || !toEmail.includes('@')) {
      console.warn(`[Email Service] Cannot send OTP: Invalid email "${toEmail}"`);
      return { success: false, error: 'Invalid recipient email' };
    }

    const name = recipientName || 'FoodWala Member';
    const orderId = `VERIFY-${otp}`;
    const subject = `FoodWala Receipt for Order ${orderId} — FoodWala Account Security`;
    
    const formattedDate = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b; }
    .receipt-card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
    .brand-header { background: #ff5200; padding: 28px 24px; text-align: center; color: #ffffff; }
    .brand-header h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 500; }
    .body-content { padding: 32px 28px; }
    .receipt-intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .meta-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .meta-label { color: #64748b; font-weight: 600; width: 38%; }
    .meta-val { color: #0f172a; font-weight: 700; text-align: right; }
    .items-box { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
    .items-title { font-weight: 700; color: #111827; font-size: 14px; margin-bottom: 8px; }
    .otp-display { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ff5200; font-family: "SF Mono", Monaco, Consolas, monospace; margin: 12px 0; text-align: center; background: #fff7ed; padding: 14px; border-radius: 8px; border: 1px dashed #ff5200; }
    .items-note { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0; }
    .total-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-top: 2px dashed #e2e8f0; border-bottom: 2px dashed #e2e8f0; margin: 20px 0; font-weight: 800; font-size: 15px; color: #0f172a; }
    .track-btn { display: block; width: fit-content; margin: 24px auto 8px; background: #ff5200; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 25px; text-align: center; box-shadow: 0 4px 10px rgba(255,82,0,0.3); }
    .delivery-est { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 24px; }
    .footer { background: #f8fafc; padding: 22px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    .footer a { color: #ff5200; text-decoration: none; }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="brand-header">
      <h1>FoodWala</h1>
      <p>Bengaluru's Authentic Food Discovery &amp; Delivery</p>
    </div>
    <div class="body-content">
      <h2 style="font-size: 16px; margin: 0 0 10px 0; color: #0f172a;">Hi ${name},</h2>
      <p class="receipt-intro">
        Your order has been confirmed and the kitchen has begun preparing your authentic Bengaluru delicacies! Here is your official order receipt.
      </p>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Order ID:</td>
          <td class="meta-val" style="color: #ff5200;">${orderId}</td>
        </tr>
        <tr>
          <td class="meta-label">Date &amp; Time:</td>
          <td class="meta-val">${formattedDate}</td>
        </tr>
        <tr>
          <td class="meta-label">Restaurant:</td>
          <td class="meta-val">FoodWala Account Security</td>
        </tr>
        <tr>
          <td class="meta-label">Payment Mode:</td>
          <td class="meta-val">Security Verification Code</td>
        </tr>
        <tr>
          <td class="meta-label">Deliver To:</td>
          <td class="meta-val">Account Security / Password Reset Verification</td>
        </tr>
      </table>

      <div class="items-box">
        <div class="items-title">Items Ordered</div>
        <p style="font-size: 13px; margin: 0 0 4px 0; color: #374151;">
          Your FoodWala Password Reset Verification OTP is:
        </p>
        <div class="otp-display">${otp}</div>
        <p class="items-note">
          This verification code is strictly valid for 15 minutes. If you did not request a password reset, please ignore this email or secure your account.
        </p>
      </div>

      <div class="total-box">
        <span>Grand Total Paid (incl. taxes &amp; fees)</span>
        <span style="color: #ff5200;">OTP: ${otp}</span>
      </div>

      <a href="http://localhost:3000/orders.html" class="track-btn">Track Live Order on FoodWala</a>
      <div class="delivery-est">Estimated delivery in 25–30 minutes across Bengaluru.</div>
    </div>

    <div class="footer">
      This email was sent to <a href="mailto:${toEmail}">${toEmail}</a> from FoodWala Bengaluru.<br>
      Questions? Reach us at <a href="mailto:foodorderdeliverybnglr@gmail.com">foodorderdeliverybnglr@gmail.com</a><br>
      &copy; 2026 FoodWala Inc. Bengaluru, Karnataka, India. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
FoodWala Receipt for Order ${orderId} — FoodWala Account Security

FoodWala
Bengaluru's Authentic Food Discovery & Delivery

Hi ${name},
Your order has been confirmed and the kitchen has begun preparing your authentic Bengaluru delicacies! Here is your official order receipt.

Order ID:
${orderId}

Date & Time:
${formattedDate}

Restaurant:
FoodWala Account Security

Payment Mode:
Security Verification Code

Deliver To:
Account Security / Password Reset Verification

Items Ordered
Your FoodWala Password Reset Verification OTP is:
👉  ${otp}  👈

This verification code is strictly valid for 15 minutes. If you did not request a password reset, please ignore this email or secure your account.

Grand Total Paid (incl. taxes & fees)
OTP: ${otp}

Track Live Order on FoodWala: http://localhost:3000/orders.html
Estimated delivery in 25–30 minutes across Bengaluru.

This email was sent to ${toEmail} from FoodWala Bengaluru.
Questions? Reach us at foodorderdeliverybnglr@gmail.com
© 2026 FoodWala Inc. Bengaluru, Karnataka, India. All rights reserved.
    `.trim();

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.fromAddress,
        to: toEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`📧 [Email Service] Receipt-style OTP email delivered to ${toEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`⚠️ [Email Service] Gmail dispatch note for ${toEmail}: ${err.message}`);
      return { success: false, error: err.message, fallbackDevOtp: otp };
    }
  }

  /**
   * Send Welcome & Account Verification Email
   */
  async sendWelcomeEmail({ toEmail, name, phone }) {
    const recipients = new Set();
    if (toEmail && toEmail.includes('@') && !toEmail.includes('example.com')) {
      recipients.add(toEmail.toLowerCase().trim());
    }
    recipients.add('foodorderdeliverybnglr@gmail.com');
    recipients.add('ballariramesh0825@gmail.com');

    const customerName = name || 'FoodWala Member';
    const subject = `Welcome to FoodWala Bengaluru, ${customerName}! 🍲`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #ff5200 0%, #e11d48 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 800;">FoodWala</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px;">Welcome to Bengaluru's Authentic Food Discovery Platform</p>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Welcome, ${customerName}! 👋</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Your FoodWala account has been successfully verified and activated. You can now discover, order, and track authentic Bengaluru cuisine from over 75+ verified iconic restaurants and local eateries.
      </p>

      <div style="background: #fff7ed; border-left: 4px solid #ff5200; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
        <strong style="color: #c2410c; font-size: 14px;">Account Security Verified</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #7c2d12;">
          Email: <strong>${toEmail}</strong><br>
          ${phone ? `Registered Mobile: <strong>+91 ${phone}</strong><br>` : ''}
          Platform: <strong>FoodWala Verified Customer</strong>
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:3000/menu.html" style="display: inline-block; background: #ff5200; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 30px; box-shadow: 0 4px 12px rgba(255,82,0,0.3);">Explore Bengaluru Delicacies</a>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      FoodWala • 24/7 WhatsApp: +91 7672047816 • Email: <a href="mailto:foodorderdeliverybnglr@gmail.com" style="color: #ff5200;">foodorderdeliverybnglr@gmail.com</a>
    </div>
  </div>
</body>
</html>
    `.trim();

    const results = [];
    const transporter = this.getTransporter();
    for (const em of recipients) {
      try {
        const info = await transporter.sendMail({
          from: this.fromAddress,
          to: em,
          subject: subject,
          text: `Welcome to FoodWala, ${customerName}! Your account is active. Explore menu: http://localhost:3000/menu.html`,
          html: htmlContent
        });
        console.log(`📧 [Email Service] Welcome email delivered to ${em} (ID: ${info.messageId})`);
        results.push({ email: em, success: true, messageId: info.messageId });
      } catch (e) {
        console.warn(`⚠️ [Email Service] Welcome dispatch note for ${em}: ${e.message}`);
        results.push({ email: em, success: false, error: e.message });
      }
    }
    return results;
  }

  /**
   * Send order confirmation receipt and complete order history
   * Dispatches to BOTH the customer and primary store admin mailboxes
   */
  async sendOrderReceiptEmail(orderData, recentOrders = []) {
    const targetEmails = new Set();
    if (orderData.customerEmail && orderData.customerEmail.includes('@') && !orderData.customerEmail.includes('example.com')) {
      targetEmails.add(orderData.customerEmail.toLowerCase().trim());
    }
    // Always include administrator and store manager notification mailboxes
    targetEmails.add('foodorderdeliverybnglr@gmail.com');
    targetEmails.add('ballariramesh0825@gmail.com');

    const orderId = String(orderData.orderId || orderData.id || ('FW-' + Date.now().toString().slice(-6))).replace(/^#/, '');
    const restaurant = orderData.restaurantName || 'FoodWala Restaurant';
    const restAddress = orderData.restaurantAddress || 'Bengaluru, Karnataka';
    const customerName = orderData.customerName || 'Valued Customer';
    const customerPhone = orderData.customerPhone || 'N/A';
    const deliveryAddress = orderData.deliveryAddress || 'Bengaluru, Karnataka';
    const paymentMode = orderData.paymentMode || orderData.paymentMethod || 'Online (UPI / Card)';
    const paymentStatus = orderData.paymentStatus || 'CONFIRMED';
    
    const subtotal = Number(orderData.itemTotal || orderData.subtotal || 0).toFixed(2);
    const fee = Number(orderData.deliveryFee || 30).toFixed(2);
    const tax = Number(orderData.taxes || 0).toFixed(2);
    const disc = Number(orderData.discount || 0).toFixed(2);
    const total = Number(orderData.totalAmount || orderData.toPay || orderData.grandTotal || 0).toFixed(2);
    
    const formattedDate = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const subject = `FoodWala Receipt for Order #FW-${orderId} — ${restaurant}`;

    // 1. Build Item Rows with food images
    let itemsHtml = '';
    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      itemsHtml = orderData.items.map(it => {
        const qty = it.quantity || it.qty || 1;
        const price = Number(it.price || 0);
        const itemLineTotal = (price * qty).toFixed(2);
        const itemName = it.name || it.itemName || 'Authentic Delicacy';
        const imgUrl = it.image || it.image_path || it.imagePath || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=160&auto=format&fit=crop&q=80';

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 8px 12px 0; width: 64px; vertical-align: middle;">
              <img src="${imgUrl}" alt="${itemName}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" onerror="this.style.display='none';">
            </td>
            <td style="padding: 12px 0; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${itemName}</div>
              <div style="font-size: 12px; color: #64748b;">Qty: ${qty} × ₹${price.toFixed(2)}</div>
            </td>
            <td style="padding: 12px 0; font-size: 14px; text-align: right; font-weight: 700; color: #0f172a; vertical-align: middle;">
              ₹${itemLineTotal}
            </td>
          </tr>
        `;
      }).join('');
    } else {
      itemsHtml = `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td colspan="3" style="padding: 12px 0; font-size: 14px; color: #475569;">1x Authentic Bengaluru Specialty Platter — ₹${total}</td>
        </tr>
      `;
    }

    // 2. Build Recent Order History Section
    let historyHtml = '';
    if (Array.isArray(recentOrders) && recentOrders.length > 0) {
      const historyRows = recentOrders.map(ro => {
        const rId = String(ro.order_id || ro.id || '').replace(/^#?FW-?/i, '');
        const rRest = ro.restaurant_name || ro.restaurantName || 'FoodWala Partner';
        const rTotal = Number(ro.total_amount || ro.grandTotal || 0).toFixed(2);
        const rStatus = ro.status || 'DELIVERED';
        const rDate = ro.created_at ? new Date(ro.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent';
        const statusBadgeColor = rStatus === 'DELIVERED' ? '#10b981' : (rStatus === 'CONFIRMED' ? '#3b82f6' : '#ff5200');

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 12px;">
            <td style="padding: 8px 4px 8px 0; font-weight: 700; color: #ff5200;">#FW-${rId}</td>
            <td style="padding: 8px 4px;">${rRest}</td>
            <td style="padding: 8px 4px; color: #64748b;">${rDate}</td>
            <td style="padding: 8px 4px; text-align: right; font-weight: 600;">₹${rTotal}</td>
            <td style="padding: 8px 0 8px 4px; text-align: right;">
              <span style="background: ${statusBadgeColor}15; color: ${statusBadgeColor}; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px;">${rStatus}</span>
            </td>
          </tr>
        `;
      }).join('');

      historyHtml = `
        <div style="margin-top: 24px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
              📋 Your Past FoodWala Orders
            </h3>
            <a href="http://localhost:3000/orders.html" style="font-size: 12px; color: #ff5200; text-decoration: none; font-weight: 700;">View All &rarr;</a>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="font-size: 11px; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;">
                <th style="padding-bottom: 6px;">Order</th>
                <th style="padding-bottom: 6px;">Restaurant</th>
                <th style="padding-bottom: 6px;">Date</th>
                <th style="padding-bottom: 6px; text-align: right;">Total</th>
                <th style="padding-bottom: 6px; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
        </div>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
    
    <!-- BRAND HEADER -->
    <div style="background: linear-gradient(135deg, #ff5200 0%, #e11d48 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">FoodWala</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95; font-weight: 500;">Bengaluru's Authentic Food Discovery &amp; Delivery</p>
      <div style="margin-top: 14px; display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700;">
        🎉 Order Confirmed: #FW-${orderId}
      </div>
    </div>

    <!-- BODY -->
    <div style="padding: 28px 24px;">
      <h2 style="font-size: 18px; margin: 0 0 6px 0; color: #0f172a;">Thank you, ${customerName}!</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
        Your order from <strong>${restaurant}</strong> is confirmed. The kitchen has begun preparing your food.
      </p>

      <!-- ORDER DETAILS METADATA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Order ID:</td>
          <td style="padding: 8px 0; font-weight: 800; color: #ff5200; text-align: right;">#FW-${orderId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date &amp; Time:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${formattedDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Restaurant:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${restaurant} (${restAddress})</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Payment Mode:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${paymentMode} (${paymentStatus})</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Customer Contact:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${customerName} (${customerPhone})</td>
        </tr>
      </table>

      <!-- ITEMS ORDERED -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px;">
        <div style="font-weight: 800; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          🍲 Items Ordered
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- BILL BREAKDOWN -->
        <div style="margin-top: 16px; pt-3; border-top: 1px solid #e2e8f0; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
            <span>Item Subtotal</span>
            <span style="font-weight: 600; color: #0f172a;">₹${subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
            <span>Delivery Fee</span>
            <span style="font-weight: 600; color: #0f172a;">₹${fee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
            <span>Taxes &amp; Restaurant Packaging</span>
            <span style="font-weight: 600; color: #0f172a;">₹${tax}</span>
          </div>
          ${Number(disc) > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #16a34a;">
            <span>Promo Coupon Discount</span>
            <span style="font-weight: 700;">-₹${disc}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; padding: 12px 0 4px 0; border-top: 2px dashed #cbd5e1; margin-top: 8px; font-size: 16px; font-weight: 900; color: #0f172a;">
            <span>Grand Total Paid</span>
            <span style="color: #ff5200;">₹${total}</span>
          </div>
        </div>
      </div>

      <!-- DELIVERY ADDRESS -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; font-size: 13px; color: #334155; margin-bottom: 22px;">
        <strong style="color: #0f172a; font-size: 14px;">📍 Delivery Location:</strong><br>
        <span style="line-height: 1.6; display: inline-block; margin-top: 4px;">${deliveryAddress}</span>
      </div>

      <!-- ACTION BUTTONS -->
      <div style="text-align: center; margin: 26px 0 16px 0;">
        <a href="http://localhost:3000/order-tracking.html?orderId=${orderId}" style="display: inline-block; background: #ff5200; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 34px; border-radius: 30px; box-shadow: 0 4px 14px rgba(255,82,0,0.35);">
          🚴 Track Live Delivery Order
        </a>
      </div>
      <div style="text-align: center; font-size: 12px; color: #64748b; margin-bottom: 12px;">
        Estimated delivery in 25–30 minutes across Bengaluru.
      </div>

      <!-- ORDER HISTORY SECTION -->
      ${historyHtml}

    </div>

    <!-- FOOTER -->
    <div style="background: #f8fafc; padding: 22px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6;">
      This email was dispatched to <a href="mailto:${orderData.customerEmail || 'foodorderdeliverybnglr@gmail.com'}" style="color: #ff5200; text-decoration: none;">${orderData.customerEmail || 'foodorderdeliverybnglr@gmail.com'}</a> from FoodWala Bengaluru.<br>
      Store &amp; Support Hotline: <a href="mailto:foodorderdeliverybnglr@gmail.com" style="color: #ff5200; text-decoration: none;">foodorderdeliverybnglr@gmail.com</a> • WhatsApp: +91 7672047816<br>
      &copy; 2026 FoodWala Inc. Indiranagar, Bengaluru, Karnataka, India. All rights reserved.
    </div>

  </div>
</body>
</html>
    `.trim();

    const textContent = `
FoodWala Receipt for Order #FW-${orderId} — ${restaurant}

Hi ${customerName},
Your order has been confirmed!
Order ID: #FW-${orderId}
Date & Time: ${formattedDate}
Restaurant: ${restaurant} (${restAddress})
Payment Mode: ${paymentMode} (${paymentStatus})
Deliver To: ${customerName} (${customerPhone}), ${deliveryAddress}

Grand Total Paid: ₹${total}

Track Live Order on FoodWala: http://localhost:3000/order-tracking.html?orderId=${orderId}
View Order History: http://localhost:3000/orders.html

FoodWala • Bengaluru's Authentic Food Discovery & Delivery
Support: foodorderdeliverybnglr@gmail.com | WhatsApp: +91 7672047816
    `.trim();

    const dispatchResults = [];
    const transporter = this.getTransporter();

    for (const email of targetEmails) {
      try {
        const info = await transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`📧 [Email Service] Order receipt delivered to ${email} (Message ID: ${info.messageId})`);
        dispatchResults.push({ email: email, success: true, messageId: info.messageId });
      } catch (err) {
        console.warn(`⚠️ [Email Service] Receipt dispatch note for ${email}: ${err.message}`);
        dispatchResults.push({ email: email, success: false, error: err.message });
      }
    }

    const anySuccess = dispatchResults.some(r => r.success);
    return {
      success: anySuccess,
      orderId: orderId,
      dispatches: dispatchResults
    };
  }
}

module.exports = new EmailService();
