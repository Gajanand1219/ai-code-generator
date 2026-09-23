// src/hooks/useEditor.js
import { useRef } from "react";

export default function useEditor({
  editedCode, setEditedCode, setGeneratedCode, setDisplayedText,
  setSuccess, setIsAnimating,
}) {
  const editorRef = useRef(null);
  const editorGutterRef = useRef(null);

  const handleEditorChange = (event) => {
    const value = event.target.value;
    setEditedCode(value);
    setGeneratedCode(value);
    setDisplayedText(value);
  };

  const handleEditorScroll = (event) => {
    const gutter = editorGutterRef.current;
    const target = event?.target;
    if (gutter && target && typeof target.scrollTop === "number") {
      try { gutter.scrollTop = target.scrollTop; } catch (_) {}
    }
  };

  const handleEditorKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const next = value.substring(0, start) + "  " + value.substring(end);
      setEditedCode(next);
      setGeneratedCode(next);
      setDisplayedText(next);
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + 2;
          editorRef.current.selectionEnd = start + 2;
        }
      });
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      const value = editorRef.current?.value || "";
      setEditedCode(value);
      setGeneratedCode(value);
      setDisplayedText(value);
      setSuccess("💾 Code changes saved and preview updated.");
      setTimeout(() => setSuccess(""), 1800);
    }
  };

  const handleRefreshFromEditor = () => {
    const value = editorRef.current?.value || editedCode;
    setEditedCode(value);
    setGeneratedCode(value);
    setDisplayedText(value);
    setSuccess("⚡ Preview refreshed from editor.");
    setTimeout(() => setSuccess(""), 1500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editedCode);
    setSuccess("📋 Code copied!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([editedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess("💾 Code downloaded!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleRestartAnimation = () => {
    setIsAnimating(false);
    setDisplayedText("");
    setTimeout(() => setIsAnimating(true), 100);
  };

  return {
    editorRef, editorGutterRef,
    handleEditorChange, handleEditorScroll, handleEditorKeyDown,
    handleRefreshFromEditor, handleCopyCode, handleDownloadCode,
    handleRestartAnimation,
  };
}