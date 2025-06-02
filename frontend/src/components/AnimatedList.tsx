import React, { useEffect, useRef, useState } from 'react';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  animationDuration?: number;
}

interface AnimatedItemProps {
  children: React.ReactNode;
  index: number;
  isNew?: boolean;
  onRemove?: () => void;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  index, 
  isNew = false,
  onRemove 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    if (isNew) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, index * 50); // Stagger effect
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [index, isNew]);

  const handleRemove = () => {
    setIsRemoving(true);
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      if (onRemove) onRemove();
    }, 300);
  };

  return (
    <div
      ref={itemRef}
      className={`animated-list-item ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}
      style={{
        opacity: isVisible && !isRemoving ? 1 : 0,
        transform: `translateX(${isVisible && !isRemoving ? 0 : isRemoving ? 20 : -20}px)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: isNew ? `${index * 50}ms` : '0ms'
      }}
    >
      {React.cloneElement(children as React.ReactElement, { onRemove: handleRemove })}
    </div>
  );
};

export const AnimatedList: React.FC<AnimatedListProps> = ({ 
  children, 
  className = '',
  animationDuration = 300 
}) => {
  return (
    <div className={`animated-list ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedList;