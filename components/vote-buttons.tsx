"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { toast } from "@/hooks/use-toast"

interface VoteButtonsProps {
  initialVotes: number
  itemId: string
  itemType: "question" | "answer"
  onVote?: (newVoteCount: number) => void
  vertical?: boolean
  size?: "sm" | "md" | "lg"
  initialUserVote?: "up" | "down" | null
}

export default function VoteButtons({
  initialVotes = 0,
  itemId,
  itemType,
  onVote,
  vertical = true,
  size = "md",
  initialUserVote = null,
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)
  const { requireAuth } = useAuthRedirect()

  const handleVote = async (direction: "up" | "down") => {
    if (isVoting) return

    if (!requireAuth("vote")) return

    setIsVoting(true)

    try {
      const endpoint = itemType === "question" ? `/api/questions/${itemId}/vote` : `/api/answers/${itemId}/vote`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType: direction }),
      })

      if (!response.ok) {
        throw new Error("Failed to vote")
      }

      const data = await response.json()

      setVotes(data.voteCount)

      // Update user vote state based on server response
      if (userVote === direction) {
        setUserVote(null)
      } else {
        setUserVote(direction)
      }

      if (onVote) onVote(data.voteCount)
    } catch (error) {
      toast.error("Failed to register your vote. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const sizeClasses = {
    sm: {
      button: "h-6 w-6",
      icon: "h-3 w-3",
      text: "text-xs",
    },
    md: {
      button: "h-8 w-8",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    lg: {
      button: "h-10 w-10",
      icon: "h-5 w-5",
      text: "text-base",
    },
  }

  return (
    <div className={cn("flex items-center gap-1", vertical ? "flex-col" : "flex-row")}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size].button,
          "rounded-full transition-colors",
          userVote === "up"
            ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
            : "text-muted-foreground hover:text-foreground",
          isVoting && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => handleVote("up")}
        disabled={isVoting}
      >
        <ArrowUp className={sizeClasses[size].icon} />
        <span className="sr-only">Upvote</span>
      </Button>

      <span
        className={cn(
          "font-medium",
          sizeClasses[size].text,
          votes > 0 ? "text-green-600 dark:text-green-400" : votes < 0 ? "text-red-600 dark:text-red-400" : "",
        )}
      >
        {votes}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          sizeClasses[size].button,
          "rounded-full transition-colors",
          userVote === "down"
            ? "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
            : "text-muted-foreground hover:text-foreground",
          isVoting && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => handleVote("down")}
        disabled={isVoting}
      >
        <ArrowDown className={sizeClasses[size].icon} />
        <span className="sr-only">Downvote</span>
      </Button>
    </div>
  )
}
