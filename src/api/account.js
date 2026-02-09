const express = require('express');
const router = express.Router();

const { v7: uuidv7 } = require('uuid');

const config = require('../config');
const msq = require('../utils/msq');
const response = require('./response');




router.get('/', async (req, res) => {
    response.responseFailure(res, 'ERR:LISTING_NOT_ALLOWED', 'Please specify a single operation related to inventory.');
    return;

});

router.get('/:hostID', async (req, res) => {
    const perfStart = Date.now();
    let hostIDLookup = req.params['hostID'];
    let hostInfo;

    if (hostIDLookup) {
        hostInfo = await msq.getHostById(hostIDLookup)
    } else {
        response.responseFailure(res, 'ERR:MISSING-PARAMS', 'Please provide host_id to find specific host.');
        return;
    }

    if (!hostInfo) {
        response.responseFailure(res, 'ERR:HOST_INFO-LIST-DB-ERR', 'Cannot find in db. Check the host_id again.');
        return;
    }

    response.responseSuccessful(res, `Host Information for ${hostIDLookup} retrieved successfully.`,
        { hostInfo: hostInfo, perf: Date.now() - perfStart });

});


router.get('/measurements/:hostID', async (req, res) => {
    const perfStart = Date.now();
    let hostIDLookup = req.params['hostID'];
    let hostInfo;

    if (!hostIDLookup) {
        response.responseFailure(res, 'ERR:MISSING-PARAMS', 'Please provide host_id to find specific host.');
        return;
    }

    hostInfo = await msq.getMeasurementsByHost(hostIDLookup);
    let goldenRecord = await msq.getGoldenRecordByHost(hostIDLookup);

    if (!hostInfo) {
        response.responseFailure(res, 'ERR:MEAS_INFO-LIST-DB-ERR', 'Cannot find in db. Check the host_id again.');
        return;
    }

    response.responseSuccessful(res, `Host Information for ${hostIDLookup} retrieved successfully.`,
        { measurements: hostInfo, goldenRecord, perf: Date.now() - perfStart });

});

router.post('/register', async (req, res) => {
    const perfStart = Date.now();
    let hostInfo = req.body;
    console.log({"keysjs": Object.keys(hostInfo), "cfg": config.IM_NEWHOST_EXPECTED_KEYS})
    if(!msq.arraysHaveSameKeys(Object.keys(hostInfo), config.IM_NEWHOST_EXPECTED_KEYS)) {
        response.responseFailure(res, 'ERR:KEYS_MISMATCH', 'Please check the keys sent and try again.');
        return;
    }

    let hostIDLookup = uuidv7();

    try {
        hostInfo["host_id"] = hostIDLookup
        hostInfo["host_auth_pw"] = msq.generateSecurePassword(24)
        msq.insertInventoryItem(hostInfo)
    }catch(e) {
        response.responseFailure(res, 'ERR:UNKNOWN-ERROR:IM_REGISTER_POST_DB', 'An unknown error occured.');
        return;
    }

    response.responseSuccessful(res, `Host ${hostIDLookup} registered successfully.`,
        { hostInfo: hostInfo, perf: Date.now() - perfStart });

});


module.exports = router;
