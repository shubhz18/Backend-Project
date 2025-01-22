import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const verifyJWT = (req, res, next) => {
    console.log('Middleware hit');
    console.log('Authorization Header:', req.headers.authorization);
     // Log the authorization header
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.AccessToken; 
    console.log("token:",token) // Access token from Authorization header

    if (!token) {
        return next(new ApiError(401, "Access token is required"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return next(new ApiError(403, "Invalid access token"));
        }
        // console.log("decoded",decoded);
        req.user = decoded; // Attach user info to request object
        console.log(req.user);
        next(); // Proceed to the next middleware or route handler
    });
};

export { verifyJWT };
