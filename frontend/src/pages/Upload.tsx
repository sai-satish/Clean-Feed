import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const Upload = () => {
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    setIsLoading(true);
    setResponseMessage(null);

    try {
      // Create form data to send the file and caption
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('caption', caption);

      // Send the request to the backend
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
        // No need to set Content-Type header as it's automatically set with FormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Display success message
      toast({
        title: "Success",
        description: "Your reel has been uploaded!",
      });

      // Show the response from the backend
      setResponseMessage(JSON.stringify(data, null, 2));

      // Optional: Navigate to profile after successful upload
      // setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <main className="page-container">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6">Upload a Reel</h1>

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
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading}
                />

                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    className="bg-purple-gradient hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    Select Video
                  </Button>
                </label>
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
                {isLoading ? <LoadingSpinner size="sm" /> : 'Upload Reel'}
              </Button>
            </div>
          </form>

          {/* Display the response from the backend */}
          {responseMessage && (
            <div className="mt-6 p-4 bg-background border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Server Response:</h2>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded overflow-auto max-h-64">
                {responseMessage}
              </pre>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Upload;