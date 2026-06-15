

module.exports = {
    // API Server
    PORT: process.env.PORT || 3000,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || '8d35ccfacd3a64eb61e8d5675f2fa6b0707675bf',

    // Database-related
    DB_SERVER_ADDR: "tpm-db.nwki.yagz.eu",
    DB_SERVER_USERNAME: "root",
    DB_SERVER_PW: "sQpw98017+",
    DB_MAIN_DATABASE_NAME: "TPMAS",

    // Externals


    // Instance and Docker Composer
    IM_NEWHOST_EXPECTED_KEYS: ["host_addr", "description", "tpm_mfg_code", "host_name"],
    PO_UPDATE_EXPECTED_KEYS: ["host_id", "host_auth_pw", "tpm_PCR0", "tpm_PCR1", "tpm_PCR2", "tpm_PCR3", "tpm_PCR4", "tpm_PCR5", "tpm_PCR6", "tpm_PCR7", "label"]

};
