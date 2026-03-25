import { useState, useEffect } from "react";
import { getApiKey } from "../lib/storage";
import LoginView from "./components/LoginView";
import CaptureView from "./components/CaptureView";
import SuccessView from "./components/SuccessView";

type View = "login" | "capture" | "success";

export default function App() {
  const [view, setView] = useState<View>("login");
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [captureKey, setCaptureKey] = useState(0);

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) {
        setApiKeyState(key);
        setView("capture");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[480px] bg-[#0C0C0E]">
        <div className="text-sm text-[#55555C]">Loading...</div>
      </div>
    );
  }

  if (view === "login" || !apiKey) {
    return (
      <LoginView
        onConnected={(key) => {
          setApiKeyState(key);
          setView("capture");
        }}
      />
    );
  }

  if (view === "success") {
    return (
      <SuccessView
        onCaptureAnother={() => {
          setCaptureKey((k) => k + 1);
          setView("capture");
        }}
      />
    );
  }

  return (
    <CaptureView
      key={captureKey}
      apiKey={apiKey}
      onSuccess={() => setView("success")}
      onLogout={() => {
        setApiKeyState(null);
        setView("login");
      }}
    />
  );
}
