# Minecraft Bedrock Auction House System

A robust, chest-form-based Auction House system for Minecraft Bedrock Edition servers. This system utilizes physical chest locations for item storage and a database-backed metadata system to handle listings, pricing, and expirations.

## 🚀 Features

* **Chest GUI Interface:** Uses `ChestFormData` for a native-feeling UI.
* **Persistent Storage:** Integrates with a custom Database utility to save listing data.
* **Automatic Pagination:** Handles large volumes of items by dynamically creating "virtual" pages.
* **Search & Filters:** Search by item name, type, or enchantments. Filter by cost and name.
* **Expiration System:** Items automatically expire after 24 hours (configurable).
* **Seller Management:** Sellers can change prices or cancel listings directly through the UI.
* **Offline Economy:** Supports adding currency to players even when they are offline.

## 📂 Installation

1.  Ensure you have the following utility structures in your project:
    * `../util/cooldatabase.js` (Database management)
    * `../util/extensions/forms.js` (Chest UI library)
    * Standard helper utilities (string/number converters)
2.  Copy the `AuctionHouse.js` class into your scripts folder.
3.  Initialize the Auction House by passing a `Player` object to the constructor.

## 🛠 Usage

### Opening the Menu
```javascript
const ah = new AuctionHouse(player);
ah.show();
