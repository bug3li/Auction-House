import { world } from "@minecraft/server"

function setScore(player, objective, amount) {
    try {
        return world.scoreboard.getObjective(objective).setScore(player, amount);
    } catch (error) {
        return 0;
    }
}

export { setScore }