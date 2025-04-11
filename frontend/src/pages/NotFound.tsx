
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <Logo size="lg" className="mb-6" />
      
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl mb-8">Oops! Page not found</p>
      
      <div className="max-w-md mb-8">
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been removed.
        </p>
        
        <Link to="/home">
          <Button className="bg-purple-gradient hover:opacity-90 transition-opacity">
            <Home size={18} className="mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
