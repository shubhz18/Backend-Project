import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { User } from "../models/user.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    const video=await Video.findById(videoId)
    console.log("Videoid",video)

    const Videolike=await Like.findOne({video:video._id,likedby:req.user._id})
    console.log("LikeDocument",Videolike)

    if(!Videolike){
        {
            console.log("VIdeo already is not liked by user,its time to like")
            try
            {
                const NewLikeByUser=await Like.create(
                    {
                          likedby:req.user._id,
                          video:video._id
                    }
                )
            console.log(NewLikeByUser)
            return res.status(200).json(new ApiResponse(200,NewLikeByUser,"User has liked the video sucessfully"))
            }
            catch(error)
              {
                      throw new ApiError(400,"Issue while logIn the video")
              }
            

        }
}
//if user has already liked tha video then unlike the video
else{
       const UnLike=await Like.findOneAndDelete({video:video._id,likedby:req.user._id})
       console.log("Deleted Like",UnLike)
       return res.status(200).json(new ApiResponse(200,"User has Unliked the video"))
}
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const LikeComment=await Like.findOne({comment:commentId,likedby:req.user._id})
    const comment=await Comment.findById(commentId);

    console.log("Like Document",LikeComment)


    if(LikeComment)  //if like comment already exit then unlike the comment
    {
        const UnLike=await Like.findOneAndDelete({comment:commentId,likedby:req.user._id})

        return res.status(200).json(new ApiResponse(200,"User has Unliked the comment"))
    }
    else
    {
        const NewLikeByUser=await Like.create({
            likedby:req.user._id,
            comment:commentId,
            // videoId:comment.video
        })
        console.log(NewLikeByUser)
        return res.status(200).json(new ApiResponse(200,NewLikeByUser,"User has likes the comment"))
    }
})



const getLikedVideos = asyncHandler(async (req, res) => {
    // //TODO: get all liked videos

    const user=await User.findById(req.user._id)
    console.log(req.user._id)
    if(!user)
    {
        throw new ApiError(400,"User not found to search their liked video")
    }
    const likedVideo=await Like.findOne({likedby:user._id})

    console.log("Liked Video",likedVideo)

    if(!likedVideo)
    {
        throw new ApiError(400,"user has not liked any video")
    }

    const VideoInfp=await Video.findById(likedVideo.video)
    if(!VideoInfp)
    {
        throw new ApiError(400,"user liked video not found")
    }
    return res.status(200).json(new ApiResponse(200,VideoInfp,"All user liked Video"))
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}