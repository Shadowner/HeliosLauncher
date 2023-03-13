import { LoggerUtil } from "helios-core/.";
import { RestResponseStatus } from "helios-core/common";
import {
    AuthorizationTokenResponse,
    MicrosoftAuth,
    MicrosoftErrorCode,
    microsoftErrorDisplayable,
} from "helios-core/microsoft";
import { MojangRestAPI, mojangErrorDisplayable, MojangErrorCode } from "helios-core/mojang";
import { AuthData, ConfigManager } from "../manager/ConfigManager";

const log = LoggerUtil.getLogger("AuthManager");

// eslint-disable-next-line no-shadow
export enum AuthMode {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    FULL = 0,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MS_REFRESH = 1,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MC_REFRESH = 2,
}

export class AuthManager {
    public static async addMojangAccount(username: string, password: string) {
        try {
            const response = await MojangRestAPI.authenticate(username, password, ConfigManager.clientToken ?? null);

            if (response.responseStatus === RestResponseStatus.SUCCESS) {
                const session = response.data;
                if (!session) throw mojangErrorDisplayable(MojangErrorCode.UNKNOWN);
                if (!session.selectedProfile) throw mojangErrorDisplayable(MojangErrorCode.ERROR_NOT_PAID);
                if (!ConfigManager.clientToken) ConfigManager.clientToken = session.clientToken;

                const ret = ConfigManager.addMojangAuthAccount(
                    session.selectedProfile.id,
                    session.accessToken,
                    username,
                    session.selectedProfile.name
                );

                ConfigManager.save();

                return ret;
            }
            if (!response) throw new Error("No Response from Mojang");
            if (!response.mojangErrorCode) throw mojangErrorDisplayable(MojangErrorCode.UNKNOWN);
            throw mojangErrorDisplayable(response.mojangErrorCode);
        } catch (err) {
            log.error(err);
            throw mojangErrorDisplayable(MojangErrorCode.UNKNOWN);
        }
    }

    public async addMicrosoftAccount(authCode: string) {
        const fullAuth = await this.fullMicrosoftAuthFlow(authCode, AuthMode.FULL);
        if (!fullAuth.accessToken) throw new Error("No AccessToken");
        if (!fullAuth.mcProfile) throw new Error("No minecraft profil returned by Microsoft");

        // Advance expiry by 10 seconds to avoid close calls.
        const now = new Date().getTime();
        const ret = ConfigManager.addMicrosoftAuthAccount(
            fullAuth.mcProfile.id,
            fullAuth.mcToken.access_token,
            fullAuth.mcProfile.name,
            this.calculateExpiryDate(now, fullAuth.mcToken.expires_in),
            fullAuth.accessToken.access_token,
            fullAuth.accessToken.refresh_token,
            this.calculateExpiryDate(now, fullAuth.accessToken.expires_in)
        );
        ConfigManager.save();

        return ret;
    }

    /**
     * Remove a Mojang account. This will invalidate the access token associated
     * with the account and then remove it from the database.
     *
     * @param {string} uuid The UUID of the account to be removed.
     * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
     */
    public async removeMojangAccount(uuid: string) {
        try {
            const authData = ConfigManager.getAuthAccountByUuid<"mojang">(uuid);
            const response = await MojangRestAPI.invalidate(authData.accessToken, ConfigManager.clientToken ?? "");
            if (response.responseStatus === RestResponseStatus.SUCCESS) {
                ConfigManager.removeAuthAccount(uuid);
                ConfigManager.save();
                return;
            }

            log.error("Error while removing account", response.error);
            throw response.error;
        } catch (err) {
            log.error("Error while removing account", err);
            return Promise.reject(err);
        }
    }

    /**
     * Remove a Microsoft account. It is expected that the caller will invoke the OAuth logout
     * through the ipc renderer.
     *
     * @param {string} uuid The UUID of the account to be removed.
     * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
     */
    public async removeMicrosoftAccount(uuid: string) {
        try {
            ConfigManager.removeAuthAccount(uuid);
            ConfigManager.save();
            return Promise.resolve();
        } catch (err) {
            log.error("Error while removing account", err);
            return Promise.reject(err);
        }
    }

    /**
     * Validate the selected auth account.
     *
     * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
     * otherwise false.
     */
    public async validateSelected() {
        const current = ConfigManager.selectedAccount;
        if (!current) return false;

        return current.type === "microsoft"
            ? this.validateSelectedMicrosoftAccount()
            : this.validateSelectedMojangAccount();
    }

