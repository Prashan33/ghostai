declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: {
      type: "ai:status";
      message: string;
    };

    ThreadMetadata: {};

    RoomInfo: {};

    FeedMessageData: {
      // ai-status-feed
      text?: string;
      // ai-chat
      sender?: string;
      role?: "user" | "assistant";
      content?: string;
      timestamp?: string;
    };
  }
}

export {};
