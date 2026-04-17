import { capitalize } from "./capitalize"

function typeIdtoName(typeId) {
    const id = typeId.split(":")[1];
    const arr = id.split("_");
    let str = "";
    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (arr[i + 1]) str += capitalize(element) + " ";
        else str += capitalize(element);
    }

    return str;
}

export { typeIdtoName }