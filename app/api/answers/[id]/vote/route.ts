import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Answer from "@/models/Answer"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const answerId = params.id
    const { voteType } = await req.json()

    if (voteType !== "up" && voteType !== "down") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    const answer = await Answer.findById(answerId)

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 })
    }

    const userId = session.user.id

    // Check if user has already voted
    const hasUpvoted = answer.upvotes.includes(userId)
    const hasDownvoted = answer.downvotes.includes(userId)

    // Handle upvote
    if (voteType === "up") {
      if (hasUpvoted) {
        // Remove upvote if already upvoted
        answer.upvotes = answer.upvotes.filter((id: string) => id.toString() !== userId)
      } else {
        // Add upvote and remove downvote if exists
        answer.upvotes.push(userId)
        answer.downvotes = answer.downvotes.filter((id: string) => id.toString() !== userId)
      }
    }

    // Handle downvote
    if (voteType === "down") {
      if (hasDownvoted) {
        // Remove downvote if already downvoted
        answer.downvotes = answer.downvotes.filter((id: string) => id.toString() !== userId)
      } else {
        // Add downvote and remove upvote if exists
        answer.downvotes.push(userId)
        answer.upvotes = answer.upvotes.filter((id: string) => id.toString() !== userId)
      }
    }

    await answer.save()

    return NextResponse.json({
      upvotes: answer.upvotes.length,
      downvotes: answer.downvotes.length,
      voteCount: answer.upvotes.length - answer.downvotes.length,
    })
  } catch (error) {
    console.error("Error voting on answer:", error)
    return NextResponse.json({ error: "Failed to vote on answer" }, { status: 500 })
  }
}
