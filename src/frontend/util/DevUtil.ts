const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV ?? "", 10) === 1;
const isEnvSet = 'ELECTRON_IS_DEV' in process.env;

export class DevUtil {
    private static enforceDevMode = false;

    public static get isDev() {
        return this.enforceDevMode ?? isEnvSet ? getFromEnv : (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath));
    }

    public static set isDev(value) {
        this.enforceDevMode = value;
    }

    public static get isARM64() { return process.arch === 'arm64'; }

}