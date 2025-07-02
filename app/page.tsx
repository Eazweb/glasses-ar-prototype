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
      <div className="flex flex-col items-center justify-center">
        <div className="mt-12 size-176">
          <FaceTracker />
        </div>
      </div>
    </>
  );
}
