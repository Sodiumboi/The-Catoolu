const { S3Client } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  // Lazy provider — defers resolution until first send(), avoids startup crash
  // and strips whitespace that can come from .env file formatting.
  credentials: async () => {
    const accessKeyId     = (process.env.R2_ACCESS_KEY_ID     || '').trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials are not configured — set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env');
    }
    return { accessKeyId, secretAccessKey };
  },
});

module.exports = r2;