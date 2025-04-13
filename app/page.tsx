"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import VoteButtons from "@/components/vote-buttons"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"

interface Author {
  _id: string
  name: string
  image: string
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
  answers: Answer[]
  images: string[]
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState("latest")
  const [subject, setSubject] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { data: session } = useSession()
  const { requireAuth } = useAuthRedirect()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          sort,
          includeAnswers: "true"
        })

        if (subject) params.append("subject", subject)
        if (debouncedSearch) params.append("search", debouncedSearch)

        const response = await fetch(`/api/questions?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch questions")

        const data = await response.json()
        setQuestions(prev => page === 1 ? data.questions : [...prev, ...data.questions])
        setHasMore(data.currentPage < data.totalPages)
      } catch (err) {
        setError("Failed to load questions. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [page, sort, subject, debouncedSearch])

  const handleLoadMore = () => !loading && hasMore && setPage(prev => prev + 1)
  const handleSortChange = (newSort: string) => setSort(prev => prev === newSort ? prev : (setPage(1), newSort))
  const handleSubjectChange = (newSubject: string) => setSubject(prev => prev === newSubject ? "" : (setPage(1), newSubject))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    return diffDays > 0 ? `${diffDays}d` : 
           diffHours > 0 ? `${diffHours}h` : 
           diffMins > 0 ? `${diffMins}m` : "Just now"
  }

  const handleAnswerSubmit = async (questionId: string, content: string) => {
    if (!requireAuth("answer")) return false
    
    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, content }),
      })

      if (!response.ok) throw new Error("Failed to post answer")

      const newAnswer = await response.json()
      setQuestions(prev => prev.map(q => 
        q._id === questionId ? { 
          ...q, 
          answers: [...(q.answers || []), newAnswer]
        } : q
      ))
      return true
    } catch (error) {
      toast.error("Failed to post answer")
      return false
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant={sort === "latest" ? "outline" : "ghost"} size="sm" onClick={() => handleSortChange("latest")}>
              Latest
            </Button>
            <Button variant={sort === "top" ? "outline" : "ghost"} size="sm" onClick={() => handleSortChange("top")}>
              Top
            </Button>
            <Button variant={sort === "unanswered" ? "outline" : "ghost"} size="sm" onClick={() => handleSortChange("unanswered")}>
              Unanswered
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant={subject ? "outline" : "ghost"} size="sm" onClick={() => handleSubjectChange(subject ? "" : "all")}>
              {subject || "All Subjects"}
            </Button>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No questions found</p>
            <Link href="/ask"><Button className="mt-4">Ask Question</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map(question => (
              <Card key={question._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="flex flex-col items-center gap-2 border-r p-4">
                      <VoteButtons
                        initialVotes={question.voteCount}
                        itemId={question._id}
                        itemType="question"
                        size="sm"
                        initialUserVote={session?.user?.id ? 
                          question.upvotes.includes(session.user.id) ? "up" :
                          question.downvotes.includes(session.user.id) ? "down" : null 
                        : null}
                      />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{question.answers?.length ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <Link href={`/questions/${question._id}`} className="text-lg font-medium hover:underline">
                        {question.title}
                      </Link>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {question.content.replace(/\n/g, " ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        {question.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => handleSubjectChange(tag)}>
                            {tag}
                          </Badge>
                        ))}
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4 bg-muted/50">
                  <div className="w-full space-y-4">
                    <div className="flex justify-between text-xs">
                      <div>
                        Asked by{' '}
                        <Link href={`/users/${question.author._id}`} className="font-medium hover:underline">
                          {question.author.name}
                        </Link>
                      </div>
                      <span>{question.views} views</span>
                    </div>

                    {/* Answers Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        {(question.answers?.length || 0)} {question.answers?.length === 1 ? "Answer" : "Answers"}
                      </h3>

                      {/* Show only first 3 answers */}
                      {(question.answers || []).slice(0, 3).map(answer => (
                        <div key={answer._id} className="pl-4 border-l-2 border-muted">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-6 w-6 mt-1">
                              <AvatarImage src={answer.author.image} />
                              <AvatarFallback>{answer.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <span className="font-medium">{answer.author.name}</span>
                                <span>·</span>
                                <span>{formatDate(answer.createdAt)}</span>
                                {answer.accepted && (
                                  <Badge variant="default" className="text-xs">
                                    Accepted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm line-clamp-2">{answer.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <VoteButtons
                                  initialVotes={answer.voteCount}
                                  itemId={answer._id}
                                  itemType="answer"
                                  size="xs"
                                  initialUserVote={session?.user?.id ? 
                                    answer.upvotes.includes(session.user.id) ? "up" :
                                    answer.downvotes.includes(session.user.id) ? "down" : null 
                                  : null}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Show "View more answers" if there are more than 3 */}
                      {question.answers?.length > 3 && (
                        <Link href={`/questions/${question._id}`}>
                          <Button variant="link" size="sm" className="text-muted-foreground h-6 pl-4">
                            View all {question.answers.length} answers →
                          </Button>
                        </Link>
                      )}

                      {/* Compact Answer Form */}
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const content = formData.get("content") as string
                        if (content?.trim()) {
                          const success = await handleAnswerSubmit(question._id, content)
                          if (success && e.currentTarget) {
                            e.currentTarget.reset()
                          }
                        }
                      }}>
                        <div className="flex gap-2 mt-2">
                          <Textarea
                            name="content"
                            placeholder={session ? "Quick answer..." : "Log in to answer"}
                            className="min-h-[60px] text-sm"
                            disabled={!session}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-auto"
                            disabled={!session || !session.user}
                          >
                            {session ? "Post" : "Login"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
              {loading && page > 1 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}