#!/usr/bin/env node

import chalk from "chalk"
import chalkAnimation from "chalk-animation"
import gradient from "gradient-string"
import inquirer from "inquirer"
import { createSpinner } from "nanospinner"
import figlet from "figlet"
import path from "path"
import fs from "fs"

const mcModsPath = path.join(process.env.APPDATA, "\\.minecraft\\mods")
const dataPath = path.join(mcModsPath, "mcmodman.json")

const getData = () => JSON.parse(fs.readFileSync(dataPath))
const setData = (data) => fs.writeFileSync(dataPath, JSON.stringify(data))
const applyRandomGradient = (string, gradients) => chalk.bold(gradients[Math.floor(Math.random() * gradients.length)](string))
const sleep = (ms = 2000) => new Promise(resolve => setTimeout(resolve, ms))
const intro = async () => console.log(gradient.summer.multiline(figlet.textSync("Minecraft Mod Manager")))


function createNecessaryFolders() {
    Array.of("Forge", "Fabric").forEach(modLoader => {
        if(!fs.existsSync(path.join(mcModsPath, modLoader))) {
            fs.mkdirSync(path.join(mcModsPath, modLoader))
        }
    })

    if(!fs.existsSync(dataPath)) {
        setData({})
    }
}

async function outro() {
    const spinner = createSpinner("Saving changes...").start()

    await sleep()
    spinner.success({ text: "Changes saved successfully." })
}



async function askModLoader() {
    const modLoaderPrompt = await inquirer.prompt({
        name: "modLoader",
        type: "list",
        message: "Which mod-loader do you want to use?",
        choices: ["Forge", "Fabric"]
    })

    return modLoaderPrompt.modLoader
}

async function askVersion() {
    const versionPrompt = await inquirer.prompt({
        name: "version",
        type: "input",
        message: "Which game version do you want to play?"
    })

    return versionPrompt.version
}

async function askMods(modLoader, version) {
    const modsPath = path.join(mcModsPath, modLoader, version)
    const data = getData()
    const redGradients = [gradient.morning, gradient.passion, gradient.instagram]


    if(data.modLoader == modLoader && data.version == version) {
        console.log(`You are already using modloader ${applyRandomGradient(modLoader, redGradients)} and version ${applyRandomGradient(version, redGradients)}!`)
        return null
    }

    else if(fs.existsSync(modsPath)) {
        const mods = fs.readdirSync(modsPath)
        ?.filter(file => path.extname(file) == ".jar")
        ?.map(file => path.basename(file))

        if(mods && mods.length > 0) {
            const modsPrompt = await inquirer.prompt({
                name: "mods",
                type: "checkbox",
                message: "Which mods do you want to use?",
                choices: mods
            })

            return modsPrompt.mods
        }
    }

    console.log(`No mods found with modloader ${applyRandomGradient(modLoader, redGradients)} and version ${applyRandomGradient(version, redGradients)}.`)
    return null
}

async function askConfirm(modLoader, version, mods) {
    const confirmPrompt = await inquirer.prompt({
        name: "confirmation",
        type: "confirm",
        message: `${gradient.cristal("Confirm")}\n  mod-loader: ${modLoader}\n  version: ${version}\n  mods: ${mods.join(", ")}`
    })

    return confirmPrompt.confirmation
}



function moveOldMods() {
    const { modLoader, version } = getData()

    fs.readdirSync(mcModsPath)
    .filter(mod => path.extname(mod) == ".jar")
    .forEach(mod => fs.renameSync(path.join(mcModsPath, mod), path.join(mcModsPath, modLoader, version, mod)))
}

function moveNewMods(mods, modLoader, version) {
    mods.forEach(mod => fs.renameSync(path.join(mcModsPath, modLoader, version, mod), path.join(mcModsPath, mod)))

    const data = getData()
    data.modLoader = modLoader
    data.version = version

    setData(data)
}



createNecessaryFolders()
await intro()

const modLoader = await askModLoader()
const version = await askVersion()
const mods = await askMods(modLoader, version)

if(mods) {
    if(await askConfirm(modLoader, version, mods)) {
        moveOldMods()
        moveNewMods(mods, modLoader, version)

        outro()
    }
}
