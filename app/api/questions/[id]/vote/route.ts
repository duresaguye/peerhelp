import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Question from "@/models/Question"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const questionId = params.id
    const { voteType } = await req.json()

    if (voteType !== "up" && voteType !== "down") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    const question = await Question.findById(questionId)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const userId = session.user.id

    // Check if user has already voted
    const hasUpvoted = question.upvotes.includes(userId)
    const hasDownvoted = question.downvotes.includes(userId)

    // Handle upvote
    if (voteType === "up") {
      if (hasUpvoted) {
        // Remove upvote if already upvoted
        question.upvotes = question.upvotes.filter((id) => id.toString() !== userId)
      } else {
        // Add upvote and remove downvote if exists
        question.upvotes.push(userId)
        question.downvotes = question.downvotes.filter((id) => id.toString() !== userId)
      }
    }

    // Handle downvote
    if (voteType === "down") {
      if (hasDownvoted) {
        // Remove downvote if already downvoted
        question.downvotes = question.downvotes.filter((id) => id.toString() !== userId)
      } else {
        // Add downvote and remove upvote if exists
        question.downvotes.push(userId)
        question.upvotes = question.upvotes.filter((id) => id.toString() !== userId)
      }
    }

    await question.save()

    return NextResponse.json({
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length,
      voteCount: question.upvotes.length - question.downvotes.length,
    })
  } catch (error) {
    console.error("Error voting on question:", error)
    return NextResponse.json({ error: "Failed to vote on question" }, { status: 500 })
  }
}
