/* eslint-disable no-control-regex */
import * as net from "net";
import { ServerStatus } from "../types/ServerStatusType";

export class ServerStatusService {

    /**
     * Retrieves the status of a minecraft server.
     * 
     * @param {string} address The server address.
     * @param {number} port Optional. The port of the server. Defaults to 25565.
     * @returns {Promise.<Object>} A promise which resolves to an object containing
     * status information.
     */
    public static getStatus(address: string, port = 25565): Promise<ServerStatus> {

        if (!port || typeof port !== 'number') {
            port = 25565;
        }
        return new Promise((resolve, reject) => {
            const socket = net.connect(port, address, () => {
                const buff = Buffer.from([0xFE, 0x01]);
                socket.write(buff);
            });

            socket.setTimeout(2500, () => {
                socket.end();
                reject({
                    code: 'ETIMEDOUT',
                    errno: 'ETIMEDOUT',
                    address,
                    port
                });
            });

            socket.on('data', (data) => {
                if (data != null && data.length > 0) {
                    const serverInfo = data.toString().split('\x00\x00\x00');
                    const NUM_FIELDS = 6;
                    if (serverInfo != null && serverInfo.length >= NUM_FIELDS) {
                        return resolve({
                            online: "Online",
                            version: serverInfo[2].replace(/\u0000/g, ''),
                            motd: serverInfo[3].replace(/\u0000/g, ''),
                            onlinePlayers: serverInfo[4].replace(/\u0000/g, ''),
                            maxPlayers: serverInfo[5].replace(/\u0000/g, '')
                        });
                    } else {
                        resolve({
                            online: 'Offline',
                        });
                    }
                }
                socket.end();
            });

            socket.on('error', (err) => {
                socket.destroy();
                reject(err);
                // ENOTFOUND = Unable to resolve.
                // ECONNREFUSED = Unable to connect to port.
            });
        });


    }
}