import React, { useRef } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ product }) => {
  const canvasRef = useRef(null);

  const generateQR = async () => {
    try {
      const qrData = JSON.stringify({
        id: product._id,
        name: product.name,
        sku: product.sku || product._id,
        price: product.price,
        barcode: product.barcode
      });
      
      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      toast.success('QR Code generated!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-${product.sku || product._id}.png`;
    link.href = url;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${product.name}</title>
          <style>
            body { text-align: center; font-family: Arial, sans-serif; padding: 20px; }
            img { border: 2px solid #000; padding: 10px; }
            .info { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h2>${product.name}</h2>
          <img src="${url}" alt="QR Code" />
          <div class="info">
            <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
            <p><strong>Price:</strong> ₹${product.price}</p>
            <p><strong>Barcode:</strong> ${product.barcode || 'N/A'}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="text-center space-y-4">
      <canvas ref={canvasRef} className="mx-auto border-2 border-gray-300 rounded-lg"></canvas>
      <div className="flex space-x-2">
        <button
          onClick={generateQR}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Generate QR
        </button>
        <button
          onClick={downloadQR}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Download
        </button>
        <button
          onClick={printQR}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;

