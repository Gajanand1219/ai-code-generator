// src/components/LivePreviewPanel.jsx
import React from "react";
import {
  Box, Card, CardContent, Chip, Fade, Typography, Stack, CircularProgress,
} from "@mui/material";
import PreviewIcon from "@mui/icons-material/Preview";

const LivePreviewPanel = ({
  currentTheme, previewHtml, previewKey, previewLoaded,
  setPreviewLoaded, glowEffect,
}) => {
  return (
    <Card
      sx={{
        flex: { xs: "1", md: 5 },
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
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(90deg, ${currentTheme.secondary}20 0%, transparent 100%)`,
            borderBottom: `1px solid ${currentTheme.secondary}30`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: currentTheme.secondary,
                boxShadow: `0 0 10px ${currentTheme.secondary}`,
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
              <PreviewIcon sx={{ color: currentTheme.secondary }} /> Live Preview
            </Typography>
            {previewHtml && (
              <Chip
                label="Live"
                size="small"
                sx={{
                  background: `${currentTheme.secondary}20`,
                  color: currentTheme.secondary,
                  animation: "pulse 1.5s ease-in-out infinite",
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: { xs: 1, md: 0 },
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "#10b981",
                borderRadius: "50%",
                display: "inline-block",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            Real-time rendering
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            background: "white",
            position: "relative",
          }}
        >
          {previewHtml ? (
            <>
              <Box
                className="preview-scrollbar"
                sx={{ width: "100%", height: "100%", overflow: "auto" }}
              >
                <iframe
                  key={previewKey}
                  srcDoc={previewHtml}
                  title="live-preview"
                  onLoad={() => setPreviewLoaded(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "100%",
                    border: "none",
                    background: "white",
                    display: "block",
                  }}
                  sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  referrerPolicy="no-referrer"
                />
              </Box>
              {!previewLoaded && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    background: "rgba(255,255,255,0.82)",
                    zIndex: 2,
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress
                      size={28}
                      sx={{ color: currentTheme.primary }}
                    />
                    <Typography variant="caption" sx={{ color: "#475569" }}>
                      Loading preview...
                    </Typography>
                  </Stack>
                </Box>
              )}
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  gap: 0.5,
                }}
              >
                {["red", "yellow", "green"].map((color, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </Box>
            </>
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
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${currentTheme.secondary} 0%, ${currentTheme.primary} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  <PreviewIcon sx={{ fontSize: 40, color: "white" }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ color: "#1e293b", mb: 0.5 }}>
                    Preview Area
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Generated content will appear here
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

export default LivePreviewPanel;