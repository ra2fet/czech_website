// import React, { useEffect, useState } from 'react';

// interface IntroScreenProps {
//   onFinish: () => void;
// }

// const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
//   const [isVisible, setIsVisible] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsVisible(false);
//       onFinish();
//     }, 3000); // Display for 3 seconds

//     return () => clearTimeout(timer);
//   }, [onFinish]);

//   if (!isVisible) {
//     return null;
//   }

//   return (
//     <div className="intro-screen fixed inset-0 flex items-center justify-center bg-white z-50">
//       <img src="/logo_animate.gif" alt="Loading Logo" className="w-64 h-64 object-contain" />
//     </div>
//   );
// };

import React, { useEffect, useState } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out animation before finishing
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3200);

    // Complete intro after fade animation
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-500 ${fadeOut
          ? 'opacity-0 scale-105 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'opacity-100 scale-100 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-800'
        }`}
      style={{
        background: fadeOut
          ? 'linear-gradient(135deg, #343433 0%, #2a2a29 50%, #343433 100%)'
          : 'linear-gradient(135deg, #343433 0%, #4a4a49 30%, #343433 70%, #2a2a29 100%)'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full mix-blend-overlay filter blur-xl animate-pulse"
            style={{ backgroundColor: '#f9c923' }}></div>
          <div className="absolute top-3/4 right-1/4 w-48 h-48 rounded-full mix-blend-overlay filter blur-xl animate-pulse animation-delay-700"
            style={{ backgroundColor: '#7a9640' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-24 h-24 rounded-full mix-blend-overlay filter blur-xl animate-pulse animation-delay-1000"
            style={{ backgroundColor: '#f9c923' }}></div>
        </div>

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full opacity-40 animate-float-${i % 3}`}
            style={{
              backgroundColor: i % 2 === 0 ? '#f9c923' : '#7a9640',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo container with enhanced styling */}
        <div className={`relative transform transition-all duration-1000 ${fadeOut ? 'scale-110 rotate-3' : 'scale-100 rotate-0'
          }`}>
          {/* Glowing ring behind logo */}
          <div className="absolute inset-0 w-80 h-80 -m-8 rounded-full opacity-20 blur-2xl animate-spin-slow"
            style={{ background: `linear-gradient(45deg, #f9c923, #7a9640, #f9c923)` }}></div>

          {/* Logo with enhanced shadow and glow */}
          <div className="relative w-64 h-64 rounded-full overflow-hidden backdrop-blur-sm shadow-2xl"
            style={{ backgroundColor: 'rgba(249, 201, 35, 0.1)', borderColor: 'rgba(249, 201, 35, 0.3)', borderWidth: '1px' }}>
            <img
              src="./logo_animate.gif"
              alt="Loading Logo"
              className="w-full h-full object-contain p-4 drop-shadow-2xl"
            />غ
          </div>

          {/* Pulsing ring animation */}
          <div className="absolute inset-0 w-64 h-64 rounded-full border-2 animate-ping"
            style={{ borderColor: 'rgba(249, 201, 35, 0.4)' }}></div>
          <div className="absolute inset-0 w-64 h-64 rounded-full border animate-pulse"
            style={{ borderColor: 'rgba(122, 150, 64, 0.6)' }}></div>
        </div>

        {/* Loading text with typewriter effect */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold drop-shadow-lg animate-fade-in" style={{ color: '#f9c923' }}>
            Welcome
          </h1>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#f9c923' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce animation-delay-200" style={{ backgroundColor: '#7a9640' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce animation-delay-400" style={{ backgroundColor: '#f9c923' }}></div>
            </div>
            <span className="text-lg font-medium" style={{ color: 'rgba(249, 201, 35, 0.8)' }}>Loading</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(249, 201, 35, 0.2)' }}>
          <div className="h-full rounded-full animate-progress"
            style={{ background: `linear-gradient(90deg, #f9c923, #7a9640)` }}></div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style >{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(-10px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-25px) translateX(5px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float-0 { animation: float-0 3s ease-in-out infinite; }
        .animate-float-1 { animation: float-1 3.5s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-progress { animation: progress 2.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1s ease-out 0.5s both; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-700 { animation-delay: 0.7s; }
        .animation-delay-1000 { animation-delay: 1s; }
      `}</style>
    </div>
  );
};


export default IntroScreen;
