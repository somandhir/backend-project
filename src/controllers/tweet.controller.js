import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(401, "Tweet can't be empty");
  }

  const result = await Tweet.create({
    content: content,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "tweet created successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "No tweet with this id found");
  }
  if (!tweet.owner.equals(req.user?._id)) {
    throw new ApiError(401, "Unauthorized access");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "no user found");
  }
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
      $addFields: { owner: { $first: "$owner" } },
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
      $addFields: { likesCount: { $size: "$likes" } },
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

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "No tweet found");
  }
  const tweetDetails = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
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
      $addFields: { owner: { $first: "$owner" } },
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
      $addFields: { likesCount: { $size: "$likes" } },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "targetId",
        as: "comments",
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        owner: {
          _id: 1,
          username: 1,
          fullname: 1,
          avatar: 1,
        },
        likesCount: 1,
        comments: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweetDetails, "Tweet fetched successfully"));
});

export { createTweet, deleteTweet, getUserTweets, getTweetById };