    /**
     * Perform the full MS Auth flow in a given mode.
     *
     * AuthMode.FULL = Full authorization for a new account.
     * AuthMode.MS_REFRESH = Full refresh authorization.
     * AuthMode.MC_REFRESH = Refresh of the MC token, reusing the MS token.
     *
     * @param {string} entryCode FULL-AuthCode. MS_REFRESH=refreshToken, MC_REFRESH=accessToken
     * @param {*} authMode The auth mode.
     * @returns An object with all auth data. AccessToken object will be null when mode is MC_REFRESH.
     */
    private async fullMicrosoftAuthFlow(entryCode: string, authMode) {
        try {
            let accessTokenRaw: string;
            let accessToken: AuthorizationTokenResponse | undefined;

            if (authMode !== AuthMode.MC_REFRESH) {
                const accessTokenResponse = await MicrosoftAuth.getAccessToken(
                    entryCode,
                    authMode === AuthMode.MS_REFRESH,
                    ConfigManager.azureClientId
                );
                if (accessTokenResponse.microsoftErrorCode)
                    throw microsoftErrorDisplayable(accessTokenResponse.microsoftErrorCode);

                accessToken = accessTokenResponse.data || undefined;
                if (!accessToken) throw new Error("No access token delivered by Microsoft");
                accessTokenRaw = accessToken.access_token;
            } else {
                accessTokenRaw = entryCode;
            }

            const xblResponse = await MicrosoftAuth.getXBLToken(accessTokenRaw);
            if (xblResponse.microsoftErrorCode || !xblResponse.data)
                throw microsoftErrorDisplayable(xblResponse.microsoftErrorCode ?? MicrosoftErrorCode.UNKNOWN);

            const xstsResonse = await MicrosoftAuth.getXSTSToken(xblResponse.data);
            if (xstsResonse.microsoftErrorCode || !xstsResonse.data)
                throw microsoftErrorDisplayable(xstsResonse.microsoftErrorCode ?? MicrosoftErrorCode.UNKNOWN);

            const mcTokenResponse = await MicrosoftAuth.getMCAccessToken(xstsResonse.data);
            if (mcTokenResponse.microsoftErrorCode || !mcTokenResponse.data)
                throw microsoftErrorDisplayable(mcTokenResponse.microsoftErrorCode ?? MicrosoftErrorCode.UNKNOWN);

            const mcProfileResponse = await MicrosoftAuth.getMCProfile(mcTokenResponse.data.access_token);
            if (mcProfileResponse.microsoftErrorCode) throw microsoftErrorDisplayable(mcProfileResponse.microsoftErrorCode);

            return {
                accessToken,
                accessTokenRaw,
                xbl: xblResponse.data,
                xsts: xstsResonse.data,
                mcToken: mcTokenResponse.data,
                mcProfile: mcProfileResponse.data,
            };
        } catch (err) {
            log.error(err);
            throw microsoftErrorDisplayable(MicrosoftErrorCode.UNKNOWN);
        }
    }

    /**
     * Validate the selected account with Mojang's authserver. If the account is not valid,
     * we will attempt to refresh the access token and update that value. If that fails, a
     * new login will be required.
     *
     * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
     * otherwise false.
     */
    private async validateSelectedMojangAccount() {
        const current = ConfigManager.selectedAccount;
        if (!current) throw new Error("No current Account selected");
        if (!ConfigManager.clientToken) throw new Error("No known client Token");

        const response = await MojangRestAPI.validate(current.accessToken, ConfigManager.clientToken);

        if (response.responseStatus !== RestResponseStatus.SUCCESS) {
            log.error(response.error);
            return false;
        }

        const isValid = response.data;
        if (isValid) {
            log.info("Account access token validated.");
            return true;
        }

        const refreshResponse = await MojangRestAPI.refresh(current.accessToken, ConfigManager.clientToken);
        if (refreshResponse.responseStatus !== RestResponseStatus.SUCCESS) {
            log.error("Error while validating selected profile:", refreshResponse.error);
            log.info("Account access token is invalid.");
            return false;
        }

        const session = refreshResponse.data;
        if (!session) throw new Error("No new session sent by Mojang");

        ConfigManager.updateMojangAuthAccount(current.uuid, session.accessToken);
        ConfigManager.save();
        log.info("Account access token validated.");
        return true;
    }

    /**
     * Validate the selected account with Microsoft's authserver. If the account is not valid,
     * we will attempt to refresh the access token and update that value. If that fails, a
     * new login will be required.
     *
     * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
     * otherwise false.
     */
    private async validateSelectedMicrosoftAccount() {
        const current = ConfigManager.selectedAccount as AuthData<"microsoft">;
        const now = new Date().getTime();
        const mcExpiresAt = current.expiresAt;
        const mcExpired = now >= mcExpiresAt?.getTime();

        if (!mcExpired) return true;

        // MC token expired. Check MS token.

        const msExpiresAt = current.microsoft.expires_at;
        const msExpired = now >= msExpiresAt.getTime();

        // MS expired, do full refresh.
        try {
            const res = await this.fullMicrosoftAuthFlow(
                msExpired ? current.microsoft.refresh_token : current.microsoft.access_token,
                AuthMode.MS_REFRESH
            );
            if (!res.accessToken) throw new Error("No Access Token");

            ConfigManager.updateMicrosoftAuthAccount(
                current.uuid,
                res.mcToken.access_token,
                msExpired ? current.microsoft.access_token : res.accessToken.access_token,
                msExpired ? current.microsoft.refresh_token : res.accessToken.refresh_token,
                msExpired ? current.microsoft.expires_at : this.calculateExpiryDate(now, res.accessToken.expires_in),
                this.calculateExpiryDate(now, res.mcToken.expires_in)
            );

            ConfigManager.save();
            return true;
        } catch (err) {
            log.error(err);
            return false;
        }
    }

    private calculateExpiryDate(nowMs: number, epiresInS: number) {
        return new Date(nowMs + (epiresInS - 10) * 1000);
    }
}
