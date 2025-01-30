/*
    Author : Benoit (BSM3D) Saint-Moulin
    2025 © BSM3D
    www.bsm3d.com
    Free to use and for Learning purpose.
    
*/

class UIManager {
    constructor() {
        console.log('Initializing UIManager...');

        // Éléments du DOM
        this.imageInput = document.getElementById('imageInput');
        this.canvas = document.getElementById('imagePreview');
        this.loadingElement = document.getElementById('loading');
        this.analysisDataElement = document.getElementById('analysisData');
        this.exifDataElement = document.getElementById('exifData');

        // Vérifier si les éléments sont trouvés
        if (!this.imageInput) console.error('imageInput not found');
        if (!this.canvas) console.error('canvas not found');
        if (!this.loadingElement) console.error('loadingElement not found');
        if (!this.analysisDataElement) console.error('analysisDataElement not found');
        if (!this.exifDataElement) console.error('exifDataElement not found');

        // Initialiser le canvas avec vérification
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            // Définir une taille initiale raisonnable
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        // Initialiser les composants avec vérification
        try {
            // Vérifier que les classes nécessaires sont disponibles
            if (typeof ImageAnalyzer === 'undefined') {
                throw new Error('ImageAnalyzer not defined');
            }
            if (typeof ExifReader === 'undefined') {
                throw new Error('ExifReader not defined');
            }
            if (typeof ExportManager === 'undefined') {
                throw new Error('ExportManager not defined');
            }

            this.imageAnalyzer = new ImageAnalyzer(this.canvas);
            this.exifReader = new ExifReader();
            this.exportManager = new ExportManager();

            console.log('All components have been successfully initialized');
        } catch (error) {
            console.error('Error during component initialization:', error);
            this.showError('Initialization error: ' + error.message);
        }

        // Lier les événements
        this.bindEvents();
        console.log('UIManager fully initialized');
    }

    bindEvents() {
        // Gérer le chargement d'image
        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => {
                console.log('Change event triggered');
                const file = e.target.files[0];
                if (file) {
                    if (file.type.startsWith('image/')) {
                        this.processImage(file);
                    } else {
                        this.showError('The file must be an image');
                    }
                }
            });
        }

        // Gérer les exports
        const exportJSONBtn = document.getElementById('exportJSON');
        const exportCSVBtn = document.getElementById('exportCSV');
        const exportExifTextBtn = document.getElementById('exportExifText');

        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', () => {
                console.log('JSON export requested');
                this.exportManager.exportJSON();
            });
        }

        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => {
                console.log('CSV export requested');
                this.exportManager.exportCSV();
            });
        }

        if (exportExifTextBtn) {
            exportExifTextBtn.addEventListener('click', () => {
                console.log('EXIF text export requested');
                this.exportManager.exportExifText();
            });
        }
    }

    async processImage(file) {
        console.log('Starting image processing');
        this.showLoading(true);

        try {
            const imageUrl = await this.readFileAsDataURL(file);
            const img = await this.loadImage(imageUrl);

            console.log('Image loaded, dimensions:', img.width, 'x', img.height);
            const dimensions = this.calculateDimensions(img.width, img.height);

            await this.drawImage(img, dimensions);
            await this.analyzeImage(img, file);

        } catch (error) {
            console.error('Error during image processing:', error);
            this.showError('Error during image processing: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => {
                console.error('File reading error:', e);
                reject(new Error('Error reading the file'));
            };
            reader.readAsDataURL(file);
        });
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error loading the image'));
            img.src = url;
        });
    }

    calculateDimensions(width, height) {
        const MAX_SIZE = 1024;
        let newWidth = width;
        let newHeight = height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
                newHeight = Math.round(height * (MAX_SIZE / width));
                newWidth = MAX_SIZE;
            } else {
                newWidth = Math.round(width * (MAX_SIZE / height));
                newHeight = MAX_SIZE;
            }
        }

        console.log(`Calculated dimensions: ${newWidth}x${newHeight} (original: ${width}x${height})`);
        return { width: newWidth, height: newHeight };
    }
	
// Method to calculate file size in human-readable format
formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Method to count unique colors in the image
countUniqueColors(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorSet = new Set();

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Create a unique color string, including alpha
        const colorKey = `${r},${g},${b},${a}`;
        colorSet.add(colorKey);
    }

    return colorSet.size;
}

