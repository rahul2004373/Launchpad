import fs from 'fs-extra';
import path from 'path';
import {
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/s3.js';
import { logBuildStep } from './log.service.js';

// ── ContentType Map (as per guide §6.3) ──
const CONTENT_TYPE_MAP = {
    '.html':  'text/html',
    '.js':    'application/javascript',
    '.mjs':   'application/javascript',
    '.css':   'text/css',
    '.json':  'application/json',
    '.png':   'image/png',
    '.jpg':   'image/jpeg',
    '.jpeg':  'image/jpeg',
    '.gif':   'image/gif',
    '.svg':   'image/svg+xml',
    '.ico':   'image/x-icon',
    '.webp':  'image/webp',
    '.txt':   'text/plain',
    '.xml':   'application/xml',
    '.woff':  'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':   'font/ttf',
    '.eot':   'application/vnd.ms-fontobject',
    '.map':   'application/json',
};

const getContentType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
};

/**
 * Delete all existing objects in a deployment's S3 folder (for redeployments)
 */
const clearDeploymentFolder = async (deploymentId) => {
    const prefix = `${deploymentId}/`;
    const existing = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    }));

    if (existing.Contents && existing.Contents.length > 0) {
        await s3Client.send(new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: existing.Contents.map(obj => ({ Key: obj.Key })),
            },
        }));
    }
};

/**
 * Recursively list all files in a directory
 */
const getAllFiles = async (dirPath) => {
    let results = [];
    const list = await fs.readdir(dirPath);

    for (const file of list) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(await getAllFiles(filePath));
        } else {
            results.push(filePath);
        }
    }
    return results;
};

/**
 * Upload a local folder to S3 under the deployment's UUID folder
 * 
 * S3 structure:
 *   bucket/
 *     <deploymentId>/
 *       index.html
 *       static/
 *       assets/
 *       _next/
 *
 * @param {string} localPath - Absolute path to the build output folder
 * @param {string} deploymentId - UUID for this deployment
 * @returns {string} Public S3 website URL
 */
export const uploadFolderToS3 = async (localPath, deploymentId) => {
    if (!await fs.pathExists(localPath)) {
        throw new Error(`Build output directory not found: ${localPath}`);
    }

    await logBuildStep(deploymentId, 'Starting S3 upload');

    // Step 1: Clear old files (handles redeployments cleanly)
    await clearDeploymentFolder(deploymentId);

    // Step 2: Collect all files
    const files = await getAllFiles(localPath);

    if (files.length === 0) {
        throw new Error('Build output directory is empty — nothing to upload');
    }

    // Step 3: Upload all files with correct ContentType and CacheControl
    const BATCH_SIZE = 10;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (filePath) => {
            const relativePath = path.relative(localPath, filePath).replace(/\\/g, '/');
            const key          = `${deploymentId}/${relativePath}`;
            const contentType  = getContentType(filePath);
            const isHtml       = filePath.endsWith('.html');

            const command = new PutObjectCommand({
                Bucket:       BUCKET_NAME,
                Key:          key,
                Body:         fs.createReadStream(filePath),
                ContentType:  contentType,
                CacheControl: isHtml ? 'no-cache' : 'max-age=31536000',
            });

            await s3Client.send(command);
        }));
    }

    await logBuildStep(deploymentId, `Uploaded ${files.length} files to S3`);

    // Return the S3 website endpoint URL (supports routing fallback via error document)
    const region = await s3Client.config.region();
    return `http://${BUCKET_NAME}.s3-website.${region}.amazonaws.com/${deploymentId}/`;
};
