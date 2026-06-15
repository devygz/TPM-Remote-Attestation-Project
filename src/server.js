const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
let inventoryRouter;
let postureRouter;
let gsRouter;
let authRouter;

try {
    inventoryRouter = require('./api/inventory');
    console.log("inventoryRouter loaded");
    postureRouter = require('./api/posture');
    console.log("postureRouter loaded");
    gsRouter = require('./api/goldenState');
    console.log("gsRouter loaded");
    authRouter = require('./api/auth');
    console.log("authRouter loaded");
} catch (err) {
    console.error("Failed to load routers:", err);
    process.exit(1);
}
const app = express();

app.use(express.json());
app.use(morgan('dev')); // log to console
app.use(cors());

app.use('/inventory', inventoryRouter);
app.use('/posture', postureRouter);
app.use('/gs', gsRouter);
app.use('/auth', authRouter);


app.use((req, res, next) => {
    res.status(418).json({ error: 'Sorry, I am a teapot, not a coffee brewer. Fancy a cup of Kräutertee? (Missing route or old server)' });
});


app.use((req, res, next) => {
    res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
