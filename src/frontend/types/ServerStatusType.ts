type Online = 'Online';
type Offline = 'Offline';
export type ServerStatus = {
    online: Online,
    version: string
    motd: string
    onlinePlayers: string
    maxPlayers: string
} | {
    online: Offline
}
