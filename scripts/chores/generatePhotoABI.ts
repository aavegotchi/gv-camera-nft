import { run } from "hardhat";

async function generatePhotoABI() {
  await run("diamondABI", {
    basePath: "/contracts/PhotoDiamond/facets/",
    libraryBasePath: "/contracts/libraries/",
    exportPath: "./diamondABI/diamondPhoto.json",
    removeTupleArrays: "true",
  });
}

if (require.main === module) {
  generatePhotoABI()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generatePhotoABI };
