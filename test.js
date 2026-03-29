const { Client } = require("./index.js");

// Configuration
const WORLD = ""; // Empty string = main world
const TILE_X = 30;
const TILE_Y = 30;
const MESSAGE = "Hello from OWOT-JS!";
const COLOR = "#00FF00"; // Green

// Create client
const client = new Client({
    world: WORLD,
    log: true,
    color: "0"
});

// Handle connection
client.on("open", () => {
    console.log("Connected to OWOT!");
    
    setTimeout(() => {
        console.log(`Writing "${MESSAGE}" at tile (${TILE_X}, ${TILE_Y})...`);
        
        // Write the message
        client.world.writeString(MESSAGE, COLOR, TILE_X, TILE_Y, 0, 0)
            .then(() => {
                console.log("Message written successfully!");
                
                // Wait for writes to flush
                setTimeout(() => {
                    console.log("Test complete. Disconnecting...");
                    client.world.leave();
                    process.exit(0);
                }, 2000);
            })
            .catch(err => {
                console.error("Error writing message:", err);
                client.world.leave();
                process.exit(1);
            });
    }, 1000);
});

// Handle errors
client.on("close", () => {
    console.log("Disconnected from OWOT");
});

// Listen for write responses
client.on("writeResponse", (data) => {
    if (data.rejected && Object.keys(data.rejected).length > 0) {
        console.warn("Some edits were rejected:", data.rejected);
    }
    if (data.accepted && data.accepted.length > 0) {
        console.log(`Accepted ${data.accepted.length} edits`);
    }
});

// Handle chat messages (optional)
client.on("chat", (data) => {
    console.log(`[Chat] ${data.nickname}: ${data.message}`);
});

console.log("Connecting to Our World Of Text...");