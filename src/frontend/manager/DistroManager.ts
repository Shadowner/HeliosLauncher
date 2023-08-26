import { readFile, writeFile } from "fs-extra";
import { LoggerUtil } from "helios-core/.";
import { DevUtil } from '../util/DevUtil';
import { ConfigManager } from "./ConfigManager";
import { join } from 'path';
import { DistroIndex, IDistroIndex } from '../models/DistroIndex';
import fetch from 'node-fetch';

const logger = LoggerUtil.getLogger('DistroManager');
// eslint-disable-next-line no-shadow
export enum DistroTypes {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Library,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ForgeHosted,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Forge, // Unimplemented
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LiteLoader,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ForgeMod,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    LiteMod,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    File,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    VersionManifest,
}

export class DistroManager {

    public static distribution?: DistroIndex;
    private static readonly distroPath = join(ConfigManager.getLauncherDirectory(), 'distribution.json');
    private static readonly devPath = join(ConfigManager.getLauncherDirectory(), 'dev_distribution.json');

    /**
     * @returns {Promise.<DistroIndex>}
     */
    public static async pullRemote() {
        if (DevUtil.isDev) return this.pullLocal();

        const distroDest = join(ConfigManager.getLauncherDirectory(), 'distribution.json');
        const response = await fetch(ConfigManager.distributionURL, { signal: AbortSignal.timeout(2500) });
        this.distribution = DistroIndex.fromJSON(await response.json() as IDistroIndex);

        writeFile(distroDest, JSON.stringify(this.distribution), 'utf-8').catch(e => {
            logger.warn("Failed to save local distribution.json");
            logger.warn(e);
        });

        return this.distribution;
    }

    /**
     * @returns {Promise.<DistroIndex>}
     */
    // TODO: Change this to fetch it from the electron store with IPCRenderer
    public static async pullLocal() {
        const file = await readFile(DevUtil.isDev ? this.devPath : this.distroPath, 'utf-8');
        this.distribution = DistroIndex.fromJSON(JSON.parse(file) as IDistroIndex);
        return this.distribution;

    }

    public static setDevMode(value: boolean) {
        if (value) {
            logger.info('Developer mode enabled.');
            logger.info('If you don\'t know what that means, revert immediately.');
        } else {
            logger.info('Developer mode disabled.');
        }
        DevUtil.isDev = value;
    }
}