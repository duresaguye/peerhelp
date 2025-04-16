import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Question from "@/models/Question"
import { revalidatePath, revalidateTag } from "next/cache"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    
    await dbConnect()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

   

    const questionId = params.id
    const { voteType } = await req.json()

    if (!["up", "down"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      )
    }

    const question = await Question.findById(questionId)
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    const userId = session.user.id.toString()
    const hasUpvoted = question.upvotes.includes(userId)
    const hasDownvoted = question.downvotes.includes(userId)

    // Clone arrays to properly detect changes
    const originalUpvotes = [...question.upvotes]
    const originalDownvotes = [...question.downvotes]

    if (voteType === "up") {
      if (hasUpvoted) {
        question.upvotes = question.upvotes.filter(
          (id) => id.toString() !== userId
        )
      } else {
        question.upvotes.push(userId)
        question.downvotes = question.downvotes.filter(
          (id) => id.toString() !== userId
        )
      }
    } else {
      if (hasDownvoted) {
        question.downvotes = question.downvotes.filter(
          (id) => id.toString() !== userId
        )
      } else {
        question.downvotes.push(userId)
        question.upvotes = question.upvotes.filter(
          (id) => id.toString() !== userId
        )
      }
    }

    // Only save if there's actual changes
    if (
      !(
        originalUpvotes.length === question.upvotes.length &&
        originalDownvotes.length === question.downvotes.length
      )
    ) {
      await question.save()
      
      // Revalidate relevant paths
      revalidatePath("/")
      revalidatePath(`/questions/${questionId}`)
      revalidateTag("questions")
    }

    return NextResponse.json({
      success: true,
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length,
      voteCount: question.upvotes.length - question.downvotes.length,
      userVote: voteType === "up" ? "up" : "down"
    })
  } catch (error) {
    console.error("Error voting on question:", error)
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    )
  }
}