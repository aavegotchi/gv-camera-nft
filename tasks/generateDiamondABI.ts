const fs = require("fs");
import { AbiCoder } from "@ethersproject/abi";
import { task } from "hardhat/config";

export interface GenerateABITaskParams {
  basePath: string;
  libraryBasePath: string;
  exportPath: string;
  removeTupleArrays: string;
}

task(
  "diamondABI",
  "Generates ABI file for diamond, includes all ABIs of facets"
)
  .addParam("basePath")
  .addParam("libraryBasePath")
  .addParam("exportPath")
  .addParam(
    "removeTupleArrays",
    "optional param for removing tuple arrays from the ABI, to be used in subgraph imports"
  )
  .setAction(
    async ({ basePath, libraryBasePath, exportPath, removeTupleArrays }) => {
      let files = fs.readdirSync("." + basePath);
      let abi: AbiCoder[] = [];
      for (const file of files) {
        const jsonFile = file.replace("sol", "json");
        let json = fs.readFileSync(
          `./artifacts/${basePath}${file}/${jsonFile}`
        );
        json = JSON.parse(json);
        abi.push(...json.abi);
      }
      files = fs.readdirSync("." + libraryBasePath);
      for (const file of files) {
        const jsonFile = file.replace("sol", "json");
        let json = fs.readFileSync(
          `./artifacts/${libraryBasePath}${file}/${jsonFile}`
        );
        json = JSON.parse(json);
        abi.push(...json.abi);
      }
      // files = fs.readdirSync("." + sharedLibraryBasePath);
      // for (const file of files) {
      //   const jsonFile = file.replace("sol", "json");
      //   let json = fs.readFileSync(
      //     `./artifacts/${sharedLibraryBasePath}${file}/${jsonFile}`
      //   );
      //   json = JSON.parse(json);
      //   abi.push(...json.abi);
      // }
      let finalAbi = JSON.stringify(abi);

      if (removeTupleArrays === "true") {
        //todo: implement this functionality
        fs.writeFileSync(`${exportPath}_noTuple`, finalAbi);
        console.log(`ABI written to ${exportPath}`);
      } else {
        fs.writeFileSync(exportPath, finalAbi);
        console.log(`ABI written to ${exportPath}`);
      }
    }
  );
