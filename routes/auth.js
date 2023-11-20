/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------              Auth Routes               -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Load required dependencies.
require('dotenv').config();
const User = require('./../models/user');
const express = require('express');
const router = express.Router();
const Utils = require('./../Utils');
const jwt = require("jsonwebtoken");


// POST - Sign in user -------------------------------------------------------------------------------------------------
// Endpoint: /auth/signin
// When the user fills in the sign-in form and clicks the confirming button, the form submits a post request, which gets
// handled here.
router.post('/signin', async (req, res) => {

    console.log('From auth.js: ', req.body);

    // First, we check if the request body contains an email and password. If not, or only one got provided, we return
    // and attach a message to the response.
    if (!req.body.email || !req.body.password) {
        console.log('Email or password empty');
        return res.status(400).json({
            message: 'Please provide an email and password.'
        });
    }

    // Define an object that holds the values from the request body.
    const {email, password} = req.body;

    // The function retrieves the email and password from the request body and uses the login function inside the user
    // model to verify the login. If the login is successful, it creates a JWT token. For convenience, we send this
    // token, together with the user information back in the response.
    await User.login(email, password)
        .then((user) => {
            if (user == null) {
                return res.status(400).json({message: 'User not found'});
            }

            const tokenPayload = {
                _id: user._id,
            };

            console.log(tokenPayload);
            const token = Utils.createToken(tokenPayload);

            // Remove password from userObject
            tokenPayload.password = undefined;

            // Once the token is generated, we return a response with the user object and the token, so that we can
            // verify a successful login in Postman. Where this response will lead in the final website is yet to be
            // determined. That depends on how we want to treat user login in general. It could just log in the user and
            // return to the homepage, unlocking access to the restricted aea, or redirect the user directly to the
            // restricted area.
            return res.json({
                user: user,
                accessToken: token
            });
        })

        // If an error occurs, the user could not get verified, and we return an errors json object displaying the
        // produced errors, plus a 400 status code. In the finished website, this will redirect back to the login form
        // and display errors accordingly.
        .catch((err) => {
            console.log('Cannot log in user: ' + err.message);
            const errors = Utils.handleErrors(err);
            res.status(400).json({
                message: 'Username or password invalid.',
                errors: errors
            });
        });
});


// GET - Validate user -------------------------------------------------------------------------------------------------
// Endpoint: /auth/validate
router.get('/validate', (req, res) => {

    // First we get the token from the header. Because the token in the header is stored as 'Bearer token' in the
    // Authorization key, we split the token value at the space and use the second half (index 1).
    const token = req.headers['authorization'].split(' ')[1];

    // Now we check if the token exists and is valid.
    if (token) {

        // If a token exists, we can try to verify it with the server.
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenData) => {

            // If verification fails, we return the error. In the final project, this response could redirect the user
            // to the sign-in page.
            if (err) {
                console.log(err.message);
                return res.status(403).json({message: 'Unauthorised'}); // Forbidden
            }

            User.findById(tokenData._id)
                .then((user) => {
                    user.password = undefined;
                    res.json({
                        user: user
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        message: "Problem validating token",
                        error: err
                    });
                });
        });

        // If there is no token at all, we return a message. In the final project, this will lead to the sign-in page.
    } else {
        res.status(400).json({
            message: 'No token provided.'
        });
    }
});


module.exports = router;

// Use of static login function and handleErrors function derived from Net Ninja Tutorial Node.js Auth Tutorial (JWT),
// https://www.youtube.com/playlist?list=PL4cUxeGkcC9iqqESP8335DA5cRFp8loyp