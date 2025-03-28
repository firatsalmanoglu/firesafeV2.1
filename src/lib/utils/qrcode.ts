// lib/utils/qrcode.ts
import QRCode from 'qrcode';

export async function generateQRCode(serialNumber: string): Promise<string> {
    try {
        // QR kod içeriği oluştur
        const qrContent = {
            serialNumber,
            timestamp: new Date().toISOString()
        };

        // QR kodu base64 formatında oluştur
        const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrContent));
        return qrCodeBase64;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('QR Code generation failed');
    }
}