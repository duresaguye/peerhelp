import mongoose from "mongoose"

const QuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Please provide content"],
    },
    tags: [
      {
        type: String,
        required: [true, "Please provide at least one tag"],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide an author"],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for vote count
QuestionSchema.virtual("voteCount").get(function () {
  return this.upvotes.length - this.downvotes.length
})

// Virtual for answers
QuestionSchema.virtual("answers", {
  ref: "Answer",
  localField: "_id",
  foreignField: "question",
  count: true,
})

// Virtual for comments
QuestionSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "question",
})

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema)
