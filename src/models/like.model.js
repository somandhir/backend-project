import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      refPath: "targetType",
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Video", "Comment", "Tweet"],
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// CRITICAL: Prevent duplicate likes at the database level
likeSchema.index({ targetId: 1, likedBy: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);
