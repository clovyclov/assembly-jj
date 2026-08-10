import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const LEADCONNECTOR_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/P7sCezLl1NDn8ujvBg1y/webhook-trigger/414b6507-d935-455f-9e4f-636b35813483';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle API submissions endpoint
  if (req.url === '/api/claim-pass' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Received Free Class Pass Claim:', data);

        const isKidsForm = data.formName === 'Kids Form' || data.formType === 'Kids Form' || data.targetAudience === 'child';
        const formType = isKidsForm ? 'Kids Form' : 'Adult Form';

        // Format payload for LeadConnector / HighLevel
        const webhookPayload = JSON.stringify({
          full_name: data.fullName || '',
          first_name: data.fullName ? data.fullName.split(' ')[0] : '',
          last_name: data.fullName ? data.fullName.split(' ').slice(1).join(' ') : '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age || '',
          target_audience: data.targetAudience || 'myself',
          form_name: formType,
          form_type: formType,
          source: 'Assembly Jiu Jitsu Bloomfield Landing Page'
        });

        // Forward payload to LeadConnector Webhook
        try {
          const webhookReq = https.request(LEADCONNECTOR_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(webhookPayload)
            }
          }, (webhookRes) => {
            console.log(`LeadConnector Webhook Response Status: ${webhookRes.statusCode}`);
          });

          webhookReq.on('error', (err) => {
            console.error('Webhook Error:', err.message);
          });

          webhookReq.write(webhookPayload);
          webhookReq.end();
        } catch (webhookErr) {
          console.error('Error triggering LeadConnector Webhook:', webhookErr);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Class pass reserved successfully!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON data' }));
      }
    });
    return;
  }

  // Clean URL path
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // If path exists and is a directory, serve index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file doesn't exist, try appending .html or index.html
  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      // Fallback to main index.html
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Assembly Jiu Jitsu Server running on http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
