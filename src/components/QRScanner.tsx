'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render((text) => {
      if (text.includes('/list/devices/')) {
        scanner.clear();
        router.push(text);
        onClose();
      }
    }, () => {});

    return () => {
      scanner.clear();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">QR Kod Tara</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div id="reader"></div>
        
        <p className="text-sm text-gray-500 mt-4 text-center">
          QR kodu kameraya yaklaştırın ve sabit tutun
        </p>
      </div>
    </div>
  );
};

export default QRScanner;