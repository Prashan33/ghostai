import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProjectAccess } from "@/lib/project-access";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";
import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";

export default async function EditorRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { roomId } = await params;
  const { project, hasAccess } = await getProjectAccess(roomId);

  if (!project || !hasAccess) {
    return <AccessDenied />;
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <WorkspaceShell
      projectName={project.name}
      projectId={project.id}
      isOwner={project.ownerId === userId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
