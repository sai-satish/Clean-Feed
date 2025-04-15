import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon, X, Tag, Film, Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Upload = () => {
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [filePath, setFilePath] = useState<string>('');
  const [authData, setAuthData] = useState(null);
  const [stage, setStage] = useState<'upload' | 'analysis' | 'publish'>('upload');
  const [progress, setProgress] = useState<number>(0);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Get auth data from localStorage
  useEffect(() => {
    // Get separate token and user from localStorage instead of authData
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Create the authData object from separate items
        setAuthData({
          token: storedToken,
          user: parsedUser
        });

        // Log the auth data for debugging (remove in production)
        console.log("Auth data loaded:", {
          token: `${storedToken.substring(0, 10)}...`,
          user: parsedUser
        });
      } catch (e) {
        console.error('Failed to parse user data:', e);
        toast({
          title: "Authentication Error",
          description: "Failed to load your account information. Please log in again.",
          variant: "destructive"
        });
      }
    } else {
      console.error('Token or user not found in localStorage');
      toast({
        title: "Authentication Error",
        description: "You need to log in to upload content",
        variant: "destructive"
      });
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisData(null);
    setStage('upload');
    setProgress(0);
  };

  // Verify token validity before upload
  const validateToken = async () => {
    if (!authData?.token) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/validate-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a video to upload",
        variant: "destructive"
      });
      return;
    }

    if (!authData) {
      toast({
        title: "Authentication Error",
        description: "Please log in before uploading content",
        variant: "destructive"
      });
      return;
    }

    // Validate token before proceeding
    const isTokenValid = await validateToken();
    if (!isTokenValid) {
      return;
    }

    setIsLoading(true);
    setResponseMessage(null);
    setStage('analysis');

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5;
        return newProgress < 90 ? newProgress : prev;
      });
    }, 500);

    try {
      // Get token from auth data
      const token = authData?.token || '';
      const userId = authData?.user?.id || '';

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Create form data to send the file and caption
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userId);

      console.log("Sending request with:", {
        userId,
        tokenPreview: `${token.substring(0, 10)}...`,
        fileSize: selectedFile.size
      });

      // Send the request to the backend
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Show success message
      toast({
        title: "Success",
        description: "Your video has been analyzed successfully!",
      });

      // Store analysis data and file path
      setAnalysisData(data.analysis);
      setFilePath(data.file_path);
      setStage('publish');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setStage('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!filePath || !authData?.user?.id) {
      toast({
        title: "Error",
        description: "Missing required information for upload",
        variant: "destructive"
      });
      return;
    }

    // Validate token before proceeding
    const isTokenValid = await validateToken();
    if (!isTokenValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = authData?.token || '';
      const userId = authData?.user?.id || '';

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('filePath', filePath);
      formData.append('caption', caption);

      const response = await fetch('http://localhost:8000/finalize-upload/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Publish failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Display success message
      toast({
        title: "Success",
        description: "Your reel has been published!",
      });

      // Optionally navigate to the feed or profile page
      setTimeout(() => navigate('/profile'), 2000);

    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = () => {
    // Open email client with pre-filled subject
    window.location.href = 'mailto:support@cleanfeed.com?subject=Content Analysis Report&body=I believe the analysis of my content is incorrect.';

    toast({
      title: "Reporting Issue",
      description: "Opening your email client to contact support",
    });
  };

  const renderUploadStage = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!selectedFile ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <UploadIcon size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Drag and drop a video file, or click to browse
          </p>
          <Input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            id="file-upload"
            disabled={isLoading}
          />
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {previewUrl && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl">▶</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            disabled={isLoading}
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Caption
          </label>
          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={isLoading}
            className="bg-background"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-gradient hover:opacity-90 transition-opacity"
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Analyze Content'}
        </Button>
      </div>
    </form>
  );

  const renderAnalysisStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Content Analysis
          </CardTitle>
          <CardDescription>
            We're analyzing your content to determine appropriate age groups and genres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex justify-center pt-4">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPublishStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Analysis Complete
          </CardTitle>
          <CardDescription>
            Review the analysis results before publishing your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisData && (
              <>
                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Clock className="h-4 w-4" /> Age Group
                  </h3>
                  <div className="bg-muted p-2 rounded-md text-center">
                    <span className="text-lg font-semibold">{analysisData.age_group}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Tag className="h-4 w-4" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Film className="h-4 w-4" /> Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.genres.map((genre: string, index: number) => (
                      <Badge key={index} className="px-2 py-1 bg-purple-gradient text-white">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            onClick={handlePublish}
            className="w-full bg-purple-gradient hover:opacity-90 transition-opacity"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : 'Publish Content'}
          </Button>

          <Button
            onClick={handleReportIssue}
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
          >
            <Mail className="h-4 w-4 mr-2" /> Report Analysis Issue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="app-container">
      <Header />

      <main className="page-container">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6">
            {stage === 'upload' && 'Upload a Reel'}
            {stage === 'analysis' && 'Analyzing Content'}
            {stage === 'publish' && 'Review & Publish'}
          </h1>

          {stage === 'upload' && renderUploadStage()}
          {stage === 'analysis' && renderAnalysisStage()}
          {stage === 'publish' && renderPublishStage()}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Upload;