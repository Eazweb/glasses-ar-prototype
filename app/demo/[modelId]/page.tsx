// app/demo/[modelId]/page.tsx
import { getGlassesModel } from "@/app/utils/modelImports";
import DemoFaceTracker from "../components/DemoFaceTracker";

type DemoPageProps = {
  params: Promise<{
    modelId: string;
  }>;
};

export default async function DemoPage({ params }: DemoPageProps) {
  const { modelId } = await params;
  const model = getGlassesModel(modelId);

  if (!model) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Model Not Found</h1>
          <p className="mt-2 text-neutral-400">
            The model ID "{modelId}" is not valid.
            <br />
            Please check the URL. Example: `/demo/aviator_sunglasses`
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="relative aspect-[1080/1080] w-full max-w-4xl">
        <DemoFaceTracker model={model} />
      </div>
    </div>
  );
}
