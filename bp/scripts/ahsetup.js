import { world, system } from "@minecraft/server";
import { Database } from "../util/cooldatabase.js";

// Listen for chat messages to trigger setup manually
world.beforeEvents.chatSend.subscribe((event) => {
    const { message, sender } = event;

    // Check for the setup trigger (e.g., !setupah)
    // Only allow players with administrative permissions (op) to run this
    if (message.startsWith("!setupah") && sender.isOp()) {
        event.cancel = true; // Hide the command from chat

        // Use system.run to execute logic safely outside the read-only beforeEvent
        system.run(() => {
            const block = sender.getBlockFromViewDirection()?.block;

            if (!block || block.typeId !== "minecraft:chest") {
                sender.sendMessage("§cPlease look at the FIRST chest (the origin) before running this!");
                return;
            }

            // In this example, we will use the player's current looking position 
            // and relative offsets to define the direction. 
            // You can also hardcode these or use specific coordinates.

            const location = {
                x: Math.floor(block.location.x),
                y: Math.floor(block.location.y),
                z: Math.floor(block.location.z)
            };

            // Define where the next chest should be relative to the first.
            // For example: 1 block away on the X axis.
            const nextLocation = {
                x: location.x - 1,
                y: location.y,
                z: location.z
            };

            // Define the secondary offset (e.g., for the other side of a double chest)
            // For example: 1 block away on the Z axis.
            const nextLocation2 = {
                x: location.x,
                y: location.y,
                z: location.z - 1
            };

            // 1. Store the initial two chest locations in the database
            Database.set("ah_chestlocations", [location, nextLocation]);

            // 2. Calculate and store the 'direction' vectors.
            // This math allows the AuctionHouse.createNextChest() method to 
            // mathematically predict where the 3rd, 4th, and 5th chests go.
            Database.set("ah_chestdirections", [
                {
                    x: Math.floor(location.x - nextLocation.x),
                    y: Math.floor(location.y - nextLocation.y),
                    z: Math.floor(location.z - nextLocation.z),
                },
                {
                    x: Math.floor(location.x - nextLocation2.x),
                    y: Math.floor(location.y - nextLocation2.y),
                    z: Math.floor(location.z - nextLocation2.z),
                },
            ]);

            sender.sendMessage("§aAuction House setup complete!");
            sender.sendMessage(`§7Origin: ${location.x}, ${location.y}, ${location.z}`);
            sender.sendMessage("§7Auto-generation vectors saved to database.");
        });
    }
});