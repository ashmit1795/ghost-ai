import { LiveObject, LiveMap } from "@liveblocks/client"
import { CanvasNode, CanvasEdge } from "@/types/canvas"

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      flow: LiveObject<{
        nodes: LiveMap<string, LiveObject<{
          id: string;
          type: string;
          position: { x: number; y: number };
          data: Record<string, any>;
          width?: number;
          height?: number;
          selected?: boolean;
        }>>;
        edges: LiveMap<string, LiveObject<{
          id: string;
          type: string;
          source: string;
          target: string;
          data?: Record<string, any>;
          selected?: boolean;
          animated?: boolean;
        }>>;
      }>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: Record<string, never>;

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
