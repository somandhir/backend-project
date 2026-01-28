import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  getTweetById,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/:tweetId").get(getTweetById).delete(deleteTweet);
router.route("/user/:userId").get(getUserTweets);

export default router;
