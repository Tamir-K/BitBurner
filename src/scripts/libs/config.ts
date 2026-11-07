import { NS } from "@ns"

const CONFIG_FILE = '/config.json'

export function getConfig(ns: NS) {
    return JSON.parse(ns.read(CONFIG_FILE));
}