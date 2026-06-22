import { Liveblocks } from '@liveblocks/node'

const CURSOR_COLORS = [
  '#E57373',
  '#64B5F6',
  '#81C784',
  '#FFB74D',
  '#CE93D8',
  '#4DB6AC',
  '#F06292',
  '#A1887F',
  '#90A4AE',
  '#FFD54F',
]

export function getCursorColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

const globalForLiveblocks = global as unknown as { liveblocks: Liveblocks }

export const liveblocks =
  globalForLiveblocks.liveblocks ??
  new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY ?? '' })

if (process.env.NODE_ENV !== 'production') globalForLiveblocks.liveblocks = liveblocks
