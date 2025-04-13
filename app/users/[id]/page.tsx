"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"

interface UserActivity {
  _id: string
  type: "question" | "answer" | "comment"
  title: string
  date: string
  link: string
}

interface UserBadge {
  name: string
  description: string
}

interface UserProfile {
  _id: string
  name: string
  image: string
  location: string
  joinedAt: string
  bio: string
  stats: {
    questions: number
    answers: number
    bestAnswers: number
  }
  badges: UserBadge[]
  recentActivity: UserActivity[]
}

export default function UserProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/users/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found")
          }
          throw new Error("Failed to fetch user profile")
        }

        const userData = await response.json()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast.error(err instanceof Error ? err.message : "Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [params.id])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 flex justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2">Loading user profile...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || "The requested user profile could not be found."}</p>
            <button onClick={() => router.back()} className="text-primary hover:underline">
              Go Back
            </button>
          </div>
        </div>
      </>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.location || "No location provided"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Member since {formatDate(user.joinedAt)}</p>
                <p className="mt-4 text-sm">{user.bio || "No bio provided"}</p>

                <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{user.stats.questions}</span>
                    <span className="text-xs text-muted-foreground">Questions</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{user.stats.answers}</span>
                    <span className="text-xs text-muted-foreground">Answers</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{user.stats.bestAnswers}</span>
                    <span className="text-xs text-muted-foreground">Best Answers</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="activity">
              <TabsList className="mb-4">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user.recentActivity.length > 0 ? (
                        user.recentActivity.map((activity) => (
                          <div key={activity._id} className="border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {activity.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{activity.date}</span>
                            </div>
                            <a href={activity.link} className="mt-1 block text-sm font-medium hover:underline">
                              {activity.title}
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="badges" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Badges Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {user.badges.length > 0 ? (
                        user.badges.map((badge, index) => (
                          <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Badge>{badge.name}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No badges earned yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  )
}
