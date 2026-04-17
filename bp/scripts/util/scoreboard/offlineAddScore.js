import { system, world } from "@minecraft/server"
import { Database } from "../cooldatabase"
import { addScore } from "./addScore";

export function offlineAddScore(playerid, objective, amount, reason) {
    Database.set(playerid, { objective: objective, amount: amount, reason: reason ?? undefined  })
}

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const queued_money = Database.get(player.id);
        if (queued_money === false) continue;
        const objective = queued_money.objective;
        const amount = parseInt(queued_money.amount);
        const reason = queued_money?.reason;
        if (reason) player.sendMessage(reason)
        addScore(player, objective, amount)
        Database.set(player.id, false)
    }
}, 20)