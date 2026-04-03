import { useState, useEffect, useRef, useCallback } from "react";

import { useLocale } from "../hooks/useLocale";
import { Button } from "./ui";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

export default function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps) {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onComplete();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onComplete]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelector =
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements =
      panel.querySelectorAll<HTMLElement>(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    panel.addEventListener("keydown", handleTab);
    return () => panel.removeEventListener("keydown", handleTab);
  }, [step]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onComplete();
    },
    [onComplete],
  );

  const isLastStep = step === TOTAL_STEPS - 1;

  const howItWorksSteps = [
    { icon: "📚", text: t("onboarding.step2CreateDecks") },
    { icon: "✍️", text: t("onboarding.step2AddCards") },
    { icon: "🔄", text: t("onboarding.step2Review") },
  ];

  const benefits = [
    t("onboarding.step3Benefit1"),
    t("onboarding.step3Benefit2"),
    t("onboarding.step3Benefit3"),
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-1000 p-8 animate-fade-in overscroll-contain"
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        className="bg-bg-secondary border border-border rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-10 shadow-lg animate-modal-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-accent-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="min-h-[240px] flex flex-col justify-center">
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-6 stagger-1">🧠</div>
              <h2
                id="onboarding-title"
                className="font-display text-2xl font-bold text-text-primary mb-3 stagger-2"
              >
                {t("onboarding.step1Title")}
              </h2>
              <p className="text-text-secondary text-base leading-relaxed max-w-sm mx-auto stagger-3">
                {t("onboarding.step1Text")}
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2
                id="onboarding-title"
                className="font-display text-2xl font-bold text-text-primary mb-6 text-center stagger-1"
              >
                {t("onboarding.step2Title")}
              </h2>
              <div className="flex flex-col gap-4">
                {howItWorksSteps.map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-4 bg-bg-card border border-border rounded-lg stagger-${i + 2}`}
                  >
                    <span className="text-3xl shrink-0">{s.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-text-secondary uppercase tracking-wider opacity-60">
                        {i + 1}/{howItWorksSteps.length}
                      </span>
                      <p className="text-text-primary font-medium">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2
                id="onboarding-title"
                className="font-display text-2xl font-bold text-text-primary mb-4 text-center stagger-1"
              >
                {t("onboarding.step3Title")}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 text-center stagger-2">
                {t("onboarding.step3Text")}
              </p>
              <div className="flex flex-col gap-3">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 stagger-${i + 3}`}
                  >
                    <span className="text-accent-primary text-lg">✓</span>
                    <span className="text-text-primary font-medium">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <div>
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                {t("onboarding.back")}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onComplete}>
                {t("onboarding.skip")}
              </Button>
            )}
          </div>
          <Button
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            {isLastStep ? t("onboarding.getStarted") : t("onboarding.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
