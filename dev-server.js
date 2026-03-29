import * as fs from "node:fs/promises";
import * as http from "node:http";
import * as path from "node:path";
import * as stream from "node:stream/promises";
import * as tls from "node:tls";

import mime from "mime";
import split from "split";
import { WebSocketServer } from "ws";

const WS_BAD_GATEWAY = 1014;

const usage = `usage: [options...] [host]

Starts an HTTP server delivering static files. If [host] is specified, the
server will proxy WebSocket connections to the specified remote IRC server.

Options:
  -p <port>  Listening port (default: 8080)
  -h         Show help message
`;

let localPort = 8080;
let remoteHost;
let remotePort = 6697;

let args = process.argv.slice(2);
while (args.length > 0 && args[0].startsWith("-")) {
	switch (args[0]) {
	case "-p":
		localPort = parseInt(args[1], 10);
		args = args.slice(2);
		break;
	default:
		console.log(usage);
		process.exit(args[0] === "-h" ? 0 : 1);
	}
}
remoteHost = args[0];

async function serveFile(res, filename) {
	let contentType = mime.getType(filename);
	if (contentType?.startsWith("text/")) {
		contentType += "; charset=utf-8";
	}
	if (contentType) {
		res.setHeader("Content-Type", contentType);
	} else {
		res.removeHeader("Content-Type");
	}

	let file;
	try {
		file = await fs.open(filename);
		await stream.pipeline(file.createReadStream(), res, { end: false });
		res.end(); // only end stream if pipeline was successful
	} finally {
		await file?.close();
	}
}

let server = http.createServer(async (req, res) => {
	let url = new URL(req.url, "http://localhost");
	let filename = path.join(".", url.pathname);

	try {
		try {
			await serveFile(res, filename);
		} catch (err) {
			if (err.code === "EISDIR") {
				await serveFile(res, path.join(filename, "index.html"));
			} else {
				throw err;
			}
		}
	} catch (err) {
		if (err.code === "ENOENT") {
			res.statusCode = 404;
			res.end("Not found");
		} else {
			console.error(err);
			res.statusCode = 500;
			res.end("Internal server error");
		}
	}
});

if (remoteHost) {
	let wsServer = new WebSocketServer({ server });
	wsServer.on("connection", (ws) => {
		let client = tls.connect(remotePort, remoteHost, {
			ALPNProtocols: ["irc"],
		});

		ws.on("message", (data) => {
			client.write(data.toString() + "\r\n");
		});

		ws.on("close", () => {
			client.destroy();
		});

		client.pipe(split()).on("data", (data) => {
			ws.send(data.toString());
		});

		client.on("end", () => {
			ws.close();
		});

		client.on("error", (err) => {
			console.log(err);
			ws.close(WS_BAD_GATEWAY);
		});
	});
}

server.listen(localPort, "localhost");

let msg = "HTTP server listening on http://localhost:" + localPort;
if (remoteHost) {
	msg += " and proxying WebSockets to " + remoteHost;
}
console.log(msg);
