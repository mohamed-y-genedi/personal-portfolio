const express = require('express');
const router = express.Router();
const { matchedData } = require('express-validator');
const { db, admin } = require('../config/firebase');
const { validateContact } = require('../middleware/validate');

// const nodemailer = require('nodemailer'); // Optional: Uncomment if using email notifications

const nodemailer = require('nodemailer');

// Simple In-Memory Rate Limiter
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

router.post('/', validateContact, async (req, res) => {
    try {
        const { name, email, message, _honey } = matchedData(req, {
            locations: ['body'],
            includeOptionals: true
        });

        // 1. Honeypot Check (Silent Success)
        if (_honey) {
            console.log(`Spam detected (Honeypot): ${req.ip}`);
            return res.status(200).json({ success: true, message: 'Message sent successfully!' });
        }

        // 2. Rate Limiting
        const ip = req.ip;
        const now = Date.now();
        
        if (rateLimit.has(ip)) {
            const data = rateLimit.get(ip);
            if (now - data.startTime > RATE_LIMIT_WINDOW) {
                // Reset window
                rateLimit.set(ip, { count: 1, startTime: now });
            } else {
                if (data.count >= RATE_LIMIT_MAX) {
                    return res.status(429).json({ 
                        success: false, 
                        message: "You’ve sent enough messages for now. Please try again later.",
                        errorType: 'RATE_LIMIT'
                    });
                }
                data.count++;
            }
        } else {
            rateLimit.set(ip, { count: 1, startTime: now });
        }

        const docData = {
            name,
            email,
            message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ip: req.ip
        };

        // 3. Save to Firestore (Primary Action)
        await db.collection('messages').add(docData);

        // 4. Send Email Notification (Secondary Action - Fail Safe)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // Or use host/port from env if preferred
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: process.env.SMTP_USER, // Send to self
                    subject: `New Portfolio Message from ${name}`,
                    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
                    replyTo: email
                };

                await transporter.sendMail(mailOptions);
                console.log('Email notification sent.');
            } catch (emailError) {
                console.error('Email sending failed (Non-blocking):', emailError.message);
                // Do not throw; continue to success response
            }
        }

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        
        if (error.code === 'PERMISSION_DENIED') {
             return res.status(503).json({ success: false, message: 'Database permission denied' });
        }
        
        if (!db) {
             return res.status(503).json({ success: false, message: 'Database service unavailable' });
        }

        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
});

module.exports = router;
