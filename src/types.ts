export type PacingArchetypeType = "sanderson" | "cinematic" | "cozy" | "thriller" | "custom";

export interface PacingArchetype {
  id: PacingArchetypeType;
  name: string;
  description: string;
  typicalTensionCurveStr: string; // Brief visual description of the wave
  beatsCount: number;
}

export interface StoryBeat {
  chapterNumber: number;
  title: string;
  synopsis: string;
  tensionLevel: number; // 0 - 100
  focusType: "setup" | "escalation" | "climax" | "cozy" | "clash" | "revelation";
  writingTips: string[];
}

export interface StoryState {
  title: string;
  premise: string;
  archetypeId: PacingArchetypeType;
  customPacingPrompt?: string;
  protagonist: string;
  worldSetting: string;
  beats: StoryBeat[];
}

export interface StoryRecipe {
  id: string;
  title: string;
  description: string;
  archetypeId: PacingArchetypeType;
  premisePlaceholder: string;
  protagonistPlaceholder: string;
  worldSettingPlaceholder: string;
}

export const ARCHETYPES: Record<PacingArchetypeType, PacingArchetype> = {
  sanderson: {
    id: "sanderson",
    name: "Brandon Sanderson-inspired",
    description: "Sanderlanche style: Rich foundational setup and strict system rules leading to an exponential burst of parallel climax threads resolving together.",
    typicalTensionCurveStr: "Slow rising line that explodes upwards at 80% mark",
    beatsCount: 8,
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic Fantasy Epic",
    description: "Sweeping widescreen layouts: Strong opening hooks, multi-peak orchestral struggles, and soaring sensory climaxes.",
    typicalTensionCurveStr: "High hook, drop, double steady crest, epic peak",
    beatsCount: 8,
  },
  cozy: {
    id: "cozy",
    name: "Cozy Low-Stakes Romance",
    description: "Heartwarming friction: High emotional safety, witty dialogue, soft-focus sensory elements, and self-healing minor conflicts.",
    typicalTensionCurveStr: "Gentle rolling waves with a warm, comforting peak",
    beatsCount: 6,
  },
  thriller: {
    id: "thriller",
    name: "Dark Psychological Thriller",
    description: "Claustrophobic ticking clock: Rapid staccato beats, escalating dread, unreliable narrators, and recurring cliffhangers.",
    typicalTensionCurveStr: "Immediate step-up staircase of endless cliffhangers",
    beatsCount: 8,
  },
  custom: {
    id: "custom",
    name: "Custom Narrative Style",
    description: "Define your own tone, escalation speed, and pacing rhythm.",
    typicalTensionCurveStr: "User defined tension",
    beatsCount: 7,
  }
};

export const STORY_RECIPES: StoryRecipe[] = [
  {
    id: "alloy-of-shadows",
    title: "Alloy of Shadows (Sanderson Style)",
    description: "A hard-magic heist story. Metal burners must outsmart the infallible inquisitors in a submerged mineral fortress.",
    archetypeId: "sanderson",
    premisePlaceholder: "A group of outcast metalsmiths attempt to rob the Grand Mineral vault by vaporizing its iron foundation.",
    protagonistPlaceholder: "Vaelen, a coin-shot alloy burner who can see the magnetic ley-lines of metals but suffers from nickel poisoning.",
    worldSettingPlaceholder: "The Obsidian Reach: A volcanic realm where ashfalls are recycled into steam power, and metals are sacred and highly regulated."
  },
  {
    id: "shattered-aurora",
    title: "The Shattered Aurora (Cinematic Epic)",
    description: "Sweeping vistas, elder titans, and cosmic glass storms in a dying, star-bound empire.",
    archetypeId: "cinematic",
    premisePlaceholder: "When the sky-shattering glass Aurora flares, an ancient sky-dreadnought wakes to find all stars replaced with void portals.",
    protagonistPlaceholder: "Kyra of the Glass Veil, a solar mechanic who can breathe in high altitude windstream currents.",
    worldSettingPlaceholder: "The Cloud Archipelago: Floating sky continents held together by magnetic root systems, drifting around a dead star."
  },
  {
    id: "lavender-and-lockets",
    title: "Lavender & Clockwork Lockets (Cozy Romance)",
    description: "A restorative, gentle love story between a clockmaker and an botanist in a sleepy tea-loving village.",
    archetypeId: "cozy",
    premisePlaceholder: "An introverted botanical alchemist accidentally drops a truth-pollen seed into the village clockmaker's prototype teapot companion.",
    protagonistPlaceholder: "Orla, a cozy herbalist who grows glowing moon-lavender and talks to sheered-wool bumblebees.",
    worldSettingPlaceholder: "Meadow-under-Hill: A quiet, green village where waterwheels power giant mechanical tea-stirrers, and dragons are the size of tea-towels."
  },
  {
    id: "behind-dead-mirrors",
    title: "Behind Dead Mirrors (Dark Thriller)",
    description: "A psychological maze where the investigator has 24 hours before their reflection becomes their jailer.",
    archetypeId: "thriller",
    premisePlaceholder: "A detective traces a series of absolute disappearances to an antique mirror dealer carrying a clockwork watch ticking backwards.",
    protagonistPlaceholder: "Agent Mercer, a sleep-deprived sensory analyst who can hear echoes of thoughts trapped in polished glass.",
    worldSettingPlaceholder: "Coldwater Precinct: A rain-lashed neon metropolis with perpetually wet streets and steam vents, where mirrors are banned from public streets."
  }
];
