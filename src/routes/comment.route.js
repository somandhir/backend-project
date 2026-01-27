import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  writeComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/writeComment/:videoId").post(writeComment);
router.route("/getComments/:videoId").get(getComments);
router.route("/c/:commentID").patch(updateComment).delete(deleteComment);

export default router;
