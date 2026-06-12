"use client"

import React, { useState } from "react"
import { useViewport } from "@xyflow/react"
import { useOthers } from "@liveblocks/react/suspense"

export interface CanvasAvatarProps {
  name: string
  avatar?: string
  initials: string
}

export function CanvasAvatar({ name, avatar, initials }: CanvasAvatarProps) {
  const [isBroken, setIsBroken] = useState(false)

  return (
    <div
      className="relative group h-8 w-8 rounded-full border-2 border-surface bg-subtle overflow-hidden flex items-center justify-center text-[10px] font-semibold text-copy-primary shadow-inner"
      title={name}
    >
      {avatar && !isBroken ? (
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setIsBroken(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export function CustomCursors() {
  const others = useOthers()
  const { x: viewportX, y: viewportY, zoom } = useViewport()

  // Filter cursors for other participants only (excluding current user's connections)
  const collaborators = others.filter(
    (other) => other.presence?.cursor !== null
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {collaborators.map(({ connectionId, presence, info }) => {
        const cursor = presence?.cursor
        if (!cursor) return null

        // Convert flow/canvas coordinates to container screen pixel coordinates
        const screenX = cursor.x * zoom + viewportX
        const screenY = cursor.y * zoom + viewportY
        const color = info?.color || "#a78bfa"
        const name = info?.name || "Anonymous"

        return (
          <div
            key={connectionId}
            className="absolute left-0 top-0 pointer-events-none select-none transition-transform duration-75 ease-out"
            style={{
              transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
              willChange: "transform",
            }}
          >
            {/* Colored pointer SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
              style={{ color }}
            >
              <path
                d="M5.65376 12.3825L19.5602 4.93781C20.9037 4.21853 22.4087 5.56547 21.821 6.99222L16.2759 20.4578C15.6882 21.8845 13.7381 21.8483 13.1979 20.3999L10.9822 14.4695L5.20465 11.2335C3.76451 10.4268 4.09015 8.27137 5.65376 7.95475L5.65376 12.3825Z"
                fill="currentColor"
                stroke="#121214"
                strokeWidth="1.5"
              />
            </svg>
            {/* Colored Name Badge */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-md text-[10px] font-medium text-white shadow-lg border border-white/10 whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
