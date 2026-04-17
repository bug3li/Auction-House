import "./saveplayers.js"

import { world, system } from "@minecraft/server";
import { AuctionHouse } from "./ah_script.js"; // Adjust the path as needed

// Example: Triggering the Auction House via a chat command
world.beforeEvents.chatSend.subscribe((event) => {
    const { message, sender } = event;

    if (message.startsWith("!ah")) {
        event.cancel = true; // Prevents the message from appearing in chat

        // We run the form on the next tick to avoid UI conflicts with chat
        system.run(() => {
            const ah = new AuctionHouse(sender);
            ah.show(); // Opens the main Auction House GUI
        });
    }

    if (message.startsWith("!sell")) {
        event.cancel = true;
        const args = message.split(" ");
        const price = parseInt(args[1]);

        if (isNaN(price) || price <= 0) {
            sender.sendMessage("§cUsage: !sell <price>");
            return;
        }

        system.run(() => {
            const inventory = sender.getComponent("inventory").container;
            const item = inventory.getItem(sender.selectedSlotIndex);

            if (!item) {
                sender.sendMessage("§cHold an item in your hand to sell!");
                return;
            }

            const ah = new AuctionHouse(sender);
            // List the item and remove it from player's hand
            ah.list(item, price);
            inventory.setItem(sender.selectedSlotIndex, undefined);
            sender.sendMessage(`§aItem listed for $${price}!`);
        });
    }
});