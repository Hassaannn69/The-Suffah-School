
/**
 * PRODUCTION BACKEND for The Suffah School SMS
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a folder 'backend'
 * 2. Run: npm init -y
 * 3. Run: npm install express cors dotenv nodemailer pg
 * 4. Create .env file with:
 *    PORT=5000
 *    SMTP_HOST=smtp-relay.brevo.com
 *    SMTP_PORT=587
 *    SMTP_USER=9d2d70001@smtp-brevo.com
 *    SMTP_PASS=GgCW38ZIvm0Ky41f
 *    SENDER_EMAIL=9d2d70001@smtp-brevo.com
 * 5. Run: node server.js
 */

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Connection (Optional for Email Test) ---
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- 📧 EMAIL SERVICE CONFIGURATION (BREVO SMTP) ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "9d2d70001@smtp-brevo.com",
        pass: process.env.SMTP_PASS || "GgCW38ZIvm0Ky41f",
    },
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ SMTP Connection Error:", error);
    } else {
        console.log("✅ Server is ready to take our messages");
    }
});

// --- 📧 REUSABLE EMAIL FUNCTIONS ---

const sendGeneralEmail = async (to, subject, message) => {
    if (!to) return { success: false, error: "No recipient" };
    try {
        const info = await transporter.sendMail({
            from: `"The Suffah School" <${process.env.SENDER_EMAIL || "9d2d70001@smtp-brevo.com"}>`,
            to: to,
            subject: subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #2563eb;">The Suffah School</h2>
                    <p>${message}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <small style="color: #666;">This is an automated notification.</small>
                   </div>`
        });
        console.log("📧 Email sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Email Failed:", error);
        return { success: false, error: error.message };
    }
};

const sendStudentRegistrationEmail = async (student) => {
    const subject = "Welcome to The Suffah School";
    const message = `Dear ${student.name},\n\nWelcome to The Suffah School! Your registration is complete.\n\nRoll Number: ${student.rollNo}\nClass: ${student.classId}\n\nPlease contact administration if you have any questions.\n\nBest Regards,\nSchool Administration`;
    return await sendGeneralEmail(student.email, subject, message);
};

const sendFeeInvoiceEmail = async (student, invoice) => {
    const subject = `Fee Invoice Generated - ${invoice.month}`;
    const message = `Dear Parent,\n\nThe fee invoice for ${invoice.month} has been generated for ${student.name}.\n\nAmount Due: $${invoice.amount}\nDue Date: ${invoice.dueDate}\n\nPlease login to the portal to view and pay.\n\nBest Regards,\nAccounts Department`;
    return await sendGeneralEmail(student.email, subject, message);
};

const sendNotificationEmail = async (to, title, body) => {
    return await sendGeneralEmail(to, title, body);
};

// --- API ROUTES ---

// 1. General Email API
app.post('/api/email/general', async (req, res) => {
    const { to, subject, body } = req.body;
    const result = await sendGeneralEmail(to, subject, body);
    if (result.success) res.json(result);
    else res.status(500).json(result);
});

// 2. Test Routes for User
app.get('/api/test/email', async (req, res) => {
    // Send to the sender email itself for testing
    const result = await sendGeneralEmail(process.env.SENDER_EMAIL, "Test Email System", "If you are reading this, the Brevo SMTP integration is working correctly!");
    res.json(result);
});

app.post('/api/test/custom-email', async (req, res) => {
    const { email } = req.body;
    const result = await sendGeneralEmail(email, "Test Email System", "If you are reading this, the Brevo SMTP integration is working correctly!");
    res.json(result);
});

// 3. Webhook for Events (Simulated integration point)
app.post('/api/events/student-registered', async (req, res) => {
    const { student } = req.body;
    // Save to DB here...
    // Trigger Email
    await sendStudentRegistrationEmail(student);
    res.json({ status: 'success', message: 'Student registered and email sent' });
});

// 4. Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 SMTP Configured for: ${process.env.SMTP_HOST}`);
});
