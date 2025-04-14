import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import dbConnect from "@/lib/db"
import Reply from "@/models/Reply"
import Answer from "@/models/Answer"
import { authOptions } from "../../../auth/[...nextauth]/route"


export async function GET(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    await dbConnect()
  
    try {
      const replies = await Reply.find({ answer: params.id })
        .populate("author", "name image")
        .sort({ createdAt: -1 }) // newest first
  
      return NextResponse.json(replies)
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      )
    }
  }
  
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  await dbConnect()

  try {
    const { content } = await request.json()
    const answerId = params.id

    // Create new reply
    const reply = new Reply({
      content,
      author: session.user.id,
      answer: answerId,
      upvotes: [],
      downvotes: [],
      voteCount: 0,
    })

    const savedReply = await reply.save()

    // Add reply to answer's replies array
    await Answer.findByIdAndUpdate(answerId, {
      $push: { replies: savedReply._id }
    })

    // Populate author info
    const populatedReply = await Reply.findById(savedReply._id)
      .populate("author", "name image")

    return NextResponse.json(populatedReply, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    )
  }
}