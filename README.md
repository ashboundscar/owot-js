# owot-js - OWOT Bot Library

> **Note:** This library is now actively maintained to support the latest features of OWOT (Our World Of Text).

## Installing

```bash
npm install owot-js
```

**Requires Node.js 12.0+!**

![Nodejs](https://img.shields.io/badge/-Node.js%2012.0%2B-brightgreen?style=for-the-badge&logo=node.js&labelColor=1a1a1a)

## Example

```js
const OWOTjs = require("owot-js");

const bot = new OWOTjs.Client({
    world: 'myworld',
    token: 'your-uvias-token', // Optional
    log: true
});

bot.on("join", () => {
    bot.chat.send("Hello World!");
});

bot.on("open", () => {
    bot.world.writeString("Welcome!", "#FF0000", 0, 0, 0, 0);
});
```

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `open` | none | WebSocket opened |
| `close` | none | WebSocket closed |
| `chat` | `data` | New message in chat |
| `chatdelete` | `data` | Chat message deleted |
| `tileUpdate` | `tiles` | New tile updates |
| `fetch` | `tiles` | Fetched tiles received |
| `join` | `id`, `channel` | Joined and got id |
| `user_count` | `count` | User count changed |
| `stats` | `data` | Stats response received |
| `cmd` | `data` | Command broadcast received |
| `cursor` | `data` | Cursor position update |
| `chathistory` | `data` | Chat history received |
| `writeResponse` | `data` | Write response (accepted/rejected) |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | string | `'https://ourworldoftext.com/'` | Origin URL |
| `ws` | string | auto-generated | WebSocket URL |
| `world` | string | `''` (main) | World name |
| `token` | string | `undefined` | Uvias authentication token |
| `color` | string | `'0'` | Default color |
| `log` | boolean | `true` | Enable logging |
| `hide` | boolean | `false` | Hide from online counter |
| `agent` | object | `undefined` | Proxy agent (e.g. HttpsProxyAgent) |

## Module Exports

Requiring the library returns an object with:

| Export | Type | Description |
|--------|------|-------------|
| `Client` | Class | Main client class |
| `CharQuota` | Class | Rate quota management |
| `Tiles` | TileSystem | Default TileSystem instance |
| `TileSystem` | Class | Tile management class |

---

# API Reference

## Client

### Client.player

Player information object:

| Property | Type | Description |
|----------|------|-------------|
| `nickname` | string | Player nickname |
| `chatColor` | number | Chat color |
| `color` | number | Default tile color |
| `id` | number | Player ID |
| `channel` | string | Current channel |
| `tileX` | number | Current tile X |
| `tileY` | number | Current tile Y |
| `charX` | number | Current character X within tile |
| `charY` | number | Current character Y within tile |
| `quota` | CharQuota | Rate quota manager |

### Client.net

Network configuration:

#### **WebSocket Client.net.ws**

WebSocket connection instance.

#### **Client.net.sendWrite(array edits, object options)**

Send write requests.

| Parameter | Type | Description |
|-----------|------|-------------|
| `edits` | Array | Array of edit items |
| `options.public_only` | boolean | Only write to public tiles |
| `options.preserve_links` | boolean | Preserve existing links |

#### **Array Client.net.writeBuffer**

Buffer for pending write operations.

#### **Number Client.net.writeSize**

Maximum edits per write request (default: 512).

#### **Client.net.flushWrites()**

Force flush pending writes.

#### **Client.net.setFlushInterval(Number newInterval)**

Set the flush interval in milliseconds.

---

### Client.chat

#### **Client.chat.send(String message, Boolean global = false)**

Sends a chat message.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | string | required | Message content |
| `global` | boolean | `false` | Send to global chat |

---

### Client.world

#### **Promise Client.world.getTile(Number tileX, Number tileY, Object options)**

Request the content of a tile. Returns cached tile if available.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tileX` | number | Tile X coordinate |
| `tileY` | number | Tile Y coordinate |
| `options.utf16` | boolean | Strip surrogates/combining chars |
| `options.array` | boolean | Split content into array |
| `options.content_only` | boolean | Return contents only |
| `options.concat` | boolean | Return joined contents |

#### **Promise Client.world.getChar(Number tileX, Number tileY, Number charX, Number charY)**

Retrieves a character at specified coordinates.

Returns: `{ char: ' ', color: 0 }`

#### **Promise Client.world.requestRectangle(Number minX, Number minY, Number maxX, Number maxY, Object options)**

Request content within a rectangular region.

| Parameter | Type | Description |
|-----------|------|-------------|
| `minX` | number | Minimum X coordinate |
| `minY` | number | Minimum Y coordinate |
| `maxX` | number | Maximum X coordinate |
| `maxY` | number | Maximum Y coordinate |
| `options` | object | Same options as getTile() |

#### **Boolean Client.world.move(Number tileX, Number tileY, Number charX, Number charY, Boolean hidden)**

Update cursor position and move player.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tileX` | number | `0` | Target tile X |
| `tileY` | number | `0` | Target tile Y |
| `charX` | number | `0` | Character X within tile |
| `charY` | number | `0` | Character Y within tile |
| `hidden` | boolean | `false` | Hide cursor |

#### **Boolean Client.world.writeChar(String char, String color, String bgColor, Number tileX, Number tileY, Number charX, Number charY)**

Write a single character.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `char` | string | `' '` | Character to write |
| `color` | string/number | `undefined` | Text color |
| `bgColor` | string/number | `undefined` | Background color (-1 for none) |
| `tileX` | number | required | Tile X coordinate |
| `tileY` | number | required | Tile Y coordinate |
| `charX` | number | required | Character X within tile |
| `charY` | number | required | Character Y within tile |

#### **Promise Client.world.writeString(String str, String color, String bgColor, Number tileX, Number tileY, Number charX, Number charY)**

Write a string (automatically handles quota limits).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `str` | string | `' '` | String to write |
| `color` | string/number | `undefined` | Text color |
| `bgColor` | string/number | `undefined` | Background color |
| `tileX` | number | required | Starting tile X |
| `tileY` | number | required | Starting tile Y |
| `charX` | number | required | Starting character X |
| `charY` | number | required | Starting character Y |

#### **Client.world.protectTile(Number tileX, Number tileY, Object options)**

Protect or unprotect a tile area. Requires owner/member permissions.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tileX` | number | Tile X coordinate |
| `tileY` | number | Tile Y coordinate |
| `options.action` | string | `'protect'` or `'unprotect'` |
| `options.type` | string | `'public'`, `'member-only'`, `'owner-only'` |
| `options.charX` | number | Character X (default: 0) |
| `options.charY` | number | Character Y (default: 0) |
| `options.charWidth` | number | Width in chars (default: 16) |
| `options.charHeight` | number | Height in chars (default: 8) |
| `options.precise` | boolean | Precise protection mode |

#### **Client.world.clearTile(Number tileX, Number tileY, Number charX, Number charY, Number charWidth, Number charHeight)**

Clear a rectangular area of tiles.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tileX` | number | required | Tile X coordinate |
| `tileY` | number | required | Tile Y coordinate |
| `charX` | number | `0` | Starting character X |
| `charY` | number | `0` | Starting character Y |
| `charWidth` | number | `16` | Width to clear |
| `charHeight` | number | `8` | Height to clear |

#### **Client.world.createLinkURL(String url, Number tileX, Number tileY, Number charX, Number charY)**

Create a URL link at specified coordinates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL to link to |
| `tileX` | number | Tile X coordinate |
| `tileY` | number | Tile Y coordinate |
| `charX` | number | Character X within tile |
| `charY` | number | Character Y within tile |

#### **Client.world.createLinkCoordinates(String url, Number linkTileX, Number linkTileY, Number tileX, Number tileY, Number charX, Number charY)**

Create a coordinate link.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL (can be relative) |
| `linkTileX` | number | Linked tile X |
| `linkTileY` | number | Linked tile Y |
| `tileX` | number | Source tile X |
| `tileY` | number | Source tile Y |
| `charX` | number | Source character X |
| `charY` | number | Source character Y |

#### **Client.world.requestChatHistory()**

Request chat history from the server. Emits `chathistory` event.

#### **Client.world.requestStats(Number id)**

Request world statistics. Emits `stats` event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Optional stats request ID |

#### **Client.world.setConfig(Object options)**

Configure content update subscriptions.

| Option | Type | Description |
|--------|------|-------------|
| `updates` | boolean | Enable/disable content updates |
| `localFilter` | boolean | Enable/disable local filtering |
| `directAdminUpdates` | boolean | Direct admin updates (superuser only) |
| `descriptiveCmd` | boolean | Descriptive commands (superuser only) |

#### **Client.world.setBoundary(Object options)**

Set view boundary and/or center.

| Option | Type | Description |
|--------|------|-------------|
| `centerX` | number | Center X coordinate |
| `centerY` | number | Center Y coordinate |
| `minX` | number | Minimum X boundary |
| `minY` | number | Minimum Y boundary |
| `maxX` | number | Maximum X boundary |
| `maxY` | number | Maximum Y boundary |

#### **Client.world.broadcastCmd(String data, Boolean includeUsername, Array coords)**

Broadcast a command to other clients. Emits `cmd` event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | string | Command data |
| `includeUsername` | boolean | Include username (requires auth) |
| `coords` | array | Optional coordinates [tileX, tileY, charX, charY] |

#### **Client.world.leave()**

Leave the current world (closes WebSocket).

#### **Number Client.world.userCount**

Current number of users in the world.

---

### Client.util

Utility methods:

#### **Array Client.util.chunkifyString(String message, Number quota)**

Split a string into chunks respecting quota limits.

#### **Number Client.util.rgbToInt(Number r, Number g, Number b)**

Convert RGB values to integer.

#### **Array Client.util.convertXY(Number x, Number y)**

Convert screen coordinates to [tileX, tileY, charX, charY].

#### **Array Client.util.convertPosition(Number tileX, Number tileY, Number charX, Number charY)**

Convert tile/char coordinates to flat [positionX, positionY].

#### **Array Client.util.getCursorPosition()**

Get current cursor position (browser only).

#### **Client.util.log(String msg)**

Log a message (if logging enabled).

---

## CharQuota

Rate quota management class:

```js
const { CharQuota } = require("owot-js");

const quota = new CharQuota(rate, time, infinite);
```

### Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `rate` | number | Characters allowed per period |
| `time` | number | Time period in milliseconds |
| `infinite` | boolean | Unlimited quota |

### Methods

#### **Boolean quota.canSpend(Number count)**

Check if quota allows spending `count` characters.

#### **Promise quota.waitUntilRestore()**

Wait asynchronously until quota is fully restored.

#### **Number quota.getTimeToRestore()**

Get milliseconds until quota is fully restored.

#### **quota.update()**

Manually update quota based on elapsed time.

---

## TileSystem

Tile management class:

```js
const { TileSystem, Tiles } = require("owot-js");

// Use default instance
const tile = Tiles.getTile(0, 0);

// Or create new instance
const myTiles = new TileSystem();
```

### Methods

#### **Array TileSystem.wrapStringTo16x16(String inputString, Array color)**

Wrap a string into a 16x16 grid (tile format).

#### **Object TileSystem.getChar(Number x, Number y, Array tile)**

Get character at position within a tile.

Returns: `{ char: ' ', color: 0 }`

#### **Array TileSystem.getTile(Number tileX, Number tileY)**

Get a cached tile.

#### **TileSystem.saveTile(String key, String content, Array color)**

Save a tile to cache.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Tile key (e.g., "0,0") |
| `content` | string | Tile content |
| `color` | array | Color array |

### Properties

#### **Object TileSystem.tiles**

Object containing all cached tiles.

---

## License

MIT License - See [LICENSE](../LICENSE) for details.

## Links

* [Our World of Text](https://ourworldoftext.com)
* [OWOT Wiki](https://wiki.ourworldoftext.com)
* [OWOT Discord](https://discord.gg/aqgH45B6W3)
* [Source Code](./index.js)
