import { EditorShell } from "@/components/editor/editor-shell";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";

export default async function EditorPage() {
  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects} />;
}
