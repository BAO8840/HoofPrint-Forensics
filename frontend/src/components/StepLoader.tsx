import { useEffect, useState } from "react";

const STEPS = [
  "Uploading hoofprint image",
  "Extracting image features",
  "Classifying species",
  "Finalizing analysis",
];

// Cosmetic-only progression: the real request runs in parallel via TanStack
// Query. This just gives the analyst a sense of what's happening instead of
// a plain spinner, and doesn't block or delay the actual API call.
export default function StepLoader() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="mb-6 text-navy font-serif text-xl">Analysing Hoofprint&hellip;</div>
      <div className="space-y-3">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 text-sm transition-colors ${
              i <= activeStep ? "text-navy" : "text-gray-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                i < activeStep
                  ? "bg-navy"
                  : i === activeStep
                  ? "bg-gold animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
