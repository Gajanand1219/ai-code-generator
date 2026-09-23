// src/hooks/useCodeGeneration.js
import { useState } from "react";
import axios from "axios";
import {
  API_URL, MODIFICATION_TYPES, createVercelProjectName, preparePreviewHtml,
} from "../components/constants";

export default function useCodeGeneration({
  promptRef, prompt, modificationType, sessionId, setSessionId,
  persistSession, clearSessionCompletely, includeCSS, includeJS,
  aiModel, creativityLevel, particleEffect, currentTheme,
  editedCode, setEditedCode, setGeneratedCode, setDisplayedText,
  setAiModelUsed, setCreativityApplied, setModificationHistory,
  setPreviewHtml, setPreviewLoaded, setPreviewKey,
  setSuccess, setError, setIsAnimating, setCurrentProjectName,
}) {
  const [loading, setLoading] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState("");
  const [deployedProjectName, setDeployedProjectName] = useState("");

  const triggerConfetti = () => {
    if (!particleEffect) return;
    const confetti = document.createElement("div");
    confetti.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;`;
    document.body.appendChild(confetti);
    const colors = [currentTheme.primary, currentTheme.secondary, "#10b981", "#3b82f6", "#f59e0b"];
    for (let i = 0; i < 100; i++) {
      const piece = document.createElement("div");
      const size = Math.random() * 12 + 4;
      piece.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        top:-20px;left:${Math.random() * 100}vw;
        border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
        animation:confetti-fall ${Math.random() * 2 + 1}s linear forwards;
        transform:rotate(${Math.random() * 360}deg);
        opacity:${Math.random() * 0.5 + 0.5};`;
      confetti.appendChild(piece);
    }
    setTimeout(() => { if (confetti.parentNode) document.body.removeChild(confetti); }, 3000);
  };

  const handleGenerateCode = async (
    isModification = false,
    promptOverride = null,
    modificationTypeOverride = null
  ) => {
    const currentPrompt = (promptOverride ?? promptRef.current).trim();
    if (!currentPrompt) return setError("Please enter a prompt");

    const activeModificationType = modificationTypeOverride || modificationType;

    if (activeModificationType !== "create" && !sessionId) {
      return setError("⚠️ No active project. Please use 'Create New' first, then Modify/Enhance/Debug/Refactor.");
    }

    let sessionForRequest = sessionId;
    if (activeModificationType === "create") {
      sessionForRequest = null;
      clearSessionCompletely();
      setModificationHistory([]);
      setGeneratedCode("");
      setEditedCode("");
      setPreviewHtml("");
      setDisplayedText("");
      setIsAnimating(false);
      setAiModelUsed("");
      setCurrentProjectName("");
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setIsAnimating(false);

    try {
      const payload = {
        prompt: currentPrompt,
        language: "html",
        include_css: includeCSS,
        include_js: includeJS,
        session_id: activeModificationType === "create" ? undefined : sessionForRequest,
        modification_type: activeModificationType,
        ai_model: aiModel,
        creativity_level: creativityLevel,
      };

      const response = await axios.post(`${API_URL}/generate`, payload, { timeout: 60000 });

      if (response.data.success) {
        const newCode = response.data.full_code;
        setGeneratedCode(newCode);
        setEditedCode(newCode);

        const safePreview = preparePreviewHtml(newCode);
        setPreviewLoaded(false);
        setPreviewHtml(safePreview);
        setPreviewKey((p) => p + 1);

        setDisplayedText("");
        setAiModelUsed(response.data.ai_model_used || aiModel);
        setCreativityApplied(response.data.creativity_applied || 0.7);

        if (response.data.session_id) {
          setSessionId(response.data.session_id);
          persistSession(response.data.session_id);
        }

        if (response.data.is_modification) {
          const modificationTypeObj = MODIFICATION_TYPES.find((t) => t.value === activeModificationType);
          setModificationHistory((prev) => [
            {
              id: Date.now(),
              prompt: currentPrompt,
              type: activeModificationType,
              summary: response.data.modification_summary || "Modified code",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              icon: modificationTypeObj?.icon,
              ai_model: response.data.ai_model_used,
              creativity: response.data.creativity_applied,
            },
            ...prev.slice(0, 9),
          ]);
          setSuccess(`✨ ${response.data.modification_summary || "Modification applied!"} (AI: ${response.data.ai_model_used})`);
        } else {
          setSuccess(`🚀 New project created! (AI: ${response.data.ai_model_used})`);
          setModificationHistory([]);
        }

        setTimeout(() => setIsAnimating(true), 500);
        if (particleEffect) setTimeout(triggerConfetti, 1000);
      } else {
        setError(`❌ ${response.data.error || "Generation failed"}`);
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") setError("⚠️ Request timeout.");
      else if (err.response?.status === 429) setError("⚠️ Too many requests.");
      else setError(`⚠️ ${err.response?.data?.error || err.message || "Failed to generate"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployToVercel = async () => {
    if (!editedCode || !editedCode.trim()) return setError("❌ No code available to deploy.");
    const currentPrompt = (promptRef.current || prompt || "").trim();
    const projectName = createVercelProjectName(currentPrompt);
    setLoading(true);
    setError("");
    setSuccess(`🚀 Deploying "${projectName}"...`);
    try {
      const response = await axios.post(
        `${API_URL}/deploy`,
        { code: editedCode, project_name: projectName, prompt: currentPrompt },
        { timeout: 120000 }
      );
      if (response.data.success) {
        setDeployedUrl(response.data.url || "");
        setDeployedProjectName(response.data.project_name || projectName);
        setSuccess("🚀 Deployed successfully!");
        setDeployDialogOpen(true);
      } else {
        setError(`❌ Deployment failed: ${response.data.error || "Unknown"}`);
      }
    } catch (err) {
      setError(`❌ Deployment failed: ${err.response?.data?.error || err.message || "Unable to deploy"}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, setLoading,
    deployDialogOpen, setDeployDialogOpen,
    deployedUrl, deployedProjectName,
    handleGenerateCode, handleDeployToVercel,
  };
}