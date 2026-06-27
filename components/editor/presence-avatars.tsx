"use client";

import { useOthers } from "@liveblocks/react";
import { useUser, UserButton } from "@clerk/nextjs";

interface CollaboratorAvatarProps {
  name: string;
  avatar: string;
  color: string;
}

function CollaboratorAvatar({ name, avatar, color }: CollaboratorAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold overflow-hidden shrink-0"
      style={{
        boxShadow: `0 0 0 2px #18181c, 0 0 0 3.5px ${color}`,
        background: avatar ? undefined : `${color}33`,
        color: color,
      }}
      title={name}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

export function PresenceAvatars() {
  const others = useOthers();
  const { user } = useUser();

  const collaborators = others.filter((other) => other.id !== user?.id);
  const visible = collaborators.slice(0, 5);
  const overflow = collaborators.length - visible.length;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
      {hasCollaborators && (
        <>
          <div className="flex items-center">
            {visible.map((other, i) => (
              <div
                key={other.connectionId}
                className="relative"
                style={{
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: visible.length - i + 1,
                }}
              >
                <CollaboratorAvatar
                  name={other.info?.name ?? "Unknown"}
                  avatar={other.info?.avatar ?? ""}
                  color={other.info?.color ?? "#6457f9"}
                />
              </div>
            ))}
            {overflow > 0 && (
              <div
                className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{
                  marginLeft: -8,
                  zIndex: 0,
                  background: "#18181c",
                  boxShadow: "0 0 0 2px #18181c, 0 0 0 3.5px #2a2a30",
                  color: "#c0c0cc",
                }}
              >
                +{overflow}
              </div>
            )}
          </div>
          <div className="w-px h-5 shrink-0" style={{ background: "#2a2a30" }} />
        </>
      )}
      <div className="pointer-events-auto">
        <UserButton />
      </div>
    </div>
  );
}
