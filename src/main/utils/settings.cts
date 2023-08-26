import ElectronStore from "electron-store";



const settings = new ElectronStore({
  defaults: {
    servers: [],
    rss: "",
    version: "",
  },
});

export default settings;