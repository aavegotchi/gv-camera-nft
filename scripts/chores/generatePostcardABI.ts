import { run } from "hardhat";

async function generatePostcardABI() {
  await run("diamondABI", {
    basePath: "/contracts/PostcardDiamond/facets/",
    libraryBasePath: "/contracts/libraries/",
    exportPath: "./diamondABI/diamondPostcard.json",
    removeTupleArrays: "true",
  });
}

if (require.main === module) {
  generatePostcardABI()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generatePostcardABI };
