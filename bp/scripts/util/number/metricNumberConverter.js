function metricNumberConverter(number, tofixed) {
    const unitAbbreviations = ["", "k", "m", "b"];
    let magnitude = 0;
    if (!tofixed) tofixed = 0;
    while (Math.abs(number) >= 1000 && magnitude < unitAbbreviations.length - 1) {
        number /= 1000;
        magnitude += 1;
    }
    return number.toFixed(tofixed) + unitAbbreviations[magnitude];
}

export { metricNumberConverter }