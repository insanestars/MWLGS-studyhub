// Reading comprehension passages (original), part A.
// Each question: { k: kind, q, a: answer, d: [3 distractors], e: explanation }
// kinds: main, detail, inference, vocab, tone, purpose, structure
export const PASSAGES_A = [
  {
    id: "town-meeting", title: "The New England Town Meeting", genre: "Civics",
    text: `In many small towns in New England, government does not happen far away in a capitol building. Once a year, residents gather in a school gym or a town hall for a town meeting. Any registered voter may attend, speak, and vote directly on the town's budget, its roads, and even whether to buy a new fire truck.

Supporters call the town meeting the purest form of democracy in America. Citizens do not elect someone to decide for them; they decide for themselves. A retired teacher can question the road commissioner, and a teenager who has just turned eighteen can cast a vote that counts exactly as much as the mayor's.

Yet the tradition faces challenges. Meetings can last for hours, and many people cannot leave work or find child care. In some towns, fewer than one in ten voters attend, which means a small, dedicated group may make decisions for everyone. Some communities have responded by holding meetings on weekends or allowing absentee ballots for major questions. Whether the town meeting survives may depend on how well it adapts to modern life.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "A form of direct democracy, its strengths, and the challenges it faces", d: ["The history of New England fire departments", "Why elected officials make better decisions than citizens", "How to register to vote in a small town"], e: "The passage describes town meetings, praises them as pure democracy, then discusses problems and adaptations." },
      { k: "detail", q: "According to the passage, who may vote at a town meeting?", a: "Any registered voter in the town", d: ["Only elected officials", "Anyone who owns property in town", "Only residents over the age of twenty-one"], e: "The first paragraph says “Any registered voter may attend, speak, and vote directly.”" },
      { k: "vocab", q: "As used in the third paragraph, the word “dedicated” most nearly means", a: "committed", d: ["assigned", "inscribed", "celebrated"], e: "A “small, dedicated group” is a group of people committed enough to keep attending." },
      { k: "inference", q: "Which statement can be inferred from the third paragraph?", a: "Low attendance may make decisions less representative of the whole town.", d: ["Most voters prefer weekend meetings.", "Absentee ballots have ended the town meeting tradition.", "Town meetings were more popular in cities than in small towns."], e: "If fewer than one in ten attend, a small group decides for everyone — so decisions may not reflect the whole town." },
      { k: "tone", q: "The author's attitude toward town meetings is best described as", a: "appreciative but realistic", d: ["openly hostile", "completely indifferent", "nostalgic and uncritical"], e: "The author praises the tradition (“purest form of democracy”) but also discusses its real problems." }
    ]
  },
  {
    id: "octopus", title: "The Clever Octopus", genre: "Science",
    text: `For a long time, scientists assumed that intelligence required a backbone. Mammals and birds solved puzzles; invertebrates simply reacted. The octopus has forced researchers to rethink that assumption.

In laboratories, octopuses have unscrewed jar lids to reach crabs inside, recognized individual human caretakers, and squirted water at people they seemed to dislike. In the wild, some carry coconut shells along the sea floor and later assemble them into portable shelters — a behavior that looks remarkably like tool use.

What makes these feats so surprising is how different the octopus brain is from our own. About two-thirds of an octopus's neurons are located not in its head but in its eight arms. Each arm can taste, touch, and even make simple decisions on its own, almost like a team of semi-independent workers reporting to a manager.

Because octopuses evolved separately from vertebrates for hundreds of millions of years, their intelligence appears to have developed along a completely different path. Studying them may help scientists understand which features of a mind are universal and which are simply accidents of our own history.`,
    qs: [
      { k: "main", q: "Which sentence best states the central idea of the passage?", a: "Octopuses show complex intelligence that developed very differently from ours.", d: ["Octopuses are the most dangerous animals in the sea.", "Only animals with backbones can use tools.", "Scientists have finally explained how the octopus brain works."], e: "Every paragraph supports the idea that octopuses are intelligent in a way that evolved separately from vertebrates." },
      { k: "detail", q: "Where are most of an octopus's neurons located?", a: "In its arms", d: ["In its head", "In its skin", "In its eyes"], e: "“About two-thirds of an octopus's neurons are located not in its head but in its eight arms.”" },
      { k: "purpose", q: "Why does the author compare the octopus's arms to “a team of semi-independent workers”?", a: "To explain how the arms can act partly on their own", d: ["To show that octopuses live in groups", "To argue that octopuses should be used for labor", "To suggest the arms are often in conflict"], e: "The comparison illustrates that each arm can sense and decide somewhat independently." },
      { k: "vocab", q: "In the first paragraph, “assumption” most nearly means", a: "a belief accepted without proof", d: ["a scientific law", "a laboratory test", "a careful measurement"], e: "Scientists “assumed” intelligence required a backbone — they believed it without proof." },
      { k: "inference", q: "Based on the last paragraph, why might studying octopuses be valuable?", a: "They can show which features of intelligence are shared across very different animals.", d: ["They can be trained to replace laboratory mice.", "They prove that humans evolved from invertebrates.", "They live longer than any other intelligent animal."], e: "The author says studying them may reveal “which features of a mind are universal.”" }
    ]
  },
  {
    id: "lantern", title: "The Lantern", genre: "Literary fiction",
    text: `Grandfather's lantern hung on a nail by the back door, its glass clouded and its handle wrapped in tape. Every evening during the summer I stayed with him, he lit it at dusk, though the house had electricity and the porch had a perfectly good light.

“Why the lantern?” I finally asked.

He turned the little brass key until the flame stood up straight. “When I was your age, we didn't have the other kind,” he said. “My mother lit this every night so my father could find his way home from the fields. After he passed, she kept lighting it anyway.”

I didn't understand then why anyone would light a lamp for someone who could not come home. I thought it was a waste of oil.

Years later, after Grandfather was gone, my mother handed me a box from his house. Inside, wrapped in a faded dish towel, was the lantern. That night, without quite knowing why, I set it on my windowsill and struck a match. The flame wobbled, steadied, and stood up straight.`,
    qs: [
      { k: "main", q: "What is this passage mostly about?", a: "How a family tradition gains meaning for the narrator over time", d: ["Why electricity replaced oil lamps", "How to repair an old lantern", "A disagreement between the narrator and Grandfather"], e: "The narrator first doesn't understand the lantern, then lights it after Grandfather dies — the tradition takes on meaning." },
      { k: "inference", q: "Why does the narrator light the lantern at the end?", a: "To honor and remember Grandfather", d: ["Because the electricity has gone out", "To guide a lost traveler home", "To test whether the lantern still works"], e: "Like Grandfather's mother, the narrator lights it for someone who cannot come home — a way of remembering." },
      { k: "detail", q: "Why did Grandfather's mother first light the lantern?", a: "So her husband could find his way home from the fields", d: ["Because she was afraid of the dark", "To signal neighbors in an emergency", "Because Grandfather asked her to"], e: "“My mother lit this every night so my father could find his way home from the fields.”" },
      { k: "structure", q: "The final sentence echoes an earlier moment in order to", a: "connect the narrator to Grandfather and the tradition", d: ["show that the lantern is broken", "suggest the narrator dislikes the lantern", "describe how lanterns are made"], e: "“Stood up straight” repeats the description of Grandfather's flame, linking narrator and grandfather." },
      { k: "tone", q: "The mood at the end of the passage is best described as", a: "quietly reflective", d: ["frightening", "humorous", "angry"], e: "The narrator lights the lantern “without quite knowing why” — a calm, thoughtful, emotional moment." }
    ]
  },
  {
    id: "silk-road", title: "More Than Silk", genre: "World history",
    text: `The name “Silk Road” suggests a single highway carrying fabric from China to Rome. In reality, it was a shifting web of routes that connected East Asia, Central Asia, the Middle East, and the Mediterranean for more than a thousand years. Few travelers made the entire journey. Instead, goods passed from merchant to merchant, changing hands in bustling oasis cities such as Samarkand.

Silk was certainly valuable, but it was only one item among many. Caravans carried spices, glass, horses, paper, and precious metals. Even more important, perhaps, were the things that could not be loaded onto a camel. Buddhism spread from India into China along these routes. Mathematical ideas, musical instruments, and new crops such as grapes and cotton moved from one culture to another.

Not everything that traveled was welcome. Historians believe that disease also followed the trade routes, including the plague that devastated Europe in the fourteenth century. The Silk Road reminds us that connection between distant peoples has always brought both great benefits and serious risks.`,
    qs: [
      { k: "main", q: "What is the main idea of the passage?", a: "The Silk Road was a network that exchanged goods, ideas, and even diseases among many cultures.", d: ["The Silk Road was a single paved highway from China to Rome.", "Silk was the only valuable product traded in the ancient world.", "Merchants usually traveled the entire Silk Road themselves."], e: "The passage corrects the “single highway” idea and describes the exchange of goods, ideas and diseases." },
      { k: "detail", q: "According to the passage, which of these spread from India into China along the routes?", a: "Buddhism", d: ["The plague", "Cotton", "Glass"], e: "“Buddhism spread from India into China along these routes.”" },
      { k: "vocab", q: "As used in the third paragraph, “devastated” most nearly means", a: "caused great destruction to", d: ["slightly inconvenienced", "carefully studied", "quickly cured"], e: "The plague “devastated Europe” — it caused enormous damage and death." },
      { k: "purpose", q: "Why does the author begin by mentioning what the name “Silk Road” suggests?", a: "To correct a common misunderstanding", d: ["To prove the name is accurate", "To explain how silk is made", "To compare China and Rome"], e: "The author says “In reality…” — the opening sets up a misconception to correct." },
      { k: "inference", q: "Which conclusion is best supported by the final paragraph?", a: "Increased contact between societies can have both positive and negative effects.", d: ["Trade should always be avoided.", "The plague began in Samarkand.", "Ancient travelers never got sick."], e: "The last sentence states that connection “brought both great benefits and serious risks.”" }
    ]
  },
  {
    id: "homework-editorial", title: "Rethinking Homework", genre: "Opinion",
    text: `Every night, millions of students sit at kitchen tables completing worksheets that will be checked for completion, not understanding. It is time to ask whether this ritual is actually helping them learn.

Research on homework is more mixed than many adults assume. For high school students, moderate amounts of homework are linked to higher achievement. For younger students, however, the benefits appear small, while the costs — lost sleep, family conflict, and less time for reading or play — are real.

None of this means homework should disappear. Practice matters, especially in subjects like math and languages. But practice works best when it is purposeful: a few carefully chosen problems that students can complete independently, followed by feedback they actually receive. Ten problems that build a skill are worth more than forty that simply fill an evening.

Schools should replace “more” with “better.” Teachers could coordinate so that students do not receive four major assignments on the same night, and every assignment should answer a simple question: what will a student learn by doing this? If no one can answer, the assignment should not be given.`,
    qs: [
      { k: "main", q: "What is the author's central claim?", a: "Homework should be fewer, better-designed assignments with a clear purpose.", d: ["All homework should be banned immediately.", "Students should receive more homework each night.", "Homework only matters in high school sports."], e: "The author says homework shouldn't disappear but should be “better,” not “more.”" },
      { k: "detail", q: "According to the passage, for which students is homework most clearly linked to higher achievement?", a: "High school students", d: ["Kindergarten students", "Elementary school students", "College professors"], e: "“For high school students, moderate amounts of homework are linked to higher achievement.”" },
      { k: "purpose", q: "Why does the author include the comparison between ten problems and forty problems?", a: "To illustrate that quality matters more than quantity", d: ["To show that math is the hardest subject", "To argue that students should do no math", "To explain how teachers grade homework"], e: "Ten useful problems are “worth more than forty that simply fill an evening” — quality over quantity." },
      { k: "vocab", q: "In the third paragraph, “purposeful” most nearly means", a: "having a clear goal", d: ["very long", "extremely difficult", "done in a group"], e: "Purposeful practice is designed with a clear aim — building a specific skill." },
      { k: "tone", q: "Which word best describes the author's tone?", a: "reasoned and persuasive", d: ["sarcastic and bitter", "fearful and anxious", "playful and silly"], e: "The author uses evidence and a measured argument to persuade — not sarcasm or humor." }
    ]
  },
  {
    id: "madam-walker", title: "A Self-Made Pioneer", genre: "Biography",
    text: `Sarah Breedlove was born in 1867 in Louisiana, the first child in her family born free after the end of slavery. Orphaned at seven and widowed by twenty, she worked for years as a laundress, earning about a dollar a day and struggling to support her young daughter.

In her thirties, Breedlove began losing her hair, a common problem caused in part by harsh soaps and poor nutrition. She experimented with remedies and eventually developed her own line of hair-care products for Black women. Taking the name Madam C. J. Walker, she sold her products door to door and trained other women as sales agents.

Her business grew rapidly. By the time of her death in 1919, her company employed thousands of agents, many of whom earned far more than they could have as maids or field workers. Walker used her wealth to fund scholarships, support the YMCA, and campaign against racial violence. She often told audiences that she had not been handed success: “I got my start by giving myself a start.”`,
    qs: [
      { k: "main", q: "Which choice best summarizes the passage?", a: "Madam C. J. Walker overcame hardship to build a successful business and help others.", d: ["Madam C. J. Walker invented modern soap.", "Laundresses in the 1800s earned high wages.", "Madam C. J. Walker refused to hire sales agents."], e: "The passage traces Walker from poverty to business success and philanthropy." },
      { k: "detail", q: "How did Walker first sell her products?", a: "Door to door", d: ["Only in department stores", "Through newspaper ads alone", "By mail to Europe"], e: "“She sold her products door to door and trained other women as sales agents.”" },
      { k: "inference", q: "What does the passage suggest about the women who worked as Walker's agents?", a: "The job offered them better economic opportunities.", d: ["Most of them disliked the work.", "They were required to live in Louisiana.", "They earned less than maids."], e: "Many agents “earned far more than they could have as maids or field workers.”" },
      { k: "vocab", q: "As used in the second paragraph, “remedies” most nearly means", a: "treatments", d: ["problems", "customers", "recipes for food"], e: "She experimented with remedies — possible treatments — for hair loss." },
      { k: "purpose", q: "The quotation at the end mainly serves to", a: "emphasize Walker's belief in her own initiative", d: ["show that Walker inherited her fortune", "criticize Walker's agents", "explain how hair products are made"], e: "“I got my start by giving myself a start” stresses that her success came from her own effort." }
    ]
  },
  {
    id: "urban-heat", title: "Cities That Bake", genre: "Science",
    text: `On a summer afternoon, a downtown street can be ten degrees hotter than a park just a few miles away. Scientists call this the urban heat island effect. Dark asphalt and rooftops absorb sunlight during the day and release it slowly at night, while concrete buildings trap warm air between them. Air conditioners add to the problem by pumping heat outdoors.

The effect is more than uncomfortable. Extreme heat kills more Americans each year than hurricanes or floods, and the danger is greatest in neighborhoods with few trees. These are often lower-income areas, where residents may not be able to afford air conditioning.

Cities are fighting back with surprisingly simple tools. Painting roofs white reflects sunlight instead of absorbing it. Planting trees provides shade and cools the air as leaves release water vapor. Some cities have replaced parking lots with small parks, and others offer residents free trees to plant in their yards. None of these solutions is expensive on its own, but together they can lower neighborhood temperatures by several degrees — enough to save lives during a heat wave.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "Why cities get hotter than surrounding areas and how they can cool down", d: ["How hurricanes form over the ocean", "Why air conditioners are the best solution to heat", "The history of asphalt roads"], e: "The passage explains the heat island effect, its dangers, and simple solutions." },
      { k: "detail", q: "According to the passage, how do trees cool the air?", a: "By providing shade and releasing water vapor", d: ["By absorbing heat at night", "By reflecting sunlight off white leaves", "By blocking air conditioners"], e: "“Planting trees provides shade and cools the air as leaves release water vapor.”" },
      { k: "inference", q: "Why might the heat island effect be especially dangerous in lower-income neighborhoods?", a: "They often have fewer trees and less access to air conditioning.", d: ["They have more white roofs.", "They are always located near the ocean.", "They have more parks than other neighborhoods."], e: "The second paragraph links few trees and unaffordable air conditioning to lower-income areas." },
      { k: "vocab", q: "In the first paragraph, “absorb” most nearly means", a: "take in", d: ["give off", "reflect", "measure"], e: "Asphalt and rooftops “absorb sunlight” — they take in its energy." },
      { k: "tone", q: "The author's attitude toward the solutions described is best described as", a: "hopeful", d: ["dismissive", "confused", "fearful"], e: "The author calls the solutions simple and says together they can “save lives.”" }
    ]
  },
  {
    id: "poem-tide", title: "Low Tide", genre: "Poetry",
    text: `The sea goes out like a held breath, leaving
a ribbon of wet sand that shines like glass.
Crabs stitch their sideways letters on the shore;
a gull reads them aloud, then lets them pass.

My father walks ahead, his trousers rolled,
collecting shells he'll never take back home.
He sets each one on a rock for someone else —
a small museum no one asked him for.

“The tide will take them,” I tell him. He just smiles.
“Then let it have them. That's the deal,” he says.
And I see what he means only when, hours later,
the water comes back in and the rocks are bare.`,
    qs: [
      { k: "main", q: "What is the poem mostly about?", a: "A father who enjoys small acts of beauty even though they will not last", d: ["A dangerous storm at sea", "How to identify different kinds of shells", "A child who is afraid of the ocean"], e: "The father arranges shells knowing the tide will take them — accepting that beauty is temporary." },
      { k: "vocab", q: "In line 3, the crabs “stitch their sideways letters” is an example of", a: "figurative language comparing crab tracks to writing", d: ["a literal description of sewing", "a rhyme scheme", "dialogue"], e: "The tracks are compared to stitched letters — a metaphor." },
      { k: "inference", q: "What does the father mean by “That's the deal”?", a: "Losing the shells is an accepted part of enjoying them.", d: ["He made a bet with the speaker.", "He plans to sell the shells.", "He wants the speaker to collect more shells."], e: "He accepts that the tide will take them — impermanence is part of the arrangement." },
      { k: "structure", q: "What happens in the last two lines?", a: "The speaker comes to understand the father's point.", d: ["The father becomes angry.", "The speaker finds a rare shell.", "The tide never returns."], e: "“I see what he means only when … the rocks are bare.”" },
      { k: "tone", q: "The tone of the poem is best described as", a: "gentle and thoughtful", d: ["harsh and critical", "excited and loud", "fearful and tense"], e: "Soft imagery and the quiet realization create a gentle, reflective tone." }
    ]
  },
  {
    id: "electoral-compromise", title: "Counting People", genre: "U.S. history",
    text: `When delegates met in Philadelphia in 1787 to write the Constitution, one question nearly broke the convention apart: how should states be represented in Congress? Large states such as Virginia wanted representation based on population, which would give them more power. Small states such as New Jersey feared being overwhelmed and wanted every state to have an equal vote.

The solution, proposed by delegates from Connecticut, created two houses. In the House of Representatives, seats would be divided according to population. In the Senate, every state would have two senators regardless of size. Neither side got everything it wanted, but both got enough to keep the new nation together.

The Great Compromise, as it came to be called, still shapes American politics. A senator from Wyoming, the least populous state, has the same vote as a senator from California, which has more than sixty times as many people. Some argue this protects smaller states from being ignored; others argue it gives some citizens far more influence than others. The debate the Founders began has never fully ended.`,
    qs: [
      { k: "main", q: "What is the main purpose of the passage?", a: "To explain how the Great Compromise resolved a conflict over representation and still matters today", d: ["To argue that the Senate should be abolished", "To describe the geography of Wyoming", "To list every delegate at the Constitutional Convention"], e: "The passage explains the large-state/small-state conflict, the compromise, and its lasting effects." },
      { k: "detail", q: "Under the Great Compromise, how are seats in the House of Representatives divided?", a: "According to each state's population", d: ["Equally, two per state", "By the size of each state's land area", "By a lottery every ten years"], e: "“In the House of Representatives, seats would be divided according to population.”" },
      { k: "inference", q: "Why did small states want an equal vote for every state?", a: "They worried large states would control decisions.", d: ["They had larger populations than big states.", "They wanted to eliminate the Senate.", "They hoped to move the capital to New Jersey."], e: "Small states “feared being overwhelmed” by states with more people." },
      { k: "vocab", q: "As used in the third paragraph, “influence” most nearly means", a: "power to affect decisions", d: ["illness", "money", "location"], e: "Some citizens have more “influence” — more power over decisions — through their senators." },
      { k: "structure", q: "How does the final paragraph relate to the first two?", a: "It connects a historical decision to a present-day debate.", d: ["It contradicts everything stated earlier.", "It tells a story about a single delegate.", "It introduces a new historical event unrelated to the compromise."], e: "The last paragraph shows the compromise “still shapes American politics” and is still debated." }
    ]
  },
  {
    id: "bees", title: "The Language of Bees", genre: "Science",
    text: `When a honeybee discovers a rich patch of flowers, it returns to the hive and performs what scientists call the waggle dance. Moving in a figure-eight pattern, the bee shakes its body during the straight middle section of the dance. The direction of that straight run tells the other bees which way to fly, measured as an angle from the sun. The length of the waggle tells them how far away the flowers are.

The Austrian scientist Karl von Frisch decoded the dance in the 1940s, and many of his colleagues were skeptical. How could an insect with a brain smaller than a sesame seed communicate abstract information about distance and direction? Von Frisch tested his ideas through careful experiments, moving food sources and watching how bees responded. In 1973 he shared the Nobel Prize for his work.

The waggle dance remains one of the most sophisticated forms of communication known in the animal world. It reminds us that intelligence comes in many forms — and that some of the most remarkable conversations on Earth happen in complete darkness, inside a crowded hive.`,
    qs: [
      { k: "main", q: "What is the central idea of the passage?", a: "Honeybees use a complex dance to share information about food sources.", d: ["Bees prefer flowers that are close to the hive.", "Karl von Frisch disliked insects.", "Bees communicate mainly through sound."], e: "The passage explains the waggle dance and how it communicates direction and distance." },
      { k: "detail", q: "What does the length of the waggle communicate?", a: "How far away the flowers are", d: ["Which direction to fly", "What color the flowers are", "How many bees should go"], e: "“The length of the waggle tells them how far away the flowers are.”" },
      { k: "vocab", q: "As used in the second paragraph, “skeptical” most nearly means", a: "doubtful", d: ["excited", "jealous", "careless"], e: "Colleagues doubted that a tiny insect could share abstract information." },
      { k: "inference", q: "Why does the author mention that the bee's brain is “smaller than a sesame seed”?", a: "To show why scientists were surprised by the bees' abilities", d: ["To prove that bees are not intelligent", "To describe what bees eat", "To compare bees with sesame plants"], e: "The tiny brain made complex communication seem unlikely — hence the skepticism." },
      { k: "tone", q: "The author's tone in the final paragraph is best described as", a: "admiring", d: ["critical", "bored", "sarcastic"], e: "The author calls the dance “sophisticated” and the conversations “remarkable.”" }
    ]
  },
  {
    id: "first-day", title: "New Kid", genre: "Literary fiction",
    text: `Priya counted the steps from the bus to the front doors: forty-two. Counting helped. It gave her something to do besides notice that everyone else seemed to be walking in pairs or clusters, laughing at jokes she would never understand.

Inside, the hallway smelled like floor wax and someone's burnt toast. She found her locker, spun the combination three times, and failed three times. The bell rang. The hallway emptied around her like water draining from a tub.

“It sticks,” said a voice. A boy in a paint-spattered sweatshirt leaned past her, thumped the locker just above the dial, and pulled. It swung open. “Every locker on this hall does that. Nobody tells you.”

“Thanks,” Priya said, and then, because he was still standing there, “Do you know where room 214 is?”

He grinned. “I'm late for room 214.”

They walked together. Priya stopped counting her steps.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "A nervous new student who finds a small moment of connection", d: ["A student who is punished for being late", "How to fix a broken locker", "A boy who dislikes art class"], e: "Priya feels isolated, then a classmate helps her — a small connection." },
      { k: "inference", q: "Why does Priya count her steps at the beginning?", a: "To calm her nerves in an unfamiliar place", d: ["Because her teacher assigned it", "To measure the length of the school", "Because she is lost"], e: "“Counting helped. It gave her something to do besides notice…” — a coping strategy for anxiety." },
      { k: "structure", q: "What does the final sentence suggest?", a: "Priya feels more at ease.", d: ["Priya has forgotten how to count.", "Priya is angry with the boy.", "Priya is going home early."], e: "She no longer needs her coping habit — she feels calmer." },
      { k: "vocab", q: "The comparison “emptied around her like water draining from a tub” mainly emphasizes", a: "how quickly Priya was left alone", d: ["how dirty the hallway was", "how loud the bell was", "how much water was on the floor"], e: "The simile shows the hallway clearing fast, leaving her alone." },
      { k: "detail", q: "How does the boy open the locker?", a: "He thumps it just above the dial and pulls.", d: ["He uses a key.", "He spins the dial four times.", "He asks a teacher for help."], e: "He “thumped the locker just above the dial, and pulled.”" }
    ]
  },
  {
    id: "microloans", title: "Small Loans, Big Changes", genre: "Economics",
    text: `In the 1970s, an economics professor in Bangladesh named Muhammad Yunus met a group of women who made bamboo stools. Because they had no money to buy bamboo, they borrowed from lenders who charged such high interest that the women earned almost nothing. Yunus lent forty-two women a total of about twenty-seven dollars from his own pocket. They repaid him in full.

That experiment grew into the Grameen Bank, which offers small loans — called microloans — to people too poor to qualify for traditional bank loans. Borrowers, most of them women, use the money to buy a cow, a sewing machine, or supplies for a small shop. Instead of requiring property as security, the bank relies on borrowers forming small groups that support one another and encourage repayment.

Microfinance has since spread to dozens of countries, and Yunus received the Nobel Peace Prize in 2006. Researchers still debate how much microloans reduce poverty overall; some studies find modest benefits rather than dramatic transformations. Still, the idea that poor borrowers can be trustworthy and creative entrepreneurs has changed how many people think about fighting poverty.`,
    qs: [
      { k: "main", q: "Which statement best expresses the main idea?", a: "Microloans offered a new way to help poor people start businesses, though their overall impact is debated.", d: ["Banks should never lend money to poor people.", "Muhammad Yunus made bamboo stools.", "Microloans have completely ended poverty worldwide."], e: "The passage describes the origin and spread of microloans, then notes debate over their impact." },
      { k: "detail", q: "Instead of property, what does the Grameen Bank rely on to encourage repayment?", a: "Small groups of borrowers who support one another", d: ["High interest rates", "Government police", "Gold deposits"], e: "“The bank relies on borrowers forming small groups that support one another.”" },
      { k: "vocab", q: "As used in the third paragraph, “modest” most nearly means", a: "moderate; not large", d: ["shy", "humble in manner", "dishonest"], e: "“Modest benefits rather than dramatic transformations” — moderate, small benefits." },
      { k: "inference", q: "What can be inferred from the fact that the first borrowers repaid Yunus in full?", a: "Poor borrowers could be reliable when given fair terms.", d: ["Yunus charged extremely high interest.", "The women were secretly wealthy.", "Bamboo stools were very expensive to make."], e: "Full repayment suggested poor borrowers were trustworthy — the idea behind microfinance." },
      { k: "tone", q: "How does the author present microfinance?", a: "Positively, while acknowledging its limits", d: ["As a complete failure", "As a dangerous scam", "Without any opinion or evaluation at all"], e: "The author praises the idea but notes studies finding “modest benefits.”" }
    ]
  }
];
