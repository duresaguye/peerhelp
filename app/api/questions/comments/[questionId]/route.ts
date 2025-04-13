import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Comment from "@/models/Comment"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { content, questionId, answerId } = body

    if (!content || (!questionId && !answerId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const comment = await Comment.create({
      content,
      author: session.user.id,
      question: questionId || null,
      answer: answerId || null,
    })

    const populatedComment = await Comment.findById(comment._id).populate("author", "name image").lean()

    return NextResponse.json(populatedComment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
