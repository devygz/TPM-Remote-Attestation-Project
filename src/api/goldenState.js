const express = require('express');
const router = express.Router();

const { v7: uuidv7 } = require('uuid');


const config = require('../config');
const msq = require('../utils/msq');
const response = require('./response');


router.post('/mark', async (req, res) => {
    const perfStart = Date.now();
    let reqBody = req.body;
    console.log({"oks": Object.keys(reqBody), reqBody})
    if(!msq.arraysHaveSameKeys(Object.keys(reqBody), ["measurement_id", "host_id"])) {
        response.responseFailure(res, 'ERR:KEYS_MISMATCH', 'Please check the keys sent and try again.');
        return;
    }

    let measurementLookup = await msq.getMeasurementByID(reqBody["measurement_id"]);

    if(!measurementLookup) {
        response.responseFailure(res, 'ERR:MEAS_CANNOT_BE_FOUND', 'Please check the measurement_id and try again.');
        return;
    }


    try {
        await msq.setMeasurementAsGolden(reqBody["measurement_id"], reqBody["host_id"])
    }catch(e) {
        response.responseFailure(res, 'ERR:UNKNOWN-ERROR:PO_UPDATE_POST_DB', 'An unknown error occured.');
        return;
    }

    measurementLookup = await msq.getMeasurementByID(reqBody["measurement_id"]);

    response.responseSuccessful(res, `Measurement ${reqBody["measurement_id"]} is now golden.`,
        { measurementInfo: measurementLookup, perf: Date.now() - perfStart });

});



module.exports = router;
