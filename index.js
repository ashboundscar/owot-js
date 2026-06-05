let isBrowser = typeof window !== "undefined";
let EventEmitter, WebSocket, Chalk;

if (isBrowser) {
	!function (e) { "use strict"; function t() { } function n(e, t) { for (var n = e.length; n--;)if (e[n].listener === t) return n; return -1 } function r(e) { return function () { return this[e].apply(this, arguments) } } function i(e) { return "function" == typeof e || e instanceof RegExp || !(!e || "object" != typeof e) && i(e.listener) } var s = t.prototype, o = e.EventEmitter; s.getListeners = function (e) { var t, n, r = this._getEvents(); if (e instanceof RegExp) { t = {}; for (n in r) r.hasOwnProperty(n) && e.test(n) && (t[n] = r[n]) } else t = r[e] || (r[e] = []); return t }, s.flattenListeners = function (e) { var t, n = []; for (t = 0; t < e.length; t += 1)n.push(e[t].listener); return n }, s.getListenersAsObject = function (e) { var t, n = this.getListeners(e); return n instanceof Array && (t = {}, t[e] = n), t || n }, s.addListener = function (e, t) { if (!i(t)) throw new TypeError("listener must be a function"); var r, s = this.getListenersAsObject(e), o = "object" == typeof t; for (r in s) s.hasOwnProperty(r) && -1 === n(s[r], t) && s[r].push(o ? t : { listener: t, once: !1 }); return this }, s.on = r("addListener"), s.addOnceListener = function (e, t) { return this.addListener(e, { listener: t, once: !0 }) }, s.once = r("addOnceListener"), s.defineEvent = function (e) { return this.getListeners(e), this }, s.defineEvents = function (e) { for (var t = 0; t < e.length; t += 1)this.defineEvent(e[t]); return this }, s.removeListener = function (e, t) { var r, i, s = this.getListenersAsObject(e); for (i in s) s.hasOwnProperty(i) && -1 !== (r = n(s[i], t)) && s[i].splice(r, 1); return this }, s.off = r("removeListener"), s.addListeners = function (e, t) { return this.manipulateListeners(!1, e, t) }, s.removeListeners = function (e, t) { return this.manipulateListeners(!0, e, t) }, s.manipulateListeners = function (e, t, n) { var r, i, s = e ? this.removeListener : this.addListener, o = e ? this.removeListeners : this.addListeners; if ("object" != typeof t || t instanceof RegExp) s.call(this, t, n); else for (r in t) t.hasOwnProperty(r) && (i = t[r]) && ("function" == typeof i ? s.call(this, r, i) : o.call(this, r, i)); return this }, s.addEventWrapper = function (e) { var t = this; return function () { return t[e].apply(t, arguments) } }, t.extendEventEmitter = function (e, n) { var r = new t; for (var i in n) n.hasOwnProperty(i) && (r[i] = n[i]); e.prototype = r }, e.EventEmitter = t }(this);
	EventEmitter = this.EventEmitter;
	WebSocket = window.WebSocket;
} else {
	EventEmitter = require("events");
	WebSocket = require("ws");
	Chalk = require("chalk");
}

const PALETTE = [
	"#000000", "#000001", "#000080", "#0000FF", "#005080", "#008000", "#008080", "#0080FF",
	"#00AAFF", "#00CCC0", "#00D900", "#00FF00", "#00FFA2", "#00FFFF", "#123ABC", "#314159",
	"#404040", "#4433BB", "#671EF0", "#6E99CA", "#7FFF00", "#800000", "#800080", "#8000FF",
	"#804000", "#808000", "#808080", "#8080FF", "#87CEEB", "#902F39", "#BADD1E", "#C0C0C0",
	"#C0FFEE", "#D00000", "#FA531F", "#FACE98", "#FF0000", "#FF0080", "#FF00FF", "#FF8000",
	"#FF8080", "#FF93C3", "#FFC0CB", "#FFD700", "#FFFF00", "#FFFFFF"
].map(hex => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return { r, g, b, int: b | (g << 8) | (r << 16) };
});

