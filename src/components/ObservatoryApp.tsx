"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Loader2,
  Orbit,
  RadioTower,
  ScanLine,
  Server,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EconomyGraph } from "@/components/EconomyGraph";
import {
  intensityOptions,
  scenarioPresets,
  type IntensityId,
  type ObservatoryResponse,
} from "@/lib/observatory-schema";

type ModelsResponse = {
  baseUrl: string;
  defaultModel: string;
  models: string[];
  error?: string;
};

const sectionOrder = [
  ["topology", "Economic Topology"],
  ["behaviors", "Autonomous Behaviors"],
  ["markets", "Emerging Market Structures"],
  ["failures", "Coordination Failures"],
  ["incentives", "Machine-Native Incentives"],
  ["trajectory", "Future Evolution Trajectory"],
] as const;

const presetIcons = [Cpu, RadioTower, Orbit, Server, WalletCards, Activity, ScanLine];

export function ObservatoryApp() {
  const [scenario, setScenario] = useState<string>(scenarioPresets[0].prompt);
  const [selectedPreset, setSelectedPreset] = useState<string>(scenarioPresets[0].title);
  const [intensityIndex, setIntensityIndex] = useState(1);
  const intensity = intensityOptions[intensityIndex];
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("qwen3:8b");
  const [manualModel, setManualModel] = useState(false);
  const [modelStatus, setModelStatus] = useState("Connecting to Ollama...");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ObservatoryResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        const response = await fetch("/api/models", { cache: "no-store" });
        const payload = (await response.json()) as ModelsResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to reach Ollama.");
        }

        if (isMounted) {
          setModels(payload.models);
          setModel(payload.defaultModel);
          setModelStatus(`${payload.models.length} local models detected at ${payload.baseUrl}`);
        }
      } catch (loadError) {
        if (isMounted) {
          setManualModel(true);
          setModelStatus(loadError instanceof Error ? loadError.message : "Unable to reach Ollama.");
        }
      }
    }

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSections = useMemo(() => {
    if (!result) {
      return [];
    }

    return sectionOrder.map(([key, label]) => ({
      key,
      label,
      section: result[key],
    }));
  }, [result]);

  async function observe() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/observe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          model,
          intensity: intensity.id satisfies IntensityId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Observation failed.");
      }

      setResult(payload as ObservatoryResponse);
    } catch (observeError) {
      setError(observeError instanceof Error ? observeError.message : "Observation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 grid-overlay opacity-45" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(140deg,rgba(6,182,212,0.12),transparent_30%,rgba(16,185,129,0.07)_54%,rgba(251,191,36,0.08)_72%,rgba(244,63,94,0.1))]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/48">
              <span>Agentic Economy Observatory</span>
              <span className="h-px w-12 bg-white/20" />
              <span>Local Models</span>
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.03] tracking-normal text-white sm:text-6xl lg:text-7xl">
              What happens when AI agents become economic actors?
            </h1>
          </div>
          <div className="grid gap-2 text-sm text-white/58 md:max-w-xs md:text-right">
            <p>Interfaces for exploring the emerging machine economy.</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
              Ollama endpoint active
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-5"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
              <SlidersHorizontal size={15} />
              Scenario Console
            </div>

            <label className="mt-5 block text-sm text-white/68" htmlFor="scenario">
              Describe a machine economy scenario
            </label>
            <textarea
              className="mt-3 min-h-[150px] w-full resize-none rounded-md border border-white/12 bg-black/60 p-4 font-mono text-sm leading-6 text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
              id="scenario"
              maxLength={1200}
              onChange={(event) => {
                setScenario(event.target.value);
                setSelectedPreset("");
              }}
              placeholder="Describe a machine economy scenario..."
              value={scenario}
            />

            <div className="mt-5">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Scenario Presets</div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {scenarioPresets.map((preset, index) => {
                  const Icon = presetIcons[index] ?? Orbit;
                  const isSelected = selectedPreset === preset.title;

                  return (
                    <button
                      className={`flex min-h-12 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs leading-4 transition ${
                        isSelected
                          ? "border-emerald-300/60 bg-emerald-300/12 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/62 hover:border-white/24 hover:text-white"
                      }`}
                      key={preset.title}
                      onClick={() => {
                        setScenario(preset.prompt);
                        setSelectedPreset(preset.title);
                      }}
                      type="button"
                    >
                      <Icon className="shrink-0 text-cyan-200/70" size={15} />
                      <span>{preset.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-md border border-white/10 bg-black/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Signal Intensity</div>
                  <div className="mt-1 text-lg font-semibold text-white">{intensity.label}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white/60">
                  {intensityIndex + 1}/4
                </div>
              </div>
              <input
                aria-label="Signal Intensity"
                className="mt-4 w-full accent-cyan-300"
                max={3}
                min={0}
                onChange={(event) => setIntensityIndex(Number(event.target.value))}
                step={1}
                type="range"
                value={intensityIndex}
              />
              <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.08em] text-white/42">
                {intensityOptions.map((option) => (
                  <span className={option.id === intensity.id ? "text-cyan-100" : ""} key={option.id}>
                    {option.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="model">
                  Open Model
                </label>
                {manualModel || models.length === 0 ? (
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/60 px-3 font-mono text-sm text-white outline-none transition focus:border-cyan-300/60"
                    id="model"
                    onChange={(event) => setModel(event.target.value)}
                    value={model}
                  />
                ) : (
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/60 px-3 font-mono text-sm text-white outline-none transition focus:border-cyan-300/60"
                    id="model"
                    onChange={(event) => setModel(event.target.value)}
                    value={model}
                  >
                    {models.map((modelName) => (
                      <option key={modelName} value={modelName}>
                        {modelName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                className="mt-5 h-11 rounded-md border border-white/12 px-4 text-xs uppercase tracking-[0.16em] text-white/58 transition hover:border-white/25 hover:text-white sm:mt-auto"
                onClick={() => setManualModel((value) => !value)}
                type="button"
              >
                Manual
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-white/42">{modelStatus}</p>

            {error ? (
              <div className="mt-4 flex gap-2 rounded-md border border-rose-300/25 bg-rose-400/10 p-3 text-sm leading-5 text-rose-100">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35"
              disabled={isLoading || scenario.trim().length < 8 || model.trim().length === 0}
              onClick={observe}
              type="button"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={18} />}
              Observe Emergence
            </button>
          </motion.section>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
            initial={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.08, duration: 0.45 }}
          >
            {result ? (
              <EconomyGraph graph={result.graph} />
            ) : (
              <div className="flex h-[540px] min-h-[420px] items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/55">
                <div className="absolute h-[540px] w-full bg-[linear-gradient(115deg,rgba(20,184,166,0.08),transparent_32%,rgba(251,191,36,0.06)_58%,rgba(244,63,94,0.08))]" />
                <div className="relative grid max-w-lg gap-5 px-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-cyan-200/20 bg-cyan-200/10 text-cyan-100 shadow-2xl shadow-cyan-400/20">
                    <Orbit size={28} />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/42">
                      Machine-market observatory
                    </p>
                    <p className="mt-3 text-xl font-semibold leading-7 text-white">
                      Awaiting emergence trace.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {selectedSections.length > 0 ? (
            selectedSections.map(({ key, label, section }, index) => (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-white/10 bg-white/[0.035] p-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 10 }}
                key={key}
                transition={{ delay: index * 0.04, duration: 0.28 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-white">{label}</h2>
                  <ArrowRight className="text-white/30" size={16} />
                </div>
                <p className="mt-3 text-sm leading-6 text-cyan-50/78">{section.thesis}</p>
                <ul className="mt-4 grid gap-2 text-sm leading-5 text-white/60">
                  {section.signals.map((signal) => (
                    <li className="border-l border-white/12 pl-3" key={signal}>
                      {signal}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))
          ) : (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-white/55 md:col-span-2 xl:col-span-3">
              Outputs will condense topology, behaviors, market structures, coordination failures,
              machine-native incentives, and trajectory into six screenshot-ready sections.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
