import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createPlaylist,
  addVideo,
  removeVid,
  deletePlaylist,
  getUsersAllPlaylists,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = Router();
router.route("/getAllPlaylists/:userId").get(getUsersAllPlaylists);
router.route("/:playlistId").get(getPlaylistById);

router.use(verifyJWT);
// protected routes
router.route("/").post(createPlaylist);
router.route("/:playlistId/:videoId").post(addVideo).delete(removeVid);
router.route("/:playlistId").delete(deletePlaylist);

export default router;
