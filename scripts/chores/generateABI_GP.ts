import { run } from "hardhat";

async function generateABI_GP() {
  await run("diamondABI", {
    basePath: "/contracts/GPDiamond/facets/",
    libraryBasePath: "/contracts/libraries/",
    exportPath: "./diamondABI/diamond_gp.json",
    removeTupleArrays: "false",
  });
}

if (require.main === module) {
  generateABI_GP()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generateABI_GP };
