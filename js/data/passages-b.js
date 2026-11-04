// Reading comprehension passages (original), part B.
export const PASSAGES_B = [
  {
    id: "un-languages", title: "Speaking for the World", genre: "International studies",
    text: `At the United Nations, a delegate from Brazil may speak in English, a delegate from Egypt in Arabic, and a delegate from China in Mandarin — and every person in the room understands each speech almost instantly. This is the work of simultaneous interpreters, who listen through headphones and translate aloud only a few seconds behind the speaker.

The job is mentally exhausting. Interpreters must understand a sentence, convert it into another language, and speak it, all while continuing to listen to what comes next. For this reason, they usually work in pairs and switch every thirty minutes. Even a small error can matter: a mistranslated word in a negotiation could cause confusion or offense between nations.

The UN has six official languages: Arabic, Chinese, English, French, Russian, and Spanish. Critics point out that many of the world's most widely spoken languages, such as Hindi and Bengali, are not on the list. Supporters respond that adding languages would be costly and slow. The debate reflects a larger question the UN has faced since its founding: how can an organization of nearly two hundred countries treat all of them fairly?`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "How the United Nations handles many languages and the challenges involved", d: ["How to become fluent in six languages", "Why Brazil joined the United Nations", "The history of the Chinese language"], e: "The passage covers interpreters, the six official languages, and fairness debates." },
      { k: "detail", q: "Why do simultaneous interpreters usually work in pairs?", a: "Because the work is mentally exhausting", d: ["Because each interpreter knows only one language", "Because the UN requires two votes", "Because headphones break frequently"], e: "“The job is mentally exhausting… For this reason, they usually work in pairs.”" },
      { k: "inference", q: "Why might critics want Hindi to be an official UN language?", a: "It is spoken by a very large number of people.", d: ["It is the oldest language in the world.", "It is easier to interpret than Arabic.", "The UN headquarters is in India."], e: "Critics note “many of the world's most widely spoken languages … are not on the list.”" },
      { k: "vocab", q: "As used in the first paragraph, “simultaneous” most nearly means", a: "happening at the same time", d: ["written down", "delayed by an hour", "carefully rehearsed"], e: "Simultaneous interpreters translate while the speaker is still talking." },
      { k: "purpose", q: "Why does the author mention a “mistranslated word in a negotiation”?", a: "To show why accuracy in interpreting is important", d: ["To criticize a specific interpreter", "To argue that negotiations should be cancelled", "To explain how to learn French"], e: "It illustrates the stakes — small errors can cause confusion between nations." }
    ]
  },
  {
    id: "wolves", title: "When the Wolves Returned", genre: "Environment",
    text: `By the 1920s, gray wolves had been hunted out of Yellowstone National Park. Without wolves, elk populations grew large and comfortable. They grazed heavily along rivers, eating young willow and aspen trees before the trees could grow tall.

In 1995, scientists reintroduced wolves to the park. What followed is often described as a trophic cascade — a chain reaction that spreads through an ecosystem. With predators around, elk moved more and lingered less in open river valleys. Willows and aspens began to recover in some areas. Beavers, which depend on willows, returned to streams. Their dams created ponds that sheltered fish and birds.

Recent research suggests the story is more complicated than the popular version. Weather, human hunting outside the park, and growing bear populations also affected elk, and some streams have changed very little. Still, the return of the wolves showed how a single species can influence an entire landscape — and how difficult it can be to undo damage once a piece of an ecosystem is removed.`,
    qs: [
      { k: "main", q: "What is the main idea of the passage?", a: "Bringing wolves back to Yellowstone affected the ecosystem in many ways, though not as simply as often claimed.", d: ["Wolves should be removed from all national parks.", "Elk are the most important animals in Yellowstone.", "Beavers caused the wolves to return."], e: "The passage describes the chain reaction and then notes the story is “more complicated.”" },
      { k: "vocab", q: "Based on the passage, a “trophic cascade” is", a: "a chain reaction that spreads through an ecosystem", d: ["a type of waterfall", "a method of hunting elk", "a disease affecting trees"], e: "The author defines it directly: “a chain reaction that spreads through an ecosystem.”" },
      { k: "detail", q: "Why did beavers return to the streams?", a: "Willows, which beavers depend on, began to recover.", d: ["Scientists released beavers in 1995.", "Wolves stopped eating beavers.", "Bears built dams for them."], e: "“Beavers, which depend on willows, returned to streams.”" },
      { k: "inference", q: "Why does the author include the third paragraph?", a: "To give a more balanced and accurate picture of the evidence", d: ["To prove the wolves had no effect", "To argue that bears are dangerous", "To describe a different national park"], e: "It adds other factors and limits, correcting an oversimplified version." },
      { k: "tone", q: "The author's approach to the topic is best described as", a: "informative and careful", d: ["angry and accusing", "humorous and light", "uncertain and confused"], e: "The author explains clearly and qualifies claims with newer research." }
    ]
  },
  {
    id: "printing-press", title: "A Machine That Changed Minds", genre: "World history",
    text: `Before about 1450, books in Europe were copied by hand. A single Bible could take a scribe more than a year to produce, so books were rare and expensive, owned mostly by churches, universities, and the wealthy.

Johannes Gutenberg's printing press changed that. By combining movable metal type, oil-based ink, and a press adapted from those used to make wine, Gutenberg could produce pages far faster than any scribe. Within fifty years, printing shops had spread to more than two hundred European cities, and millions of books were in circulation.

The consequences reached far beyond books. Ideas could now spread quickly and widely, and in identical form. Scientists could share and check one another's findings. Religious reformers such as Martin Luther used pamphlets to reach ordinary people, sparking debates that divided Europe. Rulers sometimes tried to ban printed works they considered dangerous, but once ideas were in print, they were difficult to contain. In this way, a machine built to make books helped reshape religion, science, and politics.`,
    qs: [
      { k: "main", q: "Which choice best states the central idea?", a: "The printing press made books common and allowed ideas to spread rapidly, transforming European society.", d: ["Gutenberg invented the first wine press.", "Scribes were more accurate than printing presses.", "Books before 1450 were cheap and plentiful."], e: "The passage moves from rare handmade books to the wide social effects of printing." },
      { k: "detail", q: "Which of these was part of Gutenberg's invention, according to the passage?", a: "Movable metal type", d: ["Electric power", "Paper made from plastic", "A team of hundreds of scribes"], e: "“By combining movable metal type, oil-based ink, and a press…”" },
      { k: "vocab", q: "As used in the third paragraph, “contain” most nearly means", a: "keep under control", d: ["hold inside a box", "include as a part", "measure accurately"], e: "Once printed, ideas were “difficult to contain” — hard to control or stop." },
      { k: "inference", q: "Why did rulers sometimes try to ban printed works?", a: "They feared ideas that might challenge their authority.", d: ["Printed books were too heavy.", "They wanted to protect scribes' jobs only.", "Printing ink was poisonous."], e: "They banned works “they considered dangerous” — ideas threatening their power." },
      { k: "structure", q: "How is the passage organized?", a: "It describes a situation before an invention, the invention itself, and then its effects.", d: ["It compares two inventors point by point.", "It tells a story in reverse order.", "It lists problems and offers no solutions."], e: "Paragraph 1: before; Paragraph 2: the press; Paragraph 3: consequences." }
    ]
  },
  {
    id: "screens-sleep", title: "Phones After Dark", genre: "Health",
    text: `Many teenagers fall asleep with a phone in hand, scrolling until their eyes close. Sleep scientists warn that this habit may be costing them more than a few minutes of rest.

Screens emit blue light, which can signal the brain that it is still daytime and delay the release of melatonin, a hormone that helps us feel sleepy. But light is only part of the problem. A video, a game, or a group chat is designed to hold attention, and the emotional energy of a heated conversation can keep the mind racing long after the screen goes dark. Notifications during the night interrupt sleep further.

Teenagers already face a biological challenge: during adolescence, the body's internal clock shifts later, making it naturally harder to fall asleep early. Combine that shift with early school start times and late-night screen use, and many students end up chronically sleep-deprived. The effects include weaker memory, lower mood, and slower reaction times.

The solution need not be dramatic. Experts suggest charging phones outside the bedroom, setting a “screens off” time an hour before bed, and keeping a consistent sleep schedule, even on weekends.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "How nighttime screen use can harm teenagers' sleep and what can help", d: ["Why teenagers should not own phones", "How melatonin is manufactured", "The benefits of video games for memory"], e: "The passage explains the causes of the problem and suggests simple solutions." },
      { k: "detail", q: "What is melatonin, according to the passage?", a: "A hormone that helps us feel sleepy", d: ["A type of blue light", "A sleep disorder", "An app that tracks sleep"], e: "“melatonin, a hormone that helps us feel sleepy.”" },
      { k: "inference", q: "Why does the author say “light is only part of the problem”?", a: "Engaging content and notifications also disrupt sleep.", d: ["Blue light has no effect at all.", "Teenagers prefer reading paper books.", "Phones get too hot at night."], e: "The author then explains attention-grabbing content and notifications." },
      { k: "vocab", q: "As used in the third paragraph, “chronically” most nearly means", a: "constantly over a long period", d: ["briefly", "occasionally", "fortunately"], e: "Chronically sleep-deprived means short on sleep over a long time." },
      { k: "purpose", q: "What is the purpose of the final paragraph?", a: "To offer practical advice", d: ["To introduce a new problem", "To tell a personal story", "To criticize sleep scientists"], e: "It lists specific, simple solutions." }
    ]
  },
  {
    id: "kintsugi", title: "Golden Repair", genre: "Arts & culture",
    text: `In Japan, there is a centuries-old art called kintsugi, which means “golden joinery.” When a ceramic bowl breaks, a kintsugi artist does not try to hide the damage. Instead, the pieces are rejoined with lacquer mixed with powdered gold, so that the cracks become shining lines running across the surface.

The result is a bowl that is visibly broken and visibly repaired. Its history is not erased; it is highlighted. Collectors sometimes value a kintsugi piece more than an undamaged one, because each pattern of golden seams is unique.

Many people see in kintsugi a philosophy that reaches beyond pottery. It suggests that damage and repair are part of an object's story rather than something to be ashamed of. Some writers have applied the idea to people, arguing that the difficulties we survive can become part of what makes us strong and distinctive. Whether or not one accepts that comparison, kintsugi offers an unusual way of looking at imperfection — not as an ending, but as a beginning.`,
    qs: [
      { k: "main", q: "What is the central idea of the passage?", a: "Kintsugi repairs broken pottery in a way that celebrates its history, an idea some apply to life.", d: ["Kintsugi is a method for making pottery unbreakable.", "Gold is the most valuable metal in Japan.", "Collectors only buy undamaged bowls."], e: "The passage explains the technique and its broader philosophy about imperfection." },
      { k: "detail", q: "What do kintsugi artists mix with lacquer?", a: "Powdered gold", d: ["Clay", "Glass", "Sand"], e: "“rejoined with lacquer mixed with powdered gold.”" },
      { k: "inference", q: "Why might a collector value a kintsugi bowl more than an undamaged one?", a: "Its repair makes it unique and gives it a visible history.", d: ["It is always older than other bowls.", "It is cheaper to buy.", "It cannot break again."], e: "“Each pattern of golden seams is unique” and its history is highlighted." },
      { k: "vocab", q: "As used in the third paragraph, “distinctive” most nearly means", a: "unique and recognizable", d: ["broken", "ordinary", "difficult"], e: "Difficulties can make people “strong and distinctive” — set apart, unique." },
      { k: "tone", q: "The author's attitude toward kintsugi is best described as", a: "respectful and thoughtful", d: ["mocking", "angry", "uninterested"], e: "The author explains it with appreciation and reflects on its meaning." }
    ]
  },
  {
    id: "ai-art", title: "Who Is the Artist?", genre: "Opinion",
    text: `Computer programs can now generate a painting in seconds from a short written description. Type “a lighthouse in a thunderstorm, painted like Van Gogh,” and a striking image appears. This ability has delighted some people and alarmed others, especially working artists.

Critics raise serious concerns. Many image generators were trained on millions of artworks collected from the internet, often without the artists' permission or payment. When a program imitates a living illustrator's recognizable style, that illustrator may lose commissions to a machine that learned from her own work.

Defenders reply that artists have always learned by studying others, and that new tools — from the camera to photo-editing software — have repeatedly been accused of destroying art before becoming accepted parts of it.

Both sides make fair points, but the comparison to earlier tools is incomplete. A camera does not need thousands of photographers' work fed into it without consent. A fair solution should allow creative tools to develop while ensuring that artists can choose whether their work is used — and are paid when it is.`,
    qs: [
      { k: "main", q: "What is the author's main argument?", a: "AI art tools should develop in ways that respect artists' consent and payment.", d: ["AI art tools should be banned completely.", "Artists have never learned from other artists.", "Cameras destroyed the art of painting."], e: "The last paragraph states the author's position: develop tools while protecting artists' choice and pay." },
      { k: "detail", q: "According to critics, how were many image generators trained?", a: "On artworks collected online, often without permission", d: ["Only on public-domain paintings", "By hiring thousands of artists", "Using photographs taken by the programmers"], e: "“trained on millions of artworks collected from the internet, often without the artists' permission or payment.”" },
      { k: "structure", q: "What is the function of the third paragraph?", a: "It presents the opposing viewpoint.", d: ["It gives the author's final conclusion.", "It tells a personal story.", "It defines a technical term."], e: "It begins “Defenders reply…” — the counterargument." },
      { k: "inference", q: "Why does the author say the comparison to the camera is “incomplete”?", a: "Cameras did not depend on using other artists' work without consent.", d: ["Cameras were invented after computers.", "Cameras cannot take pictures of lighthouses.", "Photography is not considered art."], e: "“A camera does not need thousands of photographers' work fed into it without consent.”" },
      { k: "tone", q: "The author's tone is best described as", a: "balanced but firm", d: ["excited and uncritical", "angry and insulting", "confused and uncertain"], e: "The author acknowledges both sides (“Both sides make fair points”) but takes a clear position." }
    ]
  },
  {
    id: "storm", title: "The Storm Cellar", genre: "Literary fiction",
    text: `The sky turned the color of a bruise just after supper. Mama looked out the kitchen window once, set down the dish towel, and said, “Cellar. Now.” She did not raise her voice. She never did when it mattered.

We filed down the wooden steps with a flashlight, two jugs of water, and the radio. My little brother, Eli, clutched his stuffed rabbit so hard its ears bent. Above us, the wind began as a whistle and grew into a freight train that never passed.

I wanted to cry, but Eli was watching me, so instead I told him the story of the rabbit who outran a fox by zigzagging through a cornfield. I made the fox ridiculous. I gave him a squeaky voice and a habit of tripping over his own tail. By the time the rabbit reached its burrow, Eli was giggling, and I had almost forgotten to be afraid.

When we climbed out an hour later, the barn roof lay in the pasture. The house stood. Mama counted us twice, the way she counted eggs, and then she let out a long breath.`,
    qs: [
      { k: "main", q: "What is the passage mostly about?", a: "A family sheltering from a storm while the narrator comforts a younger brother", d: ["A farmer repairing a barn roof", "A fox hunting rabbits in a cornfield", "A family moving to a new house"], e: "The family shelters in the cellar, and the narrator calms Eli with a story." },
      { k: "inference", q: "Why does the narrator tell Eli a funny story?", a: "To distract him — and herself — from fear", d: ["Because Mama asked for a story", "To teach Eli about foxes", "Because the radio was broken"], e: "Eli was watching, so the narrator hid her fear; by the end she “had almost forgotten to be afraid.”" },
      { k: "vocab", q: "The phrase “a freight train that never passed” describes", a: "the loud, continuous sound of the wind", d: ["a real train near the farm", "Eli's crying", "the radio broadcast"], e: "It's a metaphor for the roaring, unending wind." },
      { k: "inference", q: "What does Mama's calm voice in the first paragraph suggest about her?", a: "She stays steady in emergencies.", d: ["She did not notice the storm.", "She is angry with the children.", "She is usually very loud."], e: "“She did not raise her voice. She never did when it mattered.”" },
      { k: "tone", q: "The final paragraph creates a feeling of", a: "relief", d: ["humor", "suspense", "disappointment"], e: "The house stood, everyone was counted, and Mama “let out a long breath.”" }
    ]
  },
  {
    id: "voting-age", title: "Should Sixteen-Year-Olds Vote?", genre: "Civics",
    text: `In 1971, the Twenty-Sixth Amendment lowered the national voting age from twenty-one to eighteen. Supporters had argued that if eighteen-year-olds could be drafted to fight in a war, they deserved a voice in choosing the leaders who sent them. Today, some activists argue that the age should be lowered again, to sixteen.

They point out that sixteen-year-olds can work, pay taxes on their wages, and drive in most states. Research on voting habits suggests that people who vote in the first election they are eligible for are more likely to keep voting for life — and sixteen-year-olds, still living at home and studying government in school, may be better positioned to form that habit than eighteen-year-olds who have just moved away.

Opponents argue that most sixteen-year-olds are not yet mature enough to weigh complex policy questions, and that they could be unduly influenced by parents or teachers. A few cities, such as Takoma Park, Maryland, already allow sixteen-year-olds to vote in local elections, offering a small test case. Early results show turnout among young voters there higher than among older first-time voters, though the sample is small.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "Arguments for and against lowering the voting age to sixteen", d: ["The history of the military draft", "How to register to vote in Maryland", "Why the voting age should be raised to twenty-one"], e: "After a brief history, the passage presents both sides of the debate." },
      { k: "detail", q: "What did the Twenty-Sixth Amendment do?", a: "Lowered the national voting age to eighteen", d: ["Lowered the voting age to sixteen", "Created the military draft", "Allowed cities to set their own voting ages"], e: "“the Twenty-Sixth Amendment lowered the national voting age from twenty-one to eighteen.”" },
      { k: "inference", q: "Why might sixteen-year-olds be better positioned to start a voting habit than eighteen-year-olds?", a: "They are often still at home and studying government in school.", d: ["They have more money.", "They are required to vote by law.", "They usually live in Takoma Park."], e: "The passage says they are “still living at home and studying government in school.”" },
      { k: "vocab", q: "As used in the third paragraph, “unduly” most nearly means", a: "excessively", d: ["legally", "secretly", "rarely"], e: "“Unduly influenced” means influenced too much." },
      { k: "purpose", q: "Why does the author mention Takoma Park, Maryland?", a: "To provide a real example where the idea has been tried", d: ["To show where the Twenty-Sixth Amendment was written", "To argue that cities should not hold elections", "To describe the author's hometown"], e: "It offers “a small test case” of sixteen-year-olds voting." }
    ]
  },
  {
    id: "volcano-island", title: "An Island Is Born", genre: "Science",
    text: `In November 1963, fishermen off the southern coast of Iceland noticed dark smoke rising from the sea. An underwater volcano was erupting, and within days a new island had broken the surface. Scientists named it Surtsey, after a fire giant from Norse mythology.

Iceland's government made an unusual decision: Surtsey would be protected for science. Only a few researchers would be allowed to visit, and they had to be careful not to bring seeds or insects on their clothes. The island became a natural laboratory where scientists could watch life arrive on completely bare land.

The first plant was found in 1965, probably carried by the sea. Birds soon followed, and their droppings enriched the volcanic soil. Insects arrived on the wind and on driftwood. Over the decades, more than sixty species of plants have taken root. Yet Surtsey is also shrinking, worn away by waves. Scientists expect that most of the island will eventually disappear beneath the sea — which makes every year of observation more valuable.`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "A volcanic island that scientists have protected to study how life arrives on new land", d: ["The mythology of Norse fire giants", "How to prevent volcanic eruptions", "The history of fishing in Iceland"], e: "The passage covers Surtsey's formation, protection, and how life has colonized it." },
      { k: "detail", q: "Why did researchers have to be careful about their clothes?", a: "So they would not bring seeds or insects to the island", d: ["Because the island was very cold", "Because volcanic ash ruined fabric", "Because fishermen required uniforms"], e: "“They had to be careful not to bring seeds or insects on their clothes.”" },
      { k: "inference", q: "Why did scientists want to keep visitors to a minimum?", a: "To observe how life arrives naturally, without human help", d: ["To keep the island secret from other countries", "To protect visitors from the fire giant", "To save money on boats"], e: "It was a “natural laboratory” for watching life arrive on bare land." },
      { k: "vocab", q: "As used in the third paragraph, “enriched” most nearly means", a: "made more fertile", d: ["made wealthier", "made colder", "made heavier"], e: "Bird droppings added nutrients — enriching the soil for plants." },
      { k: "purpose", q: "Why does the author mention that Surtsey is shrinking?", a: "To explain why continued observation is especially valuable", d: ["To argue that the island should be rebuilt", "To prove that the volcano is still erupting", "To criticize Iceland's government"], e: "“Which makes every year of observation more valuable.”" }
    ]
  },
  {
    id: "letter-graduate", title: "A Letter to a Young Student", genre: "Personal essay",
    text: `You will hear a great deal of advice this year, most of it well meant and some of it contradictory. Let me add one piece, and then I will get out of your way: learn to be bad at something.

I do not mean careless. I mean willing to be a beginner. When I was fourteen, I quit the guitar after three weeks because my fingers hurt and the chords sounded like a cat on a fence. I told myself I had no talent. What I actually had was no patience with my own clumsiness.

The students I have seen grow the most are not always the ones who start out strongest. They are the ones who can tolerate the uncomfortable middle — the long stretch between starting something and being good at it. They ask questions that reveal what they do not know. They rewrite the essay. They miss the shot and take it again.

So take the class that frightens you. Join the team you might not make. Let yourself be clumsy in public. Being bad at something is not the opposite of excellence. It is usually the first step toward it.`,
    qs: [
      { k: "main", q: "What is the author's main message?", a: "Being willing to struggle as a beginner is necessary for growth.", d: ["Only naturally talented people succeed.", "Students should avoid difficult classes.", "Guitar is harder than other instruments."], e: "The author urges readers to tolerate being bad at something as the first step to excellence." },
      { k: "purpose", q: "Why does the author describe quitting the guitar?", a: "To give a personal example of lacking patience with being a beginner", d: ["To recommend a particular guitar teacher", "To prove that the author has no talent", "To explain how chords are formed"], e: "The author admits the real problem was “no patience with my own clumsiness.”" },
      { k: "vocab", q: "As used in the third paragraph, “tolerate” most nearly means", a: "put up with", d: ["avoid", "enjoy completely", "measure"], e: "To tolerate the uncomfortable middle is to endure it." },
      { k: "inference", q: "Based on the passage, what would the author likely say to a student afraid of failing a tryout?", a: "Try out anyway; the attempt itself helps you grow.", d: ["Only try out if you are sure to make the team.", "Wait until you are an expert.", "Choose an activity that comes easily."], e: "“Join the team you might not make.”" },
      { k: "tone", q: "The tone of the letter is best described as", a: "warm and encouraging", d: ["cold and formal", "bitter and regretful", "sarcastic"], e: "The author offers kind, motivating advice." }
    ]
  },
  {
    id: "water-rights", title: "Sharing a River", genre: "International studies",
    text: `The Nile River flows through eleven countries before reaching the Mediterranean Sea. For thousands of years, Egypt has depended on it almost completely; nearly all of Egypt's population lives within a few miles of its banks. So when Ethiopia began building a massive hydroelectric dam on the Blue Nile, the river's largest tributary, alarm spread downstream.

Ethiopia argued that the dam was essential. Millions of its citizens lacked electricity, and the project could power homes, schools, and factories. Because the dam generates electricity rather than diverting water for farming, Ethiopia maintained that water would continue to flow downstream.

Egypt and Sudan worried about how quickly the reservoir would be filled. Filling it rapidly during a drought could reduce the water reaching their farms and cities. Negotiations stretched on for years, with each side accusing the other of being unreasonable.

The dispute illustrates a challenge that will likely grow as populations rise and climates change: when a resource crosses borders, no country can manage it alone, and every country's needs are real.`,
    qs: [
      { k: "main", q: "What is the main idea of the passage?", a: "A dam on the Nile created a dispute between countries that all depend on the river.", d: ["Egypt built the first dam on the Nile.", "Ethiopia does not need electricity.", "The Nile flows through only two countries."], e: "The passage presents Ethiopia's dam, Egypt and Sudan's concerns, and the broader lesson." },
      { k: "detail", q: "What was Egypt's main concern?", a: "How quickly the reservoir would be filled", d: ["That the dam would be too small", "That Ethiopia would sell electricity to Egypt", "That the river would flood Cairo"], e: "“Egypt and Sudan worried about how quickly the reservoir would be filled.”" },
      { k: "vocab", q: "As used in the first paragraph, “tributary” most nearly means", a: "a river or stream that flows into a larger river", d: ["a payment to a ruler", "a type of dam", "a desert region"], e: "The Blue Nile is described as the Nile's largest tributary — a river feeding into it." },
      { k: "inference", q: "Why does the author say “every country's needs are real” in the last sentence?", a: "To suggest that both sides have legitimate concerns", d: ["To argue that Egypt is completely wrong", "To argue that Ethiopia is completely wrong", "To claim the dispute has been solved"], e: "The final sentence emphasizes fairness to all sides." },
      { k: "tone", q: "The author's presentation of the dispute is best described as", a: "even-handed", d: ["one-sided in favor of Egypt", "one-sided in favor of Ethiopia", "humorous"], e: "The author explains each side's position without taking sides." }
    ]
  },
  {
    id: "dunbar", title: "How Many Friends Can You Have?", genre: "Social science",
    text: `In the 1990s, British anthropologist Robin Dunbar noticed a pattern: primates with larger brains tended to live in larger social groups. Using this relationship, he estimated that humans can maintain stable relationships with roughly 150 people. This figure became known as Dunbar's number.

Dunbar pointed out that many human groups seem to cluster around this size. Ancient farming villages, military companies, and even the number of people to whom a typical person sends holiday cards often fall near 150. Beyond that point, he argued, it becomes difficult to remember who is who and how everyone is connected.

The idea has been widely popularized, especially in discussions of social media, where people may have thousands of “friends.” However, other researchers have criticized the number. When they reanalyzed the data using different methods, they found estimates ranging from fewer than twenty to more than five hundred. Some argue that human social limits depend heavily on culture and circumstance, not just brain size.

Whatever the exact number, the concept raises a useful question: in a world of endless online connections, how many relationships can we truly keep?`,
    qs: [
      { k: "main", q: "What is the passage mainly about?", a: "A theory about the limit on stable human relationships and the debate around it", d: ["How to make more friends on social media", "The history of military companies", "Why primates have large brains"], e: "The passage explains Dunbar's number, its evidence, and criticisms." },
      { k: "detail", q: "What relationship did Dunbar notice among primates?", a: "Those with larger brains tended to live in larger groups.", d: ["Those with smaller brains lived longer.", "Those living in trees had more friends.", "Those in larger groups had smaller brains."], e: "“Primates with larger brains tended to live in larger social groups.”" },
      { k: "vocab", q: "As used in the third paragraph, “popularized” most nearly means", a: "made widely known", d: ["proven true", "made illegal", "forgotten"], e: "The idea has been widely popularized — spread to many people." },
      { k: "inference", q: "What do the critics' findings suggest?", a: "The number 150 may not be a fixed limit for everyone.", d: ["Dunbar's number is exactly correct.", "Humans cannot have any friends online.", "Brain size is the only factor in friendship."], e: "Estimates ranged widely, and social limits may depend on culture and circumstance." },
      { k: "structure", q: "The final paragraph mainly serves to", a: "connect the idea to a broader question about modern life", d: ["introduce a new scientist", "list more examples of groups of 150", "prove that the critics are wrong"], e: "It asks how many relationships we can truly keep in an online world." }
    ]
  }
];
