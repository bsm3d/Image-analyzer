/*
    Author : Benoit (BSM3D) Saint-Moulin
    2025 © BSM3D
    www.bsm3d.com
    Free to use and for Learning purpose.
    
*/

class ImageAnalyzer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    async analyze(img) {
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        return {
            patterns: this.detectPatterns(data),
            textures: this.analyzeTextures(data),
            colors: this.analyzeColors(data),
            symmetry: this.analyzeSymmetry(data),
            noise: this.analyzeNoise(data),
            artifacts: this.detectArtifacts(data)
        };
    }

    detectPatterns(data) {
        let sharpEdges = 0;
        let repeatingPatterns = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Détection des bords nets
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width - 1; x++) {
                const i = (y * width + x) * 4;
                const nextI = (y * width + x + 1) * 4;

                const diff = Math.abs(data[i] - data[nextI]) + 
                           Math.abs(data[i+1] - data[nextI+1]) +
                           Math.abs(data[i+2] - data[nextI+2]);
                
                if (diff > 100) sharpEdges++;
            }
        }

        // Détection des motifs répétitifs
        for (let y = 0; y < height - 8; y += 8) {
            for (let x = 0; x < width - 8; x += 8) {
                const patterns = new Set();
                for (let dy = 0; dy < 8; dy++) {
                    for (let dx = 0; dx < 8; dx++) {
                        const i = ((y + dy) * width + (x + dx)) * 4;
                        patterns.add(`${data[i]},${data[i+1]},${data[i+2]}`);
                    }
                }
                if (patterns.size < 32) { // Si moins de la moitié des pixels sont uniques
                    repeatingPatterns++;
                }
            }
        }

        return {
            sharpEdges: sharpEdges / (width * height),
            repeatingPatterns: repeatingPatterns / ((width * height) / 64)
        };
    }

    analyzeTextures(data) {
        let uniformity = 0;
        let complexity = 0;
        let unnaturalGradients = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const surrounding = [
                    ((y-1) * width + x) * 4,
                    ((y+1) * width + x) * 4,
                    (y * width + x-1) * 4,
                    (y * width + x+1) * 4
                ];

                // Analyse de variation locale
                let localVariation = 0;
                let gradientCount = 0;
                surrounding.forEach(sIdx => {
                    const variation = Math.abs(data[idx] - data[sIdx]) +
                                    Math.abs(data[idx+1] - data[sIdx+1]) +
                                    Math.abs(data[idx+2] - data[sIdx+2]);
                    localVariation += variation;
                    if (variation > 0 && variation < 10) gradientCount++;
                });

                if (localVariation < 50) uniformity++;
                if (localVariation > 200) complexity++;
                if (gradientCount >= 3) unnaturalGradients++; // Détection de dégradés trop parfaits
            }
        }

        const totalPixels = (width-2) * (height-2);
        return {
            uniformity: uniformity / totalPixels,
            complexity: complexity / totalPixels,
            unnaturalGradients: unnaturalGradients / totalPixels
        };
    }

    analyzeColors(data) {
        const colors = new Set();
        const saturations = [];
        const luminances = [];
        let colorBanding = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // Analyse des couleurs uniques
            colors.add(`${Math.floor(r/8)},${Math.floor(g/8)},${Math.floor(b/8)}`);

            // Calcul de la saturation
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            saturations.push(saturation);

            // Calcul de la luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            luminances.push(luminance);

            // Détection du "color banding"
            if (i > 0 && i < data.length - 4) {
                const prevR = data[i-4];
                const prevG = data[i-3];
                const prevB = data[i-2];
                const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
                if (diff > 0 && diff < 5) colorBanding++;
            }
        }

        return {
            uniqueColors: colors.size,
            averageSaturation: saturations.reduce((a,b) => a + b) / saturations.length,
            saturationVariance: this.calculateVariance(saturations),
            luminanceVariance: this.calculateVariance(luminances),
            colorBanding: colorBanding / (data.length / 4)
        };
    }

    analyzeSymmetry(data) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        let horizontalSymmetry = 0;
        let verticalSymmetry = 0;

        // Symétrie horizontale
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                const leftIdx = (y * width + x) * 4;
                const rightIdx = (y * width + (width - 1 - x)) * 4;
                const diff = Math.abs(data[leftIdx] - data[rightIdx]) +
                           Math.abs(data[leftIdx+1] - data[rightIdx+1]) +
                           Math.abs(data[leftIdx+2] - data[rightIdx+2]);
                if (diff < 30) horizontalSymmetry++;
            }
        }

        // Symétrie verticale
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height / 2; y++) {
                const topIdx = (y * width + x) * 4;
                const bottomIdx = ((height - 1 - y) * width + x) * 4;
                const diff = Math.abs(data[topIdx] - data[bottomIdx]) +
                           Math.abs(data[topIdx+1] - data[bottomIdx+1]) +
                           Math.abs(data[topIdx+2] - data[bottomIdx+2]);
                if (diff < 30) verticalSymmetry++;
            }
        }

        return {
            horizontalSymmetry: horizontalSymmetry / ((width/2) * height),
            verticalSymmetry: verticalSymmetry / (width * (height/2))
        };
    }

    analyzeNoise(data) {
        let naturalNoise = 0;
        let artificialNoise = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const surrounding = [
                    ((y-1) * width + x) * 4,
                    ((y+1) * width + x) * 4,
                    (y * width + x-1) * 4,
                    (y * width + x+1) * 4
                ];

                let variations = surrounding.map(sIdx => {
                    return Math.abs(data[idx] - data[sIdx]) +
                           Math.abs(data[idx+1] - data[sIdx+1]) +
                           Math.abs(data[idx+2] - data[sIdx+2]);
                });

                // Bruit naturel : variations légères et irrégulières
                if (Math.max(...variations) < 30 && Math.min(...variations) > 5) {
                    naturalNoise++;
                }
                // Bruit artificiel : variations régulières ou extrêmes
                else if (variations.every(v => Math.abs(v - variations[0]) < 2) || 
                         Math.max(...variations) > 100) {
                    artificialNoise++;
                }
            }
        }

        const totalPixels = (width-2) * (height-2);
        return {
            naturalNoise: naturalNoise / totalPixels,
            artificialNoise: artificialNoise / totalPixels
        };
    }

    detectArtifacts(data) {
        let compressionArtifacts = 0;
        let perfectEdges = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const surrounding = [
                    ((y-1) * width + x) * 4,
                    ((y+1) * width + x) * 4,
                    (y * width + x-1) * 4,
                    (y * width + x+1) * 4
                ];

                // Détection d'artéfacts de compression
                let blockiness = 0;
                surrounding.forEach(sIdx => {
                    const diff = Math.abs(data[idx] - data[sIdx]) +
                               Math.abs(data[idx+1] - data[sIdx+1]) +
                               Math.abs(data[idx+2] - data[sIdx+2]);
                    if (diff === 0 || diff > 100) blockiness++;
                });
                if (blockiness >= 3) compressionArtifacts++;

                // Détection de bords trop parfaits
                let perfectEdgeCount = 0;
                for (let i = 0; i < surrounding.length - 1; i++) {
                    const diff1 = Math.abs(data[surrounding[i]] - data[surrounding[i+1]]);
                    if (diff1 === 0 || diff1 > 200) perfectEdgeCount++;
                }
                if (perfectEdgeCount >= 2) perfectEdges++;
            }
        }

        const totalPixels = (width-2) * (height-2);
        return {
            compressionArtifacts: compressionArtifacts / totalPixels,
            perfectEdges: perfectEdges / totalPixels
        };
    }

    calculateVariance(array) {
        const mean = array.reduce((a, b) => a + b) / array.length;
        return array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length;
    }

