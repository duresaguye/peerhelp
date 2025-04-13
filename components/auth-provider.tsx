"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

export interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
