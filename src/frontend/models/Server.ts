import { Module, IModule } from './Module';

export interface IServer {
    id: string,
    name: string,
    description: string,
    icon: string,
    version: string,
    address: string,
    minecraftVersion: string,
    isMainServer: boolean,
    autoconnect: boolean,
    modules: IModule[],
}

/**
 * Represents a server configuration.
 */
export class Server {
    /**
     * Parse a JSON object into a Server.
     * 
     * @param {Object} json A JSON object representing a Server.
     * 
     * @returns {Server} The parsed Server object.
     */
    public static fromJSON(json: IServer) {

        const modules = json.modules

        const serv = new Server(
            json.id,
            json.name,
            json.description,
            json.icon,
            json.version,
            json.address,
            json.minecraftVersion,
            json.isMainServer,
            json.autoconnect
        )
        serv.resolveModules(modules)

        return serv
    }


    constructor(
        public id: string,
        public name: string,
        public description: string,
        public icon: string,
        public version: string,
        public address: string,
        public minecraftVersion: string,
        public isMainServer: boolean,
        public autoconnect: boolean,
        public modules: Module[] = [],
    ) { }

    // TODO: Put this in the constructor
    private resolveModules(jsonModule: IModule[]) {
        const modules: Module[] = []
        for (const module of jsonModule) {
            modules.push(Module.fromJSON(module, this.id))
        }
        this.modules = modules
    }

}