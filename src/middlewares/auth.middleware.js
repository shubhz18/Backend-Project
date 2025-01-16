import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
      const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer", "");
  
      if (!token) {
        throw new ApiError(401, "Access token not found in cookies or Authorization header");
      }
  
      try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password-refreshToken");
  
        if (!user) {
          throw new ApiError(404, "User not found");
        }
  
        req.user = user;
        next();
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new ApiError(401, "Access token has expired");
        } else if (error.name === "JsonWebTokenError") {
          throw new ApiError(401, "Invalid access token");
        } else {
          throw new ApiError(401, error?.message || "Invalid access token");
        }
      }
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid access token");
    }
  });

