// src/components/ImageToWebsiteDialog.js
import React from "react";
import {
  Box, Typography, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Tabs, Tab, CircularProgress,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ImageIcon from "@mui/icons-material/Image";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";

export default function ImageToWebsiteDialog({
  open,
  onClose,
  currentTheme,
  imageLoading,
  imageInputRef,
  uploadedImage,
  setUploadedImage,
  imageMode,
  setImageMode,
  imagePrompt,
  setImagePrompt,
  handleImageFileSelect,
  handleImageGenerate,
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !imageLoading && onClose()}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: "#1e293b",
          color: "white",
          border: `1px solid ${currentTheme.primary}50`,
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <ImageIcon sx={{ color: currentTheme.primary }} />
        Screenshot → Website
        <Box sx={{ flexGrow: 1 }} />
        {!imageLoading && (
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: `${currentTheme.primary}30` }}>
        {/* Mode Tabs */}
        <Tabs
          value={imageMode}
          onChange={(e, v) => setImageMode(v)}
          sx={{
            mb: 2,
            "& .MuiTab-root": { color: "#94a3b8" },
            "& .Mui-selected": { color: `${currentTheme.primary} !important` },
            "& .MuiTabs-indicator": { background: currentTheme.primary },
          }}
        >
          <Tab value="website" label="🌐 Full Website" />
          <Tab value="section" label="🧩 Website Section" />
        </Tabs>

        <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 2 }}>
          {imageMode === "website"
            ? "Creates a fresh standalone website from the image. Current project will be replaced."
            : "Adds a section to your existing project, matching the image style."}
        </Typography>

        {/* Image Upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageFileSelect}
        />

        {!uploadedImage ? (
          <Box
            onClick={() => imageInputRef.current?.click()}
            sx={{
              border: `2px dashed ${currentTheme.primary}60`,
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              background: "#0f172a",
              "&:hover": {
                borderColor: currentTheme.primary,
                background: "#111827",
              },
              transition: "all 0.2s",
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 60, color: currentTheme.primary, mb: 1 }} />
            <Typography variant="body1" sx={{ color: "white", mb: 0.5 }}>
              Click to upload screenshot
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              PNG, JPG · Max 6MB
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            <Box
              component="img"
              src={uploadedImage}
              alt="Uploaded"
              sx={{
                width: "100%",
                maxHeight: 320,
                objectFit: "contain",
                borderRadius: 2,
                border: `1px solid ${currentTheme.primary}40`,
                background: "#0f172a",
              }}
            />
            <IconButton
              onClick={() => setUploadedImage(null)}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,0,0,0.6)",
                color: "white",
                "&:hover": { background: "rgba(239,68,68,0.8)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Extra prompt */}
        <TextField
          fullWidth
          multiline
          rows={2}
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder={
            imageMode === "website"
              ? "Optional: 'Make it dark theme with purple accents'"
              : "Optional: 'Add this as a hero section under the navbar'"
          }
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              background: "#0f172a",
              color: "white",
              "& fieldset": { borderColor: `${currentTheme.primary}40` },
              "&:hover fieldset": { borderColor: currentTheme.primary },
              "&.Mui-focused fieldset": { borderColor: currentTheme.primary },
            },
            "& .MuiOutlinedInput-input::placeholder": { color: "#64748b" },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={imageLoading}
          sx={{ color: "white" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImageGenerate}
          disabled={!uploadedImage || imageLoading}
          startIcon={
            imageLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AutoAwesomeIcon />
            )
          }
          sx={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            fontWeight: 700,
            "&:hover": {
              background: `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.primary})`,
            },
            "&:disabled": { background: "#475569", color: "#94a3b8" },
          }}
        >
          {imageLoading
            ? "Generating..."
            : imageMode === "website"
            ? "Generate Website"
            : "Add Section"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}