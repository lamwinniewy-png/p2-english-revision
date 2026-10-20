/* Writing practice in three parts, following the SPPCS worksheets:
   Part 1 = Writing 1, Part A (plan with 5 questions)
   Part 2 = Writing 1, Parts B–C (write a paragraph of at least six sentences)
   Part 3 = Module 2, Part C "Places like home" (places, feelings, two rules + reasons, checklist) */
'use strict';
/* F(sentence words, index of the wrong word, correct word, explain) — "tap the mistake" */
const F = (sentence, bad, fix, ex = '') => { const words = sentence.split(' '); return { type: 'fix', text: 'Find the mistake. Tap the wrong word.', words, bad, fix, answer: words.map((w, i) => i === bad ? fix : w).join(' '), explain: ex }; };

WRITING.t1.planQs = [
  { q: 'What is your favourite place at school?', frame: 'My favourite place at school is', key: 'place',
    tip: 'Write "the": the computer room, the library.' },
  { q: 'Where is your favourite place?', frame: 'It is on', key: 'floor',
    tip: 'Use "on" for floors: It is on the first floor.' },
  { q: 'What do you and your classmates do there? (Write at least two things.)', frame: 'My classmates and I', key: 'acts',
    tip: 'Write TWO things. Add the second one with "We also…": We also have computer lessons together.' },
  { q: 'What do your teachers do there?', frame: 'My teachers', key: 'teach',
    tip: 'Use "teach me how to…" and add details with "using…": My teachers teach me how to draw amazing pictures using a drawing programme on the computer.' },
  { q: 'Why do you like this place?', frame: 'I like … because', key: 'why',
    tip: 'Give a reason with "because" and add more details.' },
  { q: 'How do you feel when you are there?', frame: 'I feel … when I am there.', key: 'feel',
    tip: 'Your teacher added this question. Always say how you feel!' },
];
/* What the teacher's red pen taught us (general tips — no names) */
WRITING.t1.teacherTips = [
  ['Two things', 'My classmates and I draw pictures using computers. <b>We also</b> have computer lessons together.'],
  ['how to', 'My teachers teach me <b>how to</b> draw amazing pictures.'],
  ['using…', 'We draw pictures <b>using</b> computers. · We draw beautiful pictures <b>using</b> digital art tools.'],
  ['Feelings', '<b>How do you feel when you are there?</b> → I feel happy when I am there.'],
  ['Full stops', 'Put a full stop (.) at the end of every sentence before you start a new one.'],
];
WRITING.t1.format = [
  'Write the date at the top right: 17th September, 2026',
  'Write the title in the middle: My Favourite Place at School',
  'Indent the first line (leave a small space).',
  'Write at least six sentences.',
  'Start each sentence with a capital letter and end it with a full stop.',
  'Check your spelling: favourite, because, beautiful, pictures, computer.',
];
WRITING.t1.marks = ['Content', 'Language', 'Organisation', 'Format'];
WRITING.t1.planQuiz = [
  M('Answer the question: Where is your favourite place?', 'It is on the first floor.', ['It is in the first floor.', 'It on the first floor.', 'It is at first floor.']),
  M('My favourite place at school ___ the computer room.', 'is', ['are', 'am', 'be']),
  M('My classmates and I ___ pictures using computers.', 'draw', ['draws', 'drawing', 'can drawing']),
  M('Choose the best way to add a second thing.', 'We also have computer lessons together.', ['And chat.', 'We also has computer lessons.', 'Also computer.']),
  M('My teachers teach me ___ to draw amazing pictures.', 'how', ['what', 'who', 'when']),
  M('My teachers teach me how to draw pictures ___ a drawing programme.', 'using', ['use', 'uses', 'used']),
  M('I like the computer room ___ it is wonderful.', 'because', ['but', 'so', 'or']),
  M('Which question did the teacher add?', 'How do you feel when you are there?', ['What is your name?', 'What is your favourite food?', 'Where do you live?']),
  M('Which answer tells us a feeling?', 'I feel happy when I am there.', ['It is on the first floor.', 'We have computer lessons.', 'My teachers teach me.']),
  M('How many things must you write for "What do you and your classmates do there?"', 'at least two', ['one', 'none', 'only one']),
  O('Put the words in order.', ['We', 'also', 'have', 'computer', 'lessons', 'together.']),
  O('Put the words in order.', ['My', 'teachers', 'teach', 'me', 'how', 'to', 'draw.']),
];
WRITING.t1.fix = [
  F('My favourite place at school is the libary.', 7, 'library.', 'libary → library'),
  F('It is in the first floor.', 2, 'on', 'We say ON the first floor.'),
  F('My classmate and I draw pictures.', 1, 'classmates', 'My classmates and I (more than one classmate)'),
  F('I like the computer room beacause it is wonderful.', 5, 'because', 'beacause → because'),
  F('We draw beautiful picturers using computers.', 3, 'pictures', 'picturers → pictures'),
  F('My teachers teaches me how to draw.', 2, 'teach', 'My teachers (more than one) → teach'),
  F('I feel happy when I am their.', 6, 'there.', 'their → there (a place)'),
  F('It is so wonderfal.', 3, 'wonderful.', 'wonderfal → wonderful'),
  F('We draw pictures use computers.', 3, 'using', 'draw pictures USING computers'),
  F('My favorite place at school is the art room.', 1, 'favourite', 'In Hong Kong we use British spelling: favourite'),
  F('We also has music lessons there.', 2, 'have', 'We have'),
  F('i like the hall because it is huge.', 0, 'I', 'Always write a capital I.'),
];
WRITING.t1.paraQuiz = [
  M('A paragraph must have at least ___ sentences.', 'six', ['two', 'three', 'four']),
  M('Where do you write the date?', 'at the top right', ['at the bottom', 'in the middle of the paragraph', 'nowhere']),
  M('Which is the best title?', 'My Favourite Place at School', ['my favourite place at school', 'MY FAVOURITE', 'The Computer']),
  M('Choose the correct sentence.', 'I like the computer room because it is wonderful.', ['I like the computer room beacause it is wonderful.', 'I likes the computer room because it is wonderful.', 'i like the computer room because it is wonderful.']),
  M('Choose the correct ending: "…using digital art tools ___ I feel happy."', '. (full stop)', [', (comma)', 'nothing', '? (question mark)'], 'Two sentences need a full stop between them: …digital art tools. I feel happy.'),
  O('Put the words in order to make the first sentence.', ['My', 'favourite', 'place', 'at', 'school', 'is', 'the', 'computer', 'room.']),
];

