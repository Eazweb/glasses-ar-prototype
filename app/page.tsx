"use client";

import FaceTracker from "./components/FaceTracker";
import Header from "./components/Header";

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
    <>
      <Header />
      <div className="flex min-h-screen flex-col items-center">
        <div className="relative aspect-[1080/1080] w-full max-w-3xl">
          <FaceTracker />
        </div>
      </div>
    </>
  );
}
