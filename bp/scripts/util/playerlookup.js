import { world } from "@minecraft/server";
import { Database } from "./cooldatabase";

export class PlayerLookup {
    constructor(playerId) {
        this.playerId = playerId;
    }


    static saveToCache(player) {
        const data = {
            name: player.name,
            id: player.id,
            location: {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            },
            dimension: player.dimension.id,
            lastSeen: Date.now(),
            tags: player.getTags()
        };
      
        Database.set(player.id, data);
    }

    lookup() {
       
        const onlinePlayer = world.getAllPlayers().find(p => p.id === this.playerId);
        
        const cachedData = Database.get(this.playerId);

        if (onlinePlayer) {
            return {
                online: true,
                ...cachedData,
                name: onlinePlayer.name,
                location: onlinePlayer.location,
                dimension: onlinePlayer.dimension.id,
                tags: onlinePlayer.getTags()
            };
        }

        if (cachedData) {
            return {
                online: false,
                ...cachedData,
                note: "Data from last known session"
            };
        }

        return { error: "Player not found in registry or database." };
    }
}