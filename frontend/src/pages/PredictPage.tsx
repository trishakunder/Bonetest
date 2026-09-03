import { useCallback, useEffect, useState } from "react";
import { fetchModels, generateGradCam, predictBoneAge } from "../api/client";
import GradCamViewer from "../components/GradCamViewer";
import ImageUpload from "../components/ImageUpload";
import ModelSelector from "../components/ModelSelector";
import PredictionResultCard from "../components/PredictionResult";
import { getChronologicalAgeError } from "../utils/growthStatus";
import type { GradCamResult, ModelInfo, ModelType, PredictionResult } from "../types";

export default function PredictPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>("cnn");
  const [gender, setGender] = useState("male");
  const [chronologicalAge, setChronologicalAge] = useState("");
  const [ageTouched, setAgeTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [gradcam, setGradcam] = useState<GradCamResult | null>(null);
  const [showHeatmapOnly, setShowHeatmapOnly] = useState(false);

  const [predictLoading, setPredictLoading] = useState(false);
  const [gradcamLoading, setGradcamLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [gradcamError, setGradcamError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels()
      .then((res) => {
        setModels(res.models);
        setSelectedModel(res.default_model as ModelType);
      })
      .catch(() => setPredictError("Unable to connect to API"));
  }, []);

  const handleFileSelect = useCallback((f: File, url: string) => {
    setFile(f);
    setPreviewUrl(url);
    setPrediction(null);
    setGradcam(null);
    setPredictError(null);
    setGradcamError(null);
  }, []);

  const handlePredict = async () => {
    if (!file) return;
    setPredictLoading(true);
    setPredictError(null);
    try {
      const result = await predictBoneAge(
        file,
        selectedModel,
        selectedModel === "multimodal_cnn" ? gender : undefined
      );
      setPrediction(result);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data
              ?.detail
          : "Prediction failed";
      setPredictError(msg ?? "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  const handleGradCam = async () => {
    if (!file) return;
    setGradcamLoading(true);
    setGradcamError(null);
    try {
      const result = await generateGradCam(
        file,
        selectedModel,
        selectedModel === "multimodal_cnn" ? gender : undefined
      );
      setGradcam(result);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data
              ?.detail
          : "Grad-CAM generation failed";
      setGradcamError(msg ?? "Grad-CAM generation failed");
    } finally {
      setGradcamLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Upload X-Ray
          </h2>
          <ImageUpload
            onFileSelect={handleFileSelect}
            disabled={predictLoading || gradcamLoading}
          />
          {previewUrl && (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <img
                src={previewUrl}
                alt="X-ray preview"
                className="max-h-64 w-full object-contain bg-black"
              />
            </div>
          )}
        </div>

        <div className="card">
          <ModelSelector
            models={models.length ? models : [
              { id: "cnn", display_name: "CNN Baseline", description: "", requires_gender: false, supports_gradcam: true, checkpoint_available: true },
              { id: "cnn_dnn", display_name: "CNN + DNN", description: "", requires_gender: false, supports_gradcam: true, checkpoint_available: true },
              { id: "multimodal_cnn", display_name: "Multimodal CNN", description: "", requires_gender: true, supports_gradcam: true, checkpoint_available: true },
              { id: "cnn_rf", display_name: "CNN + Random Forest", description: "", requires_gender: false, supports_gradcam: true, checkpoint_available: true },
            ]}
            selected={selectedModel}
            onChange={setSelectedModel}
            gender={gender}
            onGenderChange={setGender}
            disabled={predictLoading || gradcamLoading}
          />

          <div className="mt-6">
            <label
              htmlFor="chronological-age"
              className="block text-sm font-medium text-slate-700"
            >
              Enter Patient&apos;s Real Age
            </label>
            <input
              id="chronological-age"
              type="number"
              min="0.1"
              max="120"
              step="0.1"
              value={chronologicalAge}
              onChange={(event) => setChronologicalAge(event.target.value)}
              onBlur={() => setAgeTouched(true)}
              aria-invalid={ageTouched && Boolean(getChronologicalAgeError(chronologicalAge))}
              aria-describedby="chronological-age-help chronological-age-error"
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="e.g. 10.0"
            />
            <p id="chronological-age-help" className="mt-1 text-xs text-slate-500">
              Enter age in years. Decimals are allowed.
            </p>
            {ageTouched && getChronologicalAgeError(chronologicalAge) && (
              <p id="chronological-age-error" className="mt-1 text-sm text-red-600">
                {getChronologicalAgeError(chronologicalAge)}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={handlePredict}
              disabled={!file || predictLoading}
            >
              {predictLoading ? "Predicting…" : "Predict Bone Age"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleGradCam}
              disabled={!file || gradcamLoading}
            >
              {gradcamLoading ? "Generating…" : "Generate Grad-CAM"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <PredictionResultCard
          result={prediction}
          chronologicalAge={chronologicalAge}
          loading={predictLoading}
          error={predictError}
        />
        <GradCamViewer
          overlayBase64={gradcam?.overlay_base64 ?? null}
          heatmapBase64={gradcam?.heatmap_base64 ?? null}
          loading={gradcamLoading}
          error={gradcamError}
          showHeatmap={showHeatmapOnly}
          onToggleView={() => setShowHeatmapOnly((v) => !v)}
        />
      </div>
    </div>
  );
}
