import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name) {
    throw new ApiError(401, "name of the playlist can't be empty");
  }

  const result = await Playlist.create({
    name,
    description,
    videos: [],
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "playlist created successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist doesn't exist");
  }
  await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

const addVideo = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params; // Get both from URL
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist doesn't exist");
  }
  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(401, "Access not granted");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video doesn't exist");
  }
  const result = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, "video added successfully"));
});

const removeVid = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist doesn't exist");
  }
  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(401, "Access not granted");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video doesn't exist");
  }

  const result = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Video removed successfully"));
});

const getUsersAllPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "user doesn't exist");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId).populate("videos");
//   if (!playlist.owner.equals(req.user?._id)) {
//     throw new ApiError(401, "access not granted");
//   }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlists fetched successfully"));
});

export {
  createPlaylist,
  addVideo,
  removeVid,
  deletePlaylist,
  getUsersAllPlaylists,
  getPlaylistById,
};
