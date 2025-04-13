import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Question from "@/models/Question"
import Answer from "@/models/Answer"
import Comment from "@/models/Comment"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const userId = params.id

    // Find user
    const user = await User.findById(userId).lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user stats
    const questionsCount = await Question.countDocuments({ author: userId })
    const answersCount = await Answer.countDocuments({ author: userId })
    const bestAnswersCount = await Answer.countDocuments({ author: userId, accepted: true })

    // Get recent questions
    const questions = await Question.find({ author: userId }).sort({ createdAt: -1 }).limit(3).lean()

    // Get recent answers
    const answers = await Answer.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("question", "title")
      .lean()

    // Get recent comments
    const comments = await Comment.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate([
        { path: "question", select: "title" },
        { path: "answer", select: "content", populate: { path: "question", select: "title" } },
      ])
      .lean()

    // Format activity
    const recentActivity = [
      ...questions.map((q) => ({
        _id: q._id.toString(),
        type: "question" as const,
        title: q.title,
        date: formatDate(q.createdAt),
        link: `/questions/${q._id}`,
      })),
      ...answers.map((a) => ({
        _id: a._id.toString(),
        type: "answer" as const,
        title: `Answer to: ${a.question?.title || "Question"}`,
        date: formatDate(a.createdAt),
        link: `/questions/${a.question?._id}`,
      })),
      ...comments.map((c) => {
        let title = "Comment"
        let link = "/"

        if (c.question) {
          title = `Comment on: ${c.question.title}`
          link = `/questions/${c.question._id}`
        } else if (c.answer) {
          title = `Comment on: ${c.answer.question?.title || "Answer"}`
          link = `/questions/${c.answer.question?._id}`
        }

        return {
          _id: c._id.toString(),
          type: "comment" as const,
          title,
          date: formatDate(c.createdAt),
          link,
        }
      }),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Generate badges
    const badges = []

    if (questionsCount >= 5) {
      badges.push({
        name: "Curious",
        description: "Asked 5 or more questions",
      })
    }

    if (answersCount >= 10) {
      badges.push({
        name: "Helper",
        description: "Provided 10 or more answers",
      })
    }

    if (bestAnswersCount >= 3) {
      badges.push({
        name: "Expert",
        description: "Had 3 or more answers accepted as best",
      })
    }

    // Format response
    const userProfile = {
      _id: user._id.toString(),
      name: user.name,
      image: user.image || "/placeholder.svg?height=100&width=100",
      location: user.location || "",
      joinedAt: user.createdAt || user.joinedAt,
      bio: user.bio || "",
      stats: {
        questions: questionsCount,
        answers: answersCount,
        bestAnswers: bestAnswersCount,
      },
      badges,
      recentActivity,
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

// Helper function to format dates
function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  } else {
    return "Just now"
  }
}
