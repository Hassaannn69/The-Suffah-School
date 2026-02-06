/**
 * Hero particles – educational shapes (circles, squares, plus) over gradient.
 * White 30% opacity, slow upward float, repulse on hover.
 * Requires: @tsparticles/slim loaded before this script.
 */
(function () {
    'use strict';

    var HERO_PARTICLES_ID = 'hero-particles';

    /* Plus sign as inline SVG (white; particle opacity applies) */
    var plusSvg = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'
    );

    var config = {
        fullScreen: false,
        detectRetina: true,
        background: { color: { value: 'transparent' } },
        particles: {
            number: { value: 45, density: { enable: true, width: 800, height: 600 } },
            color: { value: '#ffffff' },
            opacity: { value: 0.3 },
            shape: {
                type: ['circle', 'square', 'image'],
                options: {
                    image: [{ src: plusSvg, width: 20, height: 20, replaceColor: true }]
                }
            },
            size: { value: { min: 4, max: 14 } },
            move: {
                enable: true,
                speed: 0.5,
                direction: 'top',
                straight: false,
                outModes: { default: 'out', bottom: 'none' },
                random: true,
                drift: 0.15
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onHover: { enable: true, mode: 'repulse' },
                onClick: { enable: false }
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.25,
                    factor: 0.6,
                    speed: 0.5
                }
            }
        }
    };

    function initHeroParticles() {
        var container = document.getElementById(HERO_PARTICLES_ID);
        if (!container) return;
        var tsParticles = window.tsParticles || window.particlesJS;
        if (!tsParticles) return;
        if (tsParticles.load) {
            tsParticles.load(HERO_PARTICLES_ID, config).catch(function (err) {
                console.warn('Hero particles failed to load:', err);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroParticles);
    } else {
        initHeroParticles();
    }

    window.initHeroParticles = initHeroParticles;
})();
