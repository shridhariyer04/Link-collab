// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
   to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: EmailOptions) {
  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Invalid email address");
    }

    console.log('Sending email to:', to);
    console.log('Subject:', subject);

    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) {
  throw new Error("RESEND_FROM_EMAIL environment variable is not set");
}

    const result = await resend.emails.send({
     from,
      to,
      subject,
      react,
    });

    console.log('Email sent successfully:', from);
    return result;

  } catch (error) {
    console.error("Email send error:", error);
    
    // Log specific error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Test email function for debugging
export async function testEmail() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return false;
    }

    const result = await resend.emails.send({
      from: "Link Organizer <onboarding@resend.dev>",
      to: "test@example.com", // Replace with your email for testing
      subject: "Test Email",
      html: "<h1>Test Email</h1><p>This is a test email to verify Resend configuration.</p>",
    });

    console.log("Test email result:", result);
    return true;
  } catch (error) {
    console.error("Test email failed:", error);
    return false;
  }
}