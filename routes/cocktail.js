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
require('sharp');

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

// GET - Get cocktails by spirit name, meaning all cocktails that are associated with the provided spirit name. --------
// Endpoint: /cocktail/:spirit
router.get('/:spirit', Utils.authenticateToken, async (req, res) => {

    // Cocktails are linked to spirits via the spirit ID. Spirits in the request are sent as lowercase string. Therefore,
    // we first convert the string into pascal case to match the entry in the database.
    let spiritNameToPascalCase = req.params.spirit.charAt(0).toUpperCase() + req.params.spirit.slice(1);

    // We then obtain the spirit ID from the database to retrieve all cocktails that match this ID and return them in
    // the response.
    await Spirit.find({spiritName: spiritNameToPascalCase})
        .then(async (spirit) => {

            if (!spirit) {
                console.log('No spirit found');
                res.status(404).json({
                    message: 'No spirit found.',
                });
            }

            // We can save this ID in the spiritId variable.
            const spiritId = spirit[0]._id;

            // Now we can retrieve all cocktails that match this spirit ID.
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

// Get cocktail information by ID. -------------------------------------------------------------------------------------
// Endpoint: /cocktail/cocktail/:id
// Here we retrieve the full dataset for a specified cocktail ID to display to the user. This includes the background
// image filename.
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

// Update cocktail by ID. ----------------------------------------------------------------------------------------------
// Endpoint /cocktail/cocktail/:id
router.put('/cocktail/:id', Utils.authenticateToken, async (req, res) => {

    // Each cocktail has two image file names saved in the database. One for the icon on the overview page, and one for
    // the header background on the detail page. Here we set the variables for these file names to null.
    let cocktailIconFileName = null;
    let cocktailHeaderFileName = null;

    // We also set the variable for the spirit ID to null as we need it in the global scope for this method.
    let spiritId = null;

    // Here we save the ingredients array from the request body in a variable to be able to manipulate it.
    let ingredients = req.body.ingredients;


    // In the edit view for a cocktail, we add an empty input field for ingredients automatically, so that a user can add
    // ingredients if they wish. However, this produces an empty entry in the database and consequently an additional
    // empty input field every time the edit view is loaded. To avoid this, we filter the ingredients array and remove
    // all empty entries.
    let filteredIngredients = ingredients.filter(function (ingredient) {
        return ingredient.trim() !== '';
    });

    // Check if the ID is empty and if yes, return here (same as above).
    if (!req.params.id) {
        console.log('No cocktail ID in request.');
        return res.status(400).json({
            message: "Empty ID parameter received."
        });
    }

    // To ensure correct capitalisation of the spirit name, we convert it to PascalCase.
    let spiritNameToPascalCase = req.body.spiritName.charAt(0).toUpperCase() + req.body.spiritName.slice(1);

    // Convert spirit name from request into id for spirit
    await Spirit.find({spiritName: spiritNameToPascalCase})
        .then(async (spirit) => {
            spiritId = spirit[0]._id;
        })

    // Check if the request contains files. If yes, we process the images and save the file names in the below variables.
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

        // Create new Cocktail object with updated data to save to database.
        await updateCocktail({
            cocktailName: req.body.cocktailName,
            preparation: req.body.preparation,
            story: req.body.story,
            tips: req.body.tips,
            ingredients: filteredIngredients,
            spiritName: req.body.spiritName,
            spirit: spiritId,
            cocktailImage: cocktailIconFileName,
            cocktailHeaderImage: cocktailHeaderFileName
        });
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

// Create new cocktail. ------------------------------------------------------------------------------------------------
// Endpoint /cocktail/
router.post('/', Utils.authenticateToken, async (req, res) => {


    // First we check if the body of the request is empty. If yes, we return here.
    if (!req.body) {
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    console.log('Req body in cocktail post', req.body);
    console.log('Req files in cocktail post', req.files);

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

// Delete cocktail by ID. ----------------------------------------------------------------------------------------------
// Endpoint /cocktail/:id
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