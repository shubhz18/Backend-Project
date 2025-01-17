import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens=async(userId)=>
{
    try
    {
        const  user  =await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }
    catch(error)
    {
        throw new ApiError(500,"Something went wrong while generating refrsh and access token")

    }
}

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


const loginUser   = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User   not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password Incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser   = await User.findById(user._id).select("-password -refreshToken");

    // Convert Mongoose document to a plain object
    const userObject = loggedInUser .toObject();

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .header("Authorization", `Bearer ${accessToken}`)
        .json(
            new ApiResponse(
                200,
                {
                    user: userObject, // Use the plain object
                    user: user,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    message: "User     Logged In Successfully",
                },
                "User   Logged In Successfully"
            )
        );
});

const LogoutUser  = asyncHandler(async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined
          }
        },
        {
          new: true
        }
      );
  
      const options = {
        httpOnly: true,
        secure: true,
        maxAge: 0 // Set maxAge to 0 to delete the cookie
      };
  
      return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User  logged out"));
    } catch (error) {
      throw new ApiError(500, "Failed to log out user");
    }
  });

  const RefreshAccessToken=asyncHandler(async(req,res)=>
  {
    const IncomingRefreshToken=req.cookies?.RefreshToken || req.body.refreshToken

    if(!IncomingRefreshToken)
    {
        throw new ApiError(400,"Refresh Token is required")
    }
    try {
        const decodedToken= jwt.verify(IncomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken._id)
    
        if(!user)
        {
            throw new ApiError(404,"User not found")
        }
        if(IncomingRefreshToken!==user?.refreshToken)
        {
            throw new ApiError(401,"Invalid Refresh Token")
        }
        const option=
        {
            httponly:true,
            secure:true
        }
    
        const {accessToken,NewrefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("AccessToken",accessToken,options)
        .cookie("RefreshToken",NewrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
                },
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new APIError(401,error?.message)
    }
  })

const UpdatePasswords=asyncHandler(async(req,res)=>
{
    const {oldPassword,NewPassword}=req.body;
    const user=await User.findById(req.user._id)

    if(!user)
    {
        throw new ApiError(404,"User not found")
    }
    const IsPassword= await user.isPasswordCorrect(oldPassword)
    if(!IsPassword)
    {
        throw new ApiError(401,"Old Password is incorrect")
    }
    user.password=NewPassword;
    user.save();

    return res.status(200)
    .json(new ApiResponse(200,{},"Password Changes Sucessfully"))
})


const UpdateDetails=asyncHandler(async(req,res)=>
{
   const {fullName,email}=req.body;

   const user=await User.findById(req.user._id)
   if(fullName===user.fullName && email===user.email)
   {
       throw new ApiError(400,"No changes detected")
   }
   if(!user)
   {
    throw new ApiError(404,"User not found")
   }

   const Updated= await User.findByIdAndUpdate(req.user._id,
    {
        $set:
        {
        fullName,  //update fullname
        email   //update email

    }
},
    {
        new:true   //return all updated value
    }
   ).select("-password -refreshToken")


   return res.status(200)
   .json(new ApiResponse(200,Updated,"user details updated successfully"))
})

const AvatarUpdate=asyncHandler(async(req,res)=>
{
    if (!req.files) {
        throw new ApiError(400, "No file uploaded");
      }
    
      if (!req.files?.Avatar) {
        throw new ApiError(400, "File name should be 'Avatar'");
      }
    const avatarLocalPath = req.files?.Avatar?.[0]?.path;
     if(!avatarLocalPath)
     {
        throw new ApiError(400,"Avatar image is required while updating")
     }

     const Avatar=await uploadOnCloudinary(avatarLocalPath)
     if(!Avatar.url)
     {
        throw new ApiError(500,"Failed to upload avatar image while updating")
     }
     const user=await User.findByIdAndUpdate(req.user._id,
     {
         $set:
         {
                Avatar:Avatar.url
         }
     },
    {
        new:true
    }).select("-password -refreshToken")
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})


const UpdateCoverImage=asyncHandler(async(req,res)=>{

    const coverImageLocalPath=await req.file?.path
    if(!coverImageLocalPath)
    {
        throw new ApiError(400,"Cover image is required while updating")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url)
    {
        throw new ApiError(500,"Failed to upload cover image while updating")
    }
    const user=await User.findByIdAndUpdate(req.user._id,
    {
        $set:
        {
            coverImage:coverImage.url
        }
    },
    {
        new:true
    }).select("-password -refreshToken")

return res.status(200)
.json(new ApiResponse(200,user,"Cover Image updated successfully"))
})
  


export { registerUser,loginUser,LogoutUser,RefreshAccessToken,UpdateDetails,UpdatePasswords,AvatarUpdate,UpdateCoverImage} ;
