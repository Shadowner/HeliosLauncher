import ElectronStore from "electron-store";
import { IDistroIndex } from '../../frontend/models/DistroIndex';



const settings = new ElectronStore<IDistroIndex>({
  defaults: {
    servers: [],
    rss: "",
    version: "",
  },
});

export default settings;