const express = require('express');
const router = express.Router();

const { v7: uuidv7 } = require('uuid');


const config = require('../config');
const msq = require('../utils/msq');
const response = require('./response');
const gs = require('./goldenState');


router.post('/update', async (req, res) => {
    const perfStart = Date.now();
    let reqBody = await req.body;

    if(!msq.arraysHaveSameKeys(Object.keys(reqBody), config.PO_UPDATE_EXPECTED_KEYS)) {
        response.responseFailure(res, 'ERR:KEYS_MISMATCH', 'Please check the keys sent and try again.');
        return;
    }

    let hostIDLookup = await msq.getHostById(reqBody["host_id"]);

    if(!hostIDLookup) {
        response.responseFailure(res, 'ERR:HOST_CANNOT_BE_FOUND', 'Please check the host_id and try again.');
        return;
    }

    console.log(hostIDLookup);
    console.log(reqBody)
    let hostAuthKey = hostIDLookup['host_auth_pw']

    if(hostAuthKey !== reqBody["host_auth_pw"]) {
        response.responseFailure(res, 'ERR:AUTH_FAILURE', 'Authentication failure.');
        return;
    }
    let measurementID = uuidv7();
    let gsMatchResult = false;
    let skipGoldenCheck = false;
    let mismatchedValues = null;

    try {
        gsMatchData = await msq.gsMatch(reqBody["host_id"], reqBody);
        console.log(gsMatchData);
        gsMatchResult = gsMatchData.isMatch;

        if(!gsMatchData.isMatch) {
            mismatchedValues = gsMatchData.mismatchedKeys.join(",");
        }

    }catch(e){
        skipGoldenCheck = true;
        console.log(e);
    }

    try {
        
        reqBody["measurement_id"] = measurementID;
        reqBody["gs_matched"] = gsMatchResult;
        reqBody["mismatched_values"] = mismatchedValues;
        await msq.insertMeasurement(reqBody)

        if (!skipGoldenCheck) {
            let healthStatus = gsMatchResult ? "healthy" : "corrupt"
            await msq.updateInventoryHealth(reqBody["host_id"], healthStatus);
        }
        
    }catch(e) {
        response.responseFailure(res, 'ERR:UNKNOWN-ERROR:PO_UPDATE_POST_DB', 'An unknown error occured.');
        return;
    }

    response.responseSuccessful(res, `Measurement ${measurementID} registered successfully. ${skipGoldenCheck ? "Golden checks have been skipped, since probably there is no golden record yet.": "Golden checks performed."}`,
        { measurementInfo: reqBody, perf: Date.now() - perfStart });

});

router.get('/measurement/:measID', async (req, res) => {
    const perfStart = Date.now();
    let measIDLookup = req.params['measID'];
    let hostInfo;

    if (!measIDLookup) {
        response.responseFailure(res, 'ERR:MISSING-PARAMS', 'Please provide measurement_id to find specific measurement.');
        return;
    }

    hostInfo = await msq.getMeasurementByID(measIDLookup)

    if (!hostInfo) {
        response.responseFailure(res, 'ERR:MEAS_INFO-LIST-DB-ERR', 'Cannot find in db. Check the measurement_id again.');
        return;
    }

    response.responseSuccessful(res, `Host Information for ${measIDLookup} retrieved successfully.`,
        { measurementInfo: hostInfo, perf: Date.now() - perfStart });

});


module.exports = router;
