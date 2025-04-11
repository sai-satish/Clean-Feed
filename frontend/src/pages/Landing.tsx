
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ArrowRight, Heart, Video, Upload, Users } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-6 flex justify-between items-center">
        <Logo size="md" />
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-purple-gradient hover:opacity-90 transition-opacity">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 py-12">
        <section className="container max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Share Your World Through 
                <span className="block bg-clip-text text-transparent bg-purple-gradient">
                  Captivating Reels
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Join millions creating and sharing moments that matter. ReelVerse connects you with friends, family, and creators around the world.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-purple-gradient hover:opacity-90 transition-opacity w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Link to="/home">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Reels
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-reelverse-primary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-card rounded-xl overflow-hidden shadow-lg border border-border">
                <div className="aspect-[9/16] bg-muted w-full max-w-[280px] mx-auto relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-reelverse-primary"></div>
                      <span className="text-white font-medium">reelverse_official</span>
                    </div>
                    <p className="text-white text-sm mb-3">Experience the new way to share moments ✨ #ReelVerse</p>
                    <div className="flex justify-between">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1"><Heart size={18} className="text-white" /> <span className="text-white text-xs">24.5K</span></div>
                        <div className="flex items-center gap-1"><Users size={18} className="text-white" /> <span className="text-white text-xs">1.2M</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-purple-gradient/10 py-16">
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Why Choose <span className="bg-clip-text text-transparent bg-purple-gradient">ReelVerse</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center mb-4">
                  <Video className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Engaging Reels</h3>
                <p className="text-muted-foreground">Create and discover short, captivating videos that tell your story in seconds.</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center mb-4">
                  <Upload className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Sharing</h3>
                <p className="text-muted-foreground">Upload and share your moments with friends and followers with just a few taps.</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center mb-4">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Connect & Engage</h3>
                <p className="text-muted-foreground">Build your community through likes, comments, and direct interactions.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-card border-t border-border py-8">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="md" />
            <p className="text-muted-foreground text-sm mt-4 md:mt-0">
              © 2025 ReelVerse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
