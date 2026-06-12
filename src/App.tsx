import { useState, useEffect } from "react";
import { StoryState, PacingArchetypeType, StoryRecipe, ARCHETYPES } from "./types";
import PacingChart from "./components/PacingChart";
import TemplateRecipes from "./components/TemplateRecipes";
import StoryWorkspace from "./components/StoryWorkspace";
import {
  Wand2,
  BookOpen,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Flame,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from "lucide-react";

export default function App() {
  const [title, setTitle] = useState("The Ash Spindle");
  const [premise, setPremise] = useState(
    "A group of outcast metalsmiths attempt to rob the Grand Mineral vault by vaporizing its iron foundation."
  );
  const [archetypeId, setArchetypeId] = useState<PacingArchetypeType>("sanderson");
  const [customPacingPrompt, setCustomPacingPrompt] = useState("");
  const [protagonist, setProtagonist] = useState(
    "Vaelen, a coin-shot alloy burner who can see the magnetic ley-lines of metals but suffers from nickel poisoning."
  );
  const [worldSetting, setWorldSetting] = useState(
    "The Obsidian Reach: A volcanic realm where ashfalls are recycled into steam power, and metals are sacred and highly regulated."
  );

  const [beats, setBeats] = useState<any[]>([]);
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);

  // App status and loading toggles
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Fetch status on startup
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(data.configured);
      })
      .catch((err) => {
        console.error("Failed to fetch initial server status:", err);
        setIsConfigured(false);
      });
  }, []);

  // Pre-fill fields when selecting a curated recipe
  const handleSelectRecipe = (recipe: StoryRecipe) => {
    setTitle(recipe.title);
    setPremise(recipe.premisePlaceholder);
    setProtagonist(recipe.protagonistPlaceholder);
    setWorldSetting(recipe.worldSettingPlaceholder);
    setArchetypeId(recipe.archetypeId);
    setBeats([]);
    setActiveBeatIndex(0);
    setAppError(null);
  };

  // Synthesize story beats & structured pacing curve via Express API and Gemini
  const handleSynthesizeStoryArc = async () => {
    if (!premise.trim()) {
      setAppError("A story premise/logline is required first.");
      return;
    }

    setIsSynthesizing(true);
    setAppError(null);
    setBeats([]);
    setActiveBeatIndex(0);

    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          premise,
          archetypeId,
          protagonist,
          worldSetting,
          customPacingPrompt: archetypeId === "custom" ? customPacingPrompt : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to structure the pacing outline.");
      }

      if (data.outline && Array.isArray(data.outline)) {
        setBeats(data.outline);
        setActiveBeatIndex(0);
      } else {
        throw new Error("Invalid response format received from story synthesizer.");
      }
    } catch (err: any) {
      console.error(err);
      setAppError(err.message || "An error occurred while generating the pacing curve.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUpdateBeatSynopsis = (beatIndex: number, newSynopsis: string) => {
    setBeats((prev) => {
      const updated = [...prev];
      updated[beatIndex] = { ...updated[beatIndex], synopsis: newSynopsis };
      return updated;
    });
  };

  // Compute active pacing status percentage based on active index
  const pacingStatusPercentage = beats.length > 0 
    ? Math.round(((activeBeatIndex + 1) / beats.length) * 100) 
    : 35;

  return (
    <div className="min-h-screen bg-[#050505] text-white/90 flex flex-col font-sans antialiased selection:bg-amber-600 selection:text-black" id="main-application-frame">
      
      {/* GLOBAL BANNER IF KEY NOT MOUNTED */}
      {isConfigured === false && (
        <div className="bg-amber-500 text-black px-4 py-2 text-center text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg" id="api-key-warning-bar">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>GEMINI_API_KEY IS MISSING. Please declare it in Settings &gt; Secrets to activate AI writing!</span>
        </div>
      )}

      {/* HEADER SECTION (Mythos / Sanderson Atmosphere) */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0a]" id="applet-header">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,1)]"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-amber-500/90">
              MYTHOS <span className="text-white/40 font-light text-xs">AI</span>
            </h1>
            <p className="text-[9px] uppercase tracking-wider text-white/30 -mt-0.5 font-mono">STORY ARCHITECT</p>
          </div>
        </div>

        {/* Dynamic Center stats */}
        <div className="hidden md:flex gap-6 text-[10px] uppercase tracking-[0.25em] font-medium text-white/40 font-mono">
          <span>STYLE: {ARCHETYPES[archetypeId]?.name || archetypeId}</span>
          <span>DRAFT 1.2</span>
          <span>{beats.length > 0 ? `${beats.length} CHAPTERS` : "EMPTY CANVAS"}</span>
        </div>

        {/* Sandbox Scale Meter */}
        <div className="flex gap-4 items-center">
          <div className="hidden sm:block">
            <div className="h-1.5 w-28 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-amber-600/70 transition-all duration-500" 
                style={{ width: `${pacingStatusPercentage}%` }}
              ></div>
            </div>
          </div>
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-mono">
            Sander-Scale: {pacingStatusPercentage}%
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6" id="dashboard-core">
        
        {/* Curated Story Templates panel */}
        <TemplateRecipes onSelectRecipe={handleSelectRecipe} />

        {/* SECTION 2: CONFIGURATION & METADATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="setup-configuration-row">
          
          {/* LEFT: CRITERIA FORMS */}
          <div className="lg:col-span-4 space-y-5" id="metadata-setup-card">
            <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-2xl glass h-full flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#e2e8f0]">Narrative Core Def</h3>
                </div>

                {/* Story Title */}
                <div>
                  <label htmlFor="story-title" className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">Project Working Title</label>
                  <input
                    id="story-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daughter of Ash & Alloy"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/5 bg-black/40 focus:bg-black/80 focus:border-amber-600/40 text-white/80 focus:text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Protagonist profile */}
                <div>
                  <label htmlFor="protagonist-profile" className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">Key Protagonist & Magic traits</label>
                  <input
                    id="protagonist-profile"
                    type="text"
                    value={protagonist}
                    onChange={(e) => setProtagonist(e.target.value)}
                    placeholder="Describe traits or magical limits..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/5 bg-black/40 focus:bg-black/80 focus:border-amber-600/40 text-white/80 focus:text-white focus:outline-none transition-all"
                  />
                </div>

                {/* World setting constraints */}
                <div>
                  <label htmlFor="world-setting" className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">World Setting & Rules</label>
                  <input
                    id="world-setting"
                    type="text"
                    value={worldSetting}
                    onChange={(e) => setWorldSetting(e.target.value)}
                    placeholder="Specific geographical and scientific laws..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/5 bg-black/40 focus:bg-black/80 focus:border-amber-600/40 text-white/80 focus:text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Story premise */}
                <div>
                  <label htmlFor="story-premise" className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">Logline, Inciting Core, or Conflict Spark</label>
                  <textarea
                    id="story-premise"
                    value={premise}
                    onChange={(e) => setPremise(e.target.value)}
                    rows={4}
                    placeholder="What pushes the characters and the plot forward?"
                    className="w-full text-xs p-3.5 rounded-xl border border-white/5 bg-black/40 focus:bg-black/80 focus:border-amber-600/40 text-white/80 focus:text-white focus:outline-none transition-all leading-normal"
                  />
                </div>

                {/* PACING MODELS ARCHETYPES GRID */}
                <div>
                  <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2">Select Pacing Archetype</label>
                  <div className="grid grid-cols-2 gap-2" id="archetypes-selection-box">
                    {Object.values(ARCHETYPES).map((item) => {
                      const isSelected = item.id === archetypeId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setArchetypeId(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "border-amber-600 bg-amber-655/5 text-amber-400"
                              : "border-white/5 bg-white/3 hover:bg-white/5"
                          }`}
                          id={`pacing-model-select-${item.id}`}
                        >
                          <span className="font-semibold text-xs text-white/90 block truncate">{item.name}</span>
                          <span className="text-[9px] text-white/40 line-clamp-1 block leading-normal mt-0.5" title={item.description}>{item.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom system guidelines input if custom selected */}
                {archetypeId === "custom" && (
                  <div className="pt-1">
                    <label htmlFor="custom-pacing-rules" className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">Custom Pacing Guidelines</label>
                    <input
                      id="custom-pacing-rules"
                      type="text"
                      value={customPacingPrompt}
                      onChange={(e) => setCustomPacingPrompt(e.target.value)}
                      placeholder="e.g. Slow build, sudden middle disaster, quick resolution"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/5 bg-black/40 focus:bg-black/80 focus:border-amber-600/40 text-white/80 focus:text-white focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Synthesize story beats button */}
              <div className="pt-5 border-t border-white/5 mt-5">
                <button
                  onClick={handleSynthesizeStoryArc}
                  disabled={isSynthesizing}
                  className="w-full py-4 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-black transition-colors focus:outline-none disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                  id="synthesize-blueprint-btn"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-black/60" />
                      <span>Synthesizing Story Beats...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 text-black/60" />
                      <span>Synthesize Story Arc</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT: CHART VISUALIZERS CORES */}
          <div className="lg:col-span-8 flex flex-col justify-between" id="chart-visualizer-section">
            <div className="h-full flex flex-col gap-6">
              
              {/* Plot Pacing output curves rendering */}
              <div className="flex-grow">
                <PacingChart
                  beats={beats}
                  activeIndex={activeBeatIndex}
                  onSelectBeat={setActiveBeatIndex}
                  archetypeId={archetypeId}
                />
              </div>

              {/* Helpful tips card if no beats outline has been generated yet */}
              {beats.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a0a0a] glass p-6 md:p-8 text-center flex-grow flex flex-col justify-center items-center" id="empty-state-card">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/25">
                      <Sparkles className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <h4 className="text-base font-semibold text-white/90">Unlock Creative Architecture</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Select a predefined template above or input your own custom parameters in the left panel. Clicking <strong>'Synthesize Story Arc'</strong> will choreograph a tailored chapter pacing outline, compute visual tension waves, and configure sensory prompts.
                    </p>
                    
                    {/* Visual tutorial indicator */}
                    <div className="pt-3 text-left bg-black/40 p-3.5 rounded-xl border border-white/5">
                      <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Archetype Pacing Cheat-Sheet
                      </span>
                      <ul className="text-[11px] text-white/60 space-y-1.5 font-sans">
                        <li>• <strong>Sanderson style</strong> features a rapid escalation spike (the "Sanderstorm") resolving multiple parallel threads in the final chapters.</li>
                        <li>• <strong>Cinematic Fantasy</strong> focuses on high opening hooks, major turning point confrontations, and high magic.</li>
                        <li>• <strong>Cozy Romance</strong> weaves charming, relaxing dialogue patterns & cozy senses.</li>
                        <li>• <strong>Dark Thriller</strong> maintains an unrelenting claustrophobic tension staircase.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ERROR DISPLAY AREA */}
        {appError && (
          <div className="rounded-xl border border-rose-950/40 bg-rose-950/20 p-4 text-xs text-rose-350 flex items-start gap-2.5" id="app-error-dialog">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-[10px] block mb-0.5">Synthesizing Interrupted:</span> {appError}
            </div>
          </div>
        )}

        {/* SECTION 3: THE IMMERSIVE WRITING WORKSPACE */}
        {beats.length > 0 && (
          <div className="pt-5 border-t border-white/5 animate-fade-in" id="workspace-parent">
            <StoryWorkspace
              state={{
                title,
                premise,
                archetypeId,
                customPacingPrompt,
                protagonist,
                worldSetting,
                beats
              }}
              activeBeatIndex={activeBeatIndex}
              onUpdateBeatSynopsis={handleUpdateBeatSynopsis}
              archetypeId={archetypeId}
            />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/5 py-6 px-4 text-center text-[11px] uppercase tracking-widest text-white/30 bg-[#0a0a0a]" id="app-footer">
        <p className="max-w-md mx-auto">
          AI Story Architect • Powered by Gemini Flash model • Made for creative novelists and plot orchestrators.
        </p>
      </footer>

    </div>
  );
}