class CharQuota {
	constructor(rate, time, infinite) {
		this.lastCheck = Date.now();
		this.allowance = rate;
		this.rate = rate;
		this.time = time;
		this.infinite = infinite;
	}
	update() {
		const currentTime = Date.now();
		this.allowance += (currentTime - this.lastCheck) * (this.rate / this.time);
		this.lastCheck = currentTime;
		if (this.allowance > this.rate) {
			this.allowance = this.rate;
		}
	}
	canSpend(count) {
		if (this.infinite) return true;
		this.update();
		if (this.allowance < count) return false;
		this.allowance -= count;
		return true;
	}
	getTimeToRestore() {
		if (this.allowance >= this.rate) return 0;
		return (this.rate - this.allowance) / (this.rate / this.time);
	}
	async waitUntilRestore() {
		const restoreTime = this.getTimeToRestore();
		await new Promise(resolve => setTimeout(resolve, restoreTime));
	}
}

class TileSystem {
	constructor() {
		this.tiles = {}
	}
	wrapStringTo16x16(inputString, color) {
		const result = [];
		let index = 0;
		if (!color) color = new Array(inputString.length).fill(0);
		for (let row = 0; row < 8; row++) {
			result[row] = [];
			for (let col = 0; col < 16; col++) {
				const colorIndex = index;
				if (index < inputString.length)
					result[row][col] = { char: inputString[index], color: color[colorIndex] };
				else
					result[row][col] = { char: ' ', color: null };
				index++;
			}
		}
		return result;
	}
	getChar(charX, charY, tile) {
		if (!tile || typeof tile.content !== 'string') return null;
		const index = (charY * 16) + charX;
		return {
			char: tile.content[index] || ' ',
			color: (tile.color && tile.color[index] !== undefined) ? tile.color[index] : null
		};
	}
	getTile(x, y) {
		return this.tiles[`${x},${y}`] || null;
	}
	saveTile(key, content, color, writability) {
		this.tiles[key] = {
			content: content,
			color: color || new Array(content.length).fill(0),
			writability: writability === undefined ? null : writability
		};
	}
}

const Tiles = new TileSystem();

class Client extends EventEmitter {
	constructor(options = {}) {
		super();

		this.player = {
			nickname: options.nickname || '',
			chatColor: options.chatColor || '#000000',
			id: null,
			channel: null,
			quota: new CharQuota(512, 1000)
		}

		if (!options.world) options.world = '';
		if (!options.color) options.color = '0';
		if (!options.log) options.log = true;
		if (!options.origin) options.origin = "https://ourworldoftext.com/";
		if (options.forcePalette === undefined) options.forcePalette = true;
		options.ws = options.ws || `wss://ourworldoftext.com/${options.world ? options.world + '/' : ''}ws/${options.hide ? '?hide=1' : ''}`;

		this.options = options;

		const parameters = [{
			headers: {
				'Cookie': typeof options.token == "undefined" ? '' : "token=" + options.token
			},
			agent: options.agent
		}];

		if (isBrowser) parameters.unshift(null);

		this.net = {
			ws: new WebSocket(this.options.ws, ...parameters),
			sendWrite: (edits, options) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const writeReq = {
					kind: "write",
					edits: edits
				}
				if (options) {
					if (options.public_only !== undefined) writeReq.public_only = options.public_only;
					if (options.preserve_links !== undefined) writeReq.preserve_links = options.preserve_links;
				}
				this.net.ws.send(JSON.stringify(writeReq));
			},
			writeBuffer: [],
			writeSize: 512,
			flushWrites() {
				if (!this.player || !this.player.quota) return;
				if (this.net.writeBuffer.length === 0) return;
				this.player.quota.update();
				const canSend = Math.floor(this.player.quota.allowance);

				const waveSize = Math.min(this.player.quota.rate, this.net.writeSize);

				if (canSend >= waveSize || (this.net.writeBuffer.length < waveSize && canSend >= this.net.writeBuffer.length)) {
					const amount = Math.min(this.net.writeBuffer.length, this.net.writeSize, canSend);
					if (amount > 0) {
						this.player.quota.canSpend(amount);
						const edits = this.net.writeBuffer.splice(0, amount);
						this.net.sendWrite(edits);
					}
				}
			},
			writeInterval: setInterval(() => {
				this.net.flushWrites();
			}, 1000 / 15),
			setFlushInterval(newInterval) {
				clearInterval(this.net.writeInterval);
				this.net.writeInterval = setInterval(() => {
					this.net.flushWrites();
				}, newInterval);
			},
			sequence: 1
		}

		this.net.flushWrites = this.net.flushWrites.bind(this);

