// src/hooks/useProjects.js
import { useState } from "react";
import axios from "axios";
import { API_URL, preparePreviewHtml } from "../components/constants";

const PROJECTS_STORAGE_KEY = "buildCodeProjects";

export default function useProjects({
  editedCode, setEditedCode, setGeneratedCode, setDisplayedText,
  setPrompt, promptRef, aiModel, setAiModel,
  creativityLevel, setCreativityLevel, modificationHistory, setModificationHistory,
  sessionId, setSessionId, persistSession, clearSessionCompletely,
  setPreviewHtml, setPreviewLoaded, setPreviewKey,
  setSuccess, setError, currentProjectName, setCurrentProjectName,
}) {
  const [projects, setProjects] = useState([]);
  const [projectsDialogOpen, setProjectsDialogOpen] = useState(false);

  const loadProjects = () => {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  };

  const saveProjects = (list) => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(list));
      setProjects(list);
    } catch (_) {}
  };

  const saveCurrentProject = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return setError("Project name required.");
    if (!editedCode) return setError("No code to save. Generate a project first.");

    const list = loadProjects();
    const now = new Date().toISOString();
    const existingIndex = list.findIndex((p) => p.name === trimmed);

    const projectData = {
      name: trimmed,
      code: editedCode,
      sessionId: sessionId || "",
      prompt: promptRef.current || "",
      aiModel,
      creativityLevel,
      history: modificationHistory.slice(0, 20),
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) list[existingIndex] = projectData;
    else list.unshift(projectData);

    saveProjects(list);
    setCurrentProjectName(trimmed);
    setSuccess(`💾 Project "${trimmed}" saved.`);
    setTimeout(() => setSuccess(""), 2500);
  };

  const loadProject = (project) => {
    setEditedCode(project.code || "");
    setGeneratedCode(project.code || "");
    setDisplayedText(project.code || "");
    setPrompt(project.prompt || "");
    promptRef.current = project.prompt || "";
    setAiModel(project.aiModel || "openai/gpt-oss-120b");
    setCreativityLevel(project.creativityLevel || 7);
    setModificationHistory(project.history || []);
    setCurrentProjectName(project.name || "");

    if (project.sessionId) {
      setSessionId(project.sessionId);
      persistSession(project.sessionId);
      axios
        .post(`${API_URL}/sessions/restore`, {
          session_id: project.sessionId,
          prompt: project.prompt || "Restored project",
          code: project.code || "",
        })
        .then((res) => {
          if (res.data?.success && res.data?.session_id) {
            setSessionId(res.data.session_id);
            persistSession(res.data.session_id);
          }
        })
        .catch(() => {});
    } else {
      clearSessionCompletely();
    }

    const safePreview = preparePreviewHtml(project.code || "");
    setPreviewLoaded(false);
    setPreviewHtml(safePreview);
    setPreviewKey((p) => p + 1);

    setProjectsDialogOpen(false);
    setSuccess(`📂 Loaded project "${project.name}".`);
    setTimeout(() => setSuccess(""), 2500);
  };

  const deleteProject = (name) => {
    const list = loadProjects().filter((p) => p.name !== name);
    saveProjects(list);
    setSuccess(`🗑️ Project "${name}" deleted.`);
    setTimeout(() => setSuccess(""), 2000);
  };

  return {
    projects, setProjects,
    projectsDialogOpen, setProjectsDialogOpen,
    loadProjects, saveProjects,
    saveCurrentProject, loadProject, deleteProject,
  };
}