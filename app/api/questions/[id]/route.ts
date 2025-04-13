import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Question from "@/models/Question"
import Answer from "@/models/Answer"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const questionId = params.id

    const question = await Question.findById(questionId)
      .populate("author", "name image")
      .populate("upvotes", "_id")
      .populate("downvotes", "_id")
      .lean()

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Increment view count
    await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } })

    const answers = await Answer.find({ question: questionId })
      .populate("author", "name image")
      .populate("upvotes", "_id")
      .populate("downvotes", "_id")
      .sort({ accepted: -1, voteCount: -1 })
      .lean()

    return NextResponse.json({ question, answers })
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const questionId = params.id
    const body = await req.json()
    const { title, content, tags, images } = body

    const question = await Question.findById(questionId)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (question.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to update this question" }, { status: 403 })
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { title, content, tags, images },
      { new: true },
    )

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const questionId = params.id
    const question = await Question.findById(questionId)

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (question.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this question" }, { status: 403 })
    }

    await Question.findByIdAndDelete(questionId)

    // Delete related answers and comments
    await Answer.deleteMany({ question: questionId })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
  }
}
