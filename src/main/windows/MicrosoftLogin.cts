// import { BrowserWindow, ipcMain } from "electron"
// import { AZURE_CLIENT_ID, MSFT_ERROR, MSFT_OPCODE, MSFT_REPLY_TYPE } from '../../common/MicrosoftType';

// const REDIRECT_URI_PREFIX = 'https://login.microsoftonline.com/common/oauth2/nativeclient?'

// // Microsoft Auth Login
// let msftAuthWindow: BrowserWindow | undefined;
// let msftAuthSuccess = false;

// ipcMain.on(MSFT_OPCODE.OPEN_LOGIN, (ipcEvent) => {
//     if (msftAuthWindow) {
//         ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN)
//         return;
//     }
//     msftAuthSuccess = false
//     msftAuthWindow = new BrowserWindow({
//         title: 'Microsoft Login',
//         backgroundColor: '#222222',
//         width: 520,
//         height: 600,
//         frame: true,
//         // TODO: Global Icon
//         // icon: getPlatformIcon('SealCircle')
//     })

//     msftAuthWindow.on('closed', () => {
//         msftAuthWindow = undefined
//     })

//     msftAuthWindow.on('close', () => {
//         if (!msftAuthSuccess) {
//             ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED)
//         }
//     })

//     msftAuthWindow.webContents.on('did-navigate', (_, uri) => {
//         if (uri.startsWith(REDIRECT_URI_PREFIX)) {
//             const queries = uri.substring(REDIRECT_URI_PREFIX.length).split('#', 1).toString().split('&')
//             const queryMap: Record<string, string> = {}

//             queries.forEach(query => {
//                 const [name, value] = query.split('=')
//                 queryMap[name] = decodeURI(value)
//             })

//             ipcEvent.reply(MSFT_OPCODE.REPLY_LOGIN, MSFT_REPLY_TYPE.SUCCESS, queryMap)

//             msftAuthSuccess = true
//             msftAuthWindow?.close()
//             msftAuthWindow = undefined
//         }
//     })

//     msftAuthWindow.removeMenu()
//     msftAuthWindow.loadURL(`https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?prompt=select_account&client_id=${AZURE_CLIENT_ID}&response_type=code&scope=XboxLive.signin%20offline_access&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient`).catch(_e => null)
// })

// // // Microsoft Auth Logout
// // let msftLogoutWindow
// // let msftLogoutSuccess
// // let msftLogoutSuccessSent
// // ipcMain.on(MSFT_OPCODE.OPEN_LOGOUT, (ipcEvent, uuid, isLastAccount) => {
// //     if (msftLogoutWindow) {
// //         ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.ALREADY_OPEN)
// //         return
// //     }

// //     msftLogoutSuccess = false
// //     msftLogoutSuccessSent = false
// //     msftLogoutWindow = new BrowserWindow({
// //         title: 'Microsoft Logout',
// //         backgroundColor: '#222222',
// //         width: 520,
// //         height: 600,
// //         frame: true,
// //         icon: getPlatformIcon('SealCircle')
// //     })

// //     msftLogoutWindow.on('closed', () => {
// //         msftLogoutWindow = undefined
// //     })

// //     msftLogoutWindow.on('close', () => {
// //         if (!msftLogoutSuccess) {
// //             ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.ERROR, MSFT_ERROR.NOT_FINISHED)
// //         } else if (!msftLogoutSuccessSent) {
// //             msftLogoutSuccessSent = true
// //             ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
// //         }
// //     })

// //     msftLogoutWindow.webContents.on('did-navigate', (_, uri) => {
// //         if (uri.startsWith('https://login.microsoftonline.com/common/oauth2/v2.0/logoutsession')) {
// //             msftLogoutSuccess = true
// //             setTimeout(() => {
// //                 if (!msftLogoutSuccessSent) {
// //                     msftLogoutSuccessSent = true
// //                     ipcEvent.reply(MSFT_OPCODE.REPLY_LOGOUT, MSFT_REPLY_TYPE.SUCCESS, uuid, isLastAccount)
// //                 }

// //                 if (msftLogoutWindow) {
// //                     msftLogoutWindow.close()
// //                     msftLogoutWindow = null
// //                 }
// //             }, 5000)
// //         }
// //     })

// //     msftLogoutWindow.removeMenu()
// //     msftLogoutWindow.loadURL('https://login.microsoftonline.com/common/oauth2/v2.0/logout')
// // })
