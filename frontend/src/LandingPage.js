import React from 'react';
import { ArrowRight } from 'lucide-react';
import './LandingPage.css';
import orbImage from './assets/glowing-orb.png';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="landing-container">
      <div className="background-text">
        <span className="bg-word-left">Personal</span>
        <span className="bg-word-right">Assistant</span>
      </div>
      
      <div className="landing-content">
        <h1 className="landing-title">
          Get help from your<br />personal AI assistant
        </h1>
        
        <button className="cta-button" onClick={onGetStarted}>
          Start for free <ArrowRight size={20} className="arrow-icon" />
        </button>
        
        <div className="orb-container">
          <img src={orbImage} alt="Glowing Energy Orb" className="floating-orb" />
          <div className="orb-glow"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
