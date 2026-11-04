// "How to solve" strategy guides for every question type.
export const STRATEGIES = {
  analogy: {
    steps: ["Make a sentence that links the first two words exactly: “A ___ is a tool used by a ___”.", "Try your sentence with the third word and each option — only one should fit perfectly.", "If two options fit, make the sentence more specific (part of? type of? opposite? more extreme?).", "Watch for lures: words that are related to the third word in a different way."],
    eg: "scalpel → surgeon : chisel → ?  “A scalpel is the tool of a surgeon” → chisel is the tool of a sculptor."
  },
  sentence: {
    steps: ["Read the whole sentence first and predict your own word before looking at the choices.", "Look for signal words: although, despite, but, however (contrast); because, so, and, therefore (same direction).", "For two blanks, check that both words work together — eliminate options where either word fails.", "Plug your answer back in and reread the full sentence."],
    eg: "“Despite her ____ manner, she was terrified.” → “despite” means contrast, so the blank is the opposite of terrified: composed."
  },
  classify: {
    steps: ["Name the narrowest category that includes all three words (not just “animals” — “amphibians”).", "Pick the option that fits that exact category.", "Beware of near-misses from a neighboring category (a spider is not an insect; a salamander is not a reptile)."],
    eg: "frog, newt, toad → amphibians → salamander (not lizard, which is a reptile)."
  },
  odd: {
    steps: ["Find what four of the words share, as specifically as you can.", "The odd one out breaks that rule.", "If more than one word could be odd, your category is too broad — narrow it."],
    eg: "oboe, flute, clarinet, trumpet, bassoon → woodwinds; trumpet is brass."
  },
  numanalogy: {
    steps: ["Look at the first pair and list a few rules that work (×3? +12? square?).", "Test each rule on the second pair — keep only the one that works for both.", "Apply it to the last number.", "Common rules: ×, ÷, + or − a constant, two-step rules (×2 then +1), squares and cubes."],
    eg: "[4 → 13] [6 → 19] → ×3 then +1 → 9 → 28."
  },
  numpuzzle: {
    steps: ["Work out the side you can fully calculate first.", "Undo operations in reverse order to find ?.", "For symbol chains, solve the top line first and substitute downward.", "For two-symbol systems, subtract one line from the other to cancel a symbol."],
    eg: "3 × ? + 4 = 2 × 14 → 28 − 4 = 24 → 24 ÷ 3 = 8."
  },
  series: {
    steps: ["Write the differences between neighbors underneath the series.", "If the differences aren't constant, look at the differences of the differences, or check ×/÷.", "Check for two series alternating (look at every other number).", "Know these: squares, cubes, primes, triangular numbers (1, 3, 6, 10), Fibonacci."],
    eg: "3, 4, 6, 10, 18 → differences 1, 2, 4, 8 (doubling) → next difference 16 → 34."
  },
  math: {
    steps: ["Underline what the question actually asks for (the largest number? the area? x?).", "Write the equation before calculating.", "Watch for traps: percent changes don't cancel, flip the inequality when dividing by a negative, average speed isn't the average of the speeds.", "Estimate first so you can reject unreasonable answers."],
    eg: "Up 20% then down 20%: 100 → 120 → 96, not 100."
  },
  letter: {
    steps: ["Convert letters to numbers (A=1 … Z=26) and look at the jumps.", "Check for two alternating series.", "For groups like ACE, BDF, check how the first letter moves and how letters inside a group are spaced."],
    eg: "B, E, J, Q → +3, +5, +7 → +9 → Z."
  },
  matrix: {
    steps: ["2×2: describe exactly how the first figure changes into the second (turn? flip? shading? swap?). Apply the same change to the third.", "Check rotation direction carefully — follow one small mark around.", "3×3: look along rows AND down columns. Often each row contains one of each shape, count or shading.", "Line grids: the third figure may be the first two overlaid, or only the lines that are NOT shared."],
    eg: "If the small dot moves from top-left to top-right, the figure turned 90° clockwise (or flipped left-right — check the other mark to tell which)."
  },
  folding: {
    steps: ["Unfold in reverse: start from the LAST fold and work back to the first.", "Each fold doubles the holes: every hole gets a mirror image across that fold line.", "Count: 1 hole × 2 for each fold (2 folds → 4 holes, 3 folds → 8).", "Mirror images are the same distance from the fold line, on the opposite side."],
    eg: "Fold in half left-to-right, then top-to-bottom, punch one hole → 4 holes, symmetric across both center lines."
  },
  figclass: {
    steps: ["Ignore size, rotation and position at first — those usually vary on purpose.", "Ask: how many sides? how many parts? what's shaded? does the inside match the outside? what points at what?", "Find the one rule all three share, then find the single option that follows it."],
    eg: "Triangle with 3 dots, square with 4 dots, pentagon with 5 dots → hexagon with 6 dots."
  },
  balance: {
    steps: ["Pick the lightest shape and call it 1.", "Use each balanced scale to write every shape in terms of the lightest one.", "Add up the weight on the left of the question scale.", "Pick the option with exactly the same total."],
    eg: "1 star = 2 circles, 1 square = 3 circles → 2 stars = 4 circles; 1 square + 1 circle = 4 circles ✓."
  },
  shapes: {
    steps: ["Track ONE feature at a time: rotation, number of sides, count, shading, position.", "Hard sequences change two things at once — check both before choosing.", "Say the rule out loud: “turns 45° clockwise and alternates filled / empty”."],
    eg: "Arrow up, right-up, right, right-down → turns 45° clockwise → next points down."
  }
};
