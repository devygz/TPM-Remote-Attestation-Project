function responseSuccessful(res, message, body = {}) {
    res.status(200).json({ ...{result: {success: true, message}}, ...body});
}
function responseFailure(res, reason, message, body = {}) {
    console.log('response failed: ' + message);
    res.status(200).json({ ...{result: {success: false, message, reason}}, ...body});
}

module.exports = {responseFailure, responseSuccessful};