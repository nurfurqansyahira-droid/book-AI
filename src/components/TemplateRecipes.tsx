import { StoryRecipe, STORY_RECIPES, ARCHETYPES } from "../types";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";

interface TemplateRecipesProps {
  onSelectRecipe: (recipe: StoryRecipe) => void;
}

export default function TemplateRecipes({ onSelectRecipe }: TemplateRecipesProps) {
  const getArchetypeDisplay = (archetypeId: string) => {
    return ARCHETYPES[archetypeId as keyof typeof ARCHETYPES]?.name || archetypeId;
  };

  const getCardStyle = (archetypeId: string) => {
    switch (archetypeId) {
      case "sanderson":
        return "from-amber-600/10 to-transparent hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]";
      case "cinematic":
        return "from-cyan-600/10 to-transparent hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]";
      case "cozy":
        return "from-pink-600/10 to-transparent hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]";
      case "thriller":
        return "from-rose-600/10 to-transparent hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]";
      default:
        return "from-amber-600/10 to-transparent hover:border-amber-500/40";
    }
  };

  const getArchetypeBadgeClass = (archetypeId: string) => {
    switch (archetypeId) {
      case "sanderson":
        return "bg-amber-950/40 text-amber-300 border-amber-900/60";
      case "cinematic":
        return "bg-cyan-950/40 text-cyan-300 border-cyan-900/60";
      case "cozy":
        return "bg-pink-950/40 text-pink-300 border-pink-900/60";
      case "thriller":
        return "bg-rose-950/40 text-rose-300 border-rose-900/60";
      default:
        return "bg-amber-950/40 text-amber-300 border-amber-900/60";
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/5 bg-[#0a0a0a] p-5 shadow-xl glass" id="prompt-recipes-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Curated Story Templates
          </h3>
          <p className="text-xs text-white/50">
            Click any crafted layout starter below. Automatically loads pacing strategies, protagonist profiles, and world frameworks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" id="recipes-card-grid">
        {STORY_RECIPES.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onSelectRecipe(recipe)}
            className={`group text-left flex flex-col justify-between p-4 rounded-xl border border-white/5 bg-gradient-to-br bg-white/3 transition-all duration-300 hover:-translate-y-0.5 ${getCardStyle(
              recipe.archetypeId
            )}`}
            id={`recipe-card-${recipe.id}`}
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium uppercase tracking-wider ${getArchetypeBadgeClass(recipe.archetypeId)}`}>
                  {getArchetypeDisplay(recipe.archetypeId)}
                </span>
              </div>
              <h4 className="font-semibold text-white/90 leading-tight group-hover:text-amber-400 transition-colors">
                {recipe.title}
              </h4>
              <p className="mt-1.5 text-xs text-white/60 line-clamp-2 md:line-clamp-3">
                {recipe.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-amber-500/80">
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                <Wand2 className="h-3.5 w-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                Initialize Draft
              </span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
