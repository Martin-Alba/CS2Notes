import type { Metadata } from "next";
import { Noto_Sans, Oswald } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CS2 Notes",
    template: "%s - CS2 Notes",
  },
  description: "Track every round, improve your game.",
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${notoSans.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 55% at 15% 20%, rgba(255, 136, 0, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 85% 75%, rgba(68, 136, 255, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 50% 45% at 50% 60%, rgba(255, 68, 68, 0.05) 0%, transparent 50%)
              `,
            }}
          />
          <div
            className="absolute -left-32 -top-32 h-[500px] w-[500px] animate-[float-orb-slow_8s_ease-in-out_infinite] rounded-full opacity-50"
            style={{
              background:
                "radial-gradient(circle, rgba(255,136,0,0.2) 0%, rgba(255,136,0,0.08) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute -bottom-40 -right-32 h-[600px] w-[600px] animate-[float-orb_10s_ease-in-out_infinite] rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(68,136,255,0.18) 0%, rgba(68,136,255,0.06) 35%, transparent 65%)",
              filter: "blur(70px)",
            }}
          />
          <div
            className="absolute left-1/3 top-2/3 h-[400px] w-[400px] animate-[float-orb-slow_12s_ease-in-out_infinite] rounded-full opacity-25"
            style={{
              background:
                "radial-gradient(circle, rgba(136,68,255,0.15) 0%, rgba(136,68,255,0.05) 40%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
