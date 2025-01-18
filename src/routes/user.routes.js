import { Router } from "express";
import { LogoutUser, registerUser,loginUser,UpdatePasswords, 
UpdateDetails, AvatarUpdate, UpdateCoverImage, GetUserProfile,
 GetWatchHistory } 
 from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { RefreshAccessToken } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"Avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        },
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT,LogoutUser)
router.route("/refreshToken").post(RefreshAccessToken)
router.route("/UpdatePassword").post(verifyJWT,UpdatePasswords)
router.route("/UpdateDetails").post(verifyJWT,UpdateDetails)
router.route("/UpdateAvatar").patch(verifyJWT,upload.single("/Avatar"),AvatarUpdate)

router.route("/UpdateCoverImage").patch(verifyJWT,upload.single("/coverImage"),UpdateCoverImage)
router.route("/c/:username").get(verifyJWT,GetUserProfile)

router.route("/history").get(verifyJWT,GetWatchHistory)



export default router