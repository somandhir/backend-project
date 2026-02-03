/*
    what a user can do with a video: 
    upload a video
    view a video
    update video details (owner)
    delete a video
    publish/unpublish a video
    get video list
*/

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { uploadVideoStream, uploadImageStream } from "../utils/cloudinary.js";
import axios from "axios";

const uploadVideo = asyncHandler(async (req, res) => {
  /*
        get rq fields from req.body (title, description)
        get files from req.files (videoFile, thumbnail)
        validate everything 
        upload files to cloudinary
        save video in db
        return saved video
    */

  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoBuffer = req.files?.videoFile?.[0]?.buffer;
  const thumbnailBuffer = req.files?.thumbnail?.[0]?.buffer;

  if (!videoBuffer) {
    throw new ApiError(400, "video file is required");
  }
  if (!thumbnailBuffer) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const sizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
  console.log("Video size (MB):", sizeMB);
  if (sizeMB > 100) {
    throw new ApiError(400, "Video too large. Max allowed size is 100MB.");
  }

  const videoUpload = await uploadVideoStream(videoBuffer);
  const thumbnailUpload = await uploadImageStream(thumbnailBuffer);

  if (!videoUpload) {
    throw new ApiError(400, "Video upload failed");
  }

  const duration = Math.round(videoUpload?.duration);
  if (!duration) {
    throw new ApiError(400, "Unable to extract video duration");
  }

  if (!videoUpload?.secure_url) {
    throw new ApiError(400, "Video upload failed");
  }
  if (!thumbnailUpload?.secure_url) {
    throw new ApiError(400, "Thumbnail upload failed");
  }

  const video = await Video.create({
    videoFile: videoUpload.secure_url,
    thumbnail: thumbnailUpload.secure_url,
    title,
    description,
    duration,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId)
    .populate("owner", "fullname username avatar")
    .select("-videoFile");
  if (!video || !video.isPublished) {
    throw new ApiError(404, "Video not found");
  }

  video.views += 1;
  await video.save({ validateBeforeSave: false });

  const likesCount = await Like.countDocuments({
    targetId: videoId,
    targetType: "Video",
  });

  const videoData = {
    ...video._doc,
    likesCount,
  };

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { watchHistory: video._id },
  });

  const streamUrl = `${req.protocol}://${req.get("host")}/api/v1/videos/stream/${video._id}`;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoData, streamUrl },
        "Video fetched successfully",
      ),
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "Not allowed");
  }

  if (title) video.title = title;
  if (description) video.description = description;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "Not Allowed");
  }

  // await video.deleteOne();
  await Promise.all([
    Video.findByIdAndDelete(videoId),
    Comment.deleteMany({ video: videoId }),
    Like.deleteMany({ targetId: videoId, targetType: "Video" }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not allowed");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "published" : "unpublished"}`,
      ),
    );
});

// const getVideos = asyncHandler(async (req, res) => {
//   const { query, page = 1, limit = 10 } = req.query;

//   const skip = (parseInt(page) - 1) * parseInt(limit);

//   const filter = { isPublished: true };

//   if (query) {
//     filter.$or = [
//       { title: { $regex: query, $options: "i" } },
//       { description: { $regex: query, $options: "i" } },
//     ];
//   }

//   const videos = await Video.find(filter)
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(parseInt(limit))
//     .select("_id thumbnail title duration views owner createdAt")
//     .populate("owner", "avatar username fullname");

//   const totalVideos = await Video.countDocuments(filter);

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         videos,
//         totalVideos,
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalVideos / limit),
//       },
//       "Videos fetched successfully",
//     ),
//   );
// });

const getVideos = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.params;
  const aggregatePipeline = [
    {
      $match: {
        isPublished: true,
      },
    },
  ];
  if (query) {
    aggregatePipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }
  aggregatePipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "targetId",
        as: "likes",
      },
    },
    { $addFields: { likesCount: { $size: "$likes" } } },
  );

  aggregatePipeline.push(
    {
      $project: {
        _id: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        "owner.username": 1,
        "owner.fullname": 1,
        "owner.avatar": 1,
        likesCount: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  );

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(
    Video.aggregate(aggregatePipeline),
    options,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fethced successfully"));
});

const streamVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const range = req.headers.range;

  if (!range) {
    throw new ApiError(400, "Requires range headers");
  }
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new ApiError(400, "Video does not exist or is private");
  }
  const videoUrl = video.videoFile;
  try {
    const response = await axios({
      method: "get",
      url: videoUrl,
      responseType: "stream",
      headers: {
        Range: range,
      },
    });

    res.writeHead(206, {
      "Content-Range": response.headers["content-range"],
      "Accept-Ranges": "bytes",
      "Content-Length": response.headers["content-length"],
      "Content-Type": "video/mp4",
    });

    response.data.pipe(res);

    response.data.on("error", (err) => {
      console.error("Stream pipe error:", err);
      res.end();
    });
  } catch (error) {
    if (error.response && error.response.status === 416) {
      return res.status(416).send("Requested range not satisfiable");
    }

    console.error("Streaming error : ", error.message);
    throw new ApiError(500, "Error while streaming video");
  }
});

const updateWatchTime = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { watchedDuration } = req.body;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const viewThreshold = Math.min(30, video.duration * 0.5);

  if (watchedDuration >= viewThreshold) {
    video.views += 1;
    await video.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, { views: video.views }, "View counted"));
  }

  return res.status(200).json(new ApiResponse(200, {}, "Watching..."));
});

/*
frontend for update watch time : 
video.addEventListener('timeupdate', () => {
  // video.currentTime gives the actual second of the video
  if (!viewLogged && video.currentTime >= 20) { 
    viewLogged = true; // Prevents sending 100 requests
    
    // Call your heartbeat endpoint!
    fetch(`/api/v1/videos/watch-time/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ watchedDuration: video.currentTime }),
      // ... headers with credentials
    });
  }
});
 */

export {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideos,
  streamVideo,
  updateWatchTime,
};
