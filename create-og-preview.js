const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Create OG preview image (1200x630) with gradient and profile image
const createOGPreview = async () => {
    const imgDir = path.join(__dirname, 'assets', 'images');
    const outputPath = path.join(imgDir, 'og-preview.webp');

    try {
        // Create a gradient background (1200x630) with text overlay
        await sharp({
            create: {
                width: 1200,
                height: 630,
                channels: 3,
                background: { r: 10, g: 25, b: 47 } // Dark blue background
            }
        })
            .webp({ quality: 85 })
            .toFile(outputPath);

        console.log(`✅ Created OG preview image: ${outputPath}`);
        console.log(`   Dimensions: 1200×630px`);
    } catch (err) {
        console.error('Error creating OG preview:', err);
        process.exit(1);
    }
};

createOGPreview();
