/**
 * Command to run this script:
 * npm install sharp && node optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Optimize images located in any of the asset sub‑folders (images, brand, projects)
const assetsRoot = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsRoot)) {
    console.error(`Directory not found: ${assetsRoot}`);
    process.exit(1);
}

// iterate over each subdirectory inside assets
fs.readdir(assetsRoot, (err, dirs) => {
    if (err) {
        console.error('Could not list the assets directory.', err);
        process.exit(1);
    }

    dirs.forEach(folder => {
        const imgDir = path.join(assetsRoot, folder);
        if (!fs.lstatSync(imgDir).isDirectory()) return; // skip files

        fs.readdir(imgDir, (err, files) => {
            if (err) {
                console.error(`Could not list directory ${imgDir}.`, err);
                return;
            }

            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
            });

            if (imageFiles.length === 0) {
                console.log(`No PNG or JPG images in ${imgDir}.`);
                return;
            }

            imageFiles.forEach(file => {
                const filePath = path.join(imgDir, file);
                const fileNameWithoutExt = path.parse(file).name;
                const outputPath = path.join(imgDir, `${fileNameWithoutExt}.webp`);

                sharp(filePath)
                    .webp({ quality: 80 })
                    .toFile(outputPath)
                    .then(info => {
                        console.log(`Converted: ${file} -> ${fileNameWithoutExt}.webp in ${folder}`);
                    })
                    .catch(err => {
                        console.error(`Error converting ${file} in ${folder}:`, err);
                    });
            });
        });
    });
});
