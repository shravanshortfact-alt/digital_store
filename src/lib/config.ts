export const config = {
  productName: process.env.NEXT_PUBLIC_PRODUCT_NAME || "Premium 1000+ Reels Bundle",
  productPrice: parseFloat(process.env.NEXT_PUBLIC_PRODUCT_PRICE || "299"),
  upiId: process.env.NEXT_PUBLIC_UPI_ID || "ayushahir01@fam",
  // Generates standard UPI payment URL
  get upiPayUrl() {
    return `upi://pay?pa=${this.upiId}&pn=${encodeURIComponent(this.productName)}&am=${this.productPrice}&cu=INR`;
  },
  adminPassword: process.env.ADMIN_PASSWORD || "AdminPass123!",
  downloadLink: process.env.DOWNLOAD_LINK || "https://drive.google.com/drive/folders/your-reels-bundle-google-drive-link",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Reels Store <noreply@resend.dev>",
  smmApiKey: process.env.SMM_API_KEY || "",
  smmApiUrl: process.env.SMM_API_URL || "https://favoritesmm.com/api/v2",
};
