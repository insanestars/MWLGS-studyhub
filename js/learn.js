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
  vocabctx: {
    steps: ["Read the sentence and predict the meaning of the missing word from context clues.", "Look for clue words: because, although, despite, so, but — they tell you if the blank agrees with or contrasts with the rest.", "Check the part of speech: an adjective slot needs an adjective.", "If you don't know a word, break it into roots (bene = good, mal = bad, chron = time)."],
    eg: "“Despite his size, the dog had a ____ nature.” → contrast with size → gentle → benign."
  },
  reading: {
    steps: ["Skim the passage first for the big idea: who or what is it about, and what is the author saying about it?", "Main idea answers cover the WHOLE passage, not one detail.", "For detail questions, go back and find the exact line — don't rely on memory.", "Inference answers must be supported by the text; eliminate choices that go too far (always, never, all).", "Vocab-in-context: substitute each choice into the sentence; the common meaning is often a trap.", "Tone: look at word choice — praise words, doubt words, emotional words."],
    eg: "If an answer is true but only describes paragraph 2, it is a detail, not the main idea."
  },
  arith: {
    steps: ["Order of operations: Parentheses, Exponents, Multiply/Divide left to right, Add/Subtract left to right.", "Signs: negative × negative = positive; negative × positive = negative.", "Long multiplication: split one number into tens and ones, multiply separately, then add.", "Long division: take away big chunks of the divisor (×100, ×10) and add up the chunks.", "Mental tricks: 99 × n = 100n − n; 25 × n = n ÷ 4 × 100; 11 × n = 10n + n."],
    eg: "8 + 3 × 4 − 6 ÷ 2 = 8 + 12 − 3 = 17 (not 41!)."
  },
  fdp: {
    steps: ["Add/subtract fractions: find a common denominator first.", "Multiply fractions: top × top, bottom × bottom. Divide: keep, change, flip.", "Mixed numbers: convert to improper fractions before multiplying or dividing.", "Percent of a number: find 10% (move the decimal) and build from there.", "Percent change = change ÷ ORIGINAL × 100."],
    eg: "15% of 80: 10% = 8, 5% = 4, so 15% = 12."
  },
  ratio: {
    steps: ["Ratio a:b with total T: each part = T ÷ (a + b).", "Proportions: cross-multiply (a/b = c/d → ad = bc).", "Unit rate: divide to find the cost or amount for ONE.", "Scale factor: big ÷ small, then multiply.", "Distance = speed × time; time = distance ÷ speed."],
    eg: "Boys:girls = 3:5 with 40 students → 8 parts, 5 per part → 25 girls."
  },
  word: {
    steps: ["Read the question twice; underline what it actually asks for.", "Name the unknown (let x = …) and write an equation from the words.", "“Is” means =, “of” means ×, “more than” means +, “less than” means − (careful with order!).", "Check your answer makes sense (you can't have 3.5 buses — round up!)."],
    eg: "“A number doubled plus 7 is 31” → 2n + 7 = 31 → n = 12."
  },
  algebra: {
    steps: ["Solve equations by undoing operations in reverse order, doing the same thing to both sides.", "Distribute first, then collect x-terms on one side.", "Inequalities: dividing or multiplying by a negative FLIPS the sign.", "Slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁); y = mx + b.", "Systems: add or subtract equations to cancel a variable, or substitute.", "Exponents: multiply → add exponents; power of a power → multiply; x⁰ = 1; x⁻ⁿ = 1/xⁿ."],
    eg: "−3x + 4 > 19 → −3x > 15 → x < −5 (sign flipped)."
  },
  geometry: {
    steps: ["Triangle angles add to 180°; a straight line is 180°; around a point is 360°.", "Pythagorean triples to know: 3-4-5, 5-12-13, 8-15-17, 7-24-25.", "Area: rectangle lw, triangle ½bh, circle πr². Circumference 2πr.", "Volume: box lwh, cylinder πr²h. Double the sides → area ×4, volume ×8."],
    eg: "Diameter 10 → radius 5 → area 25π."
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