		this.net.ws.onopen = () => {
			this.util.log(`WebSocket connected!`);
			this.emit("open");
		}
		this.net.ws.onerror = (err) => {
			this.util.log(`WebSocket error: ${err.message}`);
			this.emit("error", err);
		}
		this.net.ws.onmessage = (msg) => {
			let data = JSON.parse(msg.data);
			if (data.kind == "chat") {
				if (data.delete) this.emit("chatdelete", data);
				else this.emit("chat", data);
			}
			if (data.kind == "tileUpdate" || data.kind == "fetch") {
				this.emit("tileUpdate", data.tiles);
				for (const update in data.tiles) {
					if (!data.tiles[update]) continue;
					Tiles.saveTile(update, data.tiles[update].content, (data.tiles[update].properties || {}).color, (data.tiles[update].properties || {}).writability);
				}
				if (data.kind == "fetch") this.emit("fetch", data.tiles);
			}
			if (data.kind == "channel") {
				this.player.id = data.id;
				this.player.channel = data.channel;
				this.emit("join", data.id, data.channel);
			}
			if (data.kind == "user_count") {
				this.world.userCount = data.count;
				this.emit("user_count", data.count);
			}
			if (data.kind == "stats") this.emit("stats", data);
			if (data.kind == "cmd") this.emit("cmd", data);
			if (data.kind == "cursor") this.emit("cursor", data);
			if (data.kind == "chathistory") this.emit("chathistory", data);

			if (data.accepted || data.rejected) this.emit("writeResponse", data);
		}
		this.net.ws.onclose = () => {
			this.util.log("WebSocket disconnected!");
			this.emit("close");
		}

