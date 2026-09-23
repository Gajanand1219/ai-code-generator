// src/hooks/useImageGeneration.js
import { useState, useRef } from "react";
import axios from "axios";
import { API_URL, preparePreviewHtml } from "../components/constants";

export default function useImageGeneration({
  editedCode, setEditedCode, setGeneratedCode, setDisplayedText,
  setAiModelUsed, setCreativityApplied, setModificationHistory,
  setSessionId, persistSession, clearSessionCompletely,
  setPreviewHtml, setPreviewLoaded, setPreviewKey,
  setSuccess, setError, setIsAnimating,
}) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageMode, setImageMode] = useState("website");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select a valid image file.");
    if (file.size > 6 * 1024 * 1024) return setError("Image too large. Max 6MB.");

    const reader = new FileReader();
    reader.onload = (e) => { setUploadedImage(e.target.result); setError(""); };
    reader.onerror = () => setError("Failed to read image.");
    reader.readAsDataURL(file);
  };

  const handleImageGenerate = async () => {
    if (!uploadedImage) return setError("Please upload an image first.");

    setImageLoading(true);
    setError("");
    setSuccess("");

    const isSection = imageMode === "section";

    if (!isSection) {
      clearSessionCompletely();
      setModificationHistory([]);
    } else if (!editedCode) {
      setImageLoading(false);
      return setError("⚠️ No existing project. Use 'Full Website' mode first.");
    }

    try {
      const response = await axios.post(
        `${API_URL}/generate-from-image`,
        {
          image_data_url: uploadedImage,
          prompt: imagePrompt || (isSection
            ? "Recreate this screenshot as a responsive website section."
            : "Recreate this design as a complete responsive website."),
          existing_code: isSection ? editedCode : "",
        },
        { timeout: 120000 }
      );

      if (response.data.success) {
        const newCode = response.data.full_code;
        setGeneratedCode(newCode);
        setEditedCode(newCode);

        const safePreview = preparePreviewHtml(newCode);
        setPreviewLoaded(false);
        setPreviewHtml(safePreview);
        setPreviewKey((p) => p + 1);

        setDisplayedText("");
        setAiModelUsed(response.data.ai_model_used || "Vision Model");
        setCreativityApplied(0.4);

        if (response.data.session_id) {
          setSessionId(response.data.session_id);
          persistSession(response.data.session_id);
        }

        setModificationHistory((prev) => [
          {
            id: Date.now(),
            prompt: imagePrompt || (isSection ? "Image → Section" : "Image → Website"),
            type: isSection ? "enhance" : "create",
            summary: isSection ? "Website section generated from image" : "Website generated from image",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            ai_model: response.data.ai_model_used,
          },
          ...prev.slice(0, 9),
        ]);

        setSuccess(isSection ? "🖼️ Section added from image!" : "🖼️ Website generated from image!");
        setTimeout(() => setIsAnimating(true), 400);
        setImageDialogOpen(false);
      } else {
        setError(`❌ ${response.data.error || "Image generation failed"}`);
      }
    } catch (err) {
      setError(`❌ ${err.response?.data?.error || err.message || "Image generation failed"}`);
    } finally {
      setImageLoading(false);
    }
  };

  return {
    imageDialogOpen, setImageDialogOpen,
    uploadedImage, setUploadedImage,
    imageMode, setImageMode,
    imagePrompt, setImagePrompt,
    imageLoading, imageInputRef,
    handleImageFileSelect, handleImageGenerate,
  };
}