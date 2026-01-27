import { Router } from "express";
import {toggleLike,likedVideos} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const appendTarget = (type) => (req, res, next) => {
  req.targetType = type;
  next();
};

router.use(verifyJWT);

router.route("/video/:targetId").post(appendTarget("Video"), toggleLike);
router.route("/comment/:targetId").post(appendTarget("Comment"), toggleLike);
router.route("/tweet/:targetId").post(appendTarget("Tweet"), toggleLike);

router.route("/likedVideos").get(likedVideos);

export default router;
