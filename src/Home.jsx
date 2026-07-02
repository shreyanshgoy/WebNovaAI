// src/pages/Home.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import gsap from 'gsap';
import * as THREE from 'three';
import './Home.css';

const Home = () => {
  const titleRef = useRef(null);
  const btnRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef();

  // Detect dark mode
  const isDarkMode = () => document.body.classList.contains('dark-mode');

  // Three.js 3D background
  useEffect(() => {
    let renderer, scene, camera, particles, particleMaterial, animationId;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const particleCount = 120;
    const colorsLight = [0x00f2fe, 0x4facfe, 0x43e97b, 0xf7971e, 0xff512f];
    const colorsDark = [0x00f2fe, 0x4facfe, 0x43e97b, 0xf7971e, 0xff512f, 0x22223b, 0x232946];

    // Remove old renderer if any
    if (threeCanvasRef.current) {
      while (threeCanvasRef.current.firstChild) {
        threeCanvasRef.current.removeChild(threeCanvasRef.current.firstChild);
      }
    }

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // transparent
    threeCanvasRef.current.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 220;

    // Particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const colorPalette = isDarkMode() ? colorsDark : colorsLight;
    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      );
      const color = new THREE.Color(colorPalette[i % colorPalette.length]);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    particleMaterial = new THREE.PointsMaterial({
      size: 12,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Animate
    const animate = () => {
      particles.rotation.y += 0.0015;
      particles.rotation.x += 0.0007;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();
    animationRef.current = animationId;

    // Handle resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Handle theme change
    const observer = new MutationObserver(() => {
      // Update particle colors on theme change
      const newPalette = isDarkMode() ? colorsDark : colorsLight;
      const colorArr = geometry.getAttribute('color');
      for (let i = 0; i < particleCount; i++) {
        const color = new THREE.Color(newPalette[i % newPalette.length]);
        colorArr.setXYZ(i, color.r, color.g, color.b);
      }
      colorArr.needsUpdate = true;
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  // Animate title and button
  useEffect(() => {
    gsap.fromTo(titleRef.current,
      { y: -80, opacity: 0, rotationX: 60, textShadow: '0 0 40px #00f2fe' },
      { y: 0, opacity: 1, rotationX: 0, duration: 1.2, ease: 'power4.out', textShadow: '0 0 40px #00f2fe, 0 0 80px #4facfe' }
    );
    gsap.fromTo(btnRef.current,
      { y: 80, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, delay: 0.7, ease: 'back.out(1.7)' }
    );
  }, []);

  return (
    <>
      <Navbar />
      <div className="home-container wow-bg" ref={containerRef}>
        <div className="three-bg" ref={threeCanvasRef} />
        <div className="home-overlay">
          <h1 ref={titleRef} className="main-title wow-title">
            Build Websites with <span className="gradient-text">AI Superpowers</span>
          </h1>
          <p className="sub-text">Just describe it. We’ll build it.</p>
          <Link to="/builder">
            <button ref={btnRef} className="get-started-btn wow-btn">
              Get Started →
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
