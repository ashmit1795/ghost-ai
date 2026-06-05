import { Liveblocks } from "@liveblocks/node"

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined
}

if (!process.env.LIVEBLOCKS_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("LIVEBLOCKS_SECRET_KEY is missing in production. secretKey cannot be initialized with a dummy value.")
}

const secretKey = process.env.LIVEBLOCKS_SECRET_KEY || "sk_dummy_secret_key_for_build"

let liveblocksInstance: Liveblocks

if (globalForLiveblocks.liveblocks) {
  liveblocksInstance = globalForLiveblocks.liveblocks
} else {
  liveblocksInstance = new Liveblocks({
    secret: secretKey,
  })

  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = liveblocksInstance
  }
}

export const liveblocks = liveblocksInstance

const COLORS = [
  "#52A8FF", // Blue
  "#BF7AF0", // Purple
  "#FF990A", // Orange
  "#FF6166", // Red
  "#F75F8F", // Pink
  "#62C073", // Green
  "#0AC7B4", // Teal
  "#00c8d4", // Cyan
]

export function getCursorColor(userId: string): string {
  let sum = 0
  for (let i = 0; i < userId.length; i++) {
    sum += userId.charCodeAt(i)
  }
  return COLORS[sum % COLORS.length]
}
