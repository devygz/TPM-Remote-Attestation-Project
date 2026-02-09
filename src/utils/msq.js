const crypto = require('node:crypto');

const config = require('../config')
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: config.DB_SERVER_ADDR,
  user: config.DB_SERVER_USERNAME,
  password: config.DB_SERVER_PW, 
  database: config.DB_MAIN_DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function getHostById(targetId) {
  try {
    // We use [rows] to "destructure" the result because MySQL returns [data, metadata]
    const [rows] = await pool.query(
      'SELECT * FROM inventory_information WHERE host_id = ?', 
      [targetId]
    );

    if (rows.length === 0) {
      console.log("No host found with that ID.");
      return null;
    }

    console.log("Host Found:", rows[0]);
    return rows[0];
    
  } catch (error) {
    console.error("Database error:", error);
  }
}

async function getMeasurementByID(targetId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pcr_states WHERE measurement_id = ?', 
      [targetId]
    );

    if (rows.length === 0) {
      console.log("No measurement found with that ID.");
      return null;
    }

    console.log("Measurement Found:", rows[0]);
    return rows[0];
    
  } catch (error) {
    console.error("Database error:", error);
  }
}

async function getMeasurementsByHost(targetId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pcr_states WHERE host_id = ?', 
      [targetId]
    );

    if (rows.length === 0) {
      console.log(`No measurement found for host ID ${targetId}`);
      return null;
    }

    console.log("Measurements per Host Found:", rows[0]);
    return rows;
    
  } catch (error) {
    console.error("Database error:", error);
  }
}

async function getGoldenRecordByHost(targetId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pcr_states WHERE host_id = ? AND gold_state = 1', 
      [targetId]
    );

    if (rows.length === 0) {
      console.log("No golden measurement found for that host ID.");
      return null;
    }

    console.log("Golden Measurements per Host Found:", rows[0]);
    return rows[0];
    
  } catch (error) {
    console.error("Database error:", error);
  }
}

async function getAllInventory() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM inventory_information'
    );

    if (rows.length === 0) {
      console.log("No hosts found in DB.");
      return null;
    }

    return rows;
    
  } catch (error) {
    console.error("Database error:", error);
  }
}

async function setMeasurementAsGolden(targetId, hostID) {
  try {
    // This query sets gold_state to 1 if the ID matches, 
    // and 0 for every other row in the table.
    const [result] = await pool.query(
      'UPDATE pcr_states SET gold_state = (measurement_id = ?) WHERE host_id = ?', 
      [targetId, hostID]
    );

    if (result.affectedRows === 0) {
      console.log("No rows updated. Check if the table is empty.");
      return false;
    }

    console.log(`Success! Measurement ${targetId} is now the Golden State.`);
    return true;
    
  } catch (error) {
    console.error("Database error while setting golden state:", error);
    throw error;
  }
}

async function insertInventoryItem(hostData) {
    const query = `
        INSERT INTO inventory_information 
        (host_id, host_name, host_auth_pw, tpm_mfg_code, description, host_addr) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        hostData.host_id,
        hostData.host_name || null, // Allows NULL as per your schema
        hostData.host_auth_pw,
        hostData.tpm_mfg_code || null,
        hostData.description || null,
        hostData.host_addr || null
    ];

    try {
        const [result] = await pool.execute(query, values);
        return {
            success: true,
            insertId: result.insertId // The auto-generated UUID or Int ID
        };
    } catch (error) {
        console.error('Error inserting into inventory_information:', error);
        throw error;
    }
}

async function insertMeasurement(measurementData) {
    const query = `
        INSERT INTO pcr_states 
        (measurement_id, host_id, tpm_PCR0, tpm_PCR1, tpm_PCR2, tpm_PCR3, tpm_PCR4, tpm_PCR5, tpm_PCR6, tpm_PCR7, label, gs_matched, mismatched_elements) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        measurementData.measurement_id,
        measurementData.host_id,
        measurementData.tpm_PCR0,
        measurementData.tpm_PCR1,
        measurementData.tpm_PCR2,
        measurementData.tpm_PCR3,
        measurementData.tpm_PCR4,
        measurementData.tpm_PCR5,
        measurementData.tpm_PCR6,
        measurementData.tpm_PCR7,
        measurementData.label || null,
        measurementData.gs_matched,
        measurementData.mismatched_values
    ];

    console.log(values);

    try {
        const [result] = await pool.execute(query, values);
        return {
            success: true,
            insertId: result.insertId // The auto-generated UUID or Int ID
        };
    } catch (error) {
        console.error('Error inserting measurement into pcr_states:', error);
        throw error;
    }
}

async function updateInventoryHealth(hostId, healthStatus) {
    // We use CURRENT_TIMESTAMP so the DB handles the clock sync
    const query = `
        UPDATE inventory_information 
        SET 
            health_status = ?, 
            health_last_updated = CURRENT_TIMESTAMP 
        WHERE host_id = ?
    `;

    const values = [healthStatus, hostId];

    try {
        const [result] = await pool.execute(query, values);
        
        // result.affectedRows tells us if the hostId actually existed
        return {
            success: true,
            affectedRows: result.affectedRows 
        };
    } catch (error) {
        console.error('Error updating health status in inventory_information:', error);
        throw error;
    }
}

function generateSecurePassword(length = 24) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#-";
    let password = "";
    
    // Generate random bytes for better entropy
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        // Use the modulo operator to pick a character from the set
        // randomBytes[i] provides a value between 0-255
        password += charset.charAt(randomBytes[i] % charset.length);
    }

    return password;
}

function arraysHaveSameKeys(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    // Check if every element in the first array is present in the second
    return arr1.every(key => arr2.includes(key));
}

async function gsMatch(hostID, measurementData) {
    let goldenRecordHost = await getGoldenRecordByHost(hostID);
    
    console.log("---- GS MATCH ----");
    console.log({measurementData, goldenRecordHost});
    console.log("---- GS MATCH END ----");

    const keys = ["tpm_PCR0", "tpm_PCR1", "tpm_PCR2", "tpm_PCR3", "tpm_PCR4", "tpm_PCR5", "tpm_PCR6", "tpm_PCR7"];

    // Find all keys where the values do NOT match
    const mismatchedKeys = keys.filter(key => goldenRecordHost[key] !== measurementData[key]);

    // The match is successful only if the mismatch list is empty
    return {
        isMatch: mismatchedKeys.length === 0,
        mismatchedKeys: mismatchedKeys // This will be an array like ["tpm_PCR2", "tpm_PCR7"]
    };
}

module.exports = {
    getHostById,
    gsMatch,
    getMeasurementByID,
    setMeasurementAsGolden,
    getGoldenRecordByHost,
    getMeasurementsByHost,
    insertInventoryItem,
    insertMeasurement,
    generateSecurePassword,
    arraysHaveSameKeys,
    getAllInventory,
    updateInventoryHealth
};