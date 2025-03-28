'use client';

import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { useRouter } from 'next/navigation';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleScan = (result: any) => {
    if (result) {
      if (result?.text?.includes('/list/devices/')) {
        router.push(result.text);
        onClose();
      }
    }
  };

  const handleError = (err: string | Error) => {
    console.error(err);
    setError('Kamera erişiminde hata oluştu.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">QR Kod Tara</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={handleScan}
            scanDelay={500}
            ViewFinder={() => <div className="border-2 border-blue-500 rounded-lg absolute inset-0 m-8" />}
            className="w-full h-full"
          />
        </div>
        
        {error && (
          <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}
        
        <p className="text-sm text-gray-500 mt-4">
          Aygıt QR kodunu kamera görüş alanına getirin
        </p>
      </div>
    </div>
  );
};

export default QRScanner;