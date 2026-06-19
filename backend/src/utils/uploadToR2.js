const { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('../config/r2');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload a file buffer to R2
 * @param {Buffer} buffer - file buffer from multer memory storage
 * @param {string} folder - e.g. 'avatars', 'bugs', 'art'
 * @param {string} originalName - original filename for extension
 * @returns {string} public URL
 */
async function uploadToR2(buffer, folder, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: getContentType(ext),
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from R2 by its public URL
 * @param {string} publicUrl - full URL like https://assets.catoolu.quest/avatars/uuid.jpg
 */
async function deleteFromR2(publicUrl) {
  const key = publicUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '');
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }));
}

/**
 * Look up an object's size (bytes) from R2 by its public URL.
 * Returns 0 if the object is missing or the HEAD request fails.
 * @param {string} publicUrl
 * @returns {Promise<number>}
 */
async function getR2Size(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith(process.env.R2_PUBLIC_URL)) return 0;
  const key = publicUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '');
  try {
    const res = await r2.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
    return Number(res.ContentLength) || 0;
  } catch {
    return 0;
  }
}

function getContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

module.exports = { uploadToR2, deleteFromR2, getR2Size };