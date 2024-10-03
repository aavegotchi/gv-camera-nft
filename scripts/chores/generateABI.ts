import { run } from "hardhat";

async function generateABI_AGC() {
  await run("diamondABI", {
    basePath: "/contracts/facets/",
    libraryBasePath: "/contracts/libraries/",
    exportPath: "./diamondABI/diamond.json",
    removeTupleArrays: "true",
  });
}

if (require.main === module) {
  generateABI_AGC()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generateABI_AGC };
