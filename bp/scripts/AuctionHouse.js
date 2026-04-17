import { system, world, CustomCommandParamType, EquipmentSlot } from "@minecraft/server";
import { Database } from "../util/cooldatabase.js";
import { ChestFormData } from "../util/extensions/forms.js";
import { typeIdtoName } from "../util/string/typeIdToName.js";
import { getAttackDamage } from "../util/number/getAttackDamage.js";
import { capitalize } from "../util/string/capitalize.js";
import { toRoman } from "../util/string/toRoman.js";
import { metricNumberConverter } from "../util/number/metricNumberConverter.js";
import { PlayerLookup } from "../util/playerlookup.js";
import { getScore } from "../util/scoreboard/getScore.js";
import { removeScore } from "../util/scoreboard/removeScore.js";
import { offlineAddScore } from "../util/scoreboard/offlineAddScore.js";
import { ModalFormData } from "@minecraft/server-ui";
import { locationCheck } from "../util/vector/locationCheck.js";

export class AuctionHouse {
    constructor(player) {
        this.player = player;
        this.chest_locations = Database.get("ah_chestlocations");
        this.chest_directions = Database.get("ah_chestdirections");
        this.dimension = world.getDimension("overworld");
        this.pages = Database.get("ah_pages") ?? 1;
        this.playerinventory = this.player.getComponent("inventory").container;
        this.filters = [
            {
                name: "Cost Low to High",
                function: (a, b) => (a.data.cost - b.data.cost) || a
            },
            {
                name: "Cost High to Low",
                function: (a, b) => (b.data.cost - a.data.cost) || b
            },
            {
                name: "Name Ascending",
                function: (a, b) => (a.data.nameTag.localeCompare(b.data.nameTag)) || a
            },
            {
                name: "Name Descending",
                function: (a, b) => (b.data.nameTag.localeCompare(a.data.nameTag)) || b
            }
        ]
    }

    createNextChest() {
        const location = this.chest_locations;
        const directions = this.chest_directions;
        const lastlocation = location[location.length - 1];
        const newlocation = {
            x: Math.floor(lastlocation.x - directions[0].x),
            y: Math.floor(lastlocation.y - directions[0].y),
            z: Math.floor(lastlocation.z - directions[0].z),
        };
        const newlocation2 = {
            x: Math.floor(lastlocation.x - directions[1].x),
            y: Math.floor(lastlocation.y - directions[1].y),
            z: Math.floor(lastlocation.z - directions[1].z),
        };
        this.dimension.setBlockType(newlocation, "minecraft:chest");
        this.dimension.setBlockType(newlocation2, "minecraft:chest");
        location.push(newlocation);
        Database.set("ah_chestlocations", location);
    }

    shiftItems() {
        system.run(() => {
            const allItems = [];
            const maxSlot = 45;

            for (const loc of this.chest_locations) {
                const block = this.dimension.getBlock(loc);
                const index = this.chest_locations.findIndex((l) => locationCheck(l, loc));
                if (!block) continue;

                const container = block.getComponent("inventory")?.container;
                if (!container) continue;

                for (let i = 0; i < Math.min(container.size, maxSlot); i++) {
                    const item = container.getItem(i);
                    const data = Database.get(`ah_${i}_${index}`);
                    if (item) {
                        allItems.push({
                            item: item.clone(),
                            ownerid: data.ownerid,
                            cost: data.cost,
                            listedtime: data.listedtime,
                        });
                    }
                }
            }

            for (const loc of this.chest_locations) {
                const index = this.chest_locations.findIndex((l) => locationCheck(l, loc));
                const block = this.dimension.getBlock(loc);
                if (!block) continue;

                const container = block.getComponent("inventory")?.container;
                if (!container) continue;

                container.clearAll();
                for (let i = 0; i < 45; i++) {
                    Database.set(`ah_${i}_${index}`, {});
                }
            }

            let currentItemIndex = 0;
            let lastActiveChestIndex = -1;

            for (let chestIndex = 0; chestIndex < this.chest_locations.length; chestIndex++) {
                const loc = this.chest_locations[chestIndex];
                const block = this.dimension.getBlock(loc);
                if (!block) continue;

                const container = block.getComponent("inventory")?.container;
                if (!container) continue;

                let chestFilledInThisPass = false;
                for (let i = 0; i < Math.min(container.size, maxSlot); i++) {
                    if (currentItemIndex < allItems.length) {
                        const data = allItems[currentItemIndex];
                        container.setItem(i, data.item);
                        Database.set(`ah_${i}_${chestIndex}`, {
                            ownerid: data.ownerid,
                            cost: data.cost,
                            listedtime: data.listedtime,
                        });
                        currentItemIndex++;
                        chestFilledInThisPass = true;
                    } else {
                        break;
                    }
                }

                if (chestFilledInThisPass) {
                    lastActiveChestIndex = chestIndex;
                }

                if (currentItemIndex >= allItems.length && !chestFilledInThisPass) break;
            }

            const pages = lastActiveChestIndex + 1;
            Database.set("ah_pages", pages);
        });
    }

