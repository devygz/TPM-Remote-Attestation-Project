const app = require('./server');
const config = require('./config');

const server = app.listen(config.PORT, () => {
    console.log(`API running at port ${config.PORT}`);

});

console.log(config);

// Handle load errors
server.on('error', (err) => {
    console.error('Failed to start server:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${config.PORT} is already in use. Try another one.`);
    }
    process.exit(1);
});
