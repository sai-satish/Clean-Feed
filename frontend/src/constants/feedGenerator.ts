
import { Reel } from './types';
import { users } from './userData';

export function generateFeed(): Reel[] {
  const vimeoIds = [
    "https://player.vimeo.com/video/1074633328?h=b26a24c09d&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // Original video
    "https://player.vimeo.com/video/1074633267?h=7c1d5337a0&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // New video 1
    "https://player.vimeo.com/video/1074633306?h=55993d4eee&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // New video 2
    "https://player.vimeo.com/video/1074633234?h=7b903f06ea&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // New video 3
    "https://player.vimeo.com/video/1074633209?h=149a09ded0&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // New video 4
    "https://player.vimeo.com/video/1074633171?h=43793c59e3&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479", // New video 5
    "https://player.vimeo.com/video/1074629687?h=f5209e26a2&amp;title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"  // New video 6
  ];

  const captions = [
    "Try it and let me know #learnfromkhaby #comedy",
    "I may be coaching in the game @nbaallstar but I'm getting my jumper ready just in case my team needs me",
    "First attempt at my favourite food - ft. Mama dearest",
    "Dance vibes 💃🕺",
    "New song out now! 🎶",
    "Just vibing with the beat 🎵",
    "Watch till the end for a surprise 😂"
  ];

  return vimeoIds.map((videoId, index) => ({
    id: (index + 1).toString(),
    caption: captions[index % captions.length],
    videoId: videoId,
    likes: Math.floor(Math.random() * 3000000) + 500000,
    comments: Math.floor(Math.random() * 75000) + 1000,
    views: Math.floor(Math.random() * 45000000) + 5000000,
    postedAt: new Date(2025 - Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
    user: users[index % users.length]
  }));
}
