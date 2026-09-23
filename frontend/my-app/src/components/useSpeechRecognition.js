// src/components/useSpeechRecognition.js
import { useEffect, useRef } from "react";

const useSpeechRecognition = ({
  lang = "en-IN",
  continuous = true,
  silenceMs = 3000,
  onSilence,
} = {}) => {
  const recognitionRef = useRef(null);
  const finalBufRef = useRef("");
  const latestRef = useRef("");
  const silenceTimerRef = useRef(null);
  const manualStopRef = useRef(false);
  const restartTimerRef = useRef(null);
  const sessionRef = useRef(0);
  const onSilenceRef = useRef(onSilence);

  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

  const clearTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const start = ({ onStart, onResult, onError, onEnd } = {}) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("unsupported");
      return false;
    }

    if (recognitionRef.current) {
      manualStopRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    clearTimers();

    manualStopRef.current = false;
    finalBufRef.current = "";
    latestRef.current = "";
    const mySession = ++sessionRef.current;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let autoFired = false;

    const fireAutoSend = (spoken) => {
      if (autoFired) return;
      autoFired = true;
      manualStopRef.current = true;
      try {
        recognition.stop();
      } catch (_) {}
      onSilenceRef.current?.(spoken);
    };

    const getLatest = () => latestRef.current || finalBufRef.current;

    const scheduleSilence = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const spoken = (getLatest() || "").trim();
        if (spoken) fireAutoSend(spoken);
      }, silenceMs);
    };

    recognition.onstart = () => {
      onStart?.();
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res[0]?.transcript || "").trim();
        if (!text) continue;

        if (res.isFinal) {
          finalBufRef.current += (finalBufRef.current ? " " : "") + text;
          if (/[.?!]$/.test(text)) finalBufRef.current += "\n";
        } else {
          interim += (interim ? " " : "") + text;
        }
      }

      latestRef.current = interim
        ? `${finalBufRef.current}${finalBufRef.current ? " " : ""}${interim}`
        : finalBufRef.current;

      onResult?.({
        finalText: finalBufRef.current,
        interimText: interim,
        combined: latestRef.current,
      });

      if (mySession === sessionRef.current) {
        scheduleSilence();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      onError?.(event.error);
    };

    recognition.onend = () => {
      if (
        !manualStopRef.current &&
        continuous &&
        mySession === sessionRef.current
      ) {
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (_) {}
        }, 250);
      } else {
        onEnd?.();
      }
    };

    try {
      recognition.start();
      return true;
    } catch (_) {
      onError?.("start-failed");
      return false;
    }
  };

  const stop = () => {
    manualStopRef.current = true;
    clearTimers();
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    recognitionRef.current = null;
  };

  const getTranscript = () => latestRef.current || finalBufRef.current;

  useEffect(() => () => stop(), []);

  return { start, stop, getTranscript };
};

export default useSpeechRecognition;