calculateScore(analysis) {
    let score = 0;

    // 1. Analyse des Patterns (30 points)
    // Recherche de motifs répétitifs et de bords nets plus sophistiquée
    if (analysis.patterns.repeatingPatterns > 0.35) score += 15; 
    if (analysis.patterns.sharpEdges > 0.18) score += 15;

    // 2. Analyse des Textures (25 points)
    // Détection de textures artificielles plus fine
    if (analysis.textures.uniformity > 0.7) score += 10; 
    if (analysis.textures.unnaturalGradients > 0.45) score += 10; 
    if (analysis.textures.complexity < 0.15) score += 5; 

    // 3. Analyse des Couleurs (20 points)
    if (analysis.colors.colorBanding > 0.35) score += 7; 
    if (analysis.colors.uniqueColors < 400) score += 6; 
    if (analysis.colors.saturationVariance < 0.08) score += 7; 

    // 4. Symétrie (10 points)
    if (analysis.symmetry.horizontalSymmetry > 0.85) score += 5;
    if (analysis.symmetry.verticalSymmetry > 0.85) score += 5;

    // 5. Analyse du Bruit (10 points)
    if (analysis.noise.artificialNoise > 0.35) score += 6;
    if (analysis.noise.naturalNoise < 0.03) score += 4;

    // 6. Artifacts (5 points)
    if (analysis.artifacts.compressionArtifacts > 0.35) score += 3;
    if (analysis.artifacts.perfectEdges > 0.25) score += 2;

    // Vérification supplémentaire pour les images de type événementiel
    if (this.detectEventPhoto(analysis)) {
        score = Math.max(10, score * 0.5); // Réduction plus agressive
    }

    return Math.min(100, Math.max(0, score));
}

