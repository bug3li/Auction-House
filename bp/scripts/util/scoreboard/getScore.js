import { world } from "@minecraft/server"

function getScore(player, objective) {
    try {
        return world.scoreboard.getObjective(objective).getScore(player) ?? 0;
    } catch (error) {
        return 0;
    }
}

export { getScore }