// src/App.js
import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Chip, IconButton, Fade, Alert, Zoom, Tooltip,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import BugReportIcon from "@mui/icons-material/BugReport";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";

import VoicePromptInput from "./components/VoicePromptInput";
import CodeEditorPanel from "./components/CodeEditorPanel";
import LivePreviewPanel from "./components/LivePreviewPanel";
import SettingsAndHistory from "./components/SettingsAndHistory";
import ProjectsDialog from "./components/ProjectsDialog";
import ImageToWebsiteDialog from "./components/ImageToWebsiteDialog";
import AppFooter from "./components/AppFooter";
import { AI_MODELS, THEMES, preparePreviewHtml } from "./components/constants";

import useProjects from "./hooks/useProjects";
import useImageGeneration from "./hooks/useImageGeneration";
import useCodeGeneration from "./hooks/useCodeGeneration";
import useEditor from "./hooks/useEditor";

const SESSION_STORAGE_KEY = "buildCodeActiveSessionId";

export default function App() {
  // -------- State --------
  const [prompt, setPrompt] = useState("");
  const promptRef = useRef("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [editedCode, setEditedCode] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const previewUpdateTimerRef = useRef(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [modificationType, setModificationType] = useState("create");
  const [aiModel, setAiModel] = useState("openai/gpt-oss-120b");
  const [creativityLevel, setCreativityLevel] = useState(7);
  const [isAnimating, setIsAnimating] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(3);
  const [animationStyle, setAnimationStyle] = useState("typewriter");
  const animationRef = useRef(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modificationHistory, setModificationHistory] = useState([]);
  const [aiModelUsed, setAiModelUsed] = useState("");
  const [creativityApplied, setCreativityApplied] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [includeCSS, setIncludeCSS] = useState(true);
  const [includeJS, setIncludeJS] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [anchorEl, setAnchorEl] = useState(null);
  const [historyAnchor, setHistoryAnchor] = useState(null);
  const [glowEffect, setGlowEffect] = useState(true);
  const [particleEffect, setParticleEffect] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState("");

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const currentAiModel = AI_MODELS.find((m) => m.value === aiModel) || AI_MODELS[0];

  // -------- Session helpers --------
  const persistSession = (sid) => {
    try {
      if (sid) localStorage.setItem(SESSION_STORAGE_KEY, sid);
      else localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_) {}
  };
  const clearSessionCompletely = () => {
    setSessionId("");
    setSessionInfo(null);
    persistSession(null);
  };

  // -------- Shared ctx object (hook arguments) --------
  const ctx = {
    editedCode, setEditedCode, setGeneratedCode, setDisplayedText,
    setPrompt, promptRef, prompt,
    aiModel, setAiModel, creativityLevel, setCreativityLevel,
    modificationHistory, setModificationHistory,
    sessionId, setSessionId, persistSession, clearSessionCompletely,
    setPreviewHtml, setPreviewLoaded, setPreviewKey,
    setSuccess, setError, setIsAnimating,
    setAiModelUsed, setCreativityApplied,
    currentProjectName, setCurrentProjectName,
    modificationType, includeCSS, includeJS,
    particleEffect, currentTheme,
  };

  // -------- Hooks --------
  const projectsHook = useProjects(ctx);
  const imageHook = useImageGeneration(ctx);
  const genHook = useCodeGeneration(ctx);
  const editorHook = useEditor(ctx);

  const {
    projects, setProjects, projectsDialogOpen, setProjectsDialogOpen,
    loadProjects, saveCurrentProject, loadProject, deleteProject,
  } = projectsHook;

  const {
    imageDialogOpen, setImageDialogOpen, uploadedImage, setUploadedImage,
    imageMode, setImageMode, imagePrompt, setImagePrompt,
    imageLoading, imageInputRef, handleImageFileSelect, handleImageGenerate,
  } = imageHook;

  const {
    loading, deployDialogOpen, setDeployDialogOpen,
    deployedUrl, deployedProjectName,
    handleGenerateCode, handleDeployToVercel,
  } = genHook;

  const {
    editorRef, editorGutterRef,
    handleEditorChange, handleEditorScroll, handleEditorKeyDown,
    handleRefreshFromEditor, handleCopyCode, handleDownloadCode,
    handleRestartAnimation,
  } = editorHook;

  // -------- Effects --------
  useEffect(() => {
    setPrompt("Create a calculator with dark theme");
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setSuccess("🔄 Previous session restored.");
      setTimeout(() => setSuccess(""), 3000);
    }
    const savedSettings = localStorage.getItem("codeGenSettings");
    if (savedSettings) {
      try {
        const s = JSON.parse(savedSettings);
        setTheme(s.theme || "dark");
        setShowLineNumbers(s.showLineNumbers !== false);
        setGlowEffect(s.glowEffect !== false);
        setParticleEffect(s.particleEffect || false);
        setAiModel(s.aiModel || "openai/gpt-oss-120b");
        setCreativityLevel(s.creativityLevel || 7);
      } catch (e) { console.error(e); }
    }
    setProjects(loadProjects());
  }, []);

  useEffect(() => {
    localStorage.setItem("codeGenSettings",
      JSON.stringify({ theme, showLineNumbers, glowEffect, particleEffect, aiModel, creativityLevel }));
  }, [theme, showLineNumbers, glowEffect, particleEffect, aiModel, creativityLevel]);

  useEffect(() => { promptRef.current = prompt; }, [prompt]);

  // Animation
  useEffect(() => {
    if (!generatedCode || !isAnimating) return;
    const lines = generatedCode.split("\n");
    const animatedLineCount = Math.min(10, lines.length);
    let lineIndex = 0, charIndex = 0, output = "", cancelled = false;
    if (animationRef.current) clearTimeout(animationRef.current);
    setDisplayedText("");

    const finish = () => {
      if (cancelled) return;
      setDisplayedText(generatedCode);
      setEditedCode(generatedCode);
      setIsAnimating(false);
    };
    const typeNext = () => {
      if (cancelled) return;
      if (lineIndex < animatedLineCount) {
        const line = lines[lineIndex];
        if (charIndex < line.length) { output += line.charAt(charIndex++); }
        else { if (lineIndex < lines.length - 1) output += "\n"; lineIndex++; charIndex = 0; }
        setDisplayedText(output);
        animationRef.current = setTimeout(typeNext, 3);
        return;
      }
      finish();
    };
    if (animatedLineCount === 0) finish();
    else animationRef.current = setTimeout(typeNext, 3);
    return () => { cancelled = true; if (animationRef.current) clearTimeout(animationRef.current); };
  }, [generatedCode, isAnimating]);

  // Preview sync
  useEffect(() => {
    if (!editedCode) return;
    if (previewUpdateTimerRef.current) clearTimeout(previewUpdateTimerRef.current);
    previewUpdateTimerRef.current = setTimeout(() => {
      setPreviewLoaded(false);
      setPreviewHtml(preparePreviewHtml(editedCode));
      setPreviewKey((p) => p + 1);
    }, 350);
    return () => { if (previewUpdateTimerRef.current) clearTimeout(previewUpdateTimerRef.current); };
  }, [editedCode]);

  // Custom CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
      @keyframes confetti-fall { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(100vh) rotate(720deg)} }
      .pulse{animation:pulse .5s ease-in-out}
      .custom-scrollbar::-webkit-scrollbar{width:10px;height:10px}
      .custom-scrollbar::-webkit-scrollbar-track{background:#0f172a;border-radius:4px}
      .custom-scrollbar::-webkit-scrollbar-thumb{background:${currentTheme.primary}80;border-radius:4px;border:2px solid #0f172a}
      .preview-scrollbar::-webkit-scrollbar{width:8px}
      .preview-scrollbar::-webkit-scrollbar-track{background:#f1f5f9;border-radius:4px}
      .preview-scrollbar::-webkit-scrollbar-thumb{background:${currentTheme.secondary}60;border-radius:4px}
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [currentTheme]);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && prompt.trim()) {
        e.preventDefault();
        handleGenerateCode(modificationType !== "create");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prompt, modificationType, handleGenerateCode]);

  // -------- Other UI helpers --------
  const handleClearSession = () => {
    clearSessionCompletely();
    setGeneratedCode(""); setEditedCode(""); setPreviewHtml("");
    setPreviewLoaded(false); setPreviewKey((p) => p + 1);
    setDisplayedText(""); setIsAnimating(false); setModificationHistory([]);
    setAiModelUsed(""); setCreativityApplied(0.7); setCurrentProjectName("");
    setSuccess("🧹 Session cleared."); setTimeout(() => setSuccess(""), 2500);
  };
  const handleSettingsClick = (e) => { setAnchorEl(e.currentTarget); setShowSettings(!showSettings); };
  const handleSettingsClose = () => { setAnchorEl(null); setShowSettings(false); };
  const handleHistoryClick = (e) => setHistoryAnchor(e.currentTarget);
  const handleHistoryClose = () => setHistoryAnchor(null);
  const calculateTemperature = (level) => {
    const l = Math.max(1, Math.min(10, level));
    const base = modificationType === "create" ? 0.8 : 0.7;
    if (l <= 3) return base - 0.3;
    if (l <= 6) return base - 0.1;
    if (l <= 8) return base + 0.1;
    return base + 0.3;
  };

  const quickModifications = [
    { type: "modify", label: "🌈 Neon Theme", prompt: "Transform the design with neon glow effects, dark background and vibrant colors", color: "#8b5cf6", icon: "🌈", recommendedAiModel: "openai/gpt-oss-120b", recommendedCreativity: 9 },
    { type: "enhance", label: "⚡ Animations", prompt: "Add smooth hover animations, loading effects and transition animations", color: "#06b6d4", icon: "⚡", recommendedAiModel: "openai/gpt-oss-120b", recommendedCreativity: 8 },
    { type: "modify", label: "📱 Responsive", prompt: "Make it fully responsive for all devices with mobile-first approach", color: "#10b981", icon: "📱", recommendedAiModel: "openai/gpt-oss-120b", recommendedCreativity: 6 },
    { type: "enhance", label: "🎮 Interactive", prompt: "Add interactive elements, hover effects and click animations", color: "#f59e0b", icon: "🎮", recommendedAiModel: "openai/gpt-oss-120b", recommendedCreativity: 8 },
    { type: "modify", label: "🌙 Dark/Light", prompt: "Add dark/light mode toggle with smooth theme switching", color: "#6366f1", icon: "🌙", recommendedAiModel: "openai/gpt-oss-120b", recommendedCreativity: 7 },
  ];

  // -------- Render --------
  return (
    <Box sx={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${currentTheme.primary}20 0%, ${currentTheme.secondary}20 50%, #0f172a 100%)`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Header */}
      <Box sx={{ p: 2, background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 32, color: "yellow" }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "white" }}>AutoGen AI</Typography>
              <Typography variant="caption" sx={{ color: "rgba(9, 1, 1, 0.8)", display: "flex", alignItems: "center", gap: 0.5 }}>
                <SmartToyIcon fontSize="small" /> Multi-AI Code Generator
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Tooltip title="Projects">
              <IconButton onClick={() => { setProjects(loadProjects()); setProjectsDialogOpen(true); }}
                sx={{ background: "rgba(66, 238, 8, 0.76)", color: "black" }}>
                <FolderOpenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save project">
              <IconButton
                onClick={() => { const n = window.prompt("Project name:", currentProjectName || "My Project"); if (n) saveCurrentProject(n); }}
                disabled={!editedCode}
                sx={{ background: "rgba(255,255,255,0.2)", color: "black" }}>

                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Image → Website">
              <IconButton
                onClick={() => { setUploadedImage(null); setImagePrompt(""); setImageMode("website"); setImageDialogOpen(true); }}
                sx={{ background: "rgba(255,255,255,0.2)", color: "yellow" }}>
                <ImageIcon />
              </IconButton>
            </Tooltip>
            {aiModelUsed && <Chip icon={currentAiModel.icon} label={`AI: ${aiModelUsed}`} size="small" sx={{ background: "rgba(255,255,255,0.2)", color: "white" }} />}
            {sessionId && <Chip label={`Session: ${sessionId.substring(0, 6)}...`} size="small" sx={{ background: "rgba(16,185,129,0.3)", color: "white" }} />}
            {currentProjectName && <Chip label={`📁 ${currentProjectName}`} size="small" sx={{ background: "rgba(59,130,246,0.3)", color: "white" }} />}
            <Chip icon={<HistoryIcon />} label={`${modificationHistory.length} steps`} size="small" onClick={handleHistoryClick}
              sx={{ background: "rgba(255,255,255,0.2)", color: "white", cursor: "pointer" }} />
            <IconButton onClick={handleSettingsClick} sx={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main */}
      <Box sx={{ display: "flex", height: "calc(100vh - 180px)", p: 2, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
        <Box sx={{ flex: { xs: "1", md: 4 }, display: "flex", minHeight: 0 }}>
          <Zoom in appear={false} timeout={400} style={{ transitionDelay: "100ms", width: "100%" }}>
            <Box sx={{ width: "100%", display: "flex" }}>
              <CodeEditorPanel
                currentTheme={currentTheme} currentAiModel={currentAiModel}
                generatedCode={generatedCode} editedCode={editedCode} displayedText={displayedText}
                isAnimating={isAnimating} typingSpeed={typingSpeed} setTypingSpeed={setTypingSpeed}
                animationStyle={animationStyle} setAnimationStyle={setAnimationStyle}
                aiModelUsed={aiModelUsed} creativityApplied={creativityApplied}
                showLineNumbers={showLineNumbers} glowEffect={glowEffect}
                editorRef={editorRef} editorGutterRef={editorGutterRef}
                handleEditorChange={handleEditorChange} handleEditorScroll={handleEditorScroll}
                handleEditorKeyDown={handleEditorKeyDown}
                handleCopyCode={handleCopyCode} handleDownloadCode={handleDownloadCode}
                handleRestartAnimation={handleRestartAnimation}
                handleDeployToVercel={handleDeployToVercel}
                handleRefreshFromEditor={handleRefreshFromEditor}
                setIsAnimating={setIsAnimating} loading={loading}
              />
            </Box>
          </Zoom>
        </Box>
        <Box sx={{ flex: { xs: "1", md: 5 }, display: "flex", minHeight: 0 }}>
          <Zoom in appear={false} timeout={400} style={{ transitionDelay: "200ms", width: "100%" }}>
            <Box sx={{ width: "100%", display: "flex" }}>
              <LivePreviewPanel
                currentTheme={currentTheme} previewHtml={previewHtml}
                previewKey={previewKey} previewLoaded={previewLoaded}
                setPreviewLoaded={setPreviewLoaded} glowEffect={glowEffect}
              />
            </Box>
          </Zoom>
        </Box>
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, background: "#0f172a", borderTop: `1px solid ${currentTheme.primary}30` }}>
        <VoicePromptInput
          prompt={prompt} setPrompt={setPrompt} promptRef={promptRef}
          modificationType={modificationType} setModificationType={setModificationType}
          aiModel={aiModel} setAiModel={setAiModel}
          creativityLevel={creativityLevel} setCreativityLevel={setCreativityLevel}
          currentTheme={currentTheme} currentAiModel={currentAiModel}
          loading={loading} onGenerate={handleGenerateCode}
          setError={setError} setSuccess={setSuccess}
          quickModifications={quickModifications}
        />
        <Box sx={{ mt: 1.5 }}>
          {error && <Fade in><Alert severity="error" icon={<BugReportIcon />} onClose={() => setError("")}>{error}</Alert></Fade>}
          {success && <Fade in><Alert severity="success" icon={<AutoAwesomeIcon />} onClose={() => setSuccess("")}>{success}</Alert></Fade>}
        </Box>
      </Box>

      <SettingsAndHistory
        currentTheme={currentTheme}
        showSettings={showSettings} anchorEl={anchorEl} handleSettingsClose={handleSettingsClose}
        aiModel={aiModel} setAiModel={setAiModel}
        creativityLevel={creativityLevel} setCreativityLevel={setCreativityLevel}
        calculateTemperature={calculateTemperature}
        theme={theme} setTheme={setTheme}
        showLineNumbers={showLineNumbers} setShowLineNumbers={setShowLineNumbers}
        includeCSS={includeCSS} setIncludeCSS={setIncludeCSS}
        includeJS={includeJS} setIncludeJS={setIncludeJS}
        glowEffect={glowEffect} setGlowEffect={setGlowEffect}
        particleEffect={particleEffect} setParticleEffect={setParticleEffect}
        historyAnchor={historyAnchor} handleHistoryClose={handleHistoryClose}
        modificationHistory={modificationHistory} handleClearSession={handleClearSession}
        deployDialogOpen={deployDialogOpen} setDeployDialogOpen={setDeployDialogOpen}
        deployedUrl={deployedUrl} deployedProjectName={deployedProjectName}
        setError={setError} setSuccess={setSuccess}
      />

      <ProjectsDialog
        open={projectsDialogOpen} onClose={() => setProjectsDialogOpen(false)}
        projects={projects} currentTheme={currentTheme}
        currentProjectName={currentProjectName} editedCode={editedCode}
        saveCurrentProject={saveCurrentProject} loadProject={loadProject}
        deleteProject={deleteProject} setProjects={setProjects} loadProjects={loadProjects}
      />

      <ImageToWebsiteDialog
        open={imageDialogOpen} onClose={() => setImageDialogOpen(false)}
        currentTheme={currentTheme} imageLoading={imageLoading}
        imageInputRef={imageInputRef} uploadedImage={uploadedImage}
        setUploadedImage={setUploadedImage} imageMode={imageMode} setImageMode={setImageMode}
        imagePrompt={imagePrompt} setImagePrompt={setImagePrompt}
        handleImageFileSelect={handleImageFileSelect} handleImageGenerate={handleImageGenerate}
      />

      <AppFooter
        currentTheme={currentTheme} sessionId={sessionId}
        currentProjectName={currentProjectName} aiModelUsed={aiModelUsed}
        currentAiModel={currentAiModel} generatedCode={generatedCode}
        creativityLevel={creativityLevel}
      />
    </Box>
  );
}