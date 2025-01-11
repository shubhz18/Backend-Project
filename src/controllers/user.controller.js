import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { upload } from "../middlewares/multer.middleware.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user from the details
    //validation that data is correct and not empty
    //check if user already exits (base on username and email)
    //check for images,check for avatar
    //upload them to cloudinary,avatar
    //create user object ->create entry in DB
    //remove password and refresh token field from response
    //check user creation
    //return res

    const { fullname, email, username, passowrd } = req.body
    // console.log("email :", email);

    if (
        [fullname, email, username, passowrd].some((field) =>

            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "Full name is required")
    }

    const ExistedUser=await User.findOne(
        { $or: [{ username }, {email}]}
    )
    // console.log(ExistedUser);
    if(ExistedUser)
    {
        console.log("enter into existed")
        throw new ApiError(409,"User is already exist")
    }
        const avatarLocalHost= req.files?.Avatar[0]?.path
        const CoverImageLocalHost= req.files?.coverImage[0]?.path

        if(!avatarLocalHost)
        {
            throw new ApiError(400,"Avatar image is necessary")
        }
    const avatar = await uploadOnCloudinary(avatarLocalHost)
    const coverImage=await uploadOnCloudinary(CoverImageLocalHost)

    if(!avatar)
    {
        throw new ApiError(400,"Avatar image is necessary")
    }

    const user = await User.create({
        fullname,
        Avatar:avatar.url,
        coverImage :coverImage?.url || "",
        email,password,
        Username:username.ToLowerCase()


    })
    const createdUser= await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser ,"User Registered Sucessfully")
    )

})

export { registerUser }