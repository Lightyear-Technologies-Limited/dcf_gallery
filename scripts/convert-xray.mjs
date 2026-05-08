import sharp from "sharp";
const src = "C:/Users/MichaelDavison/AppData/Local/Temp/xray.avif";
const big = await sharp(src).webp({ quality: 90 }).toFile("public/art/optimized/operator-x-ray-machine.webp");
console.log("optimized:", big.width + "x" + big.height, big.size, "bytes");
const small = await sharp(src).resize({ width: 800 }).webp({ quality: 80 }).toFile("public/art/thumbs/operator-x-ray-machine.webp");
console.log("thumb:", small.width + "x" + small.height, small.size, "bytes");
