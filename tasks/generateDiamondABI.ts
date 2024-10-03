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
    async ({
      basePath,
      libraryBasePath,
      exportPath,
      removeTupleArrays,
    }: GenerateABITaskParams) => {
      function removeDuplicateEvents(inputAbi: any): AbiCoder[] {
        const events = new Set<string>();
        const uniqueEvents = new Set<string>();
        const filteredAbi = inputAbi.filter((item: any) => {
          if (item.type === "event") {
            const eventSignature = `${item.name}(${item.inputs
              .map((input: { type: string }) => input.type)
              .join(",")})`;
            if (uniqueEvents.has(eventSignature)) {
              return false;
            }
            uniqueEvents.add(eventSignature);
          }
          return true;
        });

        return filteredAbi;
      }

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

      // Iterate through the ABI and collect unique events
      // const events = new Set<string>();

      // let finalAbi = JSON.stringify(abi);

      abi = removeDuplicateEvents(abi);

      // for (const item of abi) {
      //   //@ts-ignore
      //   if (item.type === "event") {
      //     //@ts-ignore
      //     const eventSignature = `${item.name}(${item.inputs
      //       //@ts-ignore
      //       .map((input) => input.type)
      //       .join(",")})`;
      //     if (events.has(eventSignature)) {
      //       console.log("Duplicate event", eventSignature);
      //       //exclude this from the abi
      //       abi = abi.filter(
      //         (item: any) =>
      //           item.type !== "event" || item.name !== eventSignature
      //       );
      //     }
      //     events.add(eventSignature);
      //   }
      // }

      // // Convert Set to array for easier use
      // const uniqueEvents = Array.from(events);
      // console.log("uniqueEvents", uniqueEvents);
      // console.log(`Found ${uniqueEvents.length} unique events`);

      if (removeTupleArrays === "true") {
        const finalAbi = JSON.stringify(abi);

        // Remove objects containing tuple[] from the ABI
        abi = abi.filter((item: any) => {
          if (item.outputs) {
            return !item.outputs.some(
              (output: any) =>
                output.type === "tuple[]" ||
                (output.components &&
                  output.components.some(
                    (comp: any) => comp.type === "tuple[]"
                  ))
            );
          }
          if (item.inputs) {
            return !item.inputs.some(
              (input: any) =>
                input.type === "tuple[]" ||
                (input.components &&
                  input.components.some((comp: any) => comp.type === "tuple[]"))
            );
          }
          return true;
        });

        //todo: implement this functionality
        fs.writeFileSync(
          `${exportPath.replace(".json", "")}_noTuple.json`,
          finalAbi
        );
        console.log(
          `ABI written to ${exportPath.replace(".json", "")}_noTuple.json`
        );
      } else {
        fs.writeFileSync(exportPath, JSON.stringify(abi));
        console.log(`ABI written to ${exportPath}`);
      }
    }
  );
