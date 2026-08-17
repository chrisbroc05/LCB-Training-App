export type PlaybookSection = {
  title: string;
  paragraphs: string[];
  pullQuote?: string;
  bulletList?: string[];
  calloutTitle?: string;
  calloutText?: string;
};

export type PlaybookChapterContent = {
  number: number;
  title: string;
  subtitle: string;
  cardDescription: string;
  sections: PlaybookSection[];
  reflectionQuestions: string[];
};

export const FREE_PREVIEW_SECTION_COUNT = 2;

export const PLAYBOOK_CHAPTERS: PlaybookChapterContent[] = [
  {
    number: 1,
    title: "The Mental Game",
    subtitle: "How I Learned to Get Out of My Own Way",
    cardDescription: "How I learned to get out of my own way",
    sections: [
      {
        title: "The Perfectionism Trap",
        paragraphs: [
          "My biggest weakness as a player had nothing to do with my swing or my footwork. It was in my head.",
          "I was a perfectionist. I tried to do everything by the book. I tried to be the perfect player on the field and off it. I did everything I was told and I beat myself up every time I fell short of perfect -- which in baseball is all the time.",
          "What changed my career was the moment I realized it was okay to fail. It was okay to be a little different. Everyone's game comes to them differently and at different speeds. My swing was completely different from the guy next to me -- and that was okay. I could still have success by being myself.",
          "The day I stopped trying to be perfect was the day I started actually playing.",
        ],
        pullQuote:
          "The day I stopped trying to be perfect was the day I started actually playing.",
        calloutTitle: "What this means for you",
        calloutText:
          "Stop comparing your swing, your stats, and your progress to the player next to you. Your game is yours. Work on it, develop it, and trust it. The players who get the most out of their ability are the ones who play with freedom -- not the ones who play scared of making a mistake.",
      },
      {
        title: "Dealing With Slumps",
        paragraphs: [
          "When I was younger I would come home after a bad game and fall apart. I would get emotional. I would beat myself up. I was way too hard on myself.",
          "As I got older I learned one thing that changed everything: a slump is temporary. It is not permanent.",
          "Your hits are going to come. This game is a roller coaster and every single player at every single level goes through stretches where nothing falls. The players who get through slumps faster are the ones who keep working, keep trusting their training, and stop comparing their bad stretch to everyone else's good one.",
        ],
        pullQuote:
          "A slump is temporary. It is not permanent. Keep working and it will turn.",
        bulletList: [
          "It is temporary",
          "There is something to learn in here",
          "Keep working and it will turn",
          "Stop looking at what everyone else is doing",
        ],
      },
      {
        title: "What Failure Actually Means",
        paragraphs: [
          "Going 0 for 4 with four strikeouts is just as valuable as going 4 for 4 with four doubles. I mean that.",
          "Every failure has data in it. Every bad game has something to teach you. When you strike out looking that is information. When you boot a ground ball that is information. The players who get better fast are the ones who look at failure with curiosity instead of shame.",
          "So the next time you go 0 for 4 get excited. You just got a little bit better because you learned something you were not going to learn any other way.",
        ],
        pullQuote:
          "Going 0 for 4 is just as valuable as going 4 for 4. Every failure has data in it.",
      },
      {
        title: "What I Wish Someone Had Told Me at Fifteen",
        paragraphs: [
          "It gets better. No matter how bad it feels right now it gets better.",
          "This game is going to teach you things about yourself that you cannot learn anywhere else. You are going to learn how to handle failure, how to compete, how to be a teammate, how to push through when everything in you wants to quit. You are going to form friendships and connections that you will have for the rest of your life.",
          "This game is not just about baseball. It is about becoming the person you want to be.",
        ],
      },
      {
        title: "The One Mindset Shift That Changed Everything",
        paragraphs: [
          "Consistency and discipline will take you further than talent ever will.",
          "If I could go back and tell my sixteen year old self one thing it would be this: do not wait for someone to help you. Go out and do it yourself. Whatever you feel like you need -- go get it. Make the change. Put in the work. Do not wait.",
          "Stay consistent. Stay disciplined. Stay confident even during the tough times. Know that you are a good baseball player and that this game has more for you if you keep showing up.",
        ],
        pullQuote:
          "Consistency and discipline will take you further than talent ever will.",
      },
    ],
    reflectionQuestions: [
      "What is one thing about your game you have been too hard on yourself about? Write it down and then write one reason why it is not as bad as you think.",
      "Describe your last slump. How did you respond? What would you do differently now?",
      "Think of your worst game this season. What is one thing you learned from it?",
      "What would you tell a younger version of yourself about the mental game?",
    ],
  },
  {
    number: 2,
    title: "The Physical Game",
    subtitle: "Building the Athlete First",
    cardDescription: "Building the athlete first",
    sections: [
      {
        title: "Become an Athlete Before You Become a Baseball Player",
        paragraphs: [
          "My philosophy on specialization is simple: become an athlete first.",
          "Play multiple sports when you are young. Learn how to move. Learn how to compete. Learn how to be part of a team in different environments. Your body will thank you for it later.",
          "When you play multiple sports you develop athleticism that carries into everything you do on a baseball field. Your footwork gets better. Your body awareness gets better. Your ability to read situations and react gets better.",
          "Start specializing around sixteen. That is when you can really start focusing on baseball specific training and your body is ready for it because you have been building a foundation for years.",
        ],
        pullQuote: "Become an athlete first. The baseball will come.",
      },
      {
        title: "Hitting: Start Simple, Build Up",
        paragraphs: [
          "If I could only do one hitting drill every single day it would be tee work.",
          "Every session starts off the tee. No moving ball. Just you, the tee, and your swing. Build that muscle memory first. Lock in your mechanics, your load, your hip rotation, your finish -- all of it -- before you ever see a pitch.",
          "Then move to flips. Then the machine.",
          "And when you get to the machine -- challenge yourself. Turn it up. Make it uncomfortable. Because if you make practice harder than the game the game becomes easy.",
        ],
        pullQuote:
          "If you make practice harder than the game, the game becomes easy.",
        bulletList: [
          "Tee work -- build muscle memory and lock in mechanics",
          "Soft toss or flips -- start adding timing",
          "Machine or live pitching -- compete and challenge yourself",
          "Make it harder in practice than it will ever be in a game",
        ],
      },
      {
        title: "Fielding: Footwork First, Athletic Plays Second",
        paragraphs: [
          "The thing most coaches overlook in fielding is footwork.",
          "Everyone teaches two hands. Everyone teaches the fundamentals of fielding position. But what separates a good fielder from a great one is footwork -- the ability to get to the ball and time it so that your left foot hits right as the ball arrives, and then be athletic enough and comfortable enough to make the play.",
          "Do these every single day. Before practice. Before a game. In your backyard. It does not matter where. Just do them.",
        ],
        pullQuote: "Good feet make everything else easier.",
        bulletList: [
          "10 short hops",
          "Forehand footwork",
          "Backhand footwork",
          "Getting around the baseball",
          "Making plays on the run",
        ],
      },
      {
        title: "Strength and Mobility: The Foundation Everything Else Is Built On",
        paragraphs: [
          "My strength training philosophy for baseball is built around three things:",
          "Core strength. Everything in baseball starts from the core. Your swing, your throw, your ability to change direction -- all of it runs through your core. Build it.",
          "Rotational power. The more rotational strength you have the harder you hit and the harder you throw. Med ball work, rotational exercises, PVC pipe swings -- these are your best friends.",
          "Mobility and flexibility. This is the one most players skip and it is the one that ends careers. The more space your body has to move the harder you hit the ball, the harder you throw, and the less likely you are to get hurt. Take your mobility seriously. Start young. Be consistent about it.",
          "Lift weights you are comfortable with. Do not try to keep up with anyone else. Progressive overload -- adding a little bit more over time -- is how you build real strength.",
        ],
        pullQuote:
          "Take your mobility seriously. Start young. It is the one thing that ends careers when players ignore it.",
      },
      {
        title: "Nutrition and Recovery",
        paragraphs: [
          "Fuel your body like an athlete. Eat before games. Recover after games. Stay hydrated. Avoid the stuff that slows you down.",
          "You do not need to be perfect. You need to be consistent. Build good habits now and your body will perform better, recover faster, and stay healthier longer.",
          "Sleep is part of your training. When you are well rested your mind is clear. You are locked in during training. You react faster, you learn faster, and you perform better. Get your eight to nine hours. Your body and your mind need it.",
        ],
        pullQuote: "Sleep is part of your training. Treat it that way.",
      },
    ],
    reflectionQuestions: [
      "What is your current hitting routine? Write out exactly what you do from tee work to live reps.",
      "What part of your fielding do you feel least confident about? What daily drill would help you improve it?",
      "Are you currently doing any strength or mobility work? What does it look like and what would you add?",
      "How would you rate your nutrition and sleep on a scale of 1 to 10? What is one thing you could change this week?",
    ],
  },
  {
    number: 3,
    title: "The Preparation Game",
    subtitle: "How Championships Are Built",
    cardDescription: "How championships are built",
    sections: [
      {
        title: "We Practiced as a Championship Team",
        paragraphs: [
          "Winning the NJCAA National Championship at Oakton Community College taught me more about preparation than anything else in my career.",
          "Here is what I learned: preparation gives you mental clearance. When you are prepared you are not rushed. You are not surprised. You are not caught off guard. You walk into the biggest moments of your career knowing that you have done everything you needed to do to be ready.",
          "We did not win that championship on game day. We won it in practice. Every single day we practiced like we were already a championship team. We prepared for those moments -- the big at bats, the close games, the pressure situations -- so that when they actually happened they did not feel new. They felt like practice.",
          "And the culture mattered just as much as the preparation. Nobody was worried about who was playing and who was not. Nobody was tearing each other down. We all wanted the same thing and we all knew that the only way to get there was together.",
          "Build that culture on your team. Be the player who makes everyone better. Be the guy who brings energy, who works hard, who holds himself accountable. Championships are built by teams -- not individuals.",
        ],
        pullQuote:
          "We did not win that championship on game day. We won it in practice.",
      },
      {
        title: "Your Pre-Game Routine",
        paragraphs: [
          "Get to the field early. Not rushed -- early. Give yourself time to prepare mentally and physically before the chaos of the game starts.",
          "Here is what mine looked like:",
          "Do this every game. Every single game. The routine tells your body and your mind that it is time to compete. It eliminates the nervousness and replaces it with readiness.",
        ],
        pullQuote:
          "Your pre-game routine tells your body and your mind that it is time to compete.",
        bulletList: [
          "Arrive early with time to spare",
          "Personal dynamic stretching -- 10 to 15 minutes on my own",
          "Team stretch",
          "Throwing progression -- start short, build to full distance",
          "Daily fielding progressions -- short hops, forehand, backhand",
          "Sprints -- 10 to 15 minutes before first pitch to wake the body up",
          "Lock in mentally -- visualize, breathe, get focused",
        ],
      },
      {
        title: "The Off Season",
        paragraphs: [
          "The off season is where it all happens. During the off season you build. You lift heavy, you work on mobility, you add strength, you study the game, you figure out what kind of player you want to be.",
          "Then when the season comes you rely on that preparation. Your muscle memory is there. Your strength is there. Your confidence is there. You do not have to think about it -- you just go play and have fun.",
        ],
        pullQuote:
          "The off season is where championships are built. Show up to the season already ready.",
      },
    ],
    reflectionQuestions: [
      "Write out your ideal pre-game routine step by step from the moment you arrive at the field to first pitch.",
      "What does your current off season training look like? What would you add or change?",
      "Describe the best team culture you have ever been part of. What made it special?",
      "What is one thing you could do this week to be more prepared for your next game or practice?",
    ],
  },
  {
    number: 4,
    title: "The Life Game",
    subtitle: "What Baseball Is Really Teaching You",
    cardDescription: "What baseball is really teaching you",
    sections: [
      {
        title: "It Is Bigger Than Baseball",
        paragraphs: [
          "If I could go back and tell my fifteen year old self one thing it would be this: this game is giving you more than you know.",
          "The friendships you are forming right now -- on this team, in this dugout, on these bus rides -- you are going to have those people for the rest of your life. The lessons you are learning about handling failure, about competing, about being a teammate, how to push through when everything in you wants to quit -- those do not stay on the baseball field. They follow you into everything you do.",
          "This game is teaching you how to be a person. How to handle adversity. How to show up when you do not feel like it. How to be part of something bigger than yourself.",
          "Pay attention to those lessons. Write things down. Remember the moments -- not just the home runs and the diving catches, but the bus rides, the late nights, the teammates who made you better.",
          "Because one day it is going to be over. And it is okay when it is. But you are going to want to look back and know that you gave everything you had and enjoyed every single bit of it.",
        ],
        pullQuote:
          "This game is not just about baseball. It is about becoming the person you want to be.",
      },
      {
        title: "Don't Wait for Someone to Help You",
        paragraphs: [
          "Whatever you feel like you need -- go get it. Do not wait for someone to do it for you. Go out and make the change yourself and take your mobility seriously. Start at a young age. Do the things nobody else is willing to do.",
          "And always have fun. Enjoy the game. One day it is going to be over and you are not going to be playing ball anymore and that is okay. But enjoy every moment of it. Enjoy the connections you form, the teams you are part of, the memories you make. Write things down. Understand that you are never going to get those years back.",
        ],
        pullQuote:
          "Don't wait for someone to help you. Go out and do it yourself.",
      },
      {
        title: "For Parents",
        paragraphs: [
          "Every kid responds differently. Some players need to be pushed. Some need to be encouraged. Some need to process things on their own before they are ready to talk. Get to know your athlete. Find out what works for them.",
          "The worst thing that can happen is that a kid falls out of love with this game because the pressure at home became too much. Your job is to be the safe place -- the person they know loves them no matter what happens on that field.",
          "When you pick them up after a tough game the best thing you can say is: I love watching you play.",
        ],
      },
    ],
    reflectionQuestions: [
      "What is the most important life lesson baseball has taught you so far?",
      "Who is the teammate or coach who has had the biggest impact on you and why?",
      "What do you want to look back and remember about this chapter of your baseball life?",
      "What is one thing you are going to go do yourself without waiting for someone to tell you to?",
    ],
  },
];
