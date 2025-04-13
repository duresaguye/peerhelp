"use client"

import { useState } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { toast } from "@/hooks/use-toast"

type VoteDirection = "up" | "down" | null
type VoteItemType = "question" | "answer"
type SizeVariant = "sm" | "md" | "lg"

interface VoteButtonsProps {
  initialVotes: number
  itemId: string
  itemType: VoteItemType
  onVote?: (newVoteCount: number) => void
  vertical?: boolean
  size?: SizeVariant
  initialUserVote?: VoteDirection
}

const SIZE_CLASSES: Record<SizeVariant, { button: string; icon: string; text: string }> = {
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
  const [userVote, setUserVote] = useState<VoteDirection>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)
  const { requireAuth } = useAuthRedirect()

  const handleVote = async (direction: VoteDirection) => {
    if (isVoting || !direction) return
    if (!requireAuth("vote")) return

    setIsVoting(true)

    try {
      const endpoint = `/api/${itemType}s/${itemId}/vote`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: direction }),
      })

      if (!response.ok) throw new Error("Voting failed")

      const data = await response.json()
      
      setVotes(data.voteCount)
      setUserVote(current => current === direction ? null : direction)
      onVote?.(data.voteCount)

    } catch (error) {
      toast.error("Failed to register vote. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const currentSize = SIZE_CLASSES[size] || SIZE_CLASSES.md
  const isUpActive = userVote === "up"
  const isDownActive = userVote === "down"

  return (
    <div className={cn("flex items-center gap-1", vertical ? "flex-col" : "flex-row")}>
      <VoteButton
        direction="up"
        size={currentSize}
        isActive={isUpActive}
        disabled={isVoting}
        onClick={() => handleVote("up")}
      />
      
      <span className={cn(
        "font-medium select-none",
        currentSize.text,
        votes > 0 ? "text-green-600 dark:text-green-400" : 
        votes < 0 ? "text-red-600 dark:text-red-400" : ""
      )}>
        {votes}
      </span>

      <VoteButton
        direction="down"
        size={currentSize}
        isActive={isDownActive}
        disabled={isVoting}
        onClick={() => handleVote("down")}
      />
    </div>
  )
}

interface VoteButtonProps extends ButtonProps {
  direction: "up" | "down"
  size: { button: string; icon: string }
  isActive: boolean
}

const VoteButton = ({ 
  direction, 
  size, 
  isActive,
  ...props 
}: VoteButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className={cn(
      size.button,
      "rounded-full transition-colors",
      isActive ? direction === "up" 
        ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
        : "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
      : "text-muted-foreground hover:text-foreground",
      props.disabled && "opacity-50 cursor-not-allowed"
    )}
    {...props}
  >
    {direction === "up" ? (
      <ArrowUp className={size.icon} />
    ) : (
      <ArrowDown className={size.icon} />
    )}
    <span className="sr-only">{`${direction}vote`}</span>
  </Button>
)