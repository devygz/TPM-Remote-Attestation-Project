function logEntry(message, severity="LOG") {
    if(severity === "ERR") { console.error(`${severity}:` + message); return;}
    if(severity === "WARN") { console.warn(`${severity}:` + message); return; }
    console.log(`${severity}:${message}`);
}

module.exports = {
    logEntry
}