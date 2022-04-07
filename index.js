const fs = require("fs");
const sharp = require("sharp");

const process = async (filename, scaleLimit = 2) => {
  let image = await sharp(filename).png();
  const metadata = await image.metadata();

  const size = Math.max(metadata.width, metadata.height);
  image = await image.resize(size, size, { fit: "contain" });

  for (let z = 1; z <= 8; z++) {
    const fixScale =
      (512 * 2 ** (z - 1)) / Math.min(metadata.width, metadata.height);

    const boardSize = {
      width: metadata.width * fixScale,
      height: metadata.height * fixScale,
    };

    const countTilesX = Math.ceil(boardSize.width / 256);
    const countTilesY = Math.ceil(boardSize.height / 256);

    const newWidth = countTilesX * 256;
    const newHeight = countTilesY * 256;

    const scale = Math.max(
      newWidth / metadata.width,
      newHeight / metadata.height
    );

    if (scale > scaleLimit) continue;

    const resizedImage = await image.resize(newWidth, newHeight);

    for (let y = 0; y < countTilesY; y++) {
      for (let x = 0; x < countTilesX; x++) {
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
