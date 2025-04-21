"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import VoteButtons from "@/components/vote-buttons"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
  answerCount: number
}

const subjects = [
  { title: "Mathematics", value: "mathematics" },
  { title: "Computer Science", value: "computer-science" },
  { title: "Physics", value: "physics" },
  { title: "Chemistry", value: "chemistry" },
  { title: "Biology", value: "biology" },
  { title: "Literature", value: "literature" },
  { title: "History", value: "history" },
  { title: "Engineering", value: "engineering" },
]

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState("latest")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [subject, setSubject] = useState(searchParams.get("subject") || "")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { data: session } = useSession()
  const [forceRefresh, setForceRefresh] = useState(0);

  
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
          includeAnswers: "true",
        })

        if (subject) params.append("subject", subject)
        if (debouncedSearch) params.append("search", debouncedSearch)
          const cacheBuster = new Date().getTime();

        const response = await fetch(`/api/questions?${params.toString()}&cb=${cacheBuster}`, {
          cache: "no-store",
          next: { tags: ["questions"] }
        })

        if (!response.ok) throw new Error("Failed to fetch questions")

        const data = await response.json()
        setQuestions(prev => 
          page === 1 ? data.questions : [...prev, ...data.questions]
        )
        setHasMore(data.currentPage < data.totalPages)
      } catch (err) {
        setError("Failed to load questions. Please try again.")
        toast.error("Failed to load questions")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [page, sort, subject, debouncedSearch, forceRefresh])

  useEffect(() => {
    const currentSubject = searchParams.get("subject") || ""
    const currentSearch = searchParams.get("q") || ""
    const currentSort = searchParams.get("sort") || "latest"

    if (currentSubject !== subject) setSubject(currentSubject)
    if (currentSearch !== searchQuery) setSearchQuery(currentSearch)
    if (currentSort !== sort) setSort(currentSort)
    setPage(1)
  }, [searchParams])

  const handleLoadMore = () => !loading && hasMore && setPage(prev => prev + 1)

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    setPage(1)
  }

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject)
    setSearchQuery("")
    setSort("latest")
    setPage(1)

    const params = new URLSearchParams()
    if (newSubject) params.set("subject", newSubject)
    router.replace(`/?${params.toString()}`, { scroll: false })
    setDebouncedSearch("")
  }

  const clearFilters = () => {
    setSubject("")
    setSearchQuery("")
    setSort("latest")
    setPage(1)
    router.push("/", { scroll: false })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    return diffDays > 0
      ? `${diffDays}d`
      : diffHours > 0
      ? `${diffHours}h`
      : diffMins > 0
      ? `${diffMins}m`
      : "Just now"
  }

  const handleVoteUpdate = (questionId: string, upvoteCount: number, downvoteCount: number, userVote: "up" | "down" | null) => {
    setQuestions(prev => prev.map(question => {
      if (question._id === questionId) {
        return {
          ...question,
          upvotes: userVote === "up" 
            ? [...question.upvotes.filter(id => id !== session?.user?.id), session?.user?.id || ""]
            : question.upvotes.filter(id => id !== session?.user?.id),
          downvotes: userVote === "down" 
            ? [...question.downvotes.filter(id => id !== session?.user?.id), session?.user?.id || ""]
            : question.downvotes.filter(id => id !== session?.user?.id)
        }
      }
      return question
    }))
    setForceRefresh(prev => prev + 1)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button 
              variant={sort === "latest" ? "outline" : "ghost"} 
              size="sm" 
              onClick={() => handleSortChange("latest")}
            >
              Latest
            </Button>
            <Button 
              variant={sort === "top" ? "outline" : "ghost"} 
              size="sm" 
              onClick={() => handleSortChange("top")}
            >
              Top
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-8 h-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={subject ? "outline" : "ghost"} size="sm">
                  {subject ? subjects.find(s => s.value === subject)?.title || subject : "All Subjects"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleSubjectChange("")}>
                  All Subjects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subjects.map(subjectItem => (
                  <DropdownMenuItem 
                    key={subjectItem.value}
                    onClick={() => handleSubjectChange(subjectItem.value)}
                  >
                    {subjectItem.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(subject || searchQuery || sort !== "latest") && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">Filters:</p>
            {subject && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer" 
                onClick={() => setSubject("")}
              >
                Subject: {subjects.find(s => s.value === subject)?.title || subject}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                Search: {searchQuery}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            {sort !== "latest" && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setSort("latest")}
              >
                Sort: {sort.charAt(0).toUpperCase() + sort.slice(1)}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}

        {loading && page === 1 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No questions found</p>
            <Link href="/ask">
              <Button className="mt-4">Ask Question</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map(question => (
              <Card key={question._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="flex flex-col items-center gap-2 border-r p-4">
                      <VoteButtons
                        itemId={question._id}
                        itemType="question"
                        size="sm"
                        initialUpvotes={question.upvotes.length}
                        initialDownvotes={question.downvotes.length}
                        initialUserVote={session?.user?.id
                          ? question.upvotes.includes(session.user.id)
                            ? "up"
                            : question.downvotes.includes(session.user.id)
                              ? "down"
                              : null
                          : null}
                        onVoteSuccess={(id, upvoteCount, downvoteCount, userVote) => {
                          handleVoteUpdate(id, upvoteCount, downvoteCount, userVote)
                          router.refresh()
                        } } initialVotes={0}                      />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{question.answerCount}</span>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <Link 
                        href={`/questions/${question._id}`} 
                        className="text-lg font-medium hover:underline"
                      >
                        {question.title}
                      </Link>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {question.content.replace(/\n/g, " ")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        {question.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-accent"
                            onClick={() => handleSubjectChange(tag)}
                          >
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
                  <div className="w-full flex justify-between items-center text-xs">
                    <div>
                      Asked by{" "}
                      <Link 
                        href={`/users/${question.author._id}`} 
                        className="font-medium hover:underline"
                      >
                        {question.author.name}
                      </Link>
                    </div>
                    <span>{question.views} views</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoadMore} 
              disabled={loading}
            >
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