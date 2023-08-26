import os from 'os';

export class SystemUtil {

    public static resolveMaxRAM() {
        const mem = os.totalmem();
        return mem >= 8000000000 ? "4G" : mem >= 6000000000 ? "3G" : "2G";
    }

    public static resolveMinRAM() {
        return this.resolveMaxRAM();
    }

}