detectEventPhoto(analysis) {
    // Critères plus stricts pour identifier une photo réelle
    return (
        analysis.textures.complexity > 0.35 && // Textures plus complexes
        analysis.noise.naturalNoise > 0.15 && // Plus de bruit naturel
        analysis.colors.saturationVariance > 0.15 && // Variation de couleurs plus naturelle
        (analysis.symmetry.horizontalSymmetry < 0.6 || 
         analysis.symmetry.verticalSymmetry < 0.6) // Moins de symétrie
    );
}

 getIndicators(analysis) {
    const indicators = [];

    // Patterns
    if (analysis.patterns.repeatingPatterns > 0.35) {
        indicators.push("Motifs répétitifs hautement suspects");
    }
    if (analysis.patterns.sharpEdges > 0.18) {
        indicators.push("Bords nets artificiels détectés");
    }

    // Textures
    if (analysis.textures.uniformity > 0.7) {
        indicators.push("Textures anormalement uniformes");
    }
    if (analysis.textures.unnaturalGradients > 0.45) {
        indicators.push("Dégradés extrêmement artificiels");
    }

    // Couleurs
    if (analysis.colors.colorBanding > 0.35) {
        indicators.push("Bandes de couleurs très artificielles");
    }
    if (analysis.colors.uniqueColors < 400) {
        indicators.push("Palette de couleurs extrêmement limitée");
    }

    // Symétrie
    if (analysis.symmetry.horizontalSymmetry > 0.85 && 
        analysis.symmetry.verticalSymmetry > 0.85) {
        indicators.push("Symétrie presque parfaite (rare dans les photos naturelles)");
    }

    // Bruit
    if (analysis.noise.artificialNoise > 0.35) {
        indicators.push("Bruit numérique très artificiel");
    }
    if (analysis.noise.naturalNoise < 0.03) {
        indicators.push("Absence totale de bruit naturel");
    }

    return indicators;
}
 getIndicators(analysis) {
        const indicators = [];

	// First method
	// Patterns
	if (analysis.patterns.repeatingPatterns > 0.35) {
		indicators.push("Highly suspicious repetitive patterns");
	}
	if (analysis.patterns.sharpEdges > 0.18) {
		indicators.push("Artificial sharp edges detected");
	}
	// Textures
	if (analysis.textures.uniformity > 0.7) {
		indicators.push("Abnormally uniform textures");
	}
	if (analysis.textures.unnaturalGradients > 0.45) {
		indicators.push("Extremely artificial gradients");
	}
	// Colors
	if (analysis.colors.colorBanding > 0.35) {
		indicators.push("Highly artificial color banding");
	}
	if (analysis.colors.uniqueColors < 400) {
		indicators.push("Extremely limited color palette");
	}
	// Symmetry
	if (analysis.symmetry.horizontalSymmetry > 0.85 && 
		analysis.symmetry.verticalSymmetry > 0.85) {
		indicators.push("Almost perfect symmetry (rare in natural photos)");
	}
	// Noise
	if (analysis.noise.artificialNoise > 0.35) {
		indicators.push("Highly artificial digital noise");
	}
	if (analysis.noise.naturalNoise < 0.03) {
		indicators.push("Total absence of natural noise");
	}

	// Second method
	// Patterns
	if (analysis.patterns.sharpEdges > 0.1) {
		indicators.push("Significant presence of sharp edges");
	}
	if (analysis.patterns.repeatingPatterns > 0.3) {
		indicators.push("Suspicious repetitive patterns");
	}
	// Textures
	if (analysis.textures.uniformity > 0.6) {
		indicators.push("Abnormally uniform textures");
	}
	if (analysis.textures.complexity < 0.3) {
		indicators.push("Lack of natural details");
	}
	if (analysis.textures.unnaturalGradients > 0.4) {
		indicators.push("Artificial gradients detected");
	}
	// Colors
	if (analysis.colors.colorBanding > 0.3) {
		indicators.push("Presence of artificial color banding");
	}
	if (analysis.colors.averageSaturation > 0.7) {
		indicators.push("Abnormally high saturation");
	}
	if (analysis.colors.uniqueColors < 1000) {
		indicators.push("Limited color range");
	}
	if (analysis.colors.saturationVariance < 0.1) {
		indicators.push("Too uniform saturation variation");
	}
	// Symmetry
	if (analysis.symmetry.horizontalSymmetry > 0.8) {
		indicators.push("Suspicious horizontal symmetry");
	}
	if (analysis.symmetry.verticalSymmetry > 0.8) {
		indicators.push("Suspicious vertical symmetry");
	}
	// Noise
	if (analysis.noise.artificialNoise > 0.3) {
		indicators.push("Artificial digital noise detected");
	}
	if (analysis.noise.naturalNoise < 0.1) {
		indicators.push("Absence of natural noise");
	}
	// Artifacts
	if (analysis.artifacts.compressionArtifacts > 0.3) {
		indicators.push("Suspicious compression artifacts");
	}
	if (analysis.artifacts.perfectEdges > 0.2) {
		indicators.push("Too perfect edges");
	}

        return indicators;
    }
}

