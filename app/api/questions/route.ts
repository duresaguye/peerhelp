import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import dbConnect from "@/lib/db"
import Question from "@/models/Question"
import Answer from "@/models/Answer"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const sort = url.searchParams.get("sort") || "latest"
    const subject = url.searchParams.get("subject") || ""
    const search = url.searchParams.get("search") || ""
    const includeAnswers = url.searchParams.get("includeAnswers") === "true"

    const skip = (page - 1) * limit

    let sortOptions = {}
    if (sort === "latest") {
      sortOptions = { createdAt: -1 }
    } else if (sort === "top") {
      sortOptions = { voteCount: -1 }
    }

    const query: any = {}

    if (subject) {
      query.tags = { $in: [subject] }
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
    }

    const questions = await Question.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate("author", "name image")
      .populate("upvotes", "_id")
      .populate("downvotes", "_id")
      .select('+answerCount')
      .lean()

    const totalQuestions = await Question.countDocuments(query)
     // Get answer counts for all fetched questions
     const questionIds = questions.map(q => q._id)
     const answerCounts = await Answer.aggregate([
       { $match: { question: { $in: questionIds } } },
       { $group: { _id: "$question", count: { $sum: 1 } } }
     ])
     const questionsWithCounts = questions.map(question => ({
      ...question,
      answerCount: answerCounts.find(ac => ac._id.equals(question._id))?.count || 0
    }))

    return NextResponse.json({
      questions: questionsWithCounts,
      totalPages: Math.ceil(totalQuestions / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { title, content, tags, images } = body

    if (!title || !content || !tags || tags.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const question = await Question.create({
      title,
      content,
      tags,
      author: session.user.id,
      images: images || [],
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}
