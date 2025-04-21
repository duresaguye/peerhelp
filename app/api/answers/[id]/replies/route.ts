import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Reply from "@/models/Reply"
import { Types } from "mongoose"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: answerId } = await Promise.resolve(params)
    const parentReplyId = req.nextUrl.searchParams.get("parentReplyId")

    await dbConnect()

    const query: any = { answer: answerId }
    if (parentReplyId) {
      query.parentReply = parentReplyId
    } else {
      query.parentReply = { $exists: false }
    }

    const replies = await Reply.find(query)
      .populate("author", "name image")
      .sort({ createdAt: -1 })

    return Response.json(replies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    return Response.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { content, parentReplyId } = await req.json()
    const { id: answerId } = await Promise.resolve(params)

    await dbConnect()

    // Create new reply
    const reply = new Reply({
      content,
      author: new Types.ObjectId(session.user.id),
      answer: new Types.ObjectId(answerId),
      ...(parentReplyId && { parentReply: new Types.ObjectId(parentReplyId) })
    })

    await reply.save()
    await reply.populate("author", "name image")

    return Response.json(reply)
  } catch (error) {
    console.error("Error creating reply:", error)
    return Response.json(
      { error: "Failed to create reply" },
      { status: 500 }
    )
  }
}