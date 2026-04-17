# Minecraft Bedrock Auction House System

A high-performance, chest-form-based Auction House system for Minecraft Bedrock Edition. This system utilizes physical storage chests for item persistence and a robust database-backed metadata layer.

## 🚀 Features

* **Chest GUI Interface:** Native-feeling UI using `ChestFormData`.
* **Dynamic Scaling:** Automatically generates new physical chests as the AH fills up.
* **Persistent Meta-Data:** Stores costs, owner IDs, and listing times in a custom Database.
* **Search & Filters:** Real-time search by name, type, enchantments, or damage.
* **Automatic Item Shifting:** Keeps the UI clean by shifting items forward when a listing is bought.
* **Expiration Logic:** Items expire after 24 hours, allowing owners to reclaim them.
* **Seller Tools:** Manage your own listings, update prices, or cancel sales in real-time.

## 📂 Installation

1.  Ensure your project includes the required utilities:
    * `../util/cooldatabase.js` (Persistent storage)
    * `../util/extensions/forms.js` (Chest UI library)
    * `../util/playerlookup.js` (Player name/ID mapping)
2.  Import and initialize the `AuctionHouse` class in your main script.

## 💾 Data & Persistence

### Player Lookup Cache
The system uses a `PlayerLookup` utility to map UUIDs to player names. To ensure names are available for offline sellers, hook into the `playerLeave` event:

```javascript
import { world } from "@minecraft/server";
import { PlayerLookup } from "./util/playerlookup";

world.beforeEvents.playerLeave.subscribe((event) => {
    PlayerLookup.saveToCache(event.player);
});
