import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Answer from "@/models/Answer"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { content, questionId } = body

    if (!content || !questionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const answer = await Answer.create({
      content,
      author: session.user.id,
      question: questionId,
    })

    const populatedAnswer = await Answer.findById(answer._id).populate("author", "name image").lean()

    return NextResponse.json(populatedAnswer, { status: 201 })
  } catch (error) {
    console.error("Error creating answer:", error)
    return NextResponse.json({ error: "Failed to create answer" }, { status: 500 })
  }
}
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const questionId = req.nextUrl.searchParams.get("questionId")
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId query parameter is required" },
        { status: 400 }
      )
    }

    const answers = await Answer
      .find({ question: questionId })
      .sort({ createdAt: 1 })               
      .populate("author", "name image")
      .lean()

    return NextResponse.json({ answers }, { status: 200 })
  } catch (error) {
    console.error("Error fetching answers:", error)
    return NextResponse.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    )
  }
}