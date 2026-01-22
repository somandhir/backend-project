import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log("ENV CHECK:", {
//   cloud: process.env.CLOUDINARY_CLOUD_NAME,
//   key: process.env.CLOUDINARY_API_KEY,
//   secret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING",
// } );

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    // console.log(" Uploaded to Cloudinary:", response.secure_url);

    //  safely delete temp file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    console.error(" Cloudinary upload failed:");
    console.error(error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

export { uploadOnCloudinary };
