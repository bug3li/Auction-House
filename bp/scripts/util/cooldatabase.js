import { world, Player } from "@minecraft/server";

export class Database {
    /**
     * Set a value in the database.
     * @param {string} key - The database key.
     * @param {any} value - The value to set (will be stringified).
     * @param {Player} [target=world] - The player or world to set the property on.
     */
    static set(key, value, target = world) {
        target.setDynamicProperty(key, JSON.stringify(value));
    }

    /**
     * Get a value from the database.
     * @param {string} key - The database key.
     * @param {Player} [target=world] - The player or world to get from.
     * @returns {any} The parsed value or 0 if not found.
     */
    static get(key, target = world) {
        const data = target.getDynamicProperty(key);
        return data !== undefined ? JSON.parse(data) : false;
    }

    /**
     * Check if a key exists.
     * @param {string} key
     * @param {Player} [target=world]
     */
    static has(key, target = world) {
        return target.getDynamicProperty(key) !== undefined;
    }

    /**
     * Delete a key.
     * @param {string} key
     * @param {Player} [target=world]
     */
    static delete(key, target = world) {
        target.setDynamicProperty(key, undefined);
    }

    /**
     * Get all entries.
     * @param {Player} [target=world]
     * @returns {Array<[string, any]>}
     */
    static entries(target = world) {
        return target.getDynamicPropertyIds().map((id) => {
            return [id, this.get(id, target)];
        });
    }
}
