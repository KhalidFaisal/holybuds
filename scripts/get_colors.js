const { Jimp, rgbaToInt } = require('jimp');
async function getColors(imagePath) {
    const image = await Jimp.read(imagePath);
    const colorCounts = {};

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];

        if (a < 50) return; // ignore transparent
        if (r > 240 && g > 240 && b > 240) return; // ignore white-ish
        if (r < 15 && g < 15 && b < 15) return; // ignore black-ish

        const hex = rgbaToInt(r, g, b, 255).toString(16).padStart(8, '0').slice(0, 6);        
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    });

    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    console.log(`Colors for ${imagePath}:`);
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
        console.log(`#${sorted[i][0]} - Count: ${sorted[i][1]}`);
    }
}

async function run() {
    try {
        await getColors('./public/logo.png');
        await getColors('./public/icon.png');
    } catch (e) {
        console.error(e);
    }
}

run();
