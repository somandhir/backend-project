import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers,getAllSubscribedChannel } from "../controllers/subscriber.controller.js"

const router = Router();
router.use(verifyJWT);
router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/allSubs").get(getUserChannelSubscribers);
router.route("/toSubs").get(getAllSubscribedChannel);

export default router;