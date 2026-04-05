import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "givenest — Every Home Funds a Cause",
  description:
    "Buy or sell with givenest and we donate to a charity of your choice at closing — at no extra cost. Arizona's giving brokerage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/charity/login" signInFallbackRedirectUrl="/charity/dashboard">
      <html lang="en">
        <body className={`${lora.variable} ${dmSans.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
