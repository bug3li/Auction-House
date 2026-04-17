function locationCheck(loc1, loc2) {
    const x1 = Math.floor(loc1.x);
    const z1 = Math.floor(loc1.z);
    const x2 = Math.floor(loc2.x);
    const z2 = Math.floor(loc2.z);
    if (x1 !== x2 || loc1.y !== loc2.y || z1 !== z2) return false;
    return true;
}

export { locationCheck };