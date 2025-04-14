import mongoose from "mongoose"

const AnswerSchema = new mongoose.Schema(
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
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Please provide a question"],
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
    accepted: {
      type: Boolean,
      default: false,
    },
  },
  
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for vote count
AnswerSchema.virtual("voteCount").get(function () {
  return this.upvotes.length - this.downvotes.length
})

// Virtual for comments
AnswerSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "answer",
})

export default mongoose.models.Answer || mongoose.model("Answer", AnswerSchema)
