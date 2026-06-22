const http = require('http');
const fs = require('fs').promises;
const path = require('path');


'use strict';

/**
 * Simple starter Node.js app (index.js)
 * - CLI: node index.js [start|read|write] [args...]
 * - start: starts HTTP server on PORT (default 3000)
 * - read: prints contents of data.json
 * - write <json>: writes JSON to data.json
 */


const DATA_FILE = path.resolve(__dirname, 'data.json');
const PORT = Number(process.env.PORT || 3000);

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify({ items: [] }, null, 2), 'utf8');
    }
}

async function readData() {
    await ensureDataFile();
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
}

async function writeData(obj) {
    await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function startServer(port = PORT) {
    const server = http.createServer(async (req, res) => {
        try {
            if (req.method === 'GET' && req.url === '/api') {
                const data = await readData();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
                return;
            }

            if (req.method === 'POST' && req.url === '/api') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    const payload = JSON.parse(body || '{}');
                    const data = await readData();
                    data.items.push(payload);
                    await writeData(data);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true, item: payload }));
                });
                return;
            }

            // Default response
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello from index.js\nUse /api (GET, POST)');
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
        }
    });

    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
}

async function main() {
    const [, , cmd, ...rest] = process.argv;
    if (!cmd || cmd === 'start') {
        startServer();
        return;
    }

    if (cmd === 'read') {
        try {
            const data = await readData();
            console.log(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Read error:', err);
        }
        return;
    }

    if (cmd === 'write') {
        try {
            const jsonText = rest.join(' ') || '{}';
            const obj = JSON.parse(jsonText);
            await writeData(obj);
            console.log('Wrote data.json');
        } catch (err) {
            console.error('Write error:', err);
        }
        return;
    }

    console.log('Usage: node index.js [start|read|write <json>]');
}

main();