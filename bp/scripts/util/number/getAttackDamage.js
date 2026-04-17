const BASE_DAMAGE = {
    "minecraft:netherite_sword": 8,
    "minecraft:diamond_sword": 7,
    "minecraft:iron_sword": 6,
    "minecraft:stone_sword": 5,
    "minecraft:golden_sword": 4,
    "minecraft:wooden_sword": 4,
    "minecraft:netherite_axe": 7,
    "minecraft:diamond_axe": 6,
    "minecraft:iron_axe": 5,
};

export function getAttackDamage(itemStack) {
    if (!itemStack) return 0;

    let totalDamage = BASE_DAMAGE[itemStack.typeId] ?? 0;

    const enchantable = itemStack.getComponent("minecraft:enchantable");
    if (enchantable) {
        const sharpness = enchantable.getEnchantment("sharpness");
        if (sharpness) {
            totalDamage += sharpness.level * 1.25;
        }
    }

    return totalDamage;
}