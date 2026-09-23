// src/components/CodeEditorPanel.jsx
import React from "react";
import {
  Box, Card, CardContent, Chip, Divider, Fade, IconButton, Slider,
  Stack, Tooltip, Typography, CircularProgress, Select, MenuItem,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CodeIcon from "@mui/icons-material/Code";
import AnimationIcon from "@mui/icons-material/Animation";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SpeedIcon from "@mui/icons-material/Speed";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

const CodeEditorPanel = ({
  currentTheme, currentAiModel,
  generatedCode, editedCode, displayedText, isAnimating,
  typingSpeed, setTypingSpeed, animationStyle, setAnimationStyle,
  aiModelUsed, creativityApplied,
  showLineNumbers, glowEffect,
  editorRef, editorGutterRef,
  handleEditorChange, handleEditorScroll, handleEditorKeyDown,
  handleCopyCode, handleDownloadCode, handleRestartAnimation,
  handleDeployToVercel, handleRefreshFromEditor,
  setIsAnimating, loading,
}) => {
  return (
    <Card
      sx={{
        flex: { xs: "1", md: 4 },
        display: "flex",
        flexDirection: "column",
        background: "#1e293b",
        border: `1px solid ${currentTheme.primary}40`,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: glowEffect
          ? `0 10px 40px ${currentTheme.primary}40`
          : "none",
        transition: "all 0.3s ease",
        minHeight: { xs: "400px", md: "auto" },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(90deg, ${currentTheme.primary}20 0%, transparent 100%)`,
            borderBottom: `1px solid ${currentTheme.primary}30`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: currentTheme.primary,
                boxShadow: `0 0 10px ${currentTheme.primary}`,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CodeIcon sx={{ color: currentTheme.primary }} /> Live Code
              Editor
            </Typography>
            {isAnimating && (
              <Chip
                label="Animating"
                size="small"
                icon={<AnimationIcon />}
                sx={{
                  background: `${currentTheme.primary}20`,
                  color: currentTheme.primary,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            )}
          </Box>
          {aiModelUsed && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                size="small"
                icon={currentAiModel.icon}
                label={aiModelUsed}
                sx={{
                  background: `${currentAiModel.color}20`,
                  color: currentAiModel.color,
                  border: `1px solid ${currentAiModel.color}40`,
                  fontSize: "0.7rem",
                  height: 24,
                }}
              />
              {creativityApplied > 0 && (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Temp: {creativityApplied.toFixed(2)}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Box
          sx={{
            p: 1.5,
            background: "#0f172a",
            borderBottom: `1px solid ${currentTheme.primary}20`,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
              minWidth: "200px",
            }}
          >
            <Tooltip title="Animation Speed">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <SpeedIcon
                  sx={{
                    color: currentTheme.primary,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                />
                <Slider
                  value={typingSpeed}
                  onChange={(e, v) => setTypingSpeed(v)}
                  min={5}
                  max={100}
                  sx={{
                    color: currentTheme.primary,
                    "& .MuiSlider-thumb": {
                      boxShadow: `0 0 10px ${currentTheme.primary}`,
                    },
                  }}
                  size="small"
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", minWidth: 40, flexShrink: 0 }}
                >
                  {typingSpeed}ms
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title="Animation Style">
              <Select
                value={animationStyle}
                onChange={(e) => setAnimationStyle(e.target.value)}
                size="small"
                sx={{
                  color: "white",
                  fontSize: "0.75rem",
                  background: "#1e293b",
                  border: `1px solid ${currentTheme.primary}40`,
                  borderRadius: 2,
                  "& .MuiSelect-select": { py: 0.5, px: 1 },
                  minWidth: "100px",
                }}
              >
                <MenuItem value="typewriter">Typewriter</MenuItem>
                <MenuItem value="matrix">Matrix</MenuItem>
              </Select>
            </Tooltip>
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Tooltip title={isAnimating ? "Pause" : "Play"}>
              <IconButton
                onClick={() => setIsAnimating(!isAnimating)}
                disabled={!generatedCode}
                sx={{
                  color: isAnimating ? currentTheme.primary : "white",
                  background: isAnimating
                    ? `${currentTheme.primary}20`
                    : "transparent",
                  "&:hover": { background: `${currentTheme.primary}30` },
                }}
              >
                {isAnimating ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Restart">
              <IconButton
                onClick={handleRestartAnimation}
                disabled={!generatedCode}
                sx={{ color: "white", "&:hover": { color: currentTheme.primary } }}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: `${currentTheme.primary}30` }}
            />
            <Tooltip title="Copy Code">
              <IconButton
                onClick={handleCopyCode}
                disabled={!generatedCode}
                sx={{ color: "white", "&:hover": { color: "#10b981" } }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton
                onClick={handleDownloadCode}
                disabled={!generatedCode}
                sx={{ color: "white", "&:hover": { color: "#3b82f6" } }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={loading ? "Deploying to Vercel..." : "Deploy to Vercel"}
            >
              <IconButton
                onClick={handleDeployToVercel}
                disabled={!editedCode || loading || isAnimating}
                sx={{
                  color: loading ? currentTheme.primary : "white",
                  background: loading
                    ? `${currentTheme.primary}20`
                    : "transparent",
                  "&:hover": {
                    color: currentTheme.primary,
                    background: `${currentTheme.primary}20`,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={21}
                    sx={{ color: currentTheme.primary }}
                  />
                ) : (
                  <RocketLaunchIcon />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Code display */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            background: "#0f172a",
            position: "relative",
          }}
        >
          {generatedCode ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "#0b1120",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  borderBottom: `1px solid ${currentTheme.primary}20`,
                  background: "#111827",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={isAnimating ? "REVEALING" : "EDITABLE"}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      background: isAnimating
                        ? `${currentTheme.primary}25`
                        : "rgba(16,185,129,.15)",
                      color: isAnimating ? currentTheme.primary : "#34d399",
                      border: `1px solid ${
                        isAnimating ? currentTheme.primary : "#10b981"
                      }40`,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {editedCode.split("\n").length} lines · Ctrl+S to apply
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Apply editor changes to preview">
                    <IconButton
                      size="small"
                      onClick={handleRefreshFromEditor}
                      sx={{ color: currentTheme.primary }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy edited code">
                    <IconButton
                      size="small"
                      onClick={handleCopyCode}
                      sx={{ color: "#cbd5e1" }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  overflow: "hidden",
                  fontFamily:
                    '"Fira Code", "Cascadia Code", Consolas, monospace',
                }}
              >
                <Box
                  ref={editorGutterRef}
                  className="custom-scrollbar"
                  sx={{
                    width: showLineNumbers ? 54 : 0,
                    flexShrink: 0,
                    overflow: "hidden",
                    py: 2,
                    pr: 1,
                    pl: 1,
                    textAlign: "right",
                    color: "#475569",
                    background: "#0a0f1c",
                    borderRight: `1px solid ${currentTheme.primary}18`,
                    userSelect: "none",
                    fontSize: 13,
                    lineHeight: "21px",
                    whiteSpace: "pre",
                  }}
                >
                  {showLineNumbers &&
                    Array.from(
                      { length: Math.max(1, editedCode.split("\n").length) },
                      (_, i) => <div key={i}>{i + 1}</div>
                    )}
                </Box>
                <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
                  <textarea
                    ref={editorRef}
                    value={isAnimating ? displayedText : editedCode}
                    onChange={handleEditorChange}
                    onScroll={handleEditorScroll}
                    onKeyDown={handleEditorKeyDown}
                    spellCheck={false}
                    aria-label="Editable generated code"
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "100%",
                      resize: "none",
                      outline: "none",
                      border: "none",
                      padding: "16px",
                      margin: 0,
                      background: "#0f172a",
                      color: "#e2e8f0",
                      caretColor: currentTheme.primary,
                      fontFamily:
                        '"Fira Code", "Cascadia Code", Consolas, monospace',
                      fontSize: "13px",
                      lineHeight: "21px",
                      tabSize: 2,
                      whiteSpace: "pre",
                      overflow: "auto",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ) : (
            <Fade in={true} appear={false} timeout={300}>
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 2,
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: `conic-gradient(${currentTheme.primary}, ${currentTheme.secondary}, #0f172a)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  <CodeIcon sx={{ fontSize: 40, color: "white" }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ color: "white", mb: 0.5 }}>
                    Ready to Generate
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    Select AI model and describe what you want to build
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CodeEditorPanel;