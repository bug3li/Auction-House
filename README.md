<img width="1920" height="1032" alt="Screenshot 2026-04-18 005536 - Copy" src="https://github.com/user-attachments/assets/0239af27-3486-4f30-a5c7-dc9b35c66edb" />
<img width="1920" height="1032" alt="Screenshot 2026-04-18 005420" src="https://github.com/user-attachments/assets/362151f0-987f-4fc7-88a4-9273fcd5406f" />
<img width="1920" height="1009" alt="Screenshot 2026-04-18 005349" src="https://github.com/user-attachments/assets/593f5394-9356-45b8-a87c-1a334efefa82" />
<img width="1920" height="1009" alt="Screenshot 2026-04-18 005216" src="https://github.com/user-attachments/assets/b46322b1-2c2a-4fa4-b52e-0625a8260358" />
<img width="1920" height="1032" alt="Screenshot 2026-04-18 005150" src="https://github.com/user-attachments/assets/a2d84d1b-b2e9-49a4-bdc6-d99ecd0dd60a" />
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
