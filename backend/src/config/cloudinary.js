const cloudinary = require("cloudinary").v2;

// Verify environment variables
console.log("Cloudinary Config:");
console.log({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret_exists: !!process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single file buffer to Cloudinary.
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {String} folder - cloudinary folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = (buffer, folder = "rentride/cars") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("\n========== CLOUDINARY UPLOAD ERROR ==========");
          console.error("Full Error Object:");
          console.dir(error, { depth: null });

          console.error("\nError Details:");
          console.error("Name:", error.name);
          console.error("Message:", error.message);
          console.error("HTTP Code:", error.http_code);
          console.error("Status Code:", error.statusCode);
          console.error("Error:", error.error);
          console.error("Response:", error.response);

          if (error.response?.body) {
            console.error("Response Body:");
            console.dir(error.response.body, { depth: null });
          }

          console.error("=============================================\n");

          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.on("error", (err) => {
      console.error("Cloudinary Stream Error:");
      console.dir(err, { depth: null });
      reject(err);
    });

    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public ID.
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary Delete Result:", result);
  } catch (err) {
    console.error("\n========== CLOUDINARY DELETE ERROR ==========");
    console.dir(err, { depth: null });
    console.error("=============================================\n");
  }
};

/**
 * Extract Cloudinary public ID from URL.
 */
const extractPublicId = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
};