const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const nodemailer = require('nodemailer');

const DATA_FILE = path.join(__dirname, '..', 'data', 'aspirantes.json');
const PORT = process.env.PORT || 3000;
const EMAIL_TO = 'dcsescuadron71@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function createEmailHtml(data) {
  const rows = Object.entries(data)
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      return `<tr><th style="text-align:left; padding:6px; color:#1f2937;">${label}</th><td style="padding:6px; color:#374151;">${displayValue || '—'}</td></tr>`;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif; color:#111827;">
      <h2 style="color:#0f172a;">Nuevo Aspirante</h2>
      <p>Se ha registrado un nuevo aspirante en el formulario del Escuadrón 71.</p>
      <table style="border-collapse:collapse; width:100%; max-width:700px;">
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && reqUrl.pathname === '/api/aspirantes') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const incoming = JSON.parse(body);
        const data = readData();

        const duplicateKey = normalize(incoming.correo || incoming.callsign || incoming.nombre || '');
        const exists = data.some((item) => normalize(item.correo) === duplicateKey || normalize(item.callsign) === normalize(incoming.callsign));

        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, message: 'Este aspirante ya fue registrado.' }));
          return;
        }

        data.push(incoming);
        writeData(data);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: EMAIL_TO,
            subject: 'Nuevo Aspirante',
            html: createEmailHtml(incoming),
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Solicitud enviada correctamente.' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'No se pudo procesar la solicitud.' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/aspirantes') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readData()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
