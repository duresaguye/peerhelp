import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/components/auth-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"

import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PeerHelp - Academic Q&A Platform",
  description: "A collaborative learning platform for students",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <main>{children}</main>
          
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'