const fs = require("fs");
const sharp = require("sharp");

const process = async (filename, scaleLimit = 2) => {
  let image = await sharp(filename).png();
  const metadata = await image.metadata();

  const size = Math.max(metadata.width, metadata.height);

  image = await image.resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  for (let z = 0; z < 8; z++) {
    const newSize = 256 * 2 ** z;

    if (newSize / size > scaleLimit) continue;

    const resizedImage = await image.resize(newSize, newSize);

    for (let y = 0; y < newSize / 256; y++) {
      for (let x = 0; x < newSize / 256; x++) {
        const tile = await resizedImage.extract({
          left: x * 256,
          top: y * 256,
          width: 256,
          height: 256,
        });

        await tile.toFile(`./output/${z}_${y}_${x}.png`);
      }
    }
  }
};

if (fs.existsSync("./output")) {
  console.log("Deleting output folder");
  fs.rmSync("./output", { recursive: true, force: true });
}

fs.mkdirSync("./output");

const startsAt = Date.now();

process("image.png").then(() => {
  const time = Date.now() - startsAt;
  console.log(`finished ${time} ms`);
});