/* ---------- Part 3: Module 2 Part C ---------- */
WRITING.t2.title = 'Places like Home';
WRITING.t2.module = 'Module 2 · Writing Part C';
WRITING.t2.intro = 'Our home is always the special place we love the most. When we face difficulties, our family members support and encourage us no matter where we are.';
WRITING.t2.places.unshift(
  { p: 'the park', e: '🌳', prep: 'in', rules: [
    ['must', 'wait for our turns to go on the slide', 'It is fair for everyone to get a chance to play.'], ['mustn\'t', 'pick the flowers', 'They give food to bees and butterflies.'], ['must', 'keep off the grass', 'The grass needs time to grow.'], ['mustn\'t', 'litter', 'It makes the park dirty.']] },
  { p: 'Ocean Park', e: '🐬', prep: 'in', rules: [
    ['must', 'line up for the rides', 'It is fair for everyone.'], ['mustn\'t', 'feed the animals', 'Our food may make them sick.'], ['must', 'stay with our parents', 'We may get lost.'], ['mustn\'t', 'litter', 'It is dirty.']] },
);
WRITING.t2.places.forEach(p => { if (p.p === 'the train platform') p.prep = 'on'; });
WRITING.t2.feels = [['sad', '😢'], ['lonely', '🥺'], ['worried', '😟'], ['scared', '😨'], ['hungry', '🍱'], ['I miss my family', '💗']];
WRITING.t2.ruleTip = 'Line 1 is the RULE: We must… / We mustn\'t… · Line 2 is the REASON (why): It is… / They… / People may…';
WRITING.t2.fix = [
  F('We mustn\'t liter in the park.', 2, 'litter', 'litter ✓  liter ✗  little ✗'),
  F('We mustn\'t little in the park.', 2, 'litter', 'litter ✓  liter ✗  little ✗'),
  F('We mustn\'t eat or drink in the train.', 5, 'on', 'ON the train'),
  F('We must line up on the corridor.', 4, 'in', 'IN the corridor'),
  F('We mustn\'t spit at the park.', 3, 'in', 'IN the park'),
  F('We mustn\'t pushing on the platform.', 2, 'push', 'mustn\'t + push (no -ing)'),
  F('We must waits for our turns.', 2, 'wait', 'must + wait (no -s)'),
  F('We must keep quite in the library.', 3, 'quiet', 'quite → quiet'),
  F('We must stand behind the yelow line.', 5, 'yellow', 'yelow → yellow'),
  F('We mustn\'t touch the animals on the zoo.', 5, 'in', 'IN the zoo'),
  F('We must keep off the gras.', 5, 'grass.', 'gras → grass'),
  F('We mustn\'t push in the bus.', 3, 'on', 'ON the bus'),
];
WRITING.t2.qs.push(
  M('Which is the RULE line?', 'We mustn\'t push on the MTR platform.', ['It is dangerous.', 'People may fall.', 'Because it is fun.'], 'Line 1 = rule. Line 2 = reason.'),
  M('Which is the best REASON for "We mustn\'t push on the MTR platform"?', 'People may fall and get hurt.', ['We mustn\'t push.', 'We must line up.', 'The train is blue.']),
  M('How many rules do you write for each place?', 'two', ['one', 'three', 'six']),
  M('Name a place you see as your "home". Choose the best answer.', 'the library', ['library', 'a the library', 'the the library'], 'Remember to write "the": the school, the library.'),
  M('We ___ wait for our turns to go on the slide.', 'must', ['mustn\'t'], 'It is fair for everyone.'),
  M('We ___ pick the flowers in the park.', 'mustn\'t', ['must'], 'They give food to bees and butterflies.'),
  M('We mustn\'t feed the animals ___ Ocean Park.', 'in', ['on', 'at']),
  O('Write the rule.', ['We', 'must', 'stand', 'behind', 'the', 'yellow', 'line.']),
  O('Write the reason.', ['It', 'is', 'fair', 'for', 'everyone.']),
  O('Join the rule and the reason.', ['We', 'mustn\'t', 'push', 'on', 'the', 'platform', 'because', 'it', 'is', 'dangerous.']),
);
