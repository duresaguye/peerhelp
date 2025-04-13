"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export function useAuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const requireAuth = (action: string) => {
    if (status === "loading") return false

    if (!session) {
      toast({
        title: "Authentication required",
        description: `You need to be logged in to ${action}`,
        variant: "destructive",
      })
      router.push("/login")
      return false
    }

    return true
  }

  return {
    session,
    status,
    requireAuth,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  }
}
