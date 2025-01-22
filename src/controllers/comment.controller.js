import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    console.log("video Id",videoId)

    const video=await Video.findById(videoId)
    if(!video) return new ApiError(400,"No video found")
    const comment=await Video.aggregate([
     {

        //matching ID to mongoose ID of video schema
        $match:
        {
            _id:new mongoose.Types.ObjectId(video._id)
        }
     },
     {
        $lookup:
        {
            from: "comments",
            localField:"_id",
            foreignField:"video",
            as:"data",
        }
     },
     {
        $unwind:"$data"
     },
     {
        $lookup:
        {
            from:"users",
            localField:"data.owner",
            foreignField:"_id",
            as:"Owner"
        }
     },
     {
        $unwind:"$Owner"
     },
     {
        $project:
        {
           comment:"$data.content",
           owner:"$Owner.username",
        }
     }
])
if(!comment) return new ApiError(400,"no comment found for this video")
    console.log(comment)
    return res.status(200).json(new ApiResponse(200,comment,"Comments of clicked video fetch sucessfully"))

})

const addComment = asyncHandler(async (req, res) => {
    const {content }=req.body;
    console.log(req.body)
    const {videoId} = req.params;
    console.log("enter")

    console.log("comment",content)
    if(!videoId)
    {
        throw new ApiError(400,"Video is not found for comment")
    }
    console.log("videoId",videoId)
    const user=await User.findById(req.user._id)

    console.log("user who wants to comment",user.username);
    if(!content)
    {
        throw new ApiError(400,"Didnt receive any data for comment")
    }

    const comment=await Comment.create(
        {
            
                content:content,
                owner:user,
                video:videoId,
            
        }
    )
    res.status(200).json(new ApiResponse(200,comment,"Comment created sucessfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {content }=req.body
    const {commentId}=req.params

    console.log("Updated Comment",content)
    console.log("Commend Id",commentId)

    if(!content)
    {
        throw new ApiError("Updated Comment is not found")
    }

    if(!commentId)
    {
           throw new ApiError("Commend is not found for updation")
    }

    const comment=await Comment.findById(commentId)
    const user=await User.findById(req.user._id)
    console.log("User",user)
    const MainMalik=await User.findById(comment.owner)
    console.log("Owner of comment",MainMalik.username)
    if(comment.owner!=user.id)
    {
        throw new ApiError(400,"You are not owner of this comment so you cant modify this comment ")
    }

    const newComment=await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                   content:content
            }
        },
    {
        new:true
    })
        console.log("modified Comment",newComment)
    return res.status(200).json(new ApiResponse(200,newComment,"Comment modified sucessfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params

    const comment=await Comment.findById(commentId)

    const VideoId=await Video.findById(comment.video)  
    

    
    const VideoOwner=VideoId.owner  //video owner

    const VideoUser=await User.findById(VideoOwner)
    console.log("Video Owner",VideoUser.username)
    // console.log("video Owner",VideoOwner);

    // console.log("Video Owner",VideoOwner)

    const CommentOwner=comment.owner  //comment owner

    const CommentOwneruser=await User.findById(CommentOwner)
    console.log("Comment Ownername",CommentOwneruser.username)

    const user=await User.findById(req.user._id) //user id who wants to modify

    console.log("user who want to modify",user.username)

    console.log()

    if(user.username !==CommentOwneruser.username && user.username!==VideoUser.username)
    {
        throw new ApiError(400,"You are not comment owner or the video owner so you cant delete this video")
    }

    const newComment=await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(new ApiResponse(200,newComment,"User successfully deleted the comment"))


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }