import React, { useState } from 'react';
import Header from './Header';
import KPIGauges from './KPIGauges';
import InjectionModule from './InjectionModule';
import QualityModule from './QualityModule';
import AssemblyModule from './AssemblyModule';

const Dashboard = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events (e.g. user presses Esc)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="p-4 h-full flex flex-col gap-4 bg-dashboard-bg bg-tech-pattern text-white overflow-hidden font-sans">
        <Header isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
        
        <div className="flex-1 flex flex-col gap-4 min-h-0 animate-fade-in">
            {/* Top KPIs - Full Width */}
            <div className="h-[15%] min-h-[120px]">
                <KPIGauges />
            </div>

            {/* Main Content - Split Columns */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Column - Injection & Quality */}
                <div className="w-[40%] flex flex-col gap-4">
                    <div className="flex-1">
                        <InjectionModule />
                    </div>
                    <div className="flex-1">
                        <QualityModule />
                    </div>
                </div>

                {/* Right Column - Assembly */}
                <div className="w-[60%] h-full">
                    <AssemblyModule />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
