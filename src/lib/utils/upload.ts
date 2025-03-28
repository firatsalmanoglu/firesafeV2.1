// lib/utils/upload.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadPhoto(file: File): Promise<string> {
    try {
        // File'ı buffer'a çevir
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Base64'e çevir
        const base64Data = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64Data}`;

        // Cloudinary'ye yükle
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'devices',
        });

        return result.secure_url;
    } catch (error) {
        console.error('Photo upload error:', error);
        throw new Error('Photo upload failed');
    }
}