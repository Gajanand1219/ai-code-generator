// src/components/VoicePromptInput.jsx
import React, { useCallback, useRef, useState } from "react";
import {
  Box, TextField, InputAdornment, IconButton, Tooltip, Stack, Chip,
  FormControl, InputLabel, Select, MenuItem, Typography, Button,
  CircularProgress,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import useSpeechRecognition from "./useSpeechRecognition";
import { AI_MODELS, MODIFICATION_TYPES } from "./constants";

const VoicePromptInput = ({
  prompt, setPrompt, promptRef,
  modificationType, setModificationType,
  aiModel, setAiModel,
  creativityLevel, setCreativityLevel,
  currentTheme, currentAiModel,
  loading, onGenerate,
  setError, setSuccess,
  quickModifications,
}) => {
  const [isListening, setIsListening] = useState(false);
  const autoSentRef = useRef(false);

  const handleSilence = useCallback(
    (spoken) => {
      if (!spoken || autoSentRef.current) return;
      autoSentRef.current = true;
      setPrompt(spoken);
      promptRef.current = spoken;
      setSuccess("🎤 3 seconds of silence detected. Generating...");
      setIsListening(false);
      setTimeout(() => {
        onGenerate(modificationType !== "create", spoken);
      }, 100);
    },
    [modificationType, onGenerate, promptRef, setPrompt, setSuccess]
  );

  const speech = useSpeechRecognition({
    lang: "en-IN",
    continuous: true,
    silenceMs: 3000,
    onSilence: handleSilence,
  });

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      speech.stop();
      setIsListening(false);
      return;
    }
    autoSentRef.current = false;
    setError("");
    setSuccess(
      "🎤 Listening... Speak now. I will auto-send after 3 seconds of silence."
    );

    const ok = speech.start({
      onStart: () => setIsListening(true),
      onResult: ({ combined }) => {
        if (!combined) return;
        promptRef.current = combined;
        setPrompt(combined);
      },
      onError: (err) => {
        setIsListening(false);
        if (err === "not-allowed")
          setError("🎤 Microphone permission denied. Allow access and retry.");
        else if (err === "unsupported")
          setError("🎤 Voice input not supported. Use Chrome or Edge.");
        else setError(`🎤 Voice input error: ${err}`);
      },
      onEnd: () => setIsListening(false),
    });

    if (!ok) setIsListening(false);
  }, [isListening, speech, promptRef, setPrompt, setError, setSuccess]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        maxWidth: "100%",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Action Type */}
      <Box sx={{ minWidth: { xs: "100%", md: 200 } }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: "#94a3b8" }}>Action Type</InputLabel>
          <Select
            value={modificationType}
            label="Action Type"
            onChange={(e) => setModificationType(e.target.value)}
            sx={{
              color: "white",
              background: "#1e293b",
              border: `1px solid ${currentTheme.primary}40`,
              borderRadius: 2,
              "&:hover": {
                borderColor: currentTheme.primary,
                boxShadow: `0 0 0 1px ${currentTheme.primary}40`,
              },
              "& .MuiSelect-select": {
                py: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              },
            }}
          >
            {MODIFICATION_TYPES.map((type) => (
              <MenuItem
                key={type.value}
                value={type.value}
                sx={{
                  color: "white",
                  background: "#1e293b",
                  "&:hover": { background: `${type.color}20` },
                  "&.Mui-selected": { background: `${type.color}30` },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ color: type.color, display: "flex" }}>
                    {type.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 500 }}>{type.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* AI Model */}
      <Box sx={{ minWidth: { xs: "100%", md: 180 } }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: "#94a3b8" }}>AI Model</InputLabel>
          <Select
            value={aiModel}
            label="AI Model"
            onChange={(e) => setAiModel(e.target.value)}
            sx={{
              color: "white",
              background: "#1e293b",
              border: `1px solid ${currentAiModel.color}40`,
              borderRadius: 2,
              "&:hover": {
                borderColor: currentAiModel.color,
                boxShadow: `0 0 0 1px ${currentAiModel.color}40`,
              },
              "& .MuiSelect-select": {
                py: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              },
            }}
          >
            {AI_MODELS.map((model) => (
              <MenuItem
                key={model.value}
                value={model.value}
                sx={{
                  color: "white",
                  background: "#1e293b",
                  "&:hover": { background: `${model.color}20` },
                  "&.Mui-selected": { background: `${model.color}30` },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ color: model.color, display: "flex" }}>
                    {model.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 500 }}>
                    {model.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Main input */}
      <Box sx={{ flex: { xs: "1", md: 8 }, width: "100%" }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          value={prompt}
          onChange={(e) => {
            const v = e.target.value;
            promptRef.current = v;
            setPrompt(v);
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={isListening ? "Stop listening" : "Speak prompt"}>
                  <IconButton
                    onClick={handleVoiceToggle}
                    edge="end"
                    aria-label={
                      isListening ? "stop voice input" : "start voice input"
                    }
                    sx={{
                      width: 44,
                      height: 44,
                      mr: 0.5,
                      color: isListening ? "#ef4444" : currentTheme.primary,
                      background: isListening
                        ? "rgba(239,68,68,0.12)"
                        : `${currentTheme.primary}14`,
                      border: `1px solid ${
                        isListening ? "#ef4444" : currentTheme.primary
                      }50`,
                      animation: isListening
                        ? "pulse 1s ease-in-out infinite"
                        : "none",
                      "&:hover": {
                        background: isListening
                          ? "rgba(239,68,68,0.2)"
                          : `${currentTheme.primary}25`,
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    {isListening ? <StopIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          placeholder={
            modificationType === "create"
              ? "✨ Describe what you want to create..."
              : modificationType === "modify"
              ? "🎨 Describe what you want to change..."
              : modificationType === "enhance"
              ? "⚡ Describe what feature to add..."
              : "🔧 Describe what needs fixing or improving..."
          }
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#1e293b",
              border: `1px solid ${currentTheme.primary}40`,
              borderRadius: 2,
              color: "white",
              fontSize: "0.95rem",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: currentTheme.primary,
                boxShadow: `0 0 0 1px ${currentTheme.primary}40`,
              },
              "&.Mui-focused": {
                borderColor: currentTheme.primary,
                boxShadow: `0 0 0 2px ${currentTheme.primary}40`,
              },
            },
            "& .MuiOutlinedInput-input::placeholder": {
              color: "#64748b",
              opacity: 0.8,
            },
          }}
        />

        <Box sx={{ mt: 1.5, overflowX: "auto" }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {quickModifications.map((mod, index) => (
              <Chip
                key={index}
                label={
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <span>{mod.icon}</span>
                    {mod.label}
                  </Box>
                }
                size="small"
                onClick={() => {
                  setAiModel(mod.recommendedAiModel);
                  setCreativityLevel(mod.recommendedCreativity);
                  setModificationType(mod.type);
                  promptRef.current = mod.prompt;
                  setPrompt(mod.prompt);
                }}
                sx={{
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  height: 28,
                  background: `${mod.color}20`,
                  color: mod.color,
                  border: `1px solid ${mod.color}40`,
                  fontWeight: 500,
                  "&:hover": {
                    background: `${mod.color}30`,
                    transform: "translateY(-1px)",
                    boxShadow: `0 4px 12px ${mod.color}40`,
                  },
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Generate */}
      <Box
        sx={{
          flex: { xs: "1", md: 2 },
          minWidth: { xs: "100%", md: 200 },
          mt: { xs: 2, md: 0 },
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={() => onGenerate(modificationType !== "create")}
          disabled={loading || !prompt.trim()}
          className="generate-btn"
          sx={{
            width: "100%",
            height: { xs: "56px", md: "100%" },
            minHeight: 56,
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
            fontSize: "1rem",
            fontWeight: 700,
            borderRadius: 2,
            textTransform: "none",
            letterSpacing: "0.5px",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              background: `linear-gradient(135deg, ${currentTheme.primary} 30%, ${currentTheme.secondary} 100%)`,
              transform: "translateY(-2px)",
              boxShadow: `0 10px 25px ${currentTheme.primary}80`,
            },
            "&:disabled": {
              background: "#475569",
              color: "#94a3b8",
              transform: "none",
              boxShadow: "none",
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>Generating...</span>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AutoAwesomeIcon />
              <Box sx={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600 }}>
                  {modificationType === "create"
                    ? "✨ Generate"
                    : modificationType === "modify"
                    ? "🎨 Modify"
                    : modificationType === "enhance"
                    ? "⚡ Enhance"
                    : modificationType === "debug"
                    ? "🐛 Fix"
                    : "🌀 Refactor"}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                  {currentAiModel.label}
                </div>
              </Box>
            </Box>
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default VoicePromptInput;