		this.chat = {
			send: (message, global = false) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return;
				this.net.ws.send(JSON.stringify({
					kind: "chat",
					message: message,
					location: global ? "global" : "page",
					color: this.player.chatColor,
					nickname: this.player.nickname
				}));
				return true;
			}
		}
		this.world = {
			userCount: 0,
			leave: () => {
				this.net.ws.close();
				this.emit("close");
			},
			getTile: (tileX, tileY, options) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const existingTile = Tiles.getTile(tileX, tileY);
				if (existingTile) return existingTile;
				const fetchOptions = {
					fetchRectangles: [{ minX: tileX, minY: tileY, maxX: tileX, maxY: tileY }],
					kind: "fetch"
				};
				if (options) {
					if (options.utf16 !== undefined) fetchOptions.utf16 = options.utf16;
					if (options.array !== undefined) fetchOptions.array = options.array;
					if (options.content_only !== undefined) fetchOptions.content_only = options.content_only;
					if (options.concat !== undefined) fetchOptions.concat = options.concat;
				}
				return new Promise((resolve, reject) => {
					this.net.ws.send(JSON.stringify(fetchOptions));
					const fn = (...args) => {
						const updates = args[0];
						for (const update in updates) {
							const [tileUpdateY, tileUpdateX] = update.split(",").map(coord => parseInt(coord));
							if (tileUpdateX !== tileX || tileUpdateY !== tileY) continue;
							this.off("fetch", fn);
							if (updates[update]) Tiles.saveTile(`${tileX},${tileY}`, updates[update].content, (updates[update].properties || {}).color, (updates[update].properties || {}).writability);
							resolve(Tiles.getTile(tileX, tileY));
						}
					}
					this.on("fetch", fn);
				});
			},
			getChar: async (tileX, tileY, charX, charY) => {
				if (typeof charX === 'undefined' || typeof charY === 'undefined') {
					[tileX, tileY, charX, charY] = this.util.convertXY(tileX, tileY);
				}
				charX = Math.abs(charX);
				charY = Math.abs(charY);
				const tile = await this.world.getTile(tileX, tileY);
				return Tiles.getChar(charX, charY, tile);
			},
			requestRectangle: (minX, minY, maxX, maxY, options) => {
				return new Promise((resolve, reject) => {
					if (this.net.ws.readyState !== WebSocket.OPEN) reject(new Error("WebSocket connection is not open"));
					const fetchOptions = {
						fetchRectangles: [{ minX, minY, maxX, maxY }],
						kind: "fetch"
					};
					if (options) {
						if (options.utf16 !== undefined) fetchOptions.utf16 = options.utf16;
						if (options.array !== undefined) fetchOptions.array = options.array;
						if (options.content_only !== undefined) fetchOptions.content_only = options.content_only;
						if (options.concat !== undefined) fetchOptions.concat = options.concat;
					}
					this.net.ws.send(JSON.stringify(fetchOptions));
					const fn = (...args) => {
						const updates = args[0];
						let fetchedChunks = [];
						for (const update in updates) {
							const [updateY, updateX] = update.split(",").map(coord => parseInt(coord)); if (updateX >= minX && updateY >= minY && updateX <= maxX && updateY <= maxY) {
								if (updates[update]) fetchedChunks.push(updates[update]);
							}
						}
						if (fetchedChunks.length > 0) {
							this.off("fetch", fn);
							resolve(fetchedChunks);
						}
					}
					this.on("fetch", fn);
				});
			},
			move: (tileX = 0, tileY = 0, charX = undefined, charY = undefined, hidden = false) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				if (typeof charX === 'undefined' || typeof charY === 'undefined') {
					[tileX, tileY] = this.util.convertXY(tileX, tileY);
					charX = 0; charY = 0;
				}
				if (hidden) {
					this.net.ws.send(JSON.stringify({ kind: "cursor", hidden: true, channel: this.player.channel }));
				} else {
					this.net.ws.send(JSON.stringify({
						kind: "cursor",
						position: { tileX, tileY, charX, charY },
						channel: this.player.channel
					}));
				}
				return true;
			},
			writeChar: (char = ' ', color, bgColor, tileX, tileY, charX, charY) => {
				const processedColor = this.options.forcePalette ? this.util.getNearestColor(color) : (typeof color !== 'number' ? this.util.hexToInt(color) : color);
				const processedBgColor = (bgColor === undefined || bgColor === -1) ? -1 : (this.options.forcePalette ? this.util.getNearestColor(bgColor) : (typeof bgColor !== 'number' ? this.util.hexToInt(bgColor) : bgColor));
				const editItem = this.world.createEditItem(char, processedColor, processedBgColor, tileX, tileY, charX, charY);
				this.net.writeBuffer.push(editItem);
				return true;
			},
			writeString: async (str = ' ', color, bgColor, tileX, tileY, charX, charY) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				if (typeof charX === 'undefined' || typeof charY === 'undefined') {
					[tileX, tileY, charX, charY] = this.util.convertXY(tileX, tileY);
				}
				const chars = Array.from(str);
				for (const char of chars) {
					let [x, y] = this.util.convertPosition(tileX, tileY, charX, charY);
					const [newTileX, newTileY, newCharX, newCharY] = this.util.convertXY(x, y);
					if (!this.player.quota.canSpend(1)) {
						await this.player.quota.waitUntilRestore();
					}
					this.world.writeChar(char, color, bgColor, newTileX, newTileY, newCharX, newCharY);
					charX++;
					if (charX >= 16) {
						charX = 0;
						tileX++;
					}
				}
				return true;
			},
			createEditItem: (char = ' ', color, bgColor, tileX, tileY, charX, charY) => { return [tileY, tileX, charY, charX, Date.now(), char, this.net.sequence++, color || 0, bgColor === undefined ? -1 : bgColor]; },
			editMessage: (editItems) => {
				const MAX_EDITS_PER_MESSAGE = this.player.quota.rate;
				let messages = [];
				for (let i = 0; i < editItems.length; i += MAX_EDITS_PER_MESSAGE) {
					messages.push({ kind: "write", edits: editItems.slice(i, i + MAX_EDITS_PER_MESSAGE) });
				}
				return messages;
			},
			protectTile: (tileX, tileY, options = {}) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const action = options.action || 'protect';
				const type = options.type || 'public';
				const charX = options.charX !== undefined ? options.charX : 0;
				const charY = options.charY !== undefined ? options.charY : 0;
				const charWidth = options.charWidth !== undefined ? options.charWidth : 16;
				const charHeight = options.charHeight !== undefined ? options.charHeight : 8;
				const precise = options.precise !== undefined ? options.precise : false;
				this.net.ws.send(JSON.stringify({
					kind: "protect",
					data: { action, tileX, tileY, charX, charY, charWidth, charHeight, precise, type }
				}));
				return true;
			},
			createLinkURL: (url, tileX, tileY, charX, charY) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				this.net.ws.send(JSON.stringify({ kind: "link", data: { tileY, tileX, charY, charX, url: url }, type: "url" }));
				return true
			},
			createLinkCoordinates: (url, linkTileX, linkTileY, tileX, tileY, charX, charY) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				this.net.ws.send(JSON.stringify({ kind: "link", data: { tileY, tileX, charY, charX, link_tileX: linkTileX, link_tileY: linkTileY, url: url, relative: false }, type: "coord" }));
				return true
			},
			requestChatHistory: () => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				this.net.ws.send(JSON.stringify({ kind: "chathistory" }));
				return true;
			},
			requestStats: (id) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const data = { kind: "stats" };
				if (id !== undefined) data.id = id;
				this.net.ws.send(JSON.stringify(data));
				return true;
			},
			setConfig: (options) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const config = { kind: "config" };
				if (options.updates !== undefined) config.updates = options.updates;
				if (options.localFilter !== undefined) config.localFilter = options.localFilter;
				if (options.directAdminUpdates !== undefined) config.directAdminUpdates = options.directAdminUpdates;
				if (options.descriptiveCmd !== undefined) config.descriptiveCmd = options.descriptiveCmd;
				this.net.ws.send(JSON.stringify(config));
				return true;
			},
			setBoundary: (options) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const boundary = { kind: "boundary" };
				if (options.centerX !== undefined) boundary.centerX = options.centerX;
				if (options.centerY !== undefined) boundary.centerY = options.centerY;
				if (options.minX !== undefined || options.minY !== undefined || options.maxX !== undefined || options.maxY !== undefined) {
					boundary.minX = options.minX !== undefined ? options.minX : 0;
					boundary.minY = options.minY !== undefined ? options.minY : 0;
					boundary.maxX = options.maxX !== undefined ? options.maxX : 0;
					boundary.maxY = options.maxY !== undefined ? options.maxY : 0;
				}
				this.net.ws.send(JSON.stringify(boundary));
				return true;
			},
			broadcastCmd: (data, includeUsername, coords) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				const cmd = { kind: "cmd", data: data };
				if (includeUsername !== undefined) cmd.include_username = includeUsername;
				if (coords !== undefined) cmd.coords = coords;
				this.net.ws.send(JSON.stringify(cmd));
				return true;
			},
			clearTile: (tileX, tileY, charX = 0, charY = 0, charWidth = 16, charHeight = 8) => {
				if (this.net.ws.readyState !== WebSocket.OPEN) return false;
				this.net.ws.send(JSON.stringify({ kind: "clear_tile", data: { tileX, tileY, charX, charY, charWidth, charHeight } }));
				return true;
			},
		}
		this.util = {
			getNearestColor: (color) => {
				if (typeof color !== 'number') color = this.util.hexToInt(color);
				const r = (color >> 16) & 0xFF;
				const g = (color >> 8) & 0xFF;
				const b = color & 0xFF;

				let minDistance = Infinity;
				let nearest = PALETTE[0].int;

				for (const p of PALETTE) {
					const dist = Math.pow(r - p.r, 2) + Math.pow(g - p.g, 2) + Math.pow(b - p.b, 2);
					if (dist < minDistance) {
						minDistance = dist;
						nearest = p.int;
					}
				}
				return nearest;
			},
			chunkifyString: (message, quota) => {
				let chunks = [];
				for (let i = 0, len = message.length; i < len; i += quota) {
					chunks.push(message.substring(i, i + quota));
				}
				return chunks;
			},
			hexToInt: (hex) => {
				if (typeof hex === 'number') return Math.floor(hex);
				if (!hex) return 0;
				hex = hex.toString().trim();
				if (hex.startsWith('0x')) return parseInt(hex, 16) || 0;
				if (hex.startsWith('#')) hex = hex.slice(1);
				if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
				if (hex.length !== 6) return 0;
				return Math.max(0, Math.min(16777215, parseInt(hex, 16) || 0));
			},
			rgbToInt: (r, g, b) => {
				return b | g << 8 | r << 16;
			},
			convertXY: (x, y) => {
				let tileX = Math.floor(x / 16);
				let tileY = Math.floor(y / 8);
				let charX = x % 16;
				let charY = y % 8;
				if (charX < 0) charX += 16;
				if (charY < 0) charY += 8;
				return [tileX, tileY, charX, charY];
			},
			convertPosition: (tileX, tileY, charX, charY) => [tileX * 16 + charX, tileY * 8 + charY],
			log: (msg) => {
				if (!this.options.log) return;
				msg = "[OWOT.js] " + msg;
				if (isBrowser) console.log('%c ' + msg, "color: #00ff00");
				else console.log(Chalk.green(msg));
			}
		}
	}
}

if (isBrowser) window.OWOTjs = { Client: Client, Tiles, TileSystem }
else {
	module.exports = { Client, CharQuota, Tiles, TileSystem }
}