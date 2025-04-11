
export interface User {
  id: string;
  username: string;
  name: string;
  profilePic: string;
  followers: number;
  following: number;
  bio: string;
  posts: number;
}

export interface Reel {
  id: string;
  caption: string;
  videoId: string;
  likes: number;
  comments: number;
  views: number;
  postedAt: string;
  user: User;
}
