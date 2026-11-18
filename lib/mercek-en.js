// "Three lenses" (psychology page): the English text, the same structure as lib/mercek-tr.js. Five everyday moments,
// each seen through three schools (CBT, psychodynamic, ACT); every school asks three questions with three answers.
// The moments are invented and belong to no client. lib/mercek.js reads window.MERCEK.
window.MERCEK = {
  ui: {
    pickMoment: 'Pick a moment', pickLens: 'Pick a lens', start: 'Look through this lens',
    step: (i, n) => `Step ${i} of ${n}`, moment: n => `MOMENT ${String(n).padStart(2, '0')}`,
    again: 'Choose the last step differently', otherLens: 'See the same moment through another lens', otherMoment: 'Pick another moment',
    book: 'Let’s talk about it together: request a session →', drag: 'Drag to turn',
    noteTitle: 'In therapy', story: 'Story', count: '5 moments · 3 lenses', and: 'and', feel: (f, y) => `${f} ${y}%`
  },
  // the five moments: the same five in every school
  moments: [
    { id: 'mesaj', t: 'Read, no reply', d: 'You wrote something important. Three hours later it has been read, but no reply has come.' },
    { id: 'toplanti', t: 'Your voice shook', d: 'You spoke up in a meeting. Your voice shook as you talked, and a few people turned to look.' },
    { id: 'duzeltme', t: 'In front of everyone', d: 'Your manager corrected the work you presented in front of the whole team.' },
    { id: 'iptal', t: 'Cancelled last minute', d: 'An hour before a meet-up you had looked forward to for days, your friend cancelled.' },
    { id: 'gece', t: '3:12 a.m.', d: 'You can’t sleep. Tomorrow’s job interview keeps turning over in your mind.' }
  ],
  lenses: {
    bdt: { n: 'CBT', full: 'Cognitive Behavioural Therapy', d: 'Sees the chain between thought, feeling and behaviour, and weighs the thought against the evidence.',
      parts: { durum: 'SITUATION', dus: 'THOUGHT', duy: 'FEELING', dav: 'BEHAVIOUR', alt: 'NEW THOUGHT' } },
    psd: { n: 'Psychodynamic', full: 'Psychodynamic therapy', d: 'Goes beneath today’s reaction, to the older experiences that feed it and the ways we protect ourselves.',
      parts: { yuzey: 'SURFACE', savunma: 'DEFENCE', kok: 'ROOT' } },
    act: { n: 'ACT', full: 'Acceptance and Commitment Therapy', d: 'Doesn’t fight the thought; changes your relationship with it and moves you towards your values.',
      parts: { an: 'Present moment', kabul: 'Acceptance', ayrisma: 'Defusion', benlik: 'Observing self', deger: 'Values', eylem: 'Committed action', merkez: 'Psychological flexibility' } }
  },

  /* ---------- CBT: thought (with its trap, feeling and how strong it is) → behaviour → a weighed thought ---------- */
  bdt: {
    q: ['Which thought comes to mind first?', d => `“${d}” What do you do with this thought?`, 'Let’s weigh the thought. Which one is more balanced?'],
    kinds: { den: 'Balanced thought', kan: 'Evidence-based thought', pos: 'Overly positive thought' },
    end: (m, a) => `The situation stayed the same: ${m}. What changed is how you read it. ${a.feel}: ${a.y}% → ${a.y2}%.`,
    note: { den: 'In CBT we don’t push thoughts away; we look at the evidence and look for a more realistic reading. The feeling doesn’t vanish, but it shrinks to a size you can manage.',
      kan: 'Looking for evidence means checking the story the mind tells against what actually happened. In therapy we practise this step by step, with thought records.',
      pos: 'CBT is not about positive thinking; it is about realistic thinking. Comforting thoughts with nothing under them rarely last. Try choosing the last step differently.' },
    m: {
      mesaj: [
        [['They don’t care about me.', 'Your chest tightens. You turn the phone face down, but your eyes keep going back to it.', 'Mind reading', 'Hurt', 80],
         ['Something must have happened to them.', 'Your mind races to the worst: an accident, a hospital…', 'Catastrophising', 'Anxiety', 75],
         ['I wrote too much again; they’re tired of me.', 'You reread your message again and again, weighing every word.', 'Personalisation', 'Shame', 70]],
        [['I send message after message.', 'Still no reply; with every message the thought looks a little more right.', 'Messaging again'],
         ['I check whether they’re online.', 'They are online. It feels like new “evidence” for your thought.', 'Checking'],
         ['I switch off my phone and sulk.', 'It brings relief for a while, but your mind stays there all evening.', 'Withdrawing']],
        [['They may be busy; if they don’t write tonight, I’ll ask.', 'The tightness in your chest eases. You have a plan, and you are not living through something that hasn’t happened.', 'den', 35],
         ['They have always got back to me before; I have no evidence otherwise.', 'Remembering past examples takes the strength out of the thought.', 'kan', 30],
         ['Never mind, I’m sure everything is fine.', 'You feel relieved for a moment, but deep down you don’t believe it; the thought soon comes back.', 'pos', 60]]
      ],
      toplanti: [
        [['Everyone noticed how nervous I was.', 'Your face grows hot; you rush to the end of your sentence.', 'Mind reading', 'Shame', 80],
         ['I ruined this meeting.', 'You don’t hear a word of the rest of the meeting.', 'All-or-nothing thinking', 'Disappointment', 75],
         ['From now on they’ll think I’m not good enough.', 'Your next reviews are already playing in your head.', 'Fortune telling', 'Anxiety', 80]],
        [['I won’t speak up again.', 'You feel relieved when the meeting ends, but the idea you wanted to share stays unsaid.', 'Avoiding'],
         ['I explain myself to everyone, one by one.', 'Everyone says “I didn’t even notice”; you still tell yourself they’re just being polite.', 'Seeking reassurance'],
         ['That evening I replay the moment over and over.', 'With every replay the shake grows a little bigger.', 'Mental replaying']],
        [['My voice shook, but I made my point, and people asked questions.', 'The shake still isn’t pleasant, but it is no longer the only thing you see.', 'den', 35],
         ['Most people were looking at their notes; nobody said anything.', 'What you observed is calmer than the story your mind tells.', 'kan', 30],
         ['It didn’t really shake; I’m exaggerating.', 'Pretending it didn’t happen doesn’t work; the same fear is waiting at the next meeting.', 'pos', 60]]
      ],
      duzeltme: [
        [['They think I’m incompetent.', 'You look down at the table; you don’t want to meet anyone’s eyes.', 'Mind reading', 'Shame', 80],
         ['I humiliated myself in front of everyone.', 'Those few seconds fill your whole day in your head.', 'Magnification', 'Shame', 85],
         ['That was unfair of them.', 'Your jaw tightens; the words for a reply are already lining up.', '“Should” statements', 'Anger', 75]],
        [['I stay quiet all day.', 'The team finds you distant, and that seems to prove your thought.', 'Withdrawing'],
         ['From now on I check every piece of work three times.', 'You make no mistakes, but work slows down and you wear yourself out.', 'Overchecking'],
         ['I write a sharp email.', 'You feel relief the moment you hit send; then regret arrives.', 'Hitting back']],
        [['They corrected one point and accepted the rest of the work.', 'The correction was about one part of the work, not about all of you.', 'den', 35],
         ['Everyone’s work gets corrected in this team; it happened last week too.', 'You found evidence that makes it less personal.', 'kan', 30],
         ['It doesn’t matter, I don’t even care.', 'Calling it unimportant doesn’t close the hurt; it comes back to you in the evening.', 'pos', 60]]
      ],
      iptal: [
        [['They don’t want to spend time with me.', 'You’re still in the clothes you got ready in, not knowing what to do.', 'Mind reading', 'Hurt', 80],
         ['It’s always me who makes the effort; nobody picks me.', 'One cancellation starts to feel like the summary of all your relationships.', 'Overgeneralisation', 'Loneliness', 85],
         ['I did something wrong; they’re upset with me.', 'You go over your last conversation from start to finish.', 'Personalisation', 'Anxiety', 70]],
        [['I write “no problem” and spend the evening alone.', 'You acted as if nothing was wrong; the hurt stayed unspoken.', 'Withdrawing'],
         ['I decide I won’t be the one to call next time.', 'The decision seems to protect you, but the friendship drifts a little further away.', 'Keeping distance'],
         ['I ask at length why they cancelled.', 'The answers don’t settle you; every answer raises a new question.', 'Seeking reassurance']],
        [['Cancelling an hour before is annoying; I can tell them that.', 'You found a way that protects both your hurt and the friendship.', 'den', 35],
         ['Last month they changed their plans for me, too.', 'One cancellation doesn’t tell the whole story of a friendship.', 'kan', 30],
         ['It doesn’t matter at all; I didn’t want to go anyway.', 'You don’t believe what you’re telling yourself; the hurt is still there.', 'pos', 60]]
      ],
      gece: [
        [['If I don’t sleep, I’ll ruin everything tomorrow.', 'You check the time: 3:12. You count the hours of sleep left.', 'Catastrophising', 'Anxiety', 85],
         ['This interview is the only chance I’ll ever get.', 'Your heart speeds up; you pull the duvet tighter.', 'All-or-nothing thinking', 'Tension', 80],
         ['I’m just not a good speaker.', 'The times you stumbled in the past pass before your eyes, one by one.', 'Labelling', 'Inadequacy', 75]],
        [['I get up and go through every question again.', 'It is 4:30 now; the preparing never ends, and sleep slips further away.', 'Over-preparing'],
         ['I toss and turn and keep checking the time.', 'Every check of the clock tells the mind “there is danger”.', 'Checking'],
         ['I watch videos on my phone to take my mind off it.', 'The thought goes quiet for a while, but the screen light pushes sleep even further away.', 'Avoiding']],
        [['Even with little sleep I’m prepared; I’ve spoken well when tired before.', 'Your body loosens a little; the pressure to have to sleep eases.', 'den', 35],
         ['This interview matters, but it isn’t my only chance; I have other applications.', 'The interview shrinks to the size it should be.', 'kan', 30],
         ['I’m not worried at all; it will go perfectly.', 'The mind isn’t convinced; the thoughts are back a few minutes later.', 'pos', 60]]
      ]
    }
  },

  /* ---------- psychodynamic: the surface reaction → what it may protect from → where the feeling may come from ---------- */
  psd: {
    q: ['What would someone watching from outside see?', d => `“${d}” Which feeling might this reaction be protecting you from?`, 'Does this feeling seem familiar? Where might you have felt it before?'],
    end: m => `Today’s moment (${m}) may be waking an older scene. Noticing this is the first step towards choosing, instead of repeating the same reaction on its own.`,
    note: 'What you see here is only one possibility; nobody’s past fits into a single moment. In psychodynamic therapy we look at these links together, without rushing; meaning emerges over time, within the relationship.',
    m: {
      mesaj: [
        [['I act as if I don’t care: “Whenever they write.”', 'You look relaxed. Inside, something is waiting.', 'Indifference'],
         ['I write again and again, trying to get closer.', 'The longer the silence, the harder you try to get closer.', 'Seeking closeness'],
         ['When the reply comes, I go cold.', 'When the reply finally comes, you write a distant “ok”.', 'Coldness']],
        [['Downplaying: “I don’t care anyway.”', 'If you don’t care, not being cared about hurts a little less.', 'Downplaying'],
         ['Projection: “They’re angry with me.”', 'Seeing your own hurt as their anger makes it easier to carry.', 'Projection'],
         ['Displacement: I snap at the people at home in the evening.', 'The anger goes not to the person it is meant for, but to people who feel safer.', 'Displacement']],
        [['Days of waiting for a busy parent’s attention.', 'Perhaps back then, too, silence felt like “you don’t matter”.', 'Longed-for attention'],
         ['A friend or partner who suddenly pulled away.', 'The silence may sound like the first sign of that old separation.', 'Sudden loss'],
         ['A home where love depended on being “good”.', 'No reply can feel like proof that you weren’t good enough.', 'Conditional love']]
      ],
      toplanti: [
        [['I laugh it off.', 'Everyone laughs; nobody talks about the shake, and neither do you.', 'Joking'],
         ['I over-prepare for the next meeting.', 'You promise never to show a weak spot again.', 'Perfectionism'],
         ['I shrink and lower my voice.', 'When your turn comes, you say “that’s all from me”.', 'Withdrawal']],
        [['Humour: laughing the shame away.', 'Humour can be a mature defence, but sometimes it lets you pass the feeling by without living it.', 'Humour'],
         ['Intellectualisation: “Stage fright is an evolutionary response.”', 'Explaining instead of feeling keeps the emotion at a safe distance.', 'Intellectualisation'],
         ['Turning against the self: “That’s just how I am.”', 'Your own judgement arrives before anyone else’s.', 'Turning against the self']],
        [['A lesson where you went up to the board and froze.', 'Perhaps the silence of that classroom is heard again today.', 'A memory of shame'],
         ['Family meals where you were interrupted and not listened to.', 'Being heard may have become tiring work very early on.', 'Not being heard'],
         ['The disappointment you saw when you made a mistake.', 'A shaking voice may feel like an invitation to that old disappointment.', 'Mistakes and love']]
      ],
      duzeltme: [
        [['I smile and say thank you.', 'Everyone is at ease, except you.', 'Compliance'],
         ['From that moment on, I get defensive.', 'You start taking every comment as an attack.', 'Getting defensive'],
         ['Quietly, I pull away from them.', 'The next day you pretend not to see them in the corridor.', 'Distance']],
        [['Reaction formation: covering anger with a smile.', 'Showing the opposite of what you feel keeps conflict away.', 'Reaction formation'],
         ['Splitting: a good manager yesterday, all bad today.', 'Seeing people as all good or all bad simplifies mixed feelings.', 'Splitting'],
         ['Passive aggression: quietly letting work slip.', 'The anger that can’t be said finds another way to speak.', 'Passive aggression']],
        [['An authority who often criticised and rarely praised.', 'Your manager’s voice may be blending with an older one.', 'A critical authority'],
         ['A home where you were always compared with your siblings.', 'Being corrected in front of the team may revive an old comparison.', 'Being compared'],
         ['A school where mistakes were punished.', 'A correction can feel like the herald of a punishment.', 'Fear of punishment']]
      ],
      iptal: [
        [['I say “no problem at all” and smile.', 'Once you hang up, the smile drops from your face.', 'Looking understanding'],
         ['I make other plans straight away, so there’s no gap.', 'Your evening is full, but the emptiness inside is still there.', 'Filling the gap'],
         ['I keep my distance from them for a while.', 'You don’t pick up their calls right away; this time let them wait.', 'Pulling away']],
        [['Repression: not thinking about the hurt at all.', 'Not thinking works for a while; the feeling surfaces another day, somewhere else.', 'Repression'],
         ['Acting out: doing instead of feeling.', 'Moving feels easier than stopping to feel.', 'Acting out'],
         ['Projection: “They never really liked me anyway.”', 'Your own hurt comes back to you as their lack of love.', 'Projection']],
        [['School gates where you waited and nobody came.', 'The pain of waiting for someone who didn’t come may sit next to today’s cancellation.', 'Waiting'],
         ['Being invisible in a crowded home.', 'The cancellation may sound like “you are not a priority”.', 'Invisibility'],
         ['Friendships cut short by moving house.', 'Every cancellation may wake the fear that something will be cut short again.', 'Things left unfinished']]
      ],
      gece: [
        [['I try to keep everything under control.', 'Notes, lists, alarms… all in place, except sleep.', 'Control'],
         ['I tell no one: “I’ll handle it.”', 'Carrying the worry alone is the heaviest part of the night.', 'Self-reliance'],
         ['I push the interview out of my mind and bury myself in other things.', 'When morning comes, the interview will still be there.', 'Escape']],
        [['Denial: “I’m not nervous at all.”', 'The tension you don’t name speaks as sleeplessness.', 'Denial'],
         ['Rationalisation: “This job isn’t for me anyway.”', 'Giving up in advance protects you from a possible disappointment.', 'Rationalisation'],
         ['Somatisation: a stomach ache, a racing heart.', 'Worry that isn’t put into words speaks through the body.', 'Somatisation']],
        [['Years when exam results were a big event at home.', 'The interview may have taken the place of an old night before an exam.', 'Pressure to succeed'],
         ['Nights when you were alone and nobody came.', 'It may be no coincidence that the worry grows most at night.', 'Lonely nights'],
         ['The first time an application of yours was turned down.', 'Tomorrow may be awaited as a repeat of that old rejection.', 'The first rejection']]
      ]
    }
  },

  /* ---------- ACT: the mind's sentence → what you do with it → a value and one step toward it ---------- */
  act: {
    q: ['What is your mind saying right now?', d => `Your mind says “${d}”. What do you do with this thought?`, 'What matters to you in this moment? Choose a small step towards it.'],
    rel: [
      ['I argue with the thought and try to prove it wrong.', 'The harder you pull, the tighter the thought holds on. Nobody wins a tug of war.', []],
      [d => `I notice it and name it: “My mind is saying ‘${d}’ again.”`, 'The thought is still there, but now you’re facing it rather than inside it.', ['ayrisma', 'benlik']],
      ['I let the feeling be there and come back to my breath and the sounds in the room.', 'The feeling hasn’t gone, but you made room for it; the moment widens again.', ['kabul', 'an']]
    ],
    thoughtSay: 'The mind says this sentence loudly, again and again. You noticed it: a step into the present moment.',
    thoughtLights: ['an'],
    end: (n, struggle, rest) => struggle
      ? `${n} of the six points lit up. Arguing with a thought is very natural, but a tug of war keeps you where you are. ${rest} stayed dark.`
      : `${n} of the six points lit up: the thought and the feeling are still there, and you still take a step in the direction you care about. ${rest} ${rest.includes(' and ') ? 'are' : 'is'} still dark; all six feed each other.`,
    note: 'ACT doesn’t try to change the thought; it changes your relationship with it. In therapy we build this flexibility in small, concrete steps, starting from your own values.',
    retry: 'Choose the second step differently',
    m: {
      mesaj: [['They don’t care about me.', 'Something must have happened to them.', 'I wrote too much again.'],
        [['Closeness', 'I send a single message: “Thinking of you, write when you can.”'],
         ['Self-respect', 'I put the phone down and go back to my evening plans.'],
         ['Honesty', 'When we talk, I tell them how the waiting felt for me.']]],
      toplanti: [['Everyone noticed my nerves.', 'I ruined this meeting.', 'They’ll think I’m not good enough.'],
        [['Contribution', 'At the next meeting I share my idea again, even if my voice shakes.'],
         ['Learning', 'I look for a small group to practise presenting with.'],
         ['Compassion', 'Tonight I talk to myself the way I would to someone who just did something hard.']]],
      duzeltme: [['They think I’m incompetent.', 'I humiliated myself in front of everyone.', 'That was unfair of them.'],
        [['Mastery', 'I note down what I can learn from the correction.'],
         ['Honesty', 'I talk to my manager one to one about how the correction was made.'],
         ['Self-respect', 'At the end of the day I remind myself of the work I put in.']]],
      iptal: [['They don’t want to spend time with me.', 'Nobody picks me.', 'I did something wrong.'],
        [['Closeness', 'I tell them I was hurt, but that I still want to see them.'],
         ['Self-care', 'I give myself a good evening, since I got ready for one.'],
         ['Commitment', 'I suggest another day and put effort into the friendship.']]],
      gece: [['If I don’t sleep, I’ll ruin everything.', 'This interview is my only chance.', 'I’m just not a good speaker.'],
        [['Courage', 'Tired or not, I go to the interview; I don’t have to be perfect.'],
         ['Self-care', 'I get up, have something warm to drink and switch off the screen.'],
         ['Growth', 'I note the interview down as an experience, not an exam.']]]
    },
    valueSay: v => `Value: ${v}. A small step, but one with a clear direction.`
  }
};
