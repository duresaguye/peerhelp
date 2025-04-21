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
  answerId,
  parentReplyId
}: { 
  reply: Reply
  session: any
  answerId: string
  parentReplyId?: string
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [nestedReplies, setNestedReplies] = useState<Reply[]>([])
  const [loadingNestedReplies, setLoadingNestedReplies] = useState(false)
  const [showNestedReplies, setShowNestedReplies] = useState(false)

  // Fetch nested replies when component mounts
  useEffect(() => {
    const fetchNestedReplies = async () => {
      setLoadingNestedReplies(true)
      try {
        const response = await fetch(`/api/answers/${answerId}/replies?parentReplyId=${reply._id}`)
        if (!response.ok) throw new Error("Failed to fetch nested replies")
        const data = await response.json()
        setNestedReplies(data)
      } catch (error) {
        console.error("Error fetching nested replies:", error)
        toast.error("Failed to load nested replies")
      } finally {
        setLoadingNestedReplies(false)
      }
    }

    if (showNestedReplies) {
      fetchNestedReplies()
    }
  }, [answerId, reply._id, showNestedReplies])

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
      setNestedReplies([...nestedReplies, newReply])
      setReplyContent("")
      setIsReplying(false)
      toast.success("Reply posted successfully")
    } catch (error) {
      toast.error("Failed to submit reply. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex gap-3 mt-3 pl-10 group">
      <Avatar className="h-8 w-8">
        <AvatarImage src={reply.author.image} />
        <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium hover:underline cursor-pointer">{reply.author.name}</span>
          <span className="text-muted-foreground text-sm">
            {formatDate(reply.createdAt)}
          </span>
          {session?.user?.id === reply.author._id && (
            <div className="relative ml-auto">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-full hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-background border">
                  <div className="py-1">
                    <button key="edit" className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50">
                      Edit
                    </button>
                    <button key="delete" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted/50">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-sm bg-muted/50 rounded-lg p-3">{reply.content}</div>
        
        <div className="flex items-center gap-4 mt-2">
          <VoteButtons
            itemId={reply._id}
            itemType="reply"
            size="sm"
            initialUpvotes={reply.upvotes.length}
            initialDownvotes={reply.downvotes.length}
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
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}

          {nestedReplies.length > 0 && (
            <button
              onClick={() => setShowNestedReplies(!showNestedReplies)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {showNestedReplies ? (
                <span>Hide {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'}</span>
              ) : (
                <span>Show {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'}</span>
              )}
            </button>
          )}
        </div>

        {isReplying && (
          <div className="mt-3 pl-4">
            <form onSubmit={handleSubmitReply} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image} />
                <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-[60px] text-sm bg-background"
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
                    {isSubmitting ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {loadingNestedReplies ? (
          <div className="mt-3 pl-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : showNestedReplies && nestedReplies.length > 0 ? (
          <div className="mt-3 pl-6 space-y-3">
            {nestedReplies.map((nestedReply) => (
              <ReplyComponent 
                key={nestedReply._id} 
                reply={nestedReply}
                session={session}
                answerId={answerId}
                parentReplyId={reply._id}
              />
            ))}
          </div>
        ) : null}
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
  const [replies, setReplies] = useState<Reply[]>(answer.replies || [])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [showReplies, setShowReplies] = useState(replies.length > 0)
  const [upvotes, setUpvotes] = useState(answer.upvotes.length)
  const [downvotes, setDownvotes] = useState(answer.downvotes.length)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    session?.user?.id
      ? answer.upvotes.includes(session.user.id)
        ? "up"
        : answer.downvotes.includes(session.user.id)
        ? "down"
        : null
      : null
  )

  const handleVoteUpdate = (upvoteCount: number, downvoteCount: number, newUserVote: "up" | "down" | null) => {
    setUpvotes(upvoteCount)
    setDownvotes(downvoteCount)
    setUserVote(newUserVote)
  }

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
    <div className="flex gap-3 mt-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={answer.author.image} />
        <AvatarFallback>{answer.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted/50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{answer.author.name}</span>
            <span className="text-muted-foreground text-xs">
              {formatDate(answer.createdAt)}
            </span>
          </div>
          <div className="text-sm whitespace-pre-wrap">{answer.content}</div>
        </div>
        
        <div className="flex items-center gap-4 mt-1 ml-2">
          <VoteButtons
            itemId={answer._id}
            itemType="answer"
            size="sm"
            initialUpvotes={upvotes}
            initialDownvotes={downvotes}
            initialUserVote={userVote}
            onVoteSuccess={(id, upvoteCount, downvoteCount, newUserVote) => {
              handleVoteUpdate(upvoteCount, downvoteCount, newUserVote)
            }}
          />
          
          {session && (
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Reply
            </button>
          )}
          
          {questionAuthorId === session?.user?.id && (
            <button
              onClick={() => handleAcceptAnswer(answer._id)}
              className={cn(
                "text-xs flex items-center gap-1",
                answer.accepted ? "text-green-600" : "text-muted-foreground hover:text-green-600"
              )}
            >
              {answer.accepted ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Accepted</span>
                </>
              ) : (
                "Accept Answer"
              )}
            </button>
          )}

          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {showReplies ? (
                <>
                  <span>Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                </>
              ) : (
                <>
                  <span>Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <form onSubmit={handleSubmitReply} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image} />
                <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-sm bg-background"
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
                    {isSubmittingReply ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Replies list */}
        {loadingReplies ? (
          <div className="mt-3 pl-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : showReplies && replies.length > 0 ? (
          <div className="mt-3 pl-6 space-y-3">
            {replies.map((reply) => {
              if (!reply._id) {
                return null;
              }
              return (
                <ReplyComponent 
                  key={reply._id} 
                  reply={reply}
                  session={session}
                  answerId={answer._id}
                />
              );
            })}
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
                itemId={question._id}
                itemType="question"
                size="lg"
                initialUpvotes={question.upvotes.length}
                initialDownvotes={question.downvotes.length}
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
                      key={`${question._id}-${index}`}
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