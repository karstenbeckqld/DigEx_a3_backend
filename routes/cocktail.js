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

    let spiritNameToPascalCase = req.params.spirit.charAt(0).toUpperCase() + req.params.spirit.slice(1);

    await Spirit.find({spiritName: spiritNameToPascalCase})
        .then(async (spirit) => {

            if (!spirit) {
                console.log('No spirit found');
                res.status(404).json({
                    message: 'No spirit found.',
                });
            }
            console.log(`Spirit ID for ${req.params.spirit}: ${spirit[0]._id}`)
            const spiritId = spirit[0]._id;
            console.log(spiritId);

            await Cocktail.find({spirit: spiritId}).populate('spirit')
                .then((cocktails) => {
                    if (!cocktails) {
                        console.log('No cocktails found');
                        res.status(404).json({
                            message: 'No cocktails found.',
                        });
                    }
                    console.log(`Cocktails for ${spiritId}`)
                    res.status(200).json(cocktails);


                })
                .catch((err) => {
                    console.log('Cannot get list of cocktails: ', err);
                    res.status(400).json({
                        message: 'Cannot get spirits.',
                        error: err
                    });
                });
        })
});

router.get('/cocktail/:id', Utils.authenticateToken, async (req, res) => {
    await Cocktail.findById(req.params.id)
        .then((cocktail) => {
            if (!cocktail) {
                console.log('Cocktail not found');
                res.status(404).json({
                    message: 'Cocktail does not exist.',
                });
            } else {
                console.log('Cocktail Found in cocktail/:id');
                res.json(cocktail);
            }
        })
});

router.get('/cocktail/edit/:id', Utils.authenticateToken, async (req, res) => {
    await Cocktail.findById(req.params.id)
        .then((cocktail) => {
            if (!cocktail) {
                console.log('Cocktail not found');
                res.status(404).json({
                    message: 'Cocktail does not exist.',
                });
            } else {
                console.log('Cocktail Found');
                res.json(cocktail);
            }
        })
});

router.put('/cocktail/:id', Utils.authenticateToken, async (req, res) => {
    await Cocktail.findById(req.params.id)
    // Check if the request body is empty and if yes, return here (same as above).
    if (!req.params.id) {
        console.log('No cocktail ID in request.');
        return res.status(400).json({
            message: "Empty ID parameter received."
        });
    }

    let cocktailImageFileName = null;

    if (req.files && req.files.avatar) {
        let uploadPath = path.join(__dirname, '..', 'public', 'images');

        Utils.uploadFile(req.files.avatar, uploadPath, (uniqueFileName) => {
            cocktailImageFileName = uniqueFileName;

            updateCocktail({
                cocktailName: req.body.cocktailName,
                preparation: req.body.preparation,
                story: req.body.story,
                tips: req.body.tips,
                ingredients: req.body.ingredients,
                cocktailImage: cocktailImageFileName
            });
        })
    } else {
        await updateCocktail(req.body);
        console.log('Cocktail updated');
    }

    // Update the user model
    // The findByIdAndUpdate() method allows us to find and update a user in one go. For this, we read the passed on id
    // from the request (/:id) and the body from the request. Then we return the update user as json in the response. If
    // an error occurs, we add it to the response. We also use the handleErrors function here as the user might have
    // wanted to update their email or password and this function specifically handles these errors. As many things can
    // go wrong, we also pass on the error itself.
    function updateCocktail(update) {
        Cocktail.findByIdAndUpdate(req.params.id, update, {new: true})
            .then((cocktail) => {
                res.json(cocktail);
            })
            .catch((err) => {
                console.log('User not updated.', err.message);
                const errors = Utils.handleErrors(err);
                res.status(500).json({
                    message: 'User not updated.',
                    errors: errors,
                    error: err
                });
            });
    }
})

router.post('/', Utils.authenticateToken, async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    let spiritNameToPascalCase = req.body.spiritName.charAt(0).toUpperCase() + req.body.spiritName.slice(1);

    await Spirit.find({spiritName: spiritNameToPascalCase})
        .then(async (spirit) => {

            if (!spirit) {
                console.log('No spirit found');
                res.status(404).json({
                    message: 'No spirit found.',
                });
            }

            console.log(`Spirit ID for ${req.params.spirit}: ${spirit[0]._id}`)
            const spiritId = spirit[0]._id;
            console.log(spiritId);

            await Cocktail.findOne({cocktailName: req.body.cocktailName})
                .then(async (cocktail) => {
                    if (cocktail != null) {
                        return res.status(400).json({
                            message: "Cocktail already exists."
                        });
                    }

                    const newCocktail = new Cocktail({
                        cocktailName: req.body.cocktailName,
                        preparation: req.body.preparation,
                        story: req.body.story,
                        tips: req.body.tips,
                        ingredients: req.body.ingredients,
                        cocktailImage: req.body.cocktailImage,
                        spiritName: req.body.spiritName,
                        spirit: spiritId
                    });

                    await newCocktail.save()
                        .then((cocktail) => {
                            res.status(201).json(cocktail);
                        })
                        .catch((err) => {
                            console.log('Cannot create new cocktail: ' + err.message);
                            res.status(400).json({
                                message: 'Cannot create new cocktail.',
                                error: err
                            });
                        });
                });
        });
});

module.exports = router;
