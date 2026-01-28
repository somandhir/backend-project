import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (channelId === userId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const subTo = await User.findById(channelId);
  if (!subTo) {
    throw new ApiError(404, "channel not found");
  }

  const credentials = { subscriber: userId, channel: channelId };

  const subscribed = await Subscription.findOne(credentials);
  if (subscribed) {
    await Subscription.findByIdAndDelete(subscribed._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Unsubscribed successfully",
        ),
      );
  }

  await Subscription.create(credentials);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "Subscribed successfully"),
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: userId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
      },
    },
    {
      $unwind: "$subscribers",
    },
    {
      $project: {
        _id: 0,
        username: "$subscribers.username",
        avatar: "$subscribers.avatar",
        fullname: "$subscribers.fullname",
        subscriberId: "$subscribers._id",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "user subscribers fetched successfully",
      ),
    );
});

const getAllSubscribedChannel = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: userId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
      },
    },
    {
      $unwind: "$channels",
    },
    {
      $project: {
        _id: 0,
        username: "$channels.username",
        avatar: "$channels.avatar",
        fullname: "$channels.fullname",
        subscriberId: "$channels._id",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        "all subscribed channels fetched successfully",
      ),
    );
});

export { toggleSubscription, getUserChannelSubscribers, getAllSubscribedChannel };
