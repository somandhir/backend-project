import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getVideoById,
  updateVideo,
  uploadVideo,
  togglePublishStatus,
  getVideos,
  streamVideo,
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo,
);

router.route("/v/videos").get(getVideos);
router.route("/:videoId").get(getVideoById);
router.route("/:videoId").patch(updateVideo);
router.route("/:videoId").delete(deleteVideo);
router.route("/:videoId/publish").patch(togglePublishStatus);
router.route("/stream/:videoId").get(streamVideo);

export default router;
