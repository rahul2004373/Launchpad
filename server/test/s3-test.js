import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ── Load .env FIRST, before anything else ──
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("❌ Failed to load .env file:", result.error.message);
    process.exit(1);
}

// ── Now import AWS SDK (after env is loaded) ──
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ── Debug: Print exactly what was loaded ──
console.log("───────── ENV DEBUG ─────────");
console.log(`ENV File:     ${envPath}`);
console.log(`ACCESS_KEY:   ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.slice(0, 8) + '...' : '❌ UNDEFINED'}`);
console.log(`SECRET_KEY:   ${process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.slice(0, 8) + '...' : '❌ UNDEFINED'}`);
console.log(`REGION:       ${process.env.AWS_REGION || '❌ UNDEFINED'}`);
console.log(`BUCKET:       ${process.env.AWS_BUCKET_NAME || '❌ UNDEFINED'}`);
console.log("─────────────────────────────\n");

// ── Create a fresh S3 client using env vars directly ──
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function testS3Connection() {
    const testFilePath = path.resolve(__dirname, 'minimal.html');
    const key = 'test/minimal.html';

    try {
        if (!fs.existsSync(testFilePath)) {
            throw new Error(`Test file not found at ${testFilePath}`);
        }

        console.log(`📤 Uploading to: s3://${BUCKET_NAME}/${key}`);

        const fileContent = fs.readFileSync(testFilePath);

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: 'text/html',
        });

        const response = await s3Client.send(command);

        console.log("\n✅ SUCCESS! AWS S3 is working.");
        console.log(`- RequestId: ${response.$metadata.requestId}`);

        const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`\n🔗 Live: ${publicUrl}`);

    } catch (error) {
        console.error("\n❌ S3 TEST FAILED!");
        console.error(`Name:    ${error.name}`);
        console.error(`Message: ${error.message}`);

        if (error.name === 'SignatureDoesNotMatch') {
            console.error("\n💡 Your SECRET_ACCESS_KEY is WRONG. Go to AWS Console → IAM → Users → Security Credentials → Create new access key.");
        } else if (error.name === 'InvalidAccessKeyId') {
            console.error("\n💡 Your ACCESS_KEY_ID is WRONG or deactivated.");
        } else if (error.name === 'NoSuchBucket') {
            console.error("\n💡 Bucket doesn't exist. Check AWS_BUCKET_NAME.");
        }
    }
}

testS3Connection();
