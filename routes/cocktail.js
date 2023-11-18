/*--------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------             Cocktail Routes             -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Import dependencies.
require("mongoose");
const express = require('express');
const router = express.Router();
const Cocktail = require('../models/cocktail');
const Spirit = require('../models/spirit');
const Utils = require('../Utils');
const path = require('path');

const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});


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

// Get cocktail information by ID.
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

    console.log('In cocktail/:id put route');
    console.log('--------------------------------');

    let cocktailIconFileName = null;
    let cocktailHeaderFileName = null;
    let ingredients = req.body.ingredients;

    // Check if the ID is empty and if yes, return here (same as above).
    if (!req.params.id) {
        console.log('No cocktail ID in request.');
        return res.status(400).json({
            message: "Empty ID parameter received."
        });
    }

    if (req.files) {

        if (req.files['cocktailImage']) {
            cocktailIconFileName = await Utils.processImage(req.files['cocktailImage'][0].filename, 200, 200);
        } else {
            cocktailIconFileName = req.body.cocktailImage;
        }

        if (req.files['cocktailHeaderImage']) {
            cocktailHeaderFileName = await Utils.processImage(req.files['cocktailHeaderImage'][0].filename, 1600, 800);
        } else {
            cocktailHeaderFileName = req.body.cocktailHeaderImage;
        }

        await updateCocktail({
            cocktailName: req.body.cocktailName,
            preparation: req.body.preparation,
            story: req.body.story,
            tips: req.body.tips,
            ingredients: ingredients,
            spiritName: req.body.spiritName,
            spirit: req.body.spirit,
            cocktailImage: cocktailIconFileName,
            cocktailHeaderImage: cocktailHeaderFileName
        });

        console.log('Cocktail updated with images');


    } else {
        await updateCocktail(req.body);
        console.log('Cocktail updated');
    }

    // Update the cocktail model
    async function updateCocktail(update) {
        try {
            const cocktail = await Cocktail.findByIdAndUpdate(req.params.id, update, {new: true});
            res.status(200).json(cocktail);
            console.log('Cocktail updated:', cocktail);
        } catch (err) {
            console.log('Cocktail not updated.', err.message);
            const errors = Utils.handleErrors(err);
            res.status(500).json({
                message: 'Cocktail not updated.',
                errors: errors,
                error: err
            });
        }
    }
})

router.post('/', Utils.authenticateToken, async (req, res) => {


    // First we check if the body of the request is empty. If yes, we return here.
    if (!req.body) {
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    console.log('Req body in cocktail post', req.body);
    console.log('Req files in cocktail post', req.files);
    // console.log('Req cocktailImage file', req.files['cocktailImage'][0]);
    // console.log('Req cocktailHeaderImage file', req.files['cocktailHeaderImage'][0]);

    // Because we read the ingredients as an array in an HTML form, we added the [] to the name of the input field. This
    // leads to the backend reading the data as , 'ingredients[]': [ 'i1', 'i2', 'i3', 'i4' ] and leads to problems. To
    // fix this, we save the data from the request body in a variable and then remove the [] from the ingredients array.
    //const ingredients = req.body['ingredients[]'];
    //console.log(ingredients);

    // Now we define a variable for the cocktail image file names for the detail header and the overview icon.
    let cocktailIconFileName = null;
    let cocktailHeaderFileName = null;
    let ingredients = req.body.ingredients;

    if (req.files) {
        try {
            if (req.files['cocktailImage']) {
                cocktailIconFileName = await Utils.processImage(req.files['cocktailImage'][0].filename, 200, 200);
            } else {
                cocktailIconFileName = req.body.cocktailImage;
            }

            if (req.files['cocktailHeaderImage']) {
                cocktailHeaderFileName = await Utils.processImage(req.files['cocktailHeaderImage'][0].filename, 1600, 800);
            } else {
                cocktailHeaderFileName = req.body.cocktailHeaderImage;
            }
        } catch (err) {
            res.json({message: err.message});
        }
    }

    // Now we convert our spirit name to PascalCase, so that it matches the spirit name in the database.
    let spiritNameToPascalCase = req.body.spiritName.charAt(0).toUpperCase() + req.body.spiritName.slice(1);

    // We then obtain the spirit ID from the database as we need to save it along with the new cocktail.
    await Spirit.find({spiritName: spiritNameToPascalCase})
        .then(async (spirit) => {

            if (!spirit) {
                console.log('No spirit found');
                res.status(404).json({
                    message: 'No spirit found.',
                });
            }

            console.log(`Spirit ID for ${spirit[0].spiritName}: ${spirit[0]._id}`)
            const spiritId = spirit[0]._id;

            // Now we check if a cocktail with the same name os already in the database and if yes, we return.
            await Cocktail.findOne({cocktailName: req.body.cocktailName})
                .then(async (cocktail) => {

                    if (cocktail != null) {
                        return res.status(400).json({
                            message: "Cocktail already exists."
                        });
                    }

                    // Now we can create a new cocktail object from the request and the values collected from previous
                    // methods.
                    const newCocktail = new Cocktail({
                        cocktailName: req.body.cocktailName,
                        preparation: req.body.preparation,
                        story: req.body.story,
                        tips: req.body.tips,
                        ingredients: ingredients,
                        spiritName: req.body.spiritName,
                        spirit: spiritId,
                        cocktailImage: cocktailIconFileName,
                        cocktailHeaderImage: cocktailHeaderFileName
                    });

                    // Now we save the cocktail to the database.
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

router.delete('/:id', Utils.authenticateToken, async (req, res) => {
    await Cocktail.findByIdAndDelete(req.params.id)
        .then((cocktail) => {
            if (!cocktail) {
                console.log('Cocktail not found');
                res.status(404).json({
                    message: 'Cocktail does not exist.',
                });
            } else {
                console.log('Cocktail deleted');
                res.status(200).json({
                    message: 'Cocktail deleted.',
                });
            }
        })
        .catch((err) => {
            console.log('Cannot delete cocktail: ', err);
            res.status(400).json({
                message: 'Cannot delete cocktail.',
                error: err
            });
        });
});

module.exports = router;