const moodQuotes = {
  low: [
    "This too shall pass. Tomorrow is a fresh start.",
    "You are stronger than you think.",
    "Small steps lead to big changes.",
    "Be kind to yourself today."
  ],
  neutral: [
    "You're doing just fine.",
    "One day at a time.",
    "Keep moving forward.",
    "Progress over perfection."
  ],
  high: [
    "You're shining bright!",
    "Keep this momentum going!",
    "You've got this!",
    "Your energy is contagious!"
  ]
};

export const getQuoteByMood = (mood) => {
  let category;
  if (mood <= 3) category = 'low';
  else if (mood <= 7) category = 'neutral';
  else category = 'high';
  
  const quotes = moodQuotes[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
};
