import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

export default function GlobeHero() {
    const globeRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

    // Handle window resize for responsive globe size
    useEffect(() => {
        function handleResize() {
            // Give enough canvas space on different viewports
            const width = window.innerWidth > 768 ? window.innerWidth * 0.55 : window.innerWidth;
            const height = window.innerHeight > 768 ? window.innerHeight * 0.9 : window.innerHeight * 0.6;
            setDimensions({ width, height });
        }

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Set autorotate and initial camera position
    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.2;
            controls.enableZoom = false; // Disable zoom to keep UI robust

            // Position camera focusing on Turkey/Europe, a bit higher altitude
            globeRef.current.pointOfView({ lat: 39, lng: 35, altitude: 2.2 }, 1500);
        }
    }, []);

    // Completely removed points and arcs to ensure a clean, smooth globe appearance

    return (
        <div className="absolute -top-[10%] md:-top-[20%] right-0 z-0 h-full w-full flex justify-end items-center overflow-hidden pointer-events-none md:pointer-events-auto mix-blend-screen opacity-[0.85]">
            {/* Container aligned to right half on desktop */}
            <div className="transform md:translate-x-[5%] translate-x-0 w-[120%] md:w-auto flex justify-center mt-[-15vh] md:mt-[-10vh]">
                <Globe
                    ref={globeRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundColor="rgba(0,0,0,0)" // Fully transparent background
                    atmosphereColor="#3b82f6"
                    atmosphereAltitude={0.25}
                />
            </div>

            {/* Holographic Logo Projection Overlay */}
            <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[15%] pointer-events-none z-20 overflow-hidden mix-blend-screen perspective-[1000px] mt-[-15vh] md:mt-[-10vh]">
                <div className="relative flex flex-col items-center justify-center transform-gpu" style={{ animation: 'floatHolo 6s ease-in-out infinite' }}>
                    {/* The Logo itself with 3D rotation and glow */}
                    <img
                        src="/sqlogo.png"
                        alt="IAC Logo"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10"
                        style={{
                            filter: 'drop-shadow(0px 0px 30px rgba(59, 130, 246, 0.8)) brightness(1.2) contrast(1.1)',
                            animation: 'spinHolo 15s linear infinite'
                        }}
                    />
                    {/* Hologram Base Glow Platform */}
                    <div className="w-64 h-16 md:w-80 md:h-20 bg-blue-500/20 rounded-[100%] absolute -bottom-8 md:-bottom-10 blur-xl opacity-80" />

                    {/* Hologram Light Beams */}
                    <div className="absolute -bottom-16 w-32 md:w-48 h-[60vh] bg-gradient-to-t from-blue-600/30 via-cyan-400/10 to-transparent blur-md rounded-[100%] opacity-60" style={{ transform: 'rotateX(75deg)', animation: 'pulseHoloBeam 3s ease-in-out infinite alternate' }} />
                </div>
            </div>

            {/* Custom Animations defined for the hologram */}
            <style>{`
                @keyframes floatHolo {
                    0%, 100% { transform: translateY(0) rotateX(10deg); }
                    50% { transform: translateY(-20px) rotateX(15deg); }
                }
                @keyframes spinHolo {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                }
                @keyframes pulseHoloBeam {
                    0% { opacity: 0.4; filter: blur(10px); }
                    100% { opacity: 0.8; filter: blur(15px); }
                }
            `}</style>

            {/* Overlay to create a dark gradient masking effect so globe blends into the dark background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10 hidden md:block"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none z-10"></div>
        </div>
    );
}
