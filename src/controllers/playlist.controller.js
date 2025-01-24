import mongoose, { isValidObjectId, set } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, videos = [] } = req.body
    console.log(req.body)

    //TODO: create playlist

    const user = await User.findById(req.user._id);

    if (!(name && description)) {
        throw new ApiError(400, "Both Name and Description are required to create the playlist")
    }
    // console.log(user)
    if (!user) {
        throw new ApiError(400, "User is not valid");
    }
    const OldList = await Playlist.findOne({ name: name, owner: user._id })
    console.log("OldList",OldList)
    if (OldList) {
        throw new ApiError(400, "Playlist with the same name already exists");  // Using ApiError for error case
    }

    const NewPlaylist = await Playlist.create({
        name,
        description,
        videos,
        owner: user._id
    });
    console.log(NewPlaylist);
    return res.status(200).json(new ApiResponse(200, NewPlaylist, "PlayList created Succesfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if userId is provided
  if (!userId) {
      throw new ApiError(400, "User ID is required to get the playlist");
  }

  // Validate user existence
  const user = await User.findById(userId);
  if (!user) {
      throw new ApiError(404, "User not found");
  }
  console.log("User:", user.username);

  // Find the playlist
  const playlist = await Playlist.findOne({ owner: userId });
  if (!playlist) {
      return res.status(400).json(new ApiResponse(400, "No playlist found for this user"));
  }
  console.log("Playlist owner:", playlist);
  console.log("Playlist ID:", playlist.id);

  // Aggregate video details
  const VideoDetails = await Playlist.aggregate([
    {
        $match: {
            owner: new mongoose.Types.ObjectId(userId), // Match all playlists owned by the user
        },
    },
    {
        $lookup: {
            from: "videos", // The videos collection
            localField: "videos", // Array of video IDs in the playlist
            foreignField: "_id", // Field in the Videos collection
            as: "VideoInfo", // Alias for the joined video data
        },
    },
    {
        $project: {
            _id: 0, // Exclude the default MongoDB `_id` field
            playlistId: "$_id", // Include playlist ID
            playlistName: "$name", // Include playlist name automatically
            VideoInfo: 1, // Include video details
        },
    },
]);

  console.log("Video details:", VideoDetails);

  // Send the response
  return res.status(200).json(new ApiResponse(200, VideoDetails, "Playlist of User Fetched"));
});



const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Find the playlist by its ID
    const playlist = await Playlist.findById(playlistId);
    console.log("Playlist:", playlist);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if(playlist.videos.length==0)
    {
         throw new ApiError(400,"No video present in this playlist")
    }

    // Use the aggregate pipeline to fetch video details
    const VideoDetails = await Playlist.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(playlistId), // Match the specific playlist
          },
        },
        {
          $unwind: "$videos", // Deconstruct the videos array into individual video IDs
        },
        {
          $lookup: {
            from: "videos", // The videos collection
            localField: "videos", // Field in Playlist collection
            foreignField: "_id", // Field in Videos collection
            as: "VideoInfo", // Alias for the joined data
          },
        },
        {
          $unwind: "$VideoInfo", // Unwind the VideoInfo array to get individual video documents
        },
        {
          $group: {
            _id: "$_id", // Group by playlist ID
            VideoInfo:
            {
              $push: 
                "$VideoInfo"
              ,
          }
        },
        },
        {
          $project: {
            _id: 0, // Optionally exclude the playlist _id
            VideoInfo: 1, // Include only the VideoInfo field
          },
        },
      ]);
      
      console.log(VideoDetails);
      
      
    

    console.log("Video Details:", VideoDetails);

    return res
        .status(200)
        .json(new ApiResponse(200, VideoDetails, "Playlist fetched successfully"));
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(playlistId && videoId)) {
        throw new ApiError(400, "Both playlist and videoId is not fetch from the URL")
    }
    console.log("Playlist:", playlistId)
    console.log("VideoId", videoId)

    const check = await Playlist.findOne({
        _id: playlistId,
        videos: { $in: [videoId] } // Check if videoId exists in the videos array
    });

    console.log("check", check)

    if (check) {
        return res.status(200).json(new ApiResponse(200, check, "Video is already present in playlist"))
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId)
        console.log("Newly add")
        await playlist.save()
    }
    else {
        console.log("Already present")
        return res.status(new ApiResponse(200, playlist, "Video is already present in playlist"))
    }
    // if(!user.watchHistory.includes(video_Id  ))
    //     {
    //         user.watchHistory.push(video_Id );
    //         await user.save();
    //     }
    // const playlist=await Playlist.findById(playlistId)
    // console.log("PlayListID",playlist)

    console.log("Playlist", playlist)

    return res.status(200).json(new ApiResponse(200, playlist, "Video has uploaded sucessfully in playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!(playlistId && videoId)) {
        throw new ApiError(400, "PlayListId and VideoId something is not fetched properly")
    }
    const user=await User.findById(req.user._id) 

    const check = await Playlist.findOne({_id:playlistId,owner:user._id})
    if(!check) {
      throw new ApiError(400,"You cant do this,as you are not owner of this playlist")
    }

    const playlist = await Playlist.updateOne(
        {
          _id: playlistId, // Match the specific playlist
        },
        {
          $pull: {
            videos: videoId, // Pull (remove) the specific videoId from the 'videos' array
          },
        },
        {
          new: true, // Return the updated playlist document
        }
      );
    const updatePlaylist=await Playlist.findById(playlistId)

   return res.status(200).json(new ApiResponse(200,updatePlaylist,"Video Remove from the playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const user=await User.findById(req.user._id)   //user who wants to delete the playlist
    
    const playlist=await Playlist.findById(playlistId)
    if(!playlist) {
      throw new ApiError(400,"PlayList not found")
    }

    const PlayListOwner=playlist.owner

    if(user.id!=PlayListOwner)
    {
      throw new ApiError(400,"You are not owner of this playlist so you cant delete it")
    }
    const playlistDelete=await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json(new ApiResponse(200,"Playlist Deleted Sucessfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    const playlist=await Playlist.findById(playlistId)
    const user=await User.findById(req.user._id) 

    if(!playlist) {
      throw new ApiError(400,"PlayList not found")
    }
    console.log("Enter system")

    const PlayListOwner=playlist.owner

    if(user.id!=PlayListOwner)
    {
      throw new ApiError(400,"You are not owner of this playlist so you cant delete it")
    }
  

    const UpdatedPlayList=await Playlist.findByIdAndUpdate(playlistId, 
      {
        $set:
        {
          name:name,
          description:description,
        }
      },
      {
        new:true
      })


      return res.status(200).json(new ApiResponse(200,UpdatedPlayList,"playList updated Sucessfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}