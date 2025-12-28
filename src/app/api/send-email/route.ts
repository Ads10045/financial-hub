import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Helper to write logs to file
const logToFile = (message: string) => {
    const logFilePath = path.join(process.cwd(), 'email-error.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Append to file
    try {
        fs.appendFileSync(logFilePath, logMessage);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
};

export async function POST(request: Request) {
    try {
        const { to, code, name } = await request.json();

        console.log("------------------------------------------");
        logToFile("------------------------------------------");
        console.log("EMAIL SENDING INITIATED");
        logToFile(`EMAIL SENDING INITIATED - Recipient: ${to}, Code: ${code}`);

        const hasPassword = !!process.env.EMAIL_PASSWORD;
        logToFile(`EMAIL_PASSWORD set: ${hasPassword}`);

        if (hasPassword) {
            const passStart = process.env.EMAIL_PASSWORD?.substring(0, 2) + "**";
            // logToFile(`Password starts with: ${passStart}`);
        }

        if (!process.env.EMAIL_PASSWORD) {
            const errorMsg = "CRITICAL: Missing EMAIL_PASSWORD environment variable";
            console.error(errorMsg);
            logToFile(errorMsg);
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'abachyouness@gmail.com',
                pass: process.env.EMAIL_PASSWORD
            }
        });

        console.log("Transporter created. Verifying connection...");
        try {
            await transporter.verify();
            console.log("✅ Transporter connection verified successfully.");
            logToFile("✅ Transporter connection verified successfully.");
        } catch (verifyError) {
            const errMsg = `❌ Transporter connection failed: ${(verifyError as Error).message}`;
            const detailedErr = JSON.stringify(verifyError, null, 2);
            console.error("❌ Transporter connection failed:", verifyError);
            logToFile(errMsg);
            logToFile(`Details: ${detailedErr}`);
            return NextResponse.json({ success: false, error: 'SMTP Connection failed: ' + (verifyError as Error).message }, { status: 500 });
        }

        const mailOptions = {
            from: 'Financial Hub <abachyouness@gmail.com>',
            to: to,
            subject: 'Votre code de vérification - Financial Hub',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #00915a; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Financial Hub</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Bonjour ${name || 'client'},</p>
                        <p>Vous avez demandé à vous connecter à votre espace Financial Hub.</p>
                        <p>Voici votre code de vérification :</p>
                        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p>Ce code est valable pendant 10 minutes.</p>
                        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                        &copy; ${new Date().getFullYear()} Financial Hub. Tous droits réservés.
                    </div>
                </div>
            `
        };

        console.log("Sending mail...");
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        logToFile(`✅ Message sent successfully: ${info.messageId}`);

        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error) {
        const fatalErr = `Email send fatal error: ${(error as Error).message}`;
        console.error("Email send fatal error:", error);
        logToFile(fatalErr);
        logToFile(`Fatal Details: ${JSON.stringify(error, null, 2)}`);
        return NextResponse.json({ success: false, error: 'Failed to send email: ' + (error as Error).message }, { status: 500 });
    }
}
