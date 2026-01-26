import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

const toggleLike = asyncHandler(async (req, res) => {
  const { targetId } = req.params;
  //   console.log("targetId : ", targetId);

  const targetType = req.targetType || req.query.targetType;

  if (!targetType) {
    throw new ApiError(400, "targetType is missing in the request");
  }

  //   console.log("target type: ", targetType);

  const existingLike = await Like.findOne({
    targetId,
    targetType,
    likedBy: req.user._id,
  });
  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Like removed successfully"),
      );
  }
  await Like.create({ targetId, targetType, likedBy: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Like added succesfully"));
});

export default toggleLike;
