// src/components/SettingsAndHistory.jsx
import React from "react";
import {
  Box, Stack, Typography, Divider, Slider, Tooltip, Switch, Popover,
  List, ListItem, ListItemIcon, ListItemText, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, IconButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import CodeIcon from "@mui/icons-material/Code";
import AnimationIcon from "@mui/icons-material/Animation";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { AI_MODELS, MODIFICATION_TYPES, THEMES } from "./constants";

const SettingsAndHistory = ({
  currentTheme,
  showSettings, anchorEl, handleSettingsClose,
  aiModel, setAiModel,
  creativityLevel, setCreativityLevel, calculateTemperature,
  theme, setTheme,
  showLineNumbers, setShowLineNumbers,
  includeCSS, setIncludeCSS,
  includeJS, setIncludeJS,
  glowEffect, setGlowEffect,
  particleEffect, setParticleEffect,
  historyAnchor, handleHistoryClose,
  modificationHistory, handleClearSession,
  deployDialogOpen, setDeployDialogOpen,
  deployedUrl, deployedProjectName,
  setError, setSuccess,
}) => {
  return (
    <>
      {/* SETTINGS POPOVER */}
      <Popover
        open={showSettings}
        anchorEl={anchorEl}
        onClose={handleSettingsClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          sx: {
            background: "#1e293b",
            border: `1px solid ${currentTheme.primary}40`,
            borderRadius: 3,
            p: 2,
            width: 350,
            mt: 1,
            boxShadow: `0 20px 60px ${currentTheme.primary}30`,
            maxHeight: "80vh",
            overflow: "auto",
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <SettingsIcon /> Settings & Preferences
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#94a3b8",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <SmartToyIcon sx={{ fontSize: 16 }} /> AI Model
              </Typography>
              <Stack spacing={1}>
                {AI_MODELS.map((model) => (
                  <Box
                    key={model.value}
                    onClick={() => setAiModel(model.value)}
                    sx={{
                      p: 1.5,
                      background:
                        aiModel === model.value
                          ? `${model.color}20`
                          : "#0f172a",
                      border: `1px solid ${
                        aiModel === model.value
                          ? model.color
                          : currentTheme.primary
                      }40`,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        background: `${model.color}20`,
                        borderColor: model.color,
                      },
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box sx={{ color: model.color }}>{model.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "white", fontWeight: 500 }}
                        >
                          {model.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#94a3b8" }}
                        >
                          {model.description}
                        </Typography>
                      </Box>
                      {aiModel === model.value && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: model.color,
                            boxShadow: `0 0 10px ${model.color}`,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ borderColor: `${currentTheme.primary}20` }} />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#94a3b8",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 16 }} /> Creativity Control
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}
              >
                Level: {creativityLevel}/10
              </Typography>
              <Slider
                value={creativityLevel}
                onChange={(e, v) => setCreativityLevel(v)}
                min={1}
                max={10}
                sx={{
                  color: currentTheme.primary,
                  "& .MuiSlider-thumb": {
                    boxShadow: `0 0 10px ${currentTheme.primary}`,
                  },
                }}
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Precise ({calculateTemperature(1).toFixed(2)})
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Balanced ({calculateTemperature(5).toFixed(2)})
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Creative ({calculateTemperature(10).toFixed(2)})
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: `${currentTheme.primary}20` }} />

            <Box>
              <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
                <ColorLensIcon sx={{ fontSize: 16, mr: 1 }} /> Theme
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {THEMES.map((t) => (
                  <Tooltip key={t.value} title={t.name}>
                    <Box
                      onClick={() => setTheme(t.value)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${t.primary} 0%, ${t.secondary} 100%)`,
                        cursor: "pointer",
                        border:
                          theme === t.value
                            ? "2px solid white"
                            : "2px solid transparent",
                        boxShadow:
                          theme === t.value
                            ? `0 0 10px ${t.primary}`
                            : "none",
                        transition: "all 0.2s",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ borderColor: `${currentTheme.primary}20` }} />

            <Box>
              <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
                <CodeIcon sx={{ fontSize: 16, mr: 1 }} /> Code Display
              </Typography>
              <Stack spacing={1}>
                {[
                  ["Line Numbers", showLineNumbers, setShowLineNumbers],
                  ["Include CSS", includeCSS, setIncludeCSS],
                  ["Include JavaScript", includeJS, setIncludeJS],
                ].map(([label, val, set]) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "white" }}>
                      {label}
                    </Typography>
                    <Switch
                      checked={val}
                      onChange={(e) => set(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ borderColor: `${currentTheme.primary}20` }} />

            <Box>
              <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
                <AnimationIcon sx={{ fontSize: 16, mr: 1 }} /> Visual Effects
              </Typography>
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "white" }}>
                    Glow Effects
                  </Typography>
                  <Switch
                    checked={glowEffect}
                    onChange={(e) => setGlowEffect(e.target.checked)}
                    color="primary"
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "white" }}>
                    Particle Effects
                  </Typography>
                  <Switch
                    checked={particleEffect}
                    onChange={(e) => setParticleEffect(e.target.checked)}
                    color="primary"
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Popover>

      {/* HISTORY POPOVER */}
      <Popover
        open={Boolean(historyAnchor)}
        anchorEl={historyAnchor}
        onClose={handleHistoryClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            background: "#1e293b",
            border: `1px solid ${currentTheme.primary}40`,
            borderRadius: 3,
            p: 2,
            width: 350,
            maxHeight: 400,
            boxShadow: `0 20px 60px ${currentTheme.primary}30`,
            overflow: "hidden",
          },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: "white",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <HistoryIcon /> Modification History
        </Typography>
        {modificationHistory.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <HistoryIcon sx={{ fontSize: 48, color: "#64748b", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No modifications yet
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              className="custom-scrollbar"
              sx={{ maxHeight: 300, overflow: "auto", pr: 1 }}
            >
              <List sx={{ py: 0 }}>
                {modificationHistory.map((mod, index) => {
                  const aiModelObj =
                    AI_MODELS.find((m) => m.value === mod.ai_model) ||
                    AI_MODELS[0];
                  return (
                    <ListItem
                      key={mod.id}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        mb: 1,
                        background:
                          index === 0
                            ? `${currentTheme.primary}15`
                            : "transparent",
                        borderLeft: `3px solid ${
                          MODIFICATION_TYPES.find((t) => t.value === mod.type)
                            ?.color || currentTheme.primary
                        }`,
                        "&:hover": { background: "#0f172a" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${
                              MODIFICATION_TYPES.find(
                                (t) => t.value === mod.type
                              )?.color || currentTheme.primary
                            } 0%, ${aiModelObj.color} 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {mod.icon || (
                            <AddIcon
                              sx={{ fontSize: 14, color: "white" }}
                            />
                          )}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "white",
                                fontWeight: 500,
                                mb: 0.5,
                              }}
                            >
                              {mod.summary?.substring(0, 40) ||
                                mod.prompt.substring(0, 40)}
                              ...
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                label={aiModelObj.label}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.6rem",
                                  background: `${aiModelObj.color}20`,
                                  color: aiModelObj.color,
                                  border: `1px solid ${aiModelObj.color}40`,
                                }}
                              />
                              {mod.creativity && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#94a3b8" }}
                                >
                                  Temp:{" "}
                                  {typeof mod.creativity === "number"
                                    ? mod.creativity.toFixed(2)
                                    : "0.70"}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{ color: "#94a3b8", mt: 1 }}
                          >
                            {mod.timestamp}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
            <Button
              fullWidth
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => {
                handleClearSession();
                handleHistoryClose();
              }}
              sx={{
                mt: 2,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#fca5a5",
                "&:hover": { background: "rgba(239, 68, 68, 0.2)" },
              }}
            >
              Clear All History
            </Button>
          </>
        )}
      </Popover>

      {/* DEPLOY DIALOG */}
      <Dialog
        open={deployDialogOpen}
        onClose={() => setDeployDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "#111827",
            color: "white",
            border: `1px solid ${currentTheme.primary}50`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 800,
            color: "white",
          }}
        >
          <CheckCircleIcon sx={{ color: "#10b981" }} /> Deployment Successful
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: "#cbd5e1" }}>
            🎉 Your website is now live on Vercel!
          </Typography>
          {deployedProjectName && (
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: 700, color: currentTheme.primary }}
            >
              {deployedProjectName}
            </Typography>
          )}
          <TextField
            fullWidth
            value={deployedUrl}
            label="Live Website"
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Copy Link">
                    <IconButton
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(deployedUrl);
                          setSuccess("🔗 Deployment link copied!");
                          setTimeout(() => setSuccess(""), 2000);
                        } catch {
                          setError("❌ Failed to copy link.");
                        }
                      }}
                      sx={{ color: currentTheme.primary }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              "& .MuiInputLabel-root": { color: "#94a3b8" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "#475569" },
                "&:hover fieldset": { borderColor: currentTheme.primary },
                "&.Mui-focused fieldset": {
                  borderColor: currentTheme.primary,
                },
              },
            }}
          />
          {deployedUrl && (
            <Typography
              component="a"
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "block",
                wordBreak: "break-all",
                color: "#60a5fa",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {deployedUrl}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
          <Button
            onClick={() => setDeployDialogOpen(false)}
            variant="outlined"
            sx={{ color: "white", borderColor: "#475569" }}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            disabled={!deployedUrl}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(deployedUrl);
                setSuccess("🔗 Deployment link copied!");
                setTimeout(() => setSuccess(""), 2000);
              } catch {
                setError("❌ Failed to copy link.");
              }
            }}
            sx={{
              color: "white",
              borderColor: currentTheme.primary,
              "&:hover": {
                borderColor: currentTheme.primary,
                background: `${currentTheme.primary}15`,
              },
            }}
          >
            Copy Link
          </Button>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            disabled={!deployedUrl}
            onClick={() => {
              if (deployedUrl)
                window.open(deployedUrl, "_blank", "noopener,noreferrer");
            }}
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.primary})`,
              },
            }}
          >
            Open Website
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsAndHistory;