const express = require('express');
const router = express.Router();

const { v7: uuidv7 } = require('uuid');
const jwt = require('jsonwebtoken');

const config = require('../config');
const msq = require('../utils/msq');
const response = require('./response');



router.post('/login', async (req, res) => {
    const perfStart = Date.now();
    
    // Extracting credentials from the request body
    const { username, password } = req.body;

    if (!username || !password) {
        response.responseFailure(res, 'ERR:MISSING-CREDENTIALS', 'Please provide username and password.');
        return;
    }

    try {
        
        const accountInfo = await msq.getLoginAccountByUsername(username);

       
        if (!accountInfo || accountInfo.passwd !== password) {
           
            response.responseFailure(res, 'ERR:AUTH-FAILED', 'Invalid credentials provided.');
            return;
        }

        
        const payload = {
            username: accountInfo.username
        };

        
        const token = jwt.sign(
            payload, 
            config.JWT_SECRET || 'DEFAULT_DEV_SECRET', 
            { expiresIn: 7200 }
        );

        response.responseSuccessful(res, `User ${username} authenticated successfully.`, { 
            token: token,
            expires_in: 7200,
            perf: Date.now() - perfStart 
        });

    } catch (error) {
        console.error("Login Error:", error);
        response.responseFailure(res, 'ERR:INTERNAL_SERVER_ERROR', 'An error occurred during authentication.');
    }
});

router.post('/users', async (req, res) => {
    const perfStart = Date.now();
    const { username, password } = req.body;

    if (!username || !password) {
        response.responseFailure(res, 'ERR:MISSING-DATA', 'Please provide a username and password.');
        return;
    }

    try {
        const result = await msq.createLoginAccount(username, password);
        
        response.responseSuccessful(res, `User ${username} created successfully.`, {
            userId: result.insertId,
            perf: Date.now() - perfStart
        });
    } catch (error) {
        if (error.message === 'DUPLICATE_USERNAME') {
            response.responseFailure(res, 'ERR:USERNAME_TAKEN', 'That username is already in use.');
        } else {
            response.responseFailure(res, 'ERR:INTERNAL_SERVER_ERROR', 'An error occurred while creating the user.');
        }
    }
});

router.delete('/users/:id', async (req, res) => {
    const perfStart = Date.now();
    const userId = req.params.id;

    if (userId === '1') {
        response.responseFailure(res, 'ERR:FORBIDDEN_DELETION', 'Deletion of the primary admin account (ID 1) is strictly forbidden.');
        return;
    }

    try {
        const result = await msq.deleteLoginAccount(userId);

        if (result.affectedRows === 0) {
            response.responseFailure(res, 'ERR:USER_NOT_FOUND', 'No user found with that ID.');
            return;
        }

        response.responseSuccessful(res, `User with ID ${userId} deleted successfully.`, {
            perf: Date.now() - perfStart
        });
    } catch (error) {
        response.responseFailure(res, 'ERR:INTERNAL_SERVER_ERROR', 'An error occurred while deleting the user.');
    }
});

router.get('/users', async (req, res) => {
    const perfStart = Date.now();

    try {
        const users = await msq.getAllLoginAccounts();
        
        response.responseSuccessful(res, 'User list retrieved successfully.', {
            users: users,
            total_count: users.length,
            perf: Date.now() - perfStart
        });
    } catch (error) {
        response.responseFailure(res, 'ERR:INTERNAL_SERVER_ERROR', 'An error occurred while fetching the user list.');
    }
});


module.exports = router;
