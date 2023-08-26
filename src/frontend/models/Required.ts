/**
 * Represents a the requirement status
 * of a module.
 */

export interface IRequired {
    value: boolean,
    def: boolean,
}

export class Required {

    /**
     * Parse a JSON object into a Required object.
     * 
     * @param {Object} json A JSON object representing a Required object.
     * 
     * @returns {Required} The parsed Required object.
     */
    public static fromJSON(json: IRequired) {
        if (json == null) {
            return new Required(true, true);
        } else {
            return new Required(json.value == null ? true : json.value, json.def == null ? true : json.def);
        }
    }

    public default: boolean;
    constructor(
        public value: boolean,
        def: boolean
    ) {
        this.default = def;
    }

    /**
     * Get the default value for a required object. If a module
     * is not required, this value determines whether or not
     * it is enabled by default.
     * 
     * @returns {boolean} The default enabled value.
     */
    public get isDefault() {
        return this.default;
    }

    /**
     * @returns {boolean} Whether or not the module is required.
     */
    public get isRequired(): boolean {
        return this.value;
    }

}