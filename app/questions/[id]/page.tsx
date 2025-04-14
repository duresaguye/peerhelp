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
import { Check, Clock, Loader2, Reply, MoreHorizontal } from "lucide-react"
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

interface Reply {
  _id: string
  content: string
  author: Author
  createdAt: string
  upvotes: string[]
  downvotes: string[]
  voteCount: number
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
  replies: Reply[]
}

function ReplyComponent({ 
  reply,
  session,
  answerId
}: { 
  reply: Reply
  session: any
  answerId: string
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/answers/${answerId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parentReplyId: reply._id
        }),
      })

      if (!response.ok) throw new Error("Failed to submit reply")

      const newReply = await response.json()
     
      toast.success("Reply posted successfully")
      setReplyContent("")
      setIsReplying(false)
    } catch (error) {
      toast.error("Failed to submit reply. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex gap-3 mt-3 pl-10">
      <Avatar className="h-6 w-6">
        <AvatarImage src={reply.author.image} />
        <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{reply.author.name}</span>
          <span className="text-muted-foreground text-sm">
            {formatDate(reply.createdAt)}
          </span>
        </div>
        <div className="text-sm">{reply.content}</div>
        
        <div className="flex items-center gap-4 mt-1">
          <VoteButtons
            initialVotes={reply.voteCount}
            itemId={reply._id}
            itemType="reply"
            size="xs"
            initialUserVote={
              session?.user?.id
                ? reply.upvotes.includes(session.user.id)
                  ? "up"
                  : reply.downvotes.includes(session.user.id)
                    ? "down"
                    : null
                : null
            }
          />
          
          {session && (
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-2 pl-4">
            <form onSubmit={handleSubmitReply}>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[60px] text-sm"
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsReplying(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

function AnswerComponent({ 
  answer, 
  session, 
  questionAuthorId,
  onReplyAdded
}: { 
  answer: Answer, 
  session: any, 
  questionAuthorId: string,
  onReplyAdded: (answerId: string, newReply: Reply) => void
}) {
  const [replyContent, setReplyContent] = useState("")
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [replies, setReplies] = useState(answer.replies || [])
  const [loadingReplies, setLoadingReplies] = useState(false)

  // Fetch replies when component mounts
  useEffect(() => {
    const fetchRepliesForAnswer = async () => {
      setLoadingReplies(true)
      try {
        const response = await fetch(`/api/answers/${answer._id}/replies`)
        if (!response.ok) throw new Error("Failed to fetch replies")
        const data = await response.json()
        setReplies(data)
      } catch (error) {
        console.error("Error fetching replies:", error)
        toast.error("Failed to load replies")
      } finally {
        setLoadingReplies(false)
      }
    }

    fetchRepliesForAnswer()
  }, [answer._id])

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setIsSubmittingReply(true)

    try {
      const response = await fetch(`/api/answers/${answer._id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit reply")

      const newReply = await response.json()
      setReplies([...replies, newReply])
      onReplyAdded(answer._id, newReply)
      setReplyContent("")
      setShowReplyForm(false)
      toast.success("Reply posted successfully")
    } catch (error) {
      toast.error("Failed to submit reply. Please try again.")
    } finally {
      setIsSubmittingReply(false)
    }
  }

 

  function handleAcceptAnswer(_id: string): void {
    throw new Error("Function not implemented.")
  }

  function cn(arg0: string, arg1: string | boolean): string | undefined {
    throw new Error("Function not implemented.")
  }

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex gap-3">
        {/* Voting Section */}
        <div className="flex flex-col items-center gap-1">
          <VoteButtons
            initialVotes={answer.voteCount}
            itemId={answer._id}
            itemType="answer"
            size="sm"
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
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Author & Metadata */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={answer.author.image} />
              <AvatarFallback>{answer.author.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{answer.author.name}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDate(answer.createdAt)}
            </span>
            
            {/* Accept answer button (only shown to question author) */}
            {questionAuthorId === session?.user?.id && (
              <button
                onClick={() => handleAcceptAnswer(answer._id)}
                className="ml-auto text-sm flex items-center gap-1 text-muted-foreground hover:text-green-600"
              >
                {answer.accepted ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Accepted</span>
                  </>
                ) : (
                  "Accept Answer"
                )}
              </button>
            )}
          </div>

          {/* Answer Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {answer.content}
          </div>

          {/* Action buttons */}
          <div className="mt-2 flex items-center gap-4">
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-3 pl-6">
              <form onSubmit={handleSubmitReply}>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-[80px] text-sm"
                  disabled={isSubmittingReply}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isSubmittingReply || !replyContent.trim()}
                  >
                    {isSubmittingReply ? "Posting..." : "Post Reply"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Replies list */}
        
{loadingReplies ? (
  <div className="mt-3 pl-6 flex justify-center">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
) : replies.length > 0 ? (
  <div className="mt-3 border-l-2 border-muted pl-4">
    {replies.map((reply) => (
      <ReplyComponent 
        key={reply._id} 
        reply={reply}
        session={session}
        answerId={answer._id}
      />
    ))}
  </div>
) : (
  showReplyForm && (
    <div className="mt-3 pl-6 text-sm text-muted-foreground">
      No replies yet. Be the first to reply!
    </div>
  )
)}
        </div>
      </div>
    </div>
  )
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
        const response = await fetch(`/api/questions/${questionId}?withReplies=true`)

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

  const handleReplyAdded = (answerId: string, newReply: Reply) => {
    setAnswers(answers.map(answer => {
      if (answer._id === answerId) {
        return {
          ...answer,
          replies: [...answer.replies, newReply]
        }
      }
      return answer
    }))
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

  function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(" ")
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
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

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-semibold">
              {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Newest
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Most Votes
              </Button>
            </div>
          </div>

          {answers.map((answer) => (
            <AnswerComponent 
              key={answer._id}
              answer={answer}
              session={session}
              questionAuthorId={question.author._id}
              onReplyAdded={handleReplyAdded}
            />
          ))}

          {/* Add Answer Section */}
          <div className="sticky bottom-0 bg-background border-t pt-4">
            <div className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || "/placeholder.svg"} />
                <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <form onSubmit={handleSubmitAnswer}>
                  <Textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder={session ? "Post your answer..." : "Sign in to contribute"}
                    className="min-h-[100px] text-base"
                    disabled={!session || submitting}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    {!session ? (
                      <div className="text-sm text-muted-foreground">
                        <Link href="/login" className="text-primary hover:underline">Sign in</Link> to post
                      </div>
                    ) : (
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={submitting || !newAnswer.trim()}
                      >
                        {submitting ? "Posting..." : "Post Answer"}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}