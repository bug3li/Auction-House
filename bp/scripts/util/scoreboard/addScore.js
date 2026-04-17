import { world } from "@minecraft/server"

function addScore(player, objective, amount) {
    try {
        return world.scoreboard.getObjective(objective).addScore(player, amount);
    } catch (error) {
        return 0;
    }
}

export { addScore }