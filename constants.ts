import { parseEther } from "ethers/lib/utils";

const maticAddresses = {
  FUD_ADDRESS: "0x403e967b044d4be25170310157cb1a4bf10bdd0f",
  FOMO_ADDRESS: "0x44a6e0be76e1d9620a7f76588e4509fe4fa8e8c8",
  ALPHA_ADDRESS: "0x6a3e7c3c6ef65ee26975b12293ca1aad7e1daed2",
  KEK_ADDRESS: "0x42e5e06ef5b90fe15f853f59299fc96259209c5c",
};

const amoyAddresses = {
  FUD_ADDRESS: "0xaa1C59f2B45EF192B71De7d0CB5d95b664749d9c",
  FOMO_ADDRESS: "0x616d6Df54A9754B81aa43971794D86B3C229fA8B",
  ALPHA_ADDRESS: "0x44bca9B7C2C5F9f47D4da5B72deCdcF3a42535d8",
  KEK_ADDRESS: "0x9b39452041aCe85C03D3Ae76D0D5ccFf3a86dEc9",
};

export const networkAddresses: { [key: string]: { [key: string]: string } } = {
  137: maticAddresses,
  80002: amoyAddresses,
};

export const defaultWheelWeights = [4500, 2300, 1600, 800, 250, 50, 500];
export const defaultWheelPoints = [50, 200, 500, 1500, 5000, 50000, 0];
export const initialTokenConversionRates = [
  parseEther("0.25"),
  parseEther("0.5"),
  parseEther("1"),
  parseEther("2.5"),
]; //need to change these to thousands so we can use decimal points
export const initialSeasonPoints = parseEther("1000000000");
