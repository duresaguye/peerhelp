"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import CommentsSection from "@/components/comments-section"
import Navbar from "@/components/navbar"
import VoteButtons from "@/components/vote-buttons"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"

interface Author {
  id: string
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
  answers: number
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          sort,
        })

        if (subject) params.append("subject", subject)
        if (debouncedSearch) params.append("search", debouncedSearch)

        const response = await fetch(`/api/questions?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch questions")
        }

        const data = await response.json()

        if (page === 1) {
          setQuestions(data.questions)
        } else {
          setQuestions((prev) => [...prev, ...data.questions])
        }

        setHasMore(data.currentPage < data.totalPages)
      } catch (err) {
        setError("Failed to load questions. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [page, sort, subject, debouncedSearch])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const handleSortChange = (newSort: string) => {
    if (sort !== newSort) {
      setSort(newSort)
      setPage(1)
    }
  }

  const handleSubjectChange = (newSubject: string) => {
    if (subject !== newSubject) {
      setSubject(newSubject)
      setPage(1)
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
  

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant={sort === "latest" ? "outline" : "ghost"}
              size="sm"
              className="text-sm"
              onClick={() => handleSortChange("latest")}
            >
              Latest
            </Button>
            <Button
              variant={sort === "top" ? "outline" : "ghost"}
              size="sm"
              className="text-sm"
              onClick={() => handleSortChange("top")}
            >
              Top
            </Button>
            <Button
              variant={sort === "unanswered" ? "outline" : "ghost"}
              size="sm"
              className="text-sm"
              onClick={() => handleSortChange("unanswered")}
            >
              Unanswered
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={subject ? "outline" : "ghost"}
              size="sm"
              className="text-sm"
              onClick={() => handleSubjectChange(subject ? "" : "all")}
            >
              {subject || "All Subjects"}
            </Button>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No questions found.</p>
            <Link href="/ask">
              <Button className="mt-4">Ask a Question</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => (
              <Card key={question._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="flex flex-col items-center justify-start gap-2 border-r p-4 text-center">
                    <VoteButtons
  initialVotes={question.voteCount}
  itemId={question._id}
  itemType="question"
  size="sm"
  initialUserVote={
    session?.user?.id
      ? (question.upvotes || []).includes(session.user.id)
        ? "up"
        : (question.downvotes || []).includes(session.user.id)
          ? "down"
          : null
      : null
  }
/>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{question.answers}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="mb-2">
                        <Link href={`/questions/${question._id}`} className="text-lg font-medium hover:underline">
                          {question.title}
                        </Link>
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {question.content.replace(/\n/g, " ")}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                      {
  (question.tags || []).map((tag) => (
    <Badge
      key={tag}
      variant="secondary"
      className="px-2 py-0 text-xs cursor-pointer"
      onClick={() => handleSubjectChange(tag)}
    >
      {tag}
    </Badge>
  ))
}
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 p-2">
                  <div className="flex w-full flex-col">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs">
                        Asked by{" "}
                        {question.author ? (
  <Link href={`/users/${question.author.id}`} className="font-medium hover:underline">
    {question.author.name}
  </Link>
) : (
  <span>Unknown Author</span>
)}
                      </span>
                      <span className="text-xs">{question.views} views</span>
                    </div>

                    <div className="w-full mt-2 pt-2 border-t">
                      <CommentsSection questionId={question._id} />
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
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
