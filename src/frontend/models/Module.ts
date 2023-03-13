import { LoggerUtil } from 'helios-core/.';
import { ConfigManager } from '../manager/ConfigManager';
import { Artifact, IArtifact } from './Artifact';
import { join } from 'path';
import { DistroTypes } from '../manager/DistroManager';
import { Required, IRequired } from './Required';

const logger = LoggerUtil.getLogger('Module')

export interface IModule {
    artifactExt: string;
    artifactClassifier?: string;
    artifactVersion: string;
    artifactID: string;
    artifactGroup: string;
    subModules: IModule[];
    required: IRequired;
    artifact: IArtifact;
    id: string,
    name: string,
    type: DistroTypes,
    classpath: boolean
}

export class Module {

    /**
     * Parse a JSON object into a Module.
     * 
     * @param {Object} json A JSON object representing a Module.
     * @param {string} serverid The ID of the server to which this module belongs.
     * 
     * @returns {Module} The parsed Module.
     */
    public static fromJSON(json: IModule, serverid: string) {
        return new Module(json.id, json.name, json.type, json.classpath, json.required, json.artifact, json.subModules, serverid)
    }

    /**
     * Resolve the default extension for a specific module type.
     * 
     * @param {string} type The type of the module.
     * 
     * @return {string} The default extension for the given type.
     */
    private static resolveDefaultExtension(type: DistroTypes) {
        switch (type) {
            case DistroTypes.Library:
            case DistroTypes.ForgeHosted:
            case DistroTypes.LiteLoader:
            case DistroTypes.ForgeMod:
                return 'jar'
            case DistroTypes.LiteMod:
                return 'litemod'
            case DistroTypes.File:
            default:
                return 'jar' // There is no default extension really.
        }
    }


    public artifactExt: string;
    public artifactClassifier?: string;
    public artifactVersion: string;
    public artifactID: string;
    public artifactGroup: string;

    public subModules: Module[] = []
    public required: Required;
    public artifact: Artifact
    /**
     * @returns {string} The identifier without he version or extension.
     */
    public get versionlessID() {
        return this.artifactGroup + ':' + this.artifactID
    }

    /**
     * @returns {string} The identifier without the extension.
     */
    public get extensionlessID() {
        return this.identifier.split('@')[0]
    }

    public get hasSubModules() {
        return this.subModules.length > 0;
    }



    constructor(
        public identifier: string,
        public name: string,
        public type: DistroTypes,
        public classpath: boolean = true,
        required: IRequired,
        artifact: IArtifact,
        subModules: IModule[],
        serverid: string
    ) {
        this.required = Required.fromJSON(required);
        this.artifact = Artifact.fromJSON(artifact);

        this.resolveMetaData()
        this.resolveArtifactPath(this.artifact.path, serverid)
        this.resolveSubModules(subModules, serverid)
    }

    private resolveMetaData() {
        try {

            const m0 = this.identifier.split('@')

            this.artifactExt = m0[1] || Module.resolveDefaultExtension(this.type)

            const m1 = m0[0].split(':')

            this.artifactClassifier = m1[3] || undefined
            this.artifactVersion = m1[2] || '???'
            this.artifactID = m1[1] || '???'
            this.artifactGroup = m1[0] || '???'

        } catch (err) {
            // Improper identifier
            logger.error('Improper ID for module', this.identifier, err)
        }
    }

    private resolveArtifactPath(artifactPath: string, serverid: string) {
        const pth = artifactPath == null ? join(...this.artifactGroup.split('.'), this.artifactID, this.artifactVersion, `${this.artifactID}-${this.artifactVersion}${this.artifactClassifier ? `-${this.artifactClassifier}` : ''}.${this.artifactExt}`) : artifactPath

        switch (this.type) {
            case DistroTypes.Library:
            case DistroTypes.ForgeHosted:
            case DistroTypes.LiteLoader:
                this.artifact.path = join(ConfigManager.commonDirectory, 'libraries', pth)
                break
            case DistroTypes.ForgeMod:
            case DistroTypes.LiteMod:
                this.artifact.path = join(ConfigManager.commonDirectory, 'modstore', pth)
                break
            case DistroTypes.VersionManifest:
                this.artifact.path = join(ConfigManager.commonDirectory, 'versions', this.identifier, `${this.identifier}.json`)
                break
            case DistroTypes.File:
            default:
                this.artifact.path = join(ConfigManager.instanceDirectory, serverid, pth)
                break
        }

    }

    private resolveSubModules(jsonSubModules: IModule[], serverid: string) {
        if (jsonSubModules == null) return;

        const subModules: Module[] = []
        for (const subModule of jsonSubModules) {
            subModules.push(Module.fromJSON(subModule, serverid))
        }
        this.subModules = subModules
    }

}