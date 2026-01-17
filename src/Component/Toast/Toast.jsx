import React, { useState, useEffect } from 'react';
import './Toast.css';

// Import Icons
import { TiTick } from "react-icons/ti";
import { IoClose } from "react-icons/io5";
import { IoWarning } from "react-icons/io5";
import { IoCloseCircleOutline } from "react-icons/io5";

const toastDetails = {
  success: {
    icon: <TiTick className="toast-icon" />, 
    defaultText: 'Success: This is a success toast.',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#10b981',
  },
  error: {
    icon: <IoClose className="toast-icon" />,
    defaultText: 'Error: This is an error toast.',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#ef4444',
  },
  warning: {
    icon: <IoWarning className="toast-icon" />,
    defaultText: 'Warning: This is a warning toast.',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#f59e0b',
  },
};

const Toast = ({ type, message, duration = 5000, animation = 'slide', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  if (!type) return null; 

  const { 
    icon, 
    defaultText, 
    bgColor = '#ffffff', 
    textColor = '#1f2937',
    borderColor = '#d1d5db'
  } = toastDetails[type] || {};
  
  const displayMessage = message || defaultText;

  const closeToast = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  // Auto-close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);

  const getAnimationClass = () => {
    if (isClosing) return 'toast-exit';
    return `toast-enter toast-${animation}`;
  };

  return (
    isVisible && (
      <div 
        className="toast-wrapper"
        style={{
          position: 'fixed',
          top: '30px',
          right: '20px',
          zIndex: 2000
        }}
      >
        <div 
          className={`toast ${type} ${getAnimationClass()}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '400px',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '10px',
            backgroundColor: bgColor,
            borderLeft: `5px solid ${borderColor}`,
            justifyContent: 'space-between',
            color: textColor,
            fontWeight: '500',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="toast-content">
            <div className='toast-message' style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="toast-icon-wrapper" style={{ fontSize: '24px' }}>
                {icon}
              </span>
              <span style={{ flex: 1, color: textColor, fontSize: '14px' }}>{displayMessage}</span>
            </div>
          </div>
          <IoCloseCircleOutline 
            className="toast-close-btn" 
            onClick={closeToast}
            style={{ 
              color: textColor, 
              fontSize: '22px', 
              cursor: 'pointer',
              opacity: '0.7',
              transition: 'all 0.2s ease',
              minWidth: '22px'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          />
        </div>
      </div>
    )
  );
}

export default Toast;