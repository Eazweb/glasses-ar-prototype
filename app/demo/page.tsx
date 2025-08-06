"use client";

import { useSearchParams } from "next/navigation";
import DemoFaceTracker from "./components/DemoFaceTracker";

import { getGlassesModel } from "@/app/utils/modelImports";

export default function DemoPage() {
  const searchParams = useSearchParams();
  const modelId = searchParams.get("modelId");

  const model = getGlassesModel(modelId as string) || null;

  if (!model) {
    return <div>No model found</div>;
  }

  return (
    <>
      <div className="h-screen w-screen">
        <DemoFaceTracker model={model} />
      </div>
    </>
  );
}
