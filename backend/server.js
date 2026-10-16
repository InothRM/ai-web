import express from 'express';
import multer from 'multer';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT) || 3001;
const maxFileSize = 10 * 1024 * 1024;
const acceptedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const acceptedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const mockItems = [
  { name: 'Crispy cauliflower', price: 9.5 },
  { name: 'Margherita pizza', price: 16 },
  { name: 'Truffle fries', price: 8.5 },
  { name: 'Iced matcha', price: 6 },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter(_request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!acceptedExtensions.has(extension) || !acceptedMimeTypes.has(file.mimetype)) {
      callback(new Error('Choose a PDF, JPG, PNG, or WEBP receipt.'));
      return;
    }
    callback(null, true);
  },
});

function isValidReceiptFile(file) {
  const { buffer, mimetype } = file;

  if (mimetype === 'application/pdf') {
    return buffer.subarray(0, 5).toString() === '%PDF-';
  }

  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString() === 'RIFF'
      && buffer.subarray(8, 12).toString() === 'WEBP';
  }

  return false;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/api/receipt', upload.single('receipt'), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: 'Choose a receipt PDF or image to continue.' });
    return;
  }

  if (!isValidReceiptFile(request.file)) {
    response.status(400).json({ error: 'The selected file does not appear to be a valid PDF or image.' });
    return;
  }

  response.json({
    fileName: request.file.originalname,
    currency: 'USD',
    items: mockItems,
    tax: 3.2,
    tip: 6,
    mock: true,
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    response.status(413).json({ error: 'This file is over 10MB. Please choose a smaller receipt.' });
    return;
  }

  response.status(400).json({ error: error.message || 'The receipt could not be processed.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Receipt splitter API listening on http://127.0.0.1:${port}`);
});
