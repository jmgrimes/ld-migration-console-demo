import { init } from "launchdarkly-node-server-sdk"

export default async function Client() {
    const ldClient = init(process.env.LAUNCHDARKLY_SDK_KEY)
    await ldClient.waitForInitialization()
    return ldClient
}
