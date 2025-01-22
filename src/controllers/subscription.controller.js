import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const user=await User.findById(req.user._id);
    console.log("user",user.id);

    // Check if the channel (video owner) exists
    const channelOwner = await User.findById(channelId)
    console.log("Owner",channelOwner.id);
    

    const subscription = await Subscription.findOne({
        subscriber: user._id,
        channel: channelOwner._id,
    });
    console.log("Subscription:", subscription);
    if(subscription)
    {
        console.log("User already subscribed,Now its time to unsubscribe")
        await Subscription.findOneAndDelete({subscriber: user._id, channel:channelOwner._id})
        console.log("deleted",subscription);
        return res.status(200).json(new ApiResponse(200,"User UnSubscribe Sucessfully"))
    }
    else{
        console.log("User in not subscribed,Not its time to subcribe")
        try {
            const newSubscription = await Subscription.create({
                subscriber: req.user._id,
                channel: channelOwner._id,
            });
            console.log("New Subscription Created:", newSubscription);
        } catch (error) {
            console.error("Error Creating Subscription:", error);
        }
        return res.status(200).json(new ApiResponse(200,`${user.username} Subscribe ${channelOwner.username} Sucessfully`))
    }

});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    const channelOwner=await User.findById(subscriberId);

    if(!channelOwner)
    {
        throw new ApiError(400,"Channel has not subscriber any more")
    }
    console.log(channelOwner.username)

    const list=await Subscription.aggregate([
        {
            $match:
            {
               channel:new mongoose.Types.ObjectId(channelOwner._id)   
            }
        },
        {
            $lookup:
            {
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"name"
            }
        },
        {
           $unwind:"$name"
        },
        {
            $addFields:
            {
                owner:"$name.username"
            }
        },
        {
            $project:
            {
                owner:1
            }
        }
    ])
    if (list.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No subscribers found"));
    }

    // Return the list of subscribers
    return res.status(200).json(new ApiResponse(200, list, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    const user=await User.findById(channelId);
    if (!user)
    {
        throw new ApiError(400,"No user has found")
    }

    const list=await Subscription.aggregate([
        {
            $match:
            {
                subscriber:new mongoose.Types.ObjectId(user._id)
            }
        },
        {
            $lookup:
            {
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"name"
            }
        },
        {
            $unwind:"$name"
        },
        {
            $addFields:
            {
                owner:"$name.username"
            }
        },
        {
            $project:
            {
                owner:1
            }
        }
    ])
    if (list.length===0)
    {
        throw new ApiError("No Unsubscriber found")
    }
    return res.status(200).json(new ApiResponse(200,list,"Own following fethched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}