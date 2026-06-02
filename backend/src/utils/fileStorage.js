import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "medalert/records",
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          fileUrl: result.secure_url,
          cloudinaryPublicId: result.public_id
        });
      }
    );

    uploadStream.end(file.buffer);
  });

const uploadLocally = async (file, baseUrl) => {
  await fs.mkdir(uploadDir, { recursive: true });

  const safeExtension = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${nanoid(10)}${safeExtension}`;
  const targetPath = path.join(uploadDir, filename);

  await fs.writeFile(targetPath, file.buffer);

  return {
    fileUrl: `${baseUrl}/uploads/${filename}`,
    cloudinaryPublicId: null
  };
};

export const storeMedicalFile = async ({ file, baseUrl }) => {
  if (hasCloudinaryConfig) {
    return uploadToCloudinary(file);
  }

  return uploadLocally(file, baseUrl);
};
