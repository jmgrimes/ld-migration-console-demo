import dotenv from "dotenv"

dotenv.config()

import Client from "./client.js"
import Contexts from "./context.js"
import Daemon from "./daemon.js"
import Render from "./render.js"

async function Main() {
    const client = await Client()
    const contexts = Contexts(client)
    client.on("update", async () => {
        await Render(contexts)
    })
    await Render(contexts)
    Daemon()
}

Main()