    parseItem(inventory, slot) {
        const index = this.chest_locations.findIndex((l) => locationCheck(l, inventory.block.location));
        const data = Database.get(`ah_${slot}_${index}`);
        const ownerid = data.ownerid;
        return {
            cost: parseInt(data.cost),
            ownerid: ownerid ? ownerid.toString() : "Unknown",
            listedtime: data.listedtime,
        };
    }

    scan(callback) {
        this.chest_locations.forEach((loc, chestIndex) => {
            if (this.pages < chestIndex) return;
            const block = this.dimension.getBlock(loc);
            const inventory = block?.getComponent("inventory");
            if (!inventory.container) return;

            for (let slot = 0; slot < 45; slot++) {
                const item = inventory.container.getItem(slot);
                if (!item) continue;
                const { cost, ownerid } = this.parseItem(inventory, slot);
                const expired = this.itemData(inventory, slot).expired;
                callback({ item, inventory, slot, chestIndex, cost, ownerid, expired });
            }
        });
    }

    list(item, amount) {
        let itemadded = false;
        for (const location of this.chest_locations) {
            const index = this.chest_locations.findIndex((l) => l === location);
            const overworld = world.getDimension("overworld");
            const chest = overworld.getBlock(location);
            const container = chest.getComponent("inventory").container;
            if (container.emptySlotsCount <= 9 && this.chest_locations.length - 1 === index) this.createNextChest();
            if (container.emptySlotsCount <= 9) continue;
            for (let i = 0; i < 45; i++) {
                const conitem = container.getItem(i);
                if (conitem || itemadded) continue;
                Database.set(`ah_${i}_${index}`, {
                    cost: amount,
                    ownerid: this.player.id,
                    listedtime: new Date().getTime(),
                });
                if (!item?.nameTag) item.nameTag = typeIdtoName(item.typeId);
                container.setItem(i, item);
                itemadded = true;
            }
            return this.shiftItems();
        }
    }

    itemData(inventory, slot, showowner = true) {
        const { cost, ownerid, listedtime } = this.parseItem(inventory, slot);
        const item = inventory.container.getItem(slot);
        const nameTag = item.nameTag;
        let owner = new PlayerLookup(ownerid).lookup();
        let description = [];
        let enchanted = false;
        const enchantments = item.getComponent("enchantable")?.getEnchantments() ?? [];
        for (const enchantment of enchantments) {
            let level = toRoman(enchantment.level);
            let typeId = enchantment.type.id;
            if (enchantment.type.id === "mending" || enchantment.type.id === "aqua_affinity") level = "";
            if (typeId.includes("_")) {
                typeId = typeId.split("_");
                let a = capitalize(typeId[0]);
                let b = capitalize(typeId[1]);
                typeId = a + " " + b;
            }
            description.push(`§7${capitalize(typeId)} ${level}`);
            enchanted = true;
        }

        const damage = getAttackDamage(item);
        if (damage !== 0) description.push(`\n§9+${Math.floor(damage)} Attack Damage`);
        description.push(`§aCost: $${metricNumberConverter(cost)}`);

        let expired = false;
        const expiry = new Date();
        expiry.setTime(listedtime + 24 * 60 * 60 * 1000);
        const now = new Date();
        const difference = expiry - now;
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        if (hours <= 0 && minutes <= 0) expired = true;

        if (showowner) description.push(`§aOwner: ${owner.name}`);
        else {
            if (expired) description.push(`§cExpired`);
            else description.push(`§aExpires in \n ${hours}h ${minutes}m`);
        }

        return {
            nameTag,
            cost,
            description,
            enchanted,
            item,
            expired,
        };
    }

