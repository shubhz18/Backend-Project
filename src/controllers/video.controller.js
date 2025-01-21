import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { response } from "express"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Check if the user is authenticated
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(401, "Unauthorized user");
    }

    // Validate title and description
    if (!(title && description)) {
        throw new ApiError(400, "Title and description required");
    }

    // Check for video file
    const videoFilePath = req.files?.video?.[0]?.path;
    if (!videoFilePath) {
        console.log("Video file not found");
        throw new ApiError(400, "Video is not uploaded on cloudinary");
    }

    // Check for thumbnail file
    let thumbnailPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailPath = req.files.thumbnail[0].path;
    }

    // Upload video and thumbnail to Cloudinary
    const video1 = await uploadOnCloudinary(videoFilePath);
    const thumbnail1 = thumbnailPath ? await uploadOnCloudinary(thumbnailPath) : null;

    // Create a video document
    const MainVideo = await Video.create({
        title: title,
        description: description,
        video: video1.url,
        thumbnail: thumbnail1 ? thumbnail1.url : null,
        owner: user._id, // Set the owner as the authenticated user's username
        views: 0,
        likes: 0,
        isPublished:true
    });

    return res
        .status(200)
        .json(new ApiResponse(200, MainVideo, "Video uploaded successfully"));
});




const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate if videoId is provided
    if (!videoId) {
        throw new ApiError(400, "VideoID is missing");
    }

    // Find the video by ID
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video is no more there, something wrong");
    }

    // Use aggregation to fetch video details and channel owner details
    const channel = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId), // Match the video by its ID
            },
        },
        {
            $lookup: {
                from: "users", // Join with the users collection
                localField: "owner", // Match the 'owner' field in videos with '_id' in users
                foreignField: "_id",
                as: "channelOwner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscription", // Join with the subscription collection
                            localField: "_id", // Match the user's '_id' with 'channel' in subscriptions
                            foreignField: "channel",
                            as: "subscriber", // Field to store subscription data
                        },
                    },
                    {
                        $addFields: {
                            SubscriberCount: { $size: "$subscriber" }, // Add subscriber count
                        },
                    },
                    {
                        $project: {
                            username: 1, // Keep the username
                            SubscriberCount: 1, // Keep the subscriber count
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$channelOwner", // Flatten the 'channelOwner' array
        },
        {
            $addFields: {
                owner: "$channelOwner.username", // Add the username of the channel owner
                SubscriberCount: "$channelOwner.SubscriberCount", // Add subscriber count
            },
        },
        {
            $project: {
                title: 1,
                video: 1,
                thumbnail: 1,
                owner: 1,
                description: 1,
                duration: 1,
                isPublished: 1,
                SubscriberCount: 1, // Include subscriber count in the final result
            },
        },
    ]);
    
    if (!channel.length) {
        return res.status(404).json({ message: "Video not found" });
    }
    const user=await User.findById(req.user._id)
    console.log("User",user.username)
    console.log("Video Owner",channel[0].owner)

    if(channel[0].owner !=user.username)
    {
        return res.status(250).json(new ApiResponse(250,"You cannot access this video as this is unpublishes or private"))
    }
    // Return the response with the video details
    return res.status(200).json({ video: channel[0] });
})
    


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Fetch the user object from the database
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Aggregate to get video details along with the owner's username
    const channel = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'data',
            },
        },
        {
            $unwind: '$data',
        },
        {
            $addFields: {
                owner: '$data.username',
            },
        },
        {
            $project: {
                owner: 1,
            },
        },
    ]);

    // Check if the video exists and has an owner
    if (channel.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the logged-in user is the owner of the video
    if (user.username !== channel[0].owner) {
        throw new ApiError(400, "You are not the owner of this video, sorry");
    }
    const { title, description } = req.body;
   console.log("title",title)
   console.log("description",description)
    // Validate user
    
    if (!user) {
        throw new ApiError(400, "User not found");
    }
    const video = await Video.findById(videoId);
    if (!video) {
    throw new ApiError(400, "Video not found !!");
}

    // Validate videoId
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

     let path1;
    // Handle thumbnail upload
    const thumbnailPath = req.file?.path;
    if (thumbnailPath) {
         path1 = await uploadOnCloudinary(thumbnailPath);
        if (!path1.url) {
            throw new ApiError(400, "Failed to upload thumbnail");
        }
    }

    // Update video details
    const changes = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnailPath ? path1.url : undefined,  // Update thumbnail only if it was provided
            },
        },
        { new: true }  // Return updated document
    );

    if (!changes) {
        throw new ApiError(400, "Video not found");
    }

    // Return the updated video
    return res.status(200).json(new ApiResponse(200, changes, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Fetch the user object from the database
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Aggregate to get video details along with the owner's username
    const channel = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'data',
            },
        },
        {
            $unwind: '$data',
        },
        {
            $addFields: {
                owner: '$data.username',
            },
        },
        {
            $project: {
                owner: 1,
            },
        },
    ]);

    // Check if the video exists and has an owner
    if (channel.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the logged-in user is the owner of the video
    if (user.username !== channel[0].owner) {
        throw new ApiError(400, "You are not the owner of this video, sorry");
    }
    await Video.findByIdAndDelete(videoId);

    // Send response confirming the video was deleted
    res.status(200).json(new ApiResponse(200, "Video deleted successfully"));

});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Fetch the user object from the database
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    // Aggregate to get video details along with the owner's username
    const channel = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'data',
            },
        },
        {
            $unwind: '$data',
        },
        {
            $addFields: {
                owner: '$data.username',
            },
        },
        {
            $project: {
                owner: 1,
            },
        },
    ]);

    // Check if the video exists and has an owner
    if (channel.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the logged-in user is the owner of the video
    if (user.username !== channel[0].owner) {
        throw new ApiError(400, "You are not the owner of this video, sorry");
    }
    const video=await Video.findById(videoId)

    video.isPublished=!video.isPublished

    await video.save();

    return res.status(200).json(new ApiResponse(200,`Video ${video.isPublished ? 'published' : 'unpublished'} successfully`,
        video,))
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}