import chalk from "chalk"
import fs from "node:fs"

import { Evaluatable, Evaluation } from "./evaluation.js"

function RenderReadString(enabled: boolean, authoritative: boolean) {
    return enabled ? chalk.green(authoritative ? chalk.bold.underline("R") : "r") : chalk.gray("r")
}

function RenderWriteString(enabled: boolean, authoritative: boolean) {
    return enabled ? chalk.green(authoritative ? chalk.bold.underline("W") : "w") : chalk.gray("w")
}

function RenderEvaluation(evaluation: Evaluation) {
    const components = [
        chalk.white("["),
        RenderReadString(evaluation.readOld, !evaluation.useNew),
        RenderWriteString(evaluation.writeOld, !evaluation.useNew),
        chalk.white(" -> "),
        RenderReadString(evaluation.readNew, evaluation.useNew),
        RenderWriteString(evaluation.writeNew, evaluation.useNew),
        chalk.white("]"),
    ]
    return components.join("")
}

export default async function Render(evaluateables: Evaluatable[]) {
    const evaluations = await Promise.all(evaluateables.map((evaluateable) => evaluateable.evaluate()))
    fs.writeSync(1, "\x1B[2J\x1B[H")
    fs.writeSync(
        1,
        "┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐\n",
    )
    fs.writeSync(
        1,
        `│                                              ${chalk.bold.underline(
            "MIGRATION PROGRESSION",
        )}                                              │\n`,
    )
    fs.writeSync(
        1,
        "│                                                                                                                 │\n",
    )
    fs.writeSync(
        1,
        `│                       ${chalk.gray("Function Disabled")}         ${chalk.green(
            "Function Enabled",
        )}         ${chalk.bold.underline("AUTHORITATIVE SOURCE")}                   │\n`,
    )
    fs.writeSync(
        1,
        "┝━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┥\n",
    )
    fs.writeSync(
        1,
        "│                                                                                                                 │\n",
    )
    evaluations.forEach((evaluation, index) => {
        if (index % 10 == 0) {
            fs.writeSync(1, "│  ")
        }
        fs.writeSync(1, RenderEvaluation(evaluation) + " ")
        if (index % 10 == 9) {
            fs.writeSync(1, " │\n")
        }
    })
    fs.writeSync(
        1,
        "│                                                                                                                 │\n",
    )
    fs.writeSync(
        1,
        "└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘\n",
    )
    fs.writeSync(1, "\n")
    fs.fsyncSync(1)
}
