import { system, world } from "@minecraft/server";
import { PlayerLookup } from "./util/playerlookup";

world.beforeEvents.playerLeave.subscribe((event) => {
    PlayerLookup.saveToCache(event.player);
});