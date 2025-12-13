"use client";
import React, { useEffect, useRef } from "react";

export default function NetworkBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        // Node Configuration
        const nodeCount = 60;
        const connectDistance = 150;
        const nodes: { x: number; y: number; vx: number; vy: number }[] = [];

        // Initialize Nodes
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5, // Slow movement
                vy: (Math.random() - 0.5) * 0.5,
            });
        }

        // Animation Loop
        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, w, h);

            // Update and Draw Nodes
            nodes.forEach((node, i) => {
                // Move
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off walls
                if (node.x < 0 || node.x > w) node.vx *= -1;
                if (node.y < 0 || node.y > h) node.vy *= -1;

                // Draw Node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(45, 212, 191, 0.6)"; // Teal-400
                ctx.fill();

                // Draw Connections
                for (let j = i + 1; j < nodeCount; j++) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectDistance) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        const opacity = 1 - dist / connectDistance;
                        ctx.strokeStyle = `rgba(45, 212, 191, ${opacity * 0.2})`; // Faint Teal
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // Handle Resize
        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none bg-[#020817]" // Deep Space Black
        />
    );
}
