const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Local temp storage (before uploading to Cloudinary)
const upload = multer({ dest: "uploads/" });

module.exports = { cloudinary, upload };
