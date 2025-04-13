import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      collation: { locale: 'en', strength: 2 }, // Case-insensitive
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    password: {
      type: String,
      select: false,
    },
    image: String,
    bio: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "users",
    collation: { locale: 'en', strength: 2 }, // Collection-level case-insensitivity
  }
);

// Add email normalization
UserSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);