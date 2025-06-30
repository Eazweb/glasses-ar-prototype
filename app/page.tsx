"use client";

import FaceTracker from "./components/FaceTracker";

/**
 * Main page component for the Virtual Glasses Try-On application
 *
 * Features:
 * - Responsive layout with centered content
 * - Gradient text styling for the title
 * - Full-screen face tracker integration
 *
 * @returns JSX.Element - The main application page
 */
export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="my-10 bg-gradient-to-r from-slate-400 to-gray-500 bg-clip-text text-4xl font-medium tracking-tight text-transparent">
        Virtual Glasses Try-On
      </h1>
      <div className="size-176">
        <FaceTracker />
      </div>
    </div>
  );
}
