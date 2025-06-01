// frontend/src/components/PerformanceProfiler.tsx
import React, { Profiler, ProfilerOnRenderCallback, useState, useRef } from 'react';
import './PerformanceProfiler.css';

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

interface PerformanceProfilerProps {
  id: string;
  children: React.ReactNode;
  showOverlay?: boolean;
  threshold?: number;
  onSlowRender?: (data: ProfilerData) => void;
}

const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  id,
  children,
  showOverlay = false,
  threshold = 16, // 16ms for 60fps
  onSlowRender
}) => {
  const [profileData, setProfileData] = useState<ProfilerData[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const renderCount = useRef(0);

  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    renderCount.current++;
    
    const data: ProfilerData = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions
    };
    
    // Track slow renders
    if (actualDuration > threshold) {
      if (onSlowRender) {
        onSlowRender(data);
      }
      
      console.warn(`[Performance] Slow render detected in ${id}:`, {
        phase,
        duration: `${actualDuration.toFixed(2)}ms`,
        threshold: `${threshold}ms`
      });
    }
    
    // Store last 10 renders for overlay
    if (showOverlay) {
      setProfileData(prev => [...prev.slice(-9), data]);
    }
  };

  const getAverageRenderTime = () => {
    if (profileData.length === 0) return 0;
    const sum = profileData.reduce((acc, data) => acc + data.actualDuration, 0);
    return sum / profileData.length;
  };

  const getSlowRenderCount = () => {
    return profileData.filter(data => data.actualDuration > threshold).length;
  };

  if (!showOverlay) {
    return (
      <Profiler id={id} onRender={onRender}>
        {children}
      </Profiler>
    );
  }

  return (
    <div className="performance-profiler-wrapper">
      <Profiler id={id} onRender={onRender}>
        {children}
      </Profiler>
      
      <div className={`performance-overlay ${showDetails ? 'expanded' : ''}`}>
        <button
          className="performance-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-label={showDetails ? 'Hide performance details' : 'Show performance details'}
        >
          <i className={`fas fa-${showDetails ? 'times' : 'tachometer-alt'}`}></i>
        </button>
        
        {showDetails && (
          <div className="performance-details">
            <h4>{id} Performance</h4>
            
            <div className="performance-stats">
              <div className="stat">
                <span className="stat-label">Renders:</span>
                <span className="stat-value">{renderCount.current}</span>
              </div>
              
              <div className="stat">
                <span className="stat-label">Avg Time:</span>
                <span className="stat-value">
                  {getAverageRenderTime().toFixed(2)}ms
                </span>
              </div>
              
              <div className="stat">
                <span className="stat-label">Slow Renders:</span>
                <span className="stat-value warning">
                  {getSlowRenderCount()}
                </span>
              </div>
            </div>
            
            <div className="render-timeline">
              <h5>Recent Renders</h5>
              {profileData.map((data, index) => (
                <div 
                  key={`${data.startTime}-${index}`}
                  className={`render-item ${data.actualDuration > threshold ? 'slow' : ''}`}
                >
                  <span className="render-phase">{data.phase}</span>
                  <span className="render-duration">
                    {data.actualDuration.toFixed(2)}ms
                  </span>
                  <div 
                    className="render-bar"
                    style={{
                      width: `${Math.min(100, (data.actualDuration / 50) * 100)}%`,
                      backgroundColor: data.actualDuration > threshold 
                        ? 'var(--danger-color)' 
                        : 'var(--success-color)'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// HOC for easier usage
export const withPerformanceProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  profileId: string,
  options?: Omit<PerformanceProfilerProps, 'id' | 'children'>
) => {
  const ProfiledComponent = (props: P) => (
    <PerformanceProfiler id={profileId} {...options}>
      <Component {...props} />
    </PerformanceProfiler>
  );
  
  ProfiledComponent.displayName = `withPerformanceProfiler(${Component.displayName || Component.name})`;
  
  return ProfiledComponent;
};

export default PerformanceProfiler;