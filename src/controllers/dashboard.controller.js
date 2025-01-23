import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User} from "../models/user.model.js"
import { Comment } from "../models/comment.model.js" 

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const user=await User.findById(req.user._id)
    const Info = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(user._id), // Match the current user
            },
        },
        {
            // Find subscribers of the owner
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "CountSubs",
            },
        },
        {
            $addFields: {
                TotalSubscribers: {
                    $size: "$CountSubs",
                },
            },
        },
        {
            // Find following of the owner
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "CountFollowing",
            },
        },
        {
            $addFields: {
                TotalFollowing: {
                    $size: "$CountFollowing",
                },
            },
        },
        {
            // Total views of all videos by the owner
            $lookup: {
                from: "videos",
                let: { ownerId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$owner", "$$ownerId"], // Match videos where owner matches user ID
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id", // Video ID
                            foreignField: "watchHistory", // Users who watched this video
                            as: "VideoViews",
                        },
                    },
                    {
                        $addFields: {
                            TotalViewsForVideo: {
                                $size: "$VideoViews", // Count the number of views for this video
                            },
                        },
                    },
                    {
                        $project: {
                            TotalViewsForVideo: 1, // Include only the views count for each video
                        },
                    },
                ],
                as: "UserVideos", // Store the video details in this field
            },
        },
        {
            $addFields: {
                TotalChannelViews: {
                    $sum: "$UserVideos.TotalViewsForVideo", // Sum all the views of videos
                },
            },
        },
        {
            // Total likes for all videos by the owner
            $lookup: {
                from: "likes",
                let: { videoIds: "$UserVideos._id" }, // Collect all video IDs
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$video", "$$videoIds"], // Match likes where the video ID is in the user's videos
                            },
                        },
                    },
                ],
                as: "AllLikes",
            },
        },
        {
            $addFields: {
                TotalLikesCount: {
                    $size: "$AllLikes", // Count the total likes for all videos
                },
            },
        },
        {
            $addFields: {
                TotalVideos: {
                    $size: "$UserVideos", // Count total number of videos
                },
            },
        },
        {
            $project: {
                TotalVideos: 1,
                TotalLikesCount: 1,
                TotalSubscribers: 1,
                TotalFollowing: 1,
                TotalChannelViews: 1, // Include total channel views
            },
        },
    ]);
    
    return res
        .status(200)
        .json(new ApiResponse(200, Info, "All User Details Fetched"));
    
});    

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
        const user=await User.findById(req.user._id)
        const video=await Video.findById(user._id)
    
        // const video=await Video.find({owner:user})
        const GetVideo = await Video.aggregate([
            {
              $match: {
                owner: new mongoose.Types.ObjectId(user._id), // Match videos by owner
              },
            },
            {
              $lookup: {
                from: "comments",
                localField: "_id", // Video ID
                foreignField: "video", // Comment's video reference
                as: "comments",
              },
            },
            {
              $addFields: {
                totalComments: { $size: "$comments" }, // Count comments
              },
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id", // Video ID
                foreignField: "video", // Like's video reference
                as: "likes",
              },
            },
            {
              $addFields: {
                totalLikes: { $size: "$likes" }, // Count likes
              },
            },
            {
                  $lookup:
                  {
                    from:"users",
                    localField:"_id",
                    foreignField:"watchHistory",
                    as:"TotalViews"
                  }
            },
            {
                $addFields: {
                    totalViews:{$size:"$TotalViews"}
                }
            },
            {
              $project: {
                _id: 1, // Include video ID
                title: 1, // Include video title if applicable
                description: 1,
                video:1,
                thumbnail:1,
                totalComments: 1,
                totalLikes: 1,
                totalViews:1
              },
            },
          ]);
        return res.status(200).json(new ApiResponse(200,GetVideo,"All the video of the user"))
})

export {
    getChannelStats, 
    getChannelVideos
    }