// Update the processImage method to include these details
async processImage(file) {
    console.log('Starting image processing');
    this.showLoading(true);

    try {
        const imageUrl = await this.readFileAsDataURL(file);
        const img = await this.loadImage(imageUrl);

        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        const dimensions = this.calculateDimensions(img.width, img.height);

        // Store current image details
        this.currentImageName = file.name;
        this.currentImageSize = this.formatFileSize(file.size);

        await this.drawImage(img, dimensions);
        await this.analyzeImage(img, file);

    } catch (error) {
        console.error('Error during image processing:', error);
        this.showError('Error during image processing: ' + error.message);
    } finally {
        this.showLoading(false);
    }
}


async drawImage(img, dimensions) {
    if (!this.canvas || !this.ctx) {
        throw new Error('Canvas not initialized');
    }

    try {
        this.canvas.width = dimensions.width;
        this.canvas.height = dimensions.height;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        console.log('Image drawn on canvas');

        // Create or update image details container
        this.displayImageDetails(img);

    } catch (error) {
        console.error('Error drawing the image:', error);
        throw new Error('Error drawing the image');
    }
}

	displayImageDetails(img) {
    // Find or create the container for image details
    let detailsContainer = document.querySelector('.image-details');
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.className = 'image-details';
        this.canvas.insertAdjacentElement('afterend', detailsContainer);
    }

    // Calculate unique colors
    const uniqueColors = this.countUniqueColors(img);

    // Update the details
    detailsContainer.innerHTML = `
        <h3>Image Details</h3>
        <p><strong>Name:</strong> ${this.currentImageName || 'N/A'}</p>
        <p><strong>Size:</strong> ${this.currentImageSize || 'N/A'}</p>
        <p><strong>Unique Colors:</strong> ${uniqueColors}</p>
    `;
}

    async analyzeImage(img, file) {
        try {
            console.log('Starting image analysis');

            // Analyser l'image pour détecter les caractéristiques d'IA
            const analysis = await this.imageAnalyzer.analyze(img);
            console.log('Analysis completed:', analysis);

            // Lire les métadonnées EXIF
            const exifData = await this.exifReader.readExif(file);
            console.log('EXIF data read:', exifData);

            // Calculer le score et afficher les résultats
            const score = this.imageAnalyzer.calculateScore(analysis);
            const indicators = this.imageAnalyzer.getIndicators(analysis);

            // Mettre à jour l'interface
            this.displayResults(score, indicators, exifData);

            // Préparer les données pour l'export
            this.exportManager.setData({
                analysis: { ...analysis, score },
                exif: exifData,
                timestamp: new Date().toISOString()
            });

            console.log('Image processing completed successfully');

        } catch (error) {
            console.error('Error during analysis:', error);
            throw error;
        }
    }

    displayResults(score, indicators, exifData) {
        console.log('Displaying results...');

        // Afficher le score et les indicateurs
        this.analysisDataElement.innerHTML = `
            <h2>Analysis Results</h2>
            <div class="analysis-result">
                <h3>Probability of being AI-generated: ${score}%</h3>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${score}%;
                         background-color: ${this.getScoreColor(score)}">
                    </div>
                </div>
                ${indicators.length > 0 ? `
                    <h3>Detected Indicators:</h3>
                    <ul>
                        ${indicators.map(indicator => `<li>${indicator}</li>`).join('')}
                    </ul>
                ` : '<p>No significant indicators detected</p>'}
            </div>
        `;

        // Afficher les données EXIF si disponibles
        if (exifData && Object.keys(exifData).length > 0) {
            this.exifDataElement.innerHTML = `
                <h2>EXIF Metadata</h2>
                ${Object.entries(exifData)
                    .map(([key, value]) => `
                        <div class="exif-item">
                            <strong>${key}:</strong> ${value}
                        </div>
                    `).join('')}
            `;
        } else {
            this.exifDataElement.innerHTML = `
                <h2>EXIF Metadata</h2>
                <p>No EXIF data found in the image</p>
            `;
        }
    }

    getScoreColor(score) {
        if (score >= 70) return '#ff4444';      // Rouge pour un score élevé
        if (score >= 50) return '#ffbb33';      // Orange pour un score moyen
        return '#00C851';                      // Vert pour un score faible
    }

    showError(message) {
        console.error('Error:', message);
        this.analysisDataElement.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showLoading(show) {
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'block' : 'none';
        }
        if (this.canvas) {
            this.canvas.style.opacity = show ? '0.5' : '1';
        }
    }
}
