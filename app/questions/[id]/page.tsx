"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Check, Clock, Loader2 } from "lucide-react"
import VoteButtons from "@/components/vote-buttons"
import Navbar from "@/components/navbar"
import ImagePreview from "@/components/image-preview"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { toast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

interface Author {
  _id: string
  name: string
  image: string
}

interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  author: Author
  createdAt: string
  upvotes: string[]
  downvotes: string[]
  voteCount: number
  views: number
  images: string[]
}

interface Answer {
  _id: string
  content: string
  author: Author
  createdAt: string
  upvotes: string[]
  downvotes: string[]
  voteCount: number
  accepted: boolean
}

export default function QuestionPage() {
  const params = useParams()
  const questionId = params.id as string
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [newAnswer, setNewAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { requireAuth } = useAuthRedirect()
  const { data: session } = useSession()
  
  
  if (!questionId) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center py-8 text-red-500">Invalid question ID</div>
          <Link href="/" className="flex justify-center">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </>
    )
  }

  useEffect(() => {
    let isMounted = true

    const fetchQuestionData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/questions/${questionId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch question")
        }

        const data = await response.json()
        if (isMounted) {
          setQuestion(data.question)
          setAnswers(data.answers)
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load question. Please try again.")
          toast.error("Failed to load question. Please try again.")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchQuestionData()
    return () => { isMounted = false }
  }, [questionId])

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requireAuth("submit an answer")) return
    if (!newAnswer.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newAnswer,
          questionId: params.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit answer")
      }

      const answer = await response.json()

      setAnswers([...answers, answer])
      setNewAnswer("")

      toast.success("Your answer has been posted")
    } catch (error) {
      toast.error("Failed to submit your answer. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    if (!question || !session) return

    // Check if user is the question author
    if (question.author._id !== session.user.id) {
      toast.error("Only the question author can accept answers.")
      return
    }

    try {
      const response = await fetch(`/api/answers/${answerId}/accept`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to accept answer")
      }

      // Update answers state
      setAnswers(
        answers.map((answer) => ({
          ...answer,
          accepted: answer._id === answerId,
        })),
      )

      toast.success("Answer marked as accepted.")
    } catch (error) {
      toast.error("Failed to accept answer. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    )
  }

  if (error || !question) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center py-8 text-red-500">{error || "Question not found"}</div>
          <Link href="/" className="flex justify-center">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm hover:underline">
            ← Back to questions
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="flex flex-col items-center gap-2">
              <VoteButtons
                initialVotes={question.voteCount}
                itemId={question._id}
                itemType="question"
                size="lg"
                initialUserVote={
                  session?.user?.id
                    ? question.upvotes.includes(session.user.id)
                      ? "up"
                      : question.downvotes.includes(session.user.id)
                        ? "down"
                        : null
                    : null
                }
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{question.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Asked {formatDate(question.createdAt)}
                </span>
                <span>•</span>
                <span>Viewed {question.views} times</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              {question.content.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {question.images && question.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Attached Images:</h3>
                <div className="flex flex-wrap gap-4">
                  {question.images.map((image, index) => (
                    <ImagePreview
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`Image ${index + 1} for question ${question._id}`}
                      width={200}
                      height={150}
                      className="object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={question.author.image || "/placeholder.svg"} alt={question.author.name} />
                <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{question.author.name}</p>
                <p className="text-xs text-muted-foreground">Asked by</p>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Oldest
            </Button>
            <Button variant="ghost" size="sm">
              Votes
            </Button>
          </div>
        </div>

        {answers.map((answer) => (
          <Card key={answer._id} className="mb-6">
            <CardContent className="p-0">
              <div className="flex">
                <div className="flex flex-col items-center gap-2 border-r p-4">
                  <VoteButtons
                    initialVotes={answer.voteCount}
                    itemId={answer._id}
                    itemType="answer"
                    size="md"
                    initialUserVote={
                      session?.user?.id
                        ? answer.upvotes.includes(session.user.id)
                          ? "up"
                          : answer.downvotes.includes(session.user.id)
                            ? "down"
                            : null
                        : null
                    }
                  />
                  {answer.accepted && (
                    <div className="mt-2 rounded-full bg-green-100 p-1 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-6">
                  <div className="prose max-w-none dark:prose-invert">
                    {answer.content.split("\n\n").map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                     
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">Answered {formatDate(answer.createdAt)}</div>
                      <Avatar>
                        <AvatarImage src={answer.author.image || "/placeholder.svg"} alt={answer.author.name} />
                        <AvatarFallback>{answer.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{answer.author.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Separator className="my-8" />

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Your Answer</h2>
          <form onSubmit={handleSubmitAnswer}>
            <Textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder={session ? "Write your answer here..." : "Please log in to answer this question"}
              className="mb-4 min-h-[200px]"
              disabled={!session || submitting}
            />
            <Button type="submit" disabled={!session || submitting || !newAnswer.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Your Answer"
              )}
            </Button>
            {!session && (
              <p className="mt-2 text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link href="/login?tab=signup" className="text-primary hover:underline">
                  sign up
                </Link>{" "}
                to post an answer.
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
