import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description,videos=[]} = req.body
    console.log(req.body)

    //TODO: create playlist

    const user=await User.findById(req.user._id);

    if(!(name && description))
    {
        throw new ApiError(400,"Both Name and Description are required to create the playlist")
    }
    // console.log(user)
    if(!user)
    {
        throw new ApiError(400,"User is not valid");
    }
    const OldList=await Playlist.findOne({name:name,userId:user._id})
    if(OldList)
    {
        throw new ApiError(400,"Playlist with same name already exists")
    }

    const NewPlaylist=await Playlist.create(
        {
            name,
            description,
            videos,
            user:user._id
        }
    )
    console.log(NewPlaylist)
    return res.status(200).json(new ApiResponse(200,NewPlaylist,"PlayList created Succesfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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