import mongoose from "mongoose"

const CommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please provide content"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide an author"],
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for like count
CommentSchema.virtual("likeCount").get(function () {
  return this.likes.length - this.dislikes.length
})

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema)
