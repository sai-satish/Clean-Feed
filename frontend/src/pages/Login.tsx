import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import Logo from '@/components/Logo';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Check if redirected from another page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectReason = params.get('reason');

    if (redirectReason === 'auth_required') {
      toast({
        title: "Authentication Required",
        description: "Please log in to access that page",
        variant: "default"
      });
    }
  }, [location, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        toast({
          title: "Success",
          description: "You are now logged in!",
        });

        // Force a small delay to ensure state is updated before redirect
        setTimeout(() => {
          navigate('/home');
        }, 100);
      } else {
        setErrorMessage('Invalid email or password. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <form onSubmit={handleSubmit} className="auth-form animate-scale-in w-full max-w-md bg-card shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Log in to CleanFeed</h1>

        {errorMessage && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-gradient hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Log In'}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export default Login;