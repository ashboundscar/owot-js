const { Client } = require("./index.js");

// Configuration
const WORLD = "scar17off"; // Empty string = main world
const POSITION = [1, -1, 1, 0]; // [tile x, tile y, char x, char y]
const MESSAGE = "Hello from OWOT-JS!";

// Create client
const client = new Client({
    world: WORLD,
    log: true
});

// Handle connection
client.on("join", (id) => {
    console.log(`Connected to OWOT as user ${id}!`);
    
    console.log(`Writing "${MESSAGE}" at position (${POSITION.join(", ")})...`);
    
    // Write the message
    client.world.writeString(MESSAGE, 0, ...POSITION)
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

    client.chat.send("Hello everyone! This is a test message from OWOT-JS.", false);
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