    viewSearch(search, page = 1) {
        const form = new ChestFormData("54");
        form.title(`§eSearch: §8"${search}"`);
        form.pattern(["_________", "_________", "_________", "_________", "_________", "_xxxxxxx"], {
            x: {
                itemName: "§bYour listings",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });
        const searchResults = [];
        this.scan((data) => {
            if (data.expired) return;
            const query = search.toLowerCase();

            const enchantments = data.item.getComponent("enchantable")?.getEnchantments() ?? [];
            const enchant = enchantments.find((e) => e.type.id.includes(query));

            const damage = getAttackDamage(data.item);
            const damagestr = `+${Math.floor(damage)} attack damage`;
            const damagec = damagestr.includes(query);

            const typeId = data.item.typeId.includes(query);
            const nameTag = data.item.nameTag.includes(query);
            if (!typeId && !nameTag && !enchant && !damagec) return;
            searchResults.push({ item: data.item, inventory: data.inventory, slot: data.slot });
        });

        const start = (page - 1) * 45;
        const end = page * 45;

        const pages = Math.floor(searchResults.length / 45) + 1;

        for (let i = start; i < end; i++) {
            const result = searchResults[i];
            if (!result) continue;
            const item = result.item;
            const slot = result.slot;
            const data = this.itemData(result.inventory, slot, true);
            form.button(i - start, data.nameTag, data.description, item.typeId, item.amount, 0, data.enchanted);
        }

        const [name, texture] =
            page === pages
                ? ["§cUnavailable", "textures/blocks/glass_red"]
                : ["§aNext", "textures/blocks/glass_green"];
        form.button(53, name, [], texture);

        const button = page === 1 ? "§cClose" : "§cPrevious";
        form.button(45, button, [], "textures/blocks/glass_red");
        form.button(52, "§eSearch", [], "textures/blocks/glass_yellow");

        form.show(this.player).then((data) => {
            if (data.canceled) return;

            switch (data.selection) {
                case 53:
                    if (pages !== page) this.viewSearch(search, page + 1);
                    else this.show();
                    break;
                case 45:
                    if (page !== 1) this.viewSearch(search, page - 1);
                    else this.show();
                    break;
                default:
                    const result = searchResults[data.selection + start];
                    const item = result.item;
                    const name = item.nameTag.split("|");
                    const ownerid = name[2];
                    if (ownerid === this.player.id)
                        return this.manageListing(result.inventory, result.slot);
                    return this.confirmBuy(item, result.container, result.slot);
            }
        });
    }

    search() {
        const form = new ModalFormData();
        form.title(`§eSearch Menu`);
        form.textField("Search query: ", "eg. minecraft:netherite_sword or Netherite Sword", { defaultValue: "" });
        form.show(this.player).then((data) => {
            if (data.canceled) return;
            const query = data.formValues[0];
            this.viewSearch(query);
        });
    }

    removeListing(inventory, slot, item) {
        if (this.playerinventory.emptySlotsCount === 0) return this.player.sendMessage("§cNot enough slots free!");
        inventory.container.setItem(slot, undefined);
        this.playerinventory.addItem(item);
        this.shiftItems();
        return this.player.sendMessage(`§aClaimed listing "${item.nameTag}"`);
    }

    confirmRemoveListing(inventory, slot, item) {
        const form = new ChestFormData("27");
        const data = this.itemData(inventory, slot, false);

        form.title(`§cRemove "${data.nameTag}"`);
        form.button(13, data.nameTag, data.description, item.typeId, item.amount, 0, data.enchanted);

        form.pattern(["xxxxxxxxx", "x_xx_xx_x", "xxxxxxxxxx"], {
            x: {
                itemName: "§6Auction House",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });
        form.button(10, "§cCancel", [], "textures/blocks/glass_red");
        form.button(16, "§aConfirm", [], "textures/blocks/glass_green");
        form.show(this.player).then((data) => {
            if (data.canceled) return;
            switch (data.selection) {
                case 16:
                    return this.removeListing(inventory, slot, item);
                case 10:
                    return this.show();
            }
        });
    }

    changePrice(inventory, slot, cost) {
        const form = new ModalFormData();
        form.textField("Price of item: ", `§aCurrent Cost: $${metricNumberConverter(parseInt(cost))}`, {
            defaultValue: "",
        });
        form.show(this.player).then((it) => {
            if (it.canceled) return;
            const newcost = parseInt(it.formValues[0]);
            if (!newcost) return this.player.sendMessage("§cMust enter a valid number!");
            const index = this.chest_locations.findIndex((l) => locationCheck(l, inventory.block.location));
            const data = Database.get(`ah_${slot}_${index}`);
            Database.set(`ah_${slot}_${index}`, { cost: newcost, ownerid: data.ownerid });
            this.player.sendMessage(`§aUpdated price to $${metricNumberConverter(newcost)}`);
        });
    }

    manageListing(inventory, slot) {
        const data = this.itemData(inventory, slot, false);

        const form = new ChestFormData("27");
        form.title(`§aManage "${data.nameTag}"`);
        form.button(13, data.nameTag, data.description, data.item.typeId, data.item.amount, 0, data.enchanted);
        form.pattern(["xxxxxxxxx", "x_xx_xx_x", "xxxx_xxxx"], {
            x: {
                itemName: "§6Auction House",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });
        form.button(16, "§aChange Price", [], "textures/blocks/glass_green");
        form.button(10, "§cRemove Listing", [], "textures/blocks/glass_red");
        form.button(22, "§cBack", [], "textures/blocks/glass_red");
        form.show(this.player).then((it) => {
            if (it.canceled) return;
            switch (it.selection) {
                case 10:
                    return this.confirmRemoveListing(inventory, slot, data.item);
                case 16:
                    return this.changePrice(inventory, slot, data.cost);
                case 22:
                    return this.show();
            }
        });
    }

    buy(item, inventory, selected) {
        const { cost, ownerid } = this.parseItem(inventory, selected);
        const owner = new PlayerLookup(ownerid).lookup();

        const money = getScore(this.player, "dollars");
        if (money < cost) return this.player.sendMessage("§cNot enough money!");

        const pcontainer = this.player.getComponent("inventory").container;
        if (pcontainer.emptySlotsCount === 0) return this.player.sendMessage("§cNot enough slots free!");

        removeScore(this.player, "dollars", cost);

        item.clearDynamicProperties();
        pcontainer.addItem(item);

        inventory.container.setItem(selected, undefined);
        this.shiftItems();

        this.player.sendMessage(
            `§aBought "${item.nameTag}"\n From ${owner.name}\n Cost: ${metricNumberConverter(cost)}`,
        );

        offlineAddScore(ownerid, "dollars", cost, `§a"${this.player.name}" bought your listing of "${item.nameTag}"`);
    }

    confirmBuy(item, inventory, selected) {
        const form = new ChestFormData("27");
        const data = this.itemData(inventory, selected, true);

        form.title(`§aConfirm buying of "${data.nameTag}"`);
        form.button(13, data.nameTag, data.description, item.typeId, item.amount, 0, data.enchanted);

        form.pattern(["xxxxxxxxx", "x_xx_xx_x", "xxxxxxxxxx"], {
            x: {
                itemName: "§6Auction House",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });
        form.button(10, "§cCancel", [], "textures/blocks/glass_red");
        form.button(16, "§aConfirm", [], "textures/blocks/glass_green");
        form.show(this.player).then((data) => {
            if (data.canceled) return;
            switch (data.selection) {
                case 16:
                    return this.buy(item, inventory, selected);
                case 10:
                    return this.show();
            }
        });
    }

    viewListings(page = 1) {
        const form = new ChestFormData("54");
        form.pattern(["_________", "_________", "_________", "_________", "_________", "_xxxxxxx_"], {
            x: {
                itemName: "§bYour listings",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });

        const ownedlistings = [];
        this.scan((data) => {
            if (data.ownerid !== this.player.id) return;
            ownedlistings.push({ item: data.item, inventory: data.inventory, slot: data.slot, expired: data.expired });
        });

        const start = (page - 1) * 45;
        const end = page * 45;

        const pages = Math.floor(ownedlistings.length / 45) + 1;

        form.title(`§bYour listings §8${page}/${pages}`);

        for (let i = start; i < end; i++) {
            const result = ownedlistings[i];
            if (!result) continue;
            const item = result.item;
            const slot = result.slot;
            const data = this.itemData(result.inventory, slot, false);
            form.button(i - start, data.nameTag, data.description, item.typeId, item.amount, 0, data.enchanted);
        }

        const [name, texture] =
            page === pages
                ? ["§cUnavailable", "textures/blocks/glass_red"]
                : ["§aNext", "textures/blocks/glass_green"];
        form.button(53, name, [], texture);

        const button = page === 1 ? "§cClose" : "§cPrevious";
        form.button(45, button, [], "textures/blocks/glass_red");

        form.show(this.player).then((data) => {
            if (data.canceled) return;
            switch (data.selection) {
                case 53:
                    if (pages !== page) this.viewListings(page + 1);
                    else this.show();
                    break;
                case 45:
                    if (page !== 1) this.viewListings(page - 1);
                    else this.show();
                    break;
                default:
                    const result = ownedlistings[data.selection + start];
                    if (result.expired) this.removeListing(result.inventory, result.slot, result.item);
                    else this.manageListing(result.inventory, result.slot, result.item);
                    break;
            }
        });
    }

    filter() {
        const form = new ModalFormData();
        form.dropdown("Filter: ", this.filters.map(a => a.name))
        form.show(this.player).then((data) => {
            if (data.canceled) return;
            const filter = this.filters[data.formValues[0]];
            this.show(filter)
        })
    }

    show(filter, page = 1) {
        const form = new ChestFormData("54");
        form.pattern(["_________", "_________", "_________", "_________", "_________", "__xx_xx__"], {
            x: {
                itemName: "§6Auction House",
                itemDesc: [],
                enchanted: false,
                stackAmount: 1,
                texture: "textures/blocks/glass_black",
            },
        });

        const unexpiredlistings = [];
        this.scan((data) => {
            if (data.expired) return;
            const item_data = this.itemData(data.inventory, data.slot);
            unexpiredlistings.push({
                item: data.item,
                inventory: data.inventory,
                slot: data.slot,
                expired: data.expired,
                ownerid: data.ownerid,
                data: item_data,
            });
        });

        const start = (page - 1) * 45;
        const end = page * 45;

        const pages = Math.floor(unexpiredlistings.length / 45) + 1;

        if (filter) {
            unexpiredlistings.sort(filter.function);
        }

        const [name, texture] =
            page === pages
                ? ["§cUnavailable", "textures/blocks/glass_red"]
                : ["§aNext", "textures/blocks/glass_green"];
        form.button(53, name, [], texture);

        const button = page === 1 ? "§cClose" : "§cPrevious";
        form.button(45, button, [], "textures/blocks/glass_red");

        form.button(46, "§bView Listings", [], "textures/blocks/glass_blue");
        form.button(52, "§eSearch", [], "textures/blocks/glass_yellow");
        form.button(49, "§aFilter", [], "textures/blocks/glass_lime");

        form.title(`§aAuction House §8${page}/${pages}`);

        for (let i = start; i < end; i++) {
            const result = unexpiredlistings[i];
            if (!result) continue;
            const item = result.item;
            const slot = result.slot;
            const data = result.data;
            form.button(i - start, data.nameTag, data.description, item.typeId, item.amount, 0, data.enchanted);
        }

        system.run(() => {
            form.show(this.player).then((data) => {
                if (data.canceled) return;
                switch (data.selection) {
                    case 53:
                        if (pages !== page) this.show(filter, page + 1);
                        break;
                    case 45:
                        if (page !== 1) this.show(filter, page - 1);
                        break;
                    case 49:
                        return this.filter();
                    case 46:
                        return this.viewListings();
                    case 52:
                        return this.search();
                    default:
                        const result = unexpiredlistings[data.selection + start];
                        if (result.ownerid === this.player.id) return this.manageListing(result.inventory, result.slot);
                        return this.confirmBuy(result.item, result.inventory, result.slot);
                }
            });
        });
    }
}