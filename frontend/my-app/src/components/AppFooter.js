// src/components/AppFooter.js
import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function AppFooter({
  currentTheme,
  sessionId,
  currentProjectName,
  aiModelUsed,
  currentAiModel,
  generatedCode,
  creativityLevel,
}) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        background: "#0f172a",
        borderTop: `1px solid ${currentTheme.primary}20`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#64748b", display: "flex", alignItems: "center", gap: 1 }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: sessionId ? "#10b981" : "#f59e0b",
            animation: sessionId ? "pulse 2s ease-in-out infinite" : "none",
          }}
        />
        Session: {sessionId ? `${sessionId.substring(0, 8)}...` : "New"}
        {currentProjectName && (
          <>
            <span style={{ color: "#94a3b8" }}>|</span>
            <span style={{ color: "#60a5fa" }}>📁 {currentProjectName}</span>
          </>
        )}
        {aiModelUsed && (
          <>
            <span style={{ color: "#94a3b8" }}>|</span>
            <span style={{ color: currentAiModel.color }}>{currentAiModel.label}</span>
          </>
        )}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {generatedCode && (
          <Chip
            label={`${generatedCode.split("\n").length} lines`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.7rem",
              height: 20,
              color: "#94a3b8",
              borderColor: `${currentTheme.primary}30`,
            }}
          />
        )}
        {creativityLevel > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: currentTheme.primary }} />
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              {creativityLevel}/10
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}