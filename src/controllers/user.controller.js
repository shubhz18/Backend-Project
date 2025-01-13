import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = asyncHandler(async (req, res) => {
//     const { fullname, email, username, password } = req.body;

//     // Validate required fields
//     if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
//         throw new ApiError(400, "All fields are required");
//     }

//     // Check if user already exists (by username or email)
//     const existedUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existedUser) {
//         throw new ApiError(409, "User already exists");
//     }

//     // Extract file paths from uploaded files
//     const avatarLocalPath = req.files?.Avatar?.[0]?.path;
//     const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

//     // Ensure Avatar is uploaded
//     if (!avatarLocalPath) {
//         throw new ApiError(400, "Avatar image is required");
//     }

//     // Upload images to Cloudinary
//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

//     if (!avatar?.url) {
//         throw new ApiError(500, "Failed to upload avatar image");
//     }

//     // Create the user in the database
//     const user = await User.create({
//         fullName,
//         email,
//         password,
//         username: username.toLowerCase(),
//         Avatar: avatar.url,
//         coverImage: coverImage?.url || "",
//     });

//     // Fetch the created user, excluding sensitive fields
//     const createdUser = await User.findById(user._id).select("-password -refreshToken");
//     if (!createdUser) {
//         throw new ApiError(500, "Failed to register user");
//     }

//     // Return success response
//     return res.status(201).json(
//         new ApiResponse(201, createdUser, "User registered successfully")
//     );
// });
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    
    console.log(req.files);
    const avatarLocalPath = req.files?.Avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    const user = await User.create({
        fullName: fullname,
        email,
        username: username.toLowerCase(),
        password,
        Avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


export { registerUser };
