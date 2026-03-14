import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import FloatingChatButton from "./components/FloatingChatButton";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import type { ReactNode } from "react";

function WithNavbar({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<WithNavbar><HomePage /></WithNavbar>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating chat button — visible on all pages */}
      <FloatingChatButton />
    </>
  );
}