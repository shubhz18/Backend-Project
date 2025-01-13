import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log(cloudinary.config()); 

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("Local file path is required for upload.");
            return null;
        }

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Log successful upload (optional)
        console.log("File uploaded to Cloudinary:", response.secure_url);

        // Remove the local file
        await fs.unlink(localFilePath);

        // Return essential response data
        return { url: response.url, secure_url: response.secure_url };

    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);

        // Cleanup temporary file on error
        try {
            await fs.unlink(localFilePath);
        } catch (unlinkError) {
            console.error("Error deleting local file:", unlinkError.message);
        }

        return null;
    }
};

export { uploadOnCloudinary };
