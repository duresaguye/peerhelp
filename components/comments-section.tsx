"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface Answer {
  id: string
  author: {
    id: string
    name: string
    image: string
  }
  content: string
  createdAt: string
  upvotes: string[]
  downvotes: string[]
  accepted: boolean
}

interface AnswersSectionProps {
  questionId: string
}

export default function AnswersSection({ questionId }: AnswersSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newAnswer, setNewAnswer] = useState("")
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  const { requireAuth } = useAuthRedirect()
  const { data: session } = useSession()

  useEffect(() => {
    if (isOpen) {
      fetchAnswers()
    }
  }, [isOpen])

  const fetchAnswers = async () => {
    setLoadingAnswers(true)
    try {
      const response = await fetch(`/api/answers/${questionId}`)
      if (!response.ok) throw new Error("Failed to fetch answers")
      
      const data = await response.json()
      setAnswers(data.answers)
    } catch (error) {
      toast.error("Failed to load answers")
    } finally {
      setLoadingAnswers(false)
    }
  }

  const handleAddAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requireAuth("answer")) return
    if (!newAnswer.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/answers${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newAnswer,
          questionId
        }),
      })

      if (!response.ok) throw new Error("Failed to add answer")

      const newAnswerData = await response.json()
      setAnswers([...answers, newAnswerData])
      setNewAnswer("")
      toast.success("Answer added successfully")

    } catch (error) {
      toast.error("Failed to add your answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (answerId: string, voteType: "up" | "down") => {
    if (!requireAuth("vote")) return

    try {
      const response = await fetch(`/api/answers/${answerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      })

      if (!response.ok) throw new Error("Failed to register vote")

      const updatedAnswer = await response.json()
      setAnswers(answers.map(answer => 
        answer.id === answerId ? updatedAnswer : answer
      ))

    } catch (error) {
      toast.error("Failed to register your vote. Please try again.")
    }
  }

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex justify-between items-center text-xs p-1 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {answers.length} Answers
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
      )}>
        <form onSubmit={handleAddAnswer} className="flex gap-2 mb-3">
          <Input
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer..."
            className="text-xs h-8"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 px-3 text-xs"
            disabled={isSubmitting || !newAnswer.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Answer"}
          </Button>
        </form>

        {loadingAnswers ? (
          <div className="text-center py-2 text-sm text-muted-foreground">
            Loading answers...
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {answers.map((answer) => (
              <div key={answer.id} className="flex gap-2 text-xs">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={answer.author.image} alt={answer.author.name} />
                  <AvatarFallback>
                    {answer.author.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{answer.author.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </span>
                    {answer.accepted && (
                      <Badge className="h-4 px-1 text-xs" variant="success">
                        <Check className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1">{answer.content}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => handleVote(answer.id, "up")}
                      className="flex items-center gap-1 hover:text-green-600"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{answer.upvotes.length}</span>
                    </button>
                    <button
                      onClick={() => handleVote(answer.id, "down")}
                      className="flex items-center gap-1 hover:text-red-600"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      <span>{answer.downvotes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}