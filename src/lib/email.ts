import { Resend } from "resend";
import { config } from "./config";

// Lazy-initialize Resend
const getResend = () => {
  const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function sendFulfillmentEmail(
  toEmail: string,
  paymentName: string,
  productName: string,
  downloadLink: string
) {
  const resendClient = getResend();
  
  if (!resendClient) {
    console.warn("==================================================");
    console.warn("Resend API key is not configured. FULFILLMENT EMAIL LOGGED:");
    console.warn(`To: ${toEmail}`);
    console.warn(`Product: ${productName}`);
    console.warn(`Payer Name: ${paymentName}`);
    console.warn(`Download Link: ${downloadLink}`);
    console.warn("==================================================");
    return { success: true, logged: true };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: config.emailFrom,
      to: toEmail,
      subject: `Your Purchase is Approved! Download: ${productName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.025em;">Payment Approved! 🎉</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: center;">
            Thank you for purchasing the <strong>${productName}</strong>. Your payment has been received successfully.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${downloadLink}" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15); font-size: 16px;" target="_blank">
              Download Your Product
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
          <div style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px 0;"><strong>Transaction Summary:</strong></p>
            <p style="margin: 0 0 4px 0;"><strong>Product:</strong> ${productName}</p>
            <p style="margin: 0 0 4px 0;"><strong>Payer Name:</strong> ${paymentName}</p>
            <p style="margin: 0;"><strong>Status:</strong> Approved</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send fulfillment email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during sending email:", error);
    return { success: false, error };
  }
}

export async function sendInstagramOrderReceivedEmail(
  toEmail: string,
  paymentName: string,
  productName: string,
  instagramLink: string,
  quantity: number,
  price: number
) {
  const resendClient = getResend();
  
  if (!resendClient) {
    console.warn("==================================================");
    console.warn("Resend API key is not configured. INSTAGRAM ORDER RECEIVED LOGGED:");
    console.warn(`To: ${toEmail}`);
    console.warn(`Product: ${productName}`);
    console.warn(`Instagram Link: ${instagramLink}`);
    console.warn(`Quantity: ${quantity}`);
    console.warn(`Price: ₹${price}`);
    console.warn("==================================================");
    return { success: true, logged: true };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: config.emailFrom,
      to: toEmail,
      subject: `Order Received! Processing your: ${productName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🚀</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.025em;">Order Received & Processing!</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: center;">
            Hello <strong>${paymentName}</strong>, we have received your payment details for <strong>${productName}</strong>. Our admin is verifying the transaction.
          </p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Details:</p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Service:</strong> ${productName}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Instagram Target:</strong> <a href="${instagramLink}" style="color: #4f46e5; text-decoration: none; font-weight: 600;" target="_blank">${instagramLink}</a></p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Total Quantity:</strong> ${quantity.toLocaleString()}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Amount Paid:</strong> ₹${price}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>Status:</strong> Pending Manual Approval</p>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
            Once the payment verification is approved by our admin, we will start delivering the service to your profile instantly. This process usually takes 2-6 hours.
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            If you have any questions, feel free to reply directly to this email with your transaction screenshot.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send order received email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during sending order received email:", error);
    return { success: false, error };
  }
}

export async function sendInstagramFulfillmentEmail(
  toEmail: string,
  paymentName: string,
  productName: string,
  instagramLink: string,
  quantity: number
) {
  const resendClient = getResend();
  
  if (!resendClient) {
    console.warn("==================================================");
    console.warn("Resend API key is not configured. INSTAGRAM FULFILLMENT EMAIL LOGGED:");
    console.warn(`To: ${toEmail}`);
    console.warn(`Product: ${productName}`);
    console.warn(`Instagram Link: ${instagramLink}`);
    console.warn(`Quantity: ${quantity}`);
    console.warn("==================================================");
    return { success: true, logged: true };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: config.emailFrom,
      to: toEmail,
      subject: `Order Approved & Delivering! 🎉: ${productName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🎉</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.025em;">Payment Approved & Delivery Started!</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: center;">
            Great news <strong>${paymentName}</strong>! Your payment has been verified and your order is approved.
          </p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #15803d; border-bottom: 1px solid #bbf7d0; padding-bottom: 8px;">Order Details:</p>
            <p style="margin: 6px 0; font-size: 14px; color: #14532d;"><strong>Service:</strong> ${productName}</p>
            <p style="margin: 6px 0; font-size: 14px; color: #14532d;"><strong>Instagram Target:</strong> <a href="${instagramLink}" style="color: #16a34a; text-decoration: none; font-weight: 600;" target="_blank">${instagramLink}</a></p>
            <p style="margin: 6px 0; font-size: 14px; color: #14532d;"><strong>Delivered Quantity:</strong> ${quantity.toLocaleString()} items</p>
            <p style="margin: 6px 0; font-size: 14px; color: #14532d;"><strong>Status:</strong> Delivering / In Progress 🟢</p>
          </div>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">
            Our automated servers are already queued to deliver the service. You should see followers, likes, or views showing up on your target profile/post shortly.
          </p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            Thank you for choosing our services! We look forward to helping you grow.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send fulfillment email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during sending fulfillment email:", error);
    return { success: false, error };
  }
}
