import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "ChaiCode Persona | Chat Demo",
  description: "AI-powered persona chat demo featuring Hitesh Choudhary and Piyush Garg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${poppins.variable} antialiased min-h-screen bg-black text-white selection:bg-amber-500/30`}>
        <div className="fixed inset-0 z-[-1] bg-black">
          {/* Subtle Hexagonal or Gradient Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black"></div>
          <div className="absolute inset-0 bg-[url('/pg%20black_files/background-S4EJ6pKP.svg')] opacity-10 bg-cover bg-center"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
