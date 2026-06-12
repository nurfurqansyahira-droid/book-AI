import { useState, useEffect } from "react";
import { StoryBeat, StoryState, PacingArchetypeType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BookOpen,
  Wand2,
  Trash2,
  FileCheck,
  Zap,
  Ear,
  Eye,
  Check,
  RefreshCw,
  Clock,
  SpellCheck,
  Compass,
  ArrowRightLeft
} from "lucide-react";

interface StoryWorkspaceProps {
  state: StoryState;
  activeBeatIndex: number;
  onUpdateBeatSynopsis: (beatIndex: number, newSynopsis: string) => void;
  archetypeId: PacingArchetypeType;
}

export default function StoryWorkspace({
  state,
  activeBeatIndex,
  onUpdateBeatSynopsis,
  archetypeId
}: StoryWorkspaceProps) {
  const currentBeat = state.beats[activeBeatIndex];

  // Store drafts locally per chapter
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [pacingAnalysis, setPacingAnalysis] = useState<Record<number, string>>({});
  const [sensoryHighlights, setSensoryHighlights] = useState<Record<number, string[]>>({});

  const [activeDraft, setActiveDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [customRefining, setCustomRefining] = useState("");
  const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Load draft from local cache when active chapter changes
  useEffect(() => {
    if (currentBeat) {
      const cacheKey = `muse_draft_state_${state.title}_ch_${currentBeat.chapterNumber}`;
      const cachedProse = localStorage.getItem(cacheKey) || drafts[currentBeat.chapterNumber] || "";
      const cachedAnalysis = localStorage.getItem(`${cacheKey}_analysis`) || pacingAnalysis[currentBeat.chapterNumber] || "";
      const cachedSensory = JSON.parse(localStorage.getItem(`${cacheKey}_sensory`) || "[]") || sensoryHighlights[currentBeat.chapterNumber] || [];

      setActiveDraft(cachedProse);
      setDrafts((prev) => ({ ...prev, [currentBeat.chapterNumber]: cachedProse }));
      setPacingAnalysis((prev) => ({ ...prev, [currentBeat.chapterNumber]: cachedAnalysis }));
      setSensoryHighlights((prev) => ({ ...prev, [currentBeat.chapterNumber]: cachedSensory }));
    }
  }, [activeBeatIndex, currentBeat?.chapterNumber, state.title]);

  if (!currentBeat) {
    return null;
  }

  // Update active draft in state and local storage
  const handleDraftChange = (text: string) => {
    setActiveDraft(text);
    const updated = { ...drafts, [currentBeat.chapterNumber]: text };
    setDrafts(updated);

    const cacheKey = `muse_draft_state_${state.title}_ch_${currentBeat.chapterNumber}`;
    localStorage.setItem(cacheKey, text);
  };

  // Trigger AI to generate draft scenes for the selected chapter beat
  const generateBeatDraft = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/story/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            title: state.title,
            premise: state.premise,
            protagonist: state.protagonist,
            worldSetting: state.worldSetting,
            archetypeId: state.archetypeId
          },
          beat: currentBeat,
          temperature: 0.85
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to draft the chapter prose.");
      }

      if (data.prose) {
        handleDraftChange(data.prose);
        
        // Cache analyses
        const updatedAnalysis = { ...pacingAnalysis, [currentBeat.chapterNumber]: data.pacingAnalysis };
        setPacingAnalysis(updatedAnalysis);
        
        const updatedSensory = { ...sensoryHighlights, [currentBeat.chapterNumber]: data.sensoryHighlights };
        setSensoryHighlights(updatedSensory);

        const cacheKey = `muse_draft_state_${state.title}_ch_${currentBeat.chapterNumber}`;
        localStorage.setItem(`${cacheKey}_analysis`, data.pacingAnalysis || "");
        localStorage.setItem(`${cacheKey}_sensory`, JSON.stringify(data.sensoryHighlights || []));
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply quick tactical refiners to draft prose
  const refineProse = async (instruction: string) => {
    if (!activeDraft.trim()) return;
    setIsRefining(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/story/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: activeDraft,
          instruction,
          archetypeId: state.archetypeId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to refine the prose draft.");
      }

      if (data.refinedText) {
        handleDraftChange(data.refinedText);
        setRefinementHistory((prev) => [
          `Adjusted style: ${instruction} (${data.changesMade?.join(", ") || "Optimized dialogue & adjectives"})`,
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Something went wrong during editing.");
    } finally {
      setIsRefining(false);
    }
  };

  const clearDraft = () => {
    if (window.confirm("Are you sure you want to clear this scratchpad's content?")) {
      handleDraftChange("");
      const cacheKey = `muse_draft_state_${state.title}_ch_${currentBeat.chapterNumber}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_analysis`);
      localStorage.removeItem(`${cacheKey}_sensory`);
      setPacingAnalysis((prev) => ({ ...prev, [currentBeat.chapterNumber]: "" }));
      setSensoryHighlights((prev) => ({ ...prev, [currentBeat.chapterNumber]: [] }));
    }
  };

  // Helper stats
  const wordCount = activeDraft ? activeDraft.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMins = Math.max(1, Math.ceil(wordCount / 220));

  const getFocusBadgeColor = (focusType: string) => {
    switch (focusType) {
      case "climax": return "bg-amber-500/10 text-amber-300 border-amber-500/40";
      case "clash": return "bg-rose-500/10 text-rose-300 border-rose-500/40";
      case "cozy": return "bg-pink-500/10 text-pink-300 border-pink-500/40";
      case "revelation": return "bg-purple-500/10 text-purple-300 border-purple-500/40";
      case "setup": return "bg-sky-500/10 text-sky-300 border-sky-500/40";
      default: return "bg-orange-500/10 text-orange-300 border-orange-500/40";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="story-workspace-grid">
      
      {/* LEFT COLUMN: THE BEAT INSPECTOR */}
      <div className="lg:col-span-5 space-y-6" id="left-inspector-column">
        
        {/* Chapter beat card details */}
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-2xl glass" id="beat-detail-card">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600/10 text-xs font-bold text-amber-500 border border-amber-600/30">
                {currentBeat.chapterNumber}
              </span>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-white/40 block">Segment Navigator</span>
                <h3 className="text-xs font-semibold text-white/80">Chapter {currentBeat.chapterNumber} Plotbeat</h3>
              </div>
            </div>
            
            <span className={`px-2 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wider ${getFocusBadgeColor(currentBeat.focusType)}`}>
              {currentBeat.focusType}
            </span>
          </div>

          <div className="space-y-4">
            {/* Beat Title editable/configurable */}
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Plotbeat Focal Title</label>
              <div className="text-sm font-semibold text-white/80 bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/5">
                {currentBeat.title}
              </div>
            </div>

            {/* Beat Synopsis */}
            <div>
              <label htmlFor="edit-beat-synopsis-textarea" className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Choreograph Synopsis & Direction</label>
              <textarea
                id="edit-beat-synopsis-textarea"
                value={currentBeat.synopsis}
                onChange={(e) => onUpdateBeatSynopsis(activeBeatIndex, e.target.value)}
                rows={3}
                placeholder="Synopsis of events for this stage of the story pacing curve..."
                className="w-full text-xs text-white/70 bg-black/40 border border-white/5 focus:outline-none focus:border-amber-600/50 rounded-xl p-3.5 leading-relaxed font-sans"
              />
            </div>

            {/* Tension Index info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-white/50">Tension Intensity Scale:</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">{currentBeat.tensionLevel} / 100</span>
            </div>

            {/* Chapter-specific Creative Tips */}
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Style Directives & Sensory Cues</label>
              <div className="space-y-2" id="chapter-tips-list">
                {currentBeat.writingTips?.map((tip, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-white/60 leading-relaxed font-sans">
                    <span className="h-4 w-4 shrink-0 rounded border border-white/10 bg-white/3 flex items-center justify-center p-0.5 text-amber-500">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Big Action button to trigger Gemini drafting */}
            <div className="pt-2">
              <button
                onClick={generateBeatDraft}
                disabled={isGenerating}
                className="w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050505] bg-amber-500 hover:bg-amber-400 active:scale-[0.99] transition-all disabled:opacity-45 cursor-pointer shadow-lg shadow-amber-500/20"
                id="generate-draft-button"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-black/50" />
                    <span>Orchestrating scene prose...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Draft scene snippet (Gemini AI)</span>
                  </>
                )}
              </button>
              {generationError && (
                <p className="mt-2 text-xs text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
                  {generationError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* AI pacing & structural feedback panel */}
        {pacingAnalysis[currentBeat.chapterNumber] && (
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-2xl glass" id="pacing-analysis-box">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-amber-500" />
              Rhythm Analysis
            </h4>
            <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-3.5 rounded-lg border border-white/5 font-serif whitespace-pre-line text-amber-50/80">
              {pacingAnalysis[currentBeat.chapterNumber]}
            </p>

            {/* List sensory highlights extracted */}
            {sensoryHighlights[currentBeat.chapterNumber]?.length > 0 && (
              <div className="mt-4">
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 block mb-2">Sensory Palette Injected in Draft</span>
                <div className="flex flex-wrap gap-1.5">
                  {sensoryHighlights[currentBeat.chapterNumber].map((word, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/5 text-amber-300 border border-amber-500/20 flex items-center gap-1 uppercase tracking-wide"
                    >
                      {i % 2 === 0 ? <Eye className="h-3 w-3 text-amber-500" /> : <Ear className="h-3 w-3 text-amber-500" />}
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: PROSE STUDIO SCRATCHPAD */}
      <div className="lg:col-span-7 space-y-6" id="right-scratchpad-column">
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-2xl glass flex flex-col h-full" id="prose-scratchpad-panel">
          
          {/* Header controls for scratchpad */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-white/80">Prose Drafting Studio</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Word counts statistics */}
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-white/40 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                <span className="flex items-center gap-1">
                  <SpellCheck className="h-3 w-3 text-amber-500/80" />
                  <strong>{wordCount}</strong> words
                </span>
                <span className="h-2.5 w-px bg-white/10"></span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500/80" />
                  ~{readingTimeMins}m read
                </span>
              </div>

              <button
                onClick={clearDraft}
                disabled={!activeDraft}
                className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-colors disabled:opacity-20 cursor-pointer"
                title="Clear contents"
                id="clear-prose-studio-button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Core Textarea for writing narrative in warm editorial serif */}
          <div className="relative flex-grow min-h-[380px] flex flex-col" id="prose-studio-writing-container">
            <textarea
              value={activeDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder="Begin typing prose here, or hit 'Draft scene snippet' on the left to write an atmospheric draft aligning to your chosen genre tension index and world building laws..."
              className="w-full flex-grow p-5 bg-black/60 focus:bg-black/90 text-lg rounded-2xl border border-white/5 focus:outline-none focus:border-amber-600/40 text-white/80 focus:text-white transition-colors leading-[1.8] editor-font min-h-[380px] resize-y"
              id="story-prose-writing-canvas"
            />
          </div>

          {/* Quick Style Refiners segment with Elegant Dark Buttons */}
          <div className="mt-5 border-t border-white/5 pt-4" id="refiners-toolbox-panel">
            <h4 className="text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              Tactical AI Style Refiners (Enhance Active Prose)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5" id="refiners-buttons-row">
              <button
                onClick={() => refineProse("Add more sensory highlights and cinematic lighting/vista descriptions")}
                disabled={isRefining || !activeDraft}
                className="py-2.5 px-3 rounded-xl border border-cyan-500/20 bg-cyan-950/5 hover:bg-cyan-950/30 text-left flex flex-col justify-between h-14 group disabled:opacity-40 cursor-pointer transition-all"
                id="refine-cinematic-btn"
              >
                <span className="text-[8px] text-cyan-400 uppercase tracking-widest font-bold block">Cinematic</span>
                <span className="text-[10px] font-semibold text-white/50 truncate w-full group-hover:text-white/85">Spectacular Vistas</span>
              </button>

              <button
                onClick={() => refineProse("Incorporate stricter hard magic system limitations, currency costs, or logical physical cause-and-effect principles")}
                disabled={isRefining || !activeDraft}
                className="py-2.5 px-3 rounded-xl border border-amber-500/20 bg-amber-950/5 hover:bg-amber-950/30 text-left flex flex-col justify-between h-14 group disabled:opacity-40 cursor-pointer transition-all"
                id="refine-sanderson-btn"
              >
                <span className="text-[8px] text-amber-400 uppercase tracking-widest font-bold block">Sanderson</span>
                <span className="text-[10px] font-semibold text-white/50 truncate w-full group-hover:text-white/85">Tactical Rules</span>
              </button>

              <button
                onClick={() => refineProse("Enhance the emotional intimacy, playful banter, dry humor, or soothing atmospheric comforts")}
                disabled={isRefining || !activeDraft}
                className="py-2.5 px-3 rounded-xl border border-pink-500/20 bg-pink-950/5 hover:bg-pink-950/30 text-left flex flex-col justify-between h-14 group disabled:opacity-40 cursor-pointer transition-all"
                id="refine-cozy-btn"
              >
                <span className="text-[8px] text-pink-400 uppercase tracking-widest font-bold block">Cozy Romance</span>
                <span className="text-[10px] font-semibold text-white/50 truncate w-full group-hover:text-white/85">Witty Charm</span>
              </button>

              <button
                onClick={() => refineProse("Amplify clauses of psychological dread, ticking-clock ticking sound cues, rapid short sentences, cold sweat, paranoia")}
                disabled={isRefining || !activeDraft}
                className="py-2.5 px-3 rounded-xl border border-rose-500/20 bg-rose-950/5 hover:bg-rose-950/30 text-left flex flex-col justify-between h-14 group disabled:opacity-40 cursor-pointer transition-all"
                id="refine-thriller-btn"
              >
                <span className="text-[8px] text-rose-400 uppercase tracking-widest font-bold block">Thriller</span>
                <span className="text-[10px] font-semibold text-white/50 truncate w-full group-hover:text-white/85">Claustrophobic</span>
              </button>
            </div>

            {/* Custom Input Refining */}
            <div className="flex gap-2 items-center" id="custom-refinement-row">
              <input
                type="text"
                value={customRefining}
                onChange={(e) => setCustomRefining(e.target.value)}
                placeholder="Or type custom direct editor commands... (e.g. 'Use stark iron sensory metaphors', 'Make prose punchier')"
                className="flex-grow text-xs px-3.5 py-2.5 border border-white/5 bg-black/60 text-white/80 focus:text-white outline-none rounded-xl focus:border-amber-600/40"
                id="custom-refining-input"
              />
              <button
                onClick={() => {
                  if (customRefining.trim()) {
                    refineProse(customRefining);
                    setCustomRefining("");
                  }
                }}
                disabled={isRefining || !activeDraft || !customRefining.trim()}
                className="px-4 py-2.5 bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500 rounded-xl hover:text-black transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-30 cursor-pointer"
                id="custom-refine-trigger-btn"
              >
                {isRefining ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                Refine Vibe
              </button>
            </div>

            {/* History of recent changes */}
            {refinementHistory.length > 0 && (
              <div className="mt-3.5 bg-black/40 border border-white/5 p-2.5 rounded-lg">
                <span className="text-[8px] font-mono tracking-widest uppercase text-white/30 block mb-1">Editing Revision History</span>
                <ul className="space-y-1">
                  {refinementHistory.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-[10px] text-white/50 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
