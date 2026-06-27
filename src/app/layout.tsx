import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "1000+ Premium HD Reels Bundle | Instant Download",
  description: "Get instant access to 1000+ premium, high-converting HD reels to grow your social media presence. Kickstart your viral growth today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body style={{ fontFamily: "var(--font-sans)" }}>
        <div className="glow-bg">
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
        </div>
        {children}
        
        {/* Floating WhatsApp Button */}
        <a 
          href="https://wa.me/917348710971?text=Hello!%20I%20have%20a%20question%20about%20the%20digital%20product%20bundle." 
          target="_blank" 
          rel="noopener noreferrer" 
          className="whatsapp-float"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.456 3.48 1.332 5.004L2 22l5.124-1.32c1.488.816 3.168 1.248 4.884 1.248 5.532 0 10.012-4.48 10.012-10.012C22.02 6.48 17.54 2 12.012 2zm6.276 14.376c-.252.708-1.488 1.38-2.028 1.476-.48.084-.96.12-3.072-.756-2.7-1.116-4.428-3.864-4.56-4.044-.132-.18-1.092-1.452-1.092-2.772 0-1.32.696-1.968.948-2.232.252-.264.672-.384.888-.384.216 0 .42.012.6.024.192.012.444-.072.7.54.264.624.888 2.16.96 2.304.072.144.12.312.024.504-.096.192-.204.312-.348.48-.144.168-.3.348-.432.48-.144.144-.3.3-.132.588.168.288.756 1.248 1.62 2.016.936.816 1.728 1.068 2.016 1.188.288.12.456.096.624-.096.168-.192.732-.852.924-1.14.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.18 1.404z"/>
          </svg>
          Need Help? Chat on WhatsApp
        </a>
      </body>
    </html>
  );
}
