// src/components/ProjectsDialog.js
import React from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Tooltip,
} from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";

export default function ProjectsDialog({
  open,
  onClose,
  projects,
  currentTheme,
  currentProjectName,
  editedCode,
  saveCurrentProject,
  loadProject,
  deleteProject,
  setProjects,
  loadProjects,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
        <FolderOpenIcon sx={{ color: currentTheme.primary }} />
        Projects Workspace
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            const name = window.prompt(
              "Save current project as:",
              currentProjectName || "My Project"
            );
            if (name) {
              saveCurrentProject(name);
              setProjects(loadProjects());
            }
          }}
          disabled={!editedCode}
          sx={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
          }}
        >
          Save Current
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: `${currentTheme.primary}30` }}>
        {projects.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8" }}>
            <FolderOpenIcon sx={{ fontSize: 60, mb: 1, opacity: 0.4 }} />
            <Typography variant="body1">No saved projects yet.</Typography>
            <Typography variant="caption">
              Generate a project and click "Save Current".
            </Typography>
          </Box>
        ) : (
          <List>
            {projects.map((project) => (
              <ListItem
                key={project.name}
                sx={{
                  background: "#0f172a",
                  borderRadius: 2,
                  mb: 1,
                  border: `1px solid ${currentTheme.primary}30`,
                  "&:hover": { background: "#111827" },
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ color: "white", fontWeight: 600 }}>
                      📁 {project.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                        {project.prompt?.substring(0, 80) || "No prompt"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        Updated: {new Date(project.updatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Load project">
                    <IconButton
                      edge="end"
                      onClick={() => loadProject(project)}
                      sx={{ color: currentTheme.primary, mr: 1 }}
                    >
                      <UploadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete project">
                    <IconButton
                      edge="end"
                      onClick={() => deleteProject(project.name)}
                      sx={{ color: "#ef4444" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: "white" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}