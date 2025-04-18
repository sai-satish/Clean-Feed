import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ReelCard from '@/components/ReelCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { generateFeed } from '@/constants/feedGenerator';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState(generateFeed());
  const [prediction, setPrediction] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Stop camera when component unmounts
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Could not access camera. Please ensure camera permissions are granted.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCountdown = () => {
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(countdownInterval);
          // Capture image when countdown reaches 0
          setTimeout(() => {
            captureImage();
            setCountdown(null);
          }, 500);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Save the image data URL for display
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);

      // Convert canvas to blob and send to backend
      setProcessingImage(true);
      canvas.toBlob((blob) => {
        sendImageToBackend(blob);
      }, 'image/jpeg', 0.8);

      // Stop camera after capturing
      stopCamera();
      setShowCamera(false);
    }
  };

  const sendImageToBackend = async (imageBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data);

      // Check if age verification is successful
      // You would need to implement logic based on your backend response
      // This is a placeholder - adjust according to your actual response format
      if (data.predicted_age && data.predicted_age >= 13) {
        setIsVerified(true);
      }

    } catch (error) {
      console.error('Error sending image to backend:', error);
      setPrediction({ error: 'Failed to process image. Please try again.' });
    } finally {
      setProcessingImage(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage('');
    setPrediction(null);
    startCamera();
  };

  const renderAgeVerification = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">Age Verification Required</h2>

          {cameraError && (
            <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
              {cameraError}
            </div>
          )}

          {!showCamera && !capturedImage && (
            <div className="text-center">
              <p className="mb-4">We need to verify your age before you can access content.</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors w-full font-medium"
              >
                Start Age Verification
              </button>
            </div>
          )}

          {showCamera && (
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 bg-gray-200 rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="text-6xl font-bold text-white">{countdown}</span>
                  </div>
                )}

                {!countdown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  </div>
                )}
              </div>

              {!countdown && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={startCountdown}
                    className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors w-full font-medium"
                  >
                    Capture Image
                  </button>
                </div>
              )}
            </div>
          )}

          {capturedImage && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-3">Captured Photo</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="rounded-lg max-h-72 w-auto border-2 border-gray-300"
                />
              </div>

              {processingImage ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <LoadingSpinner size="md" />
                  <span className="mt-2 text-gray-600">Analyzing image...</span>
                </div>
              ) : prediction ? (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-700 mb-2">Age Verification Results:</h4>
                  {prediction.error ? (
                    <p className="text-red-600">{prediction.error}</p>
                  ) : (
                    <div className="space-y-2">
                      {typeof prediction === 'object' ? (
                        Object.entries(prediction).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b pb-1">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <p>{prediction}</p>
                      )}

                      {isVerified ? (
                        <div className="mt-3 bg-green-100 p-3 rounded-lg text-green-800 text-center">
                          <p className="font-bold">Age Verification Successful!</p>
                          <p className="text-sm">You can now access content</p>
                        </div>
                      ) : (
                        <div className="mt-3 bg-red-100 p-3 rounded-lg text-red-800 text-center">
                          <p className="font-bold">Age Verification Failed</p>
                          <p className="text-sm">You must be at least 13 years old to access content</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              <button
                onClick={retakePhoto}
                className="mt-4 bg-blue-600 text-white w-full py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retake Photo
              </button>

              {isVerified && (
                <button
                  onClick={() => window.scrollTo(0, 0)}
                  className="mt-3 bg-green-600 text-white w-full py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue to Content
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Header />

      <main className="page-container">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !isVerified ? (
          renderAgeVerification()
        ) : (
          <div className="p-4 space-y-6 max-w-md mx-auto">
            {feed.map((item, index) => (
              <ReelCard
                key={`${item.user.username}-${index}`}
                reel={item}
                user={item.user}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;