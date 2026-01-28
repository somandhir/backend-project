import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";

const writeComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { videoId } = req.params;
  if (!comment) {
    throw new ApiError(404, "Comment can't be null");
  }
  const commentData = await Comment.create({
    content: comment,
    video: videoId,
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, commentData, "Comment added successfully"));
});

const getComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const aggregateQuery = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "targetId",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: {
          username: 1,
          fullname: 1,
          avatar: 1,
        },
        createdAt: 1,
        likesCount: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(aggregateQuery, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentID } = req.params;
  const { updatedComment } = req.body;

  if (!updatedComment) {
    throw new ApiError(401, "Comment content can't be empty");
  }

  const comment = await Comment.findById(commentID);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Access not granted");
  }

  const result = await Comment.findByIdAndUpdate(
    commentID,
    {
      $set: {
        content: updatedComment,
      },
    },
    {
      new: true,
    },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentID } = req.params;

  const comment = await Comment.findById(commentID);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Access not granted");
  }

  const result = await Comment.findByIdAndDelete(commentID);
  await Like.deleteMany({
    targetType: "Comment",
    targetId: commentID,
  });

  if (!result) {
    throw new ApiError(404, "Comment not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

export { writeComment, getComments, updateComment, deleteComment };
