import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: "THE SYSTEM",
  description: "Crea hábitos y supera tus niveles.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The System",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userLevel = 1;
  let userXp = 0;

  if (user) {
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (dbUser) {
      userLevel = dbUser.currentLevel;
      userXp = dbUser.totalXp;
    }
  }

  return (
    <html lang="es" className={`${inter.variable} ${orbitron.variable}`}>
      <body>
        <Sidebar userLevel={userLevel} userXp={userXp} />
        <div className="layout-content">
          {children}
        </div>
      </body>
    </html>
  );
}
