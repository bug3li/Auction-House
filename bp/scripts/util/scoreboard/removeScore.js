import { world } from "@minecraft/server"

function removeScore(player, objective, amount) {
    try {
        const value = world.scoreboard.getObjective(objective).getScore(player);
        return world.scoreboard.getObjective(objective).setScore(player, value - amount);
    } catch (error) {
        return 0;
    }
}

export { removeScore }