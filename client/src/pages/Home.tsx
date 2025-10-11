import React from 'react';
import { HeroSection } from '@/components/HeroSection';

export default function Home() {
  return (
    <>
      {/* Cosmic Background */}
      <div className="cosmic-bg"></div>
      <div className="cosmic-particles"></div>
      
      {/* Content Wrapper */}
      <div className="content-wrapper">
        <HeroSection />
        <div></div>
      </div>
    </>
  );
}
