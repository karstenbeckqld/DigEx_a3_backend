/*--------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------             Cocktail Routes             -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Import dependencies.
const express = require('express');
const router = express.Router();
const Cocktail = require('../models/cocktail');
const Spirit = require('../models/spirit');
const Utils = require('../Utils');
const path = require('path');
const mongoose = require("mongoose");


// As database operations are not carried out on the same server, there might be a slight delay between the request and
// the response. Therefore, we carry out database operations in an asynchronous way. This is why all the following code
// blocks use async and await for operations on the database.

// GET - Get all cocktails----------------------------------------------------------------------------------------------
// Endpoint: /cocktail
router.get('/', Utils.authenticateToken, async (req, res) => {
    await Cocktail.find().populate('spirit', '_id spiritName')
        .then((cocktails) => {
            res.status(200).json(cocktails);
        })
        .catch((err) => {
            console.log('Cannot get list of cocktails: ', err);
            res.status(400).json({
                message: 'Cannot get cocktails.',
                error: err
            });
        });
});

router.get('/:spirit', Utils.authenticateToken, async (req, res) => {
    await Cocktail.find({spiritName: req.params.spirit}).populate('spirit')
        .then((cocktails) => {
            if (!cocktails) {
                console.log('No cocktails found');
                res.status(404).json({
                    message: 'No cocktails found.',
                });
            }
            console.log(`Cocktails for ${req.params.spirit}`)
            res.status(200).json(cocktails);


        })
        .catch((err) => {
            console.log('Cannot get list of cocktails: ', err);
            res.status(400).json({
                message: 'Cannot get spirits.',
                error: err
            });
        });
});

module.exports = router;
