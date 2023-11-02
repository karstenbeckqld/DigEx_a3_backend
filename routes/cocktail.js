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


// As database operations are not carried out on the same server, there might be a slight delay between the request and
// the response. Therefore, we carry out database operations in an asynchronous way. This is why all the following code
// blocks use async and await for operations on the database.

// GET - Get all cocktails----------------------------------------------------------------------------------------------
// Endpoint: /cocktail
router.get('/', Utils.authenticateToken, async (req, res) => {
    await Cocktail.find().populate('spirit','_id spiritName')
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

// GET - Get specific cocktail by id ---------------------------------------------------------------------------------------
// Endpoint: /cocktail/:id
router.get('/:id', async (req, res) => {
    await Cocktail.findById(req.params.id)
        .then((cocktail) => {
            if (!cocktail) {
                console.log('User not found');
                res.status(404).json({
                    message: 'User does not exist.',
                });
            } else {
                console.log('User Found');
                res.json(cocktail);
            }
        })
        .catch((err) => {
            console.log('User not found: ', err.message);
            res.status(400).json({
                message: 'Cannot find user.',
                errors: err
            });
        });
});

// POST - Create new Cocktail ------------------------------------------------------------------------------------------
// Endpoint: /cocktail
// The below post request receives data from an input form and creates a new cocktail.
router.post('/', async (req, res) => {

    // Check if the request body is empty and if yes, return here.
    if (!req.body) {
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    // First we check if the entered email is already in the database and return a response if this is the case. If the
    // entered email doesn't exist, we can continue creating a new user.
    await Cocktail.findOne({email: req.body.email})
        .then(async (cocktail) => {

            // If the search returns a cocktail, there's already a cocktail with this email in the database. Hence, we have to
            // return here and send a message in the response.
            if (cocktail != null) {
                console.log('Email already in database.');
                return res.status(400).json({
                    message: 'User email already exists'
                });
            }

            // let {firstName, lastName, email, password, avatar, bio, accessLevel} = req.body;

            // Create new Cocktail object by using the request body content.
            const newCocktail = new Cocktail(req.body);

            // Save the new cocktail to the database
            // Now we save the new newUser to the database with the save() method. If the newUser gets saved successfully, we return
            // the newUser object as json data and set the status to 201.
            await newCocktail.save()
                .then((user) => {
                    console.log('New cocktail created.');
                    res.status(201).json(user);
                })
                .catch((err) => {
                    // Because the User object defines the email to be unique, mongoose will check for this property and throw an
                    // error, if the entered email already is in the database. This will get caught here and the newUser returned to
                    // the New User dialog with an error message. Here we also check for the right password length and add this
                    // error to the return if it occurs.
                    console.log('User not created.');
                    const errors = Utils.handleErrors(err);
                    res.status(500).json({errors});
                });
        });
});

// PUT - Update cocktail with id -------------------------------------------------------------------------------------------
// Endpoint: /cocktail/:id
// To update a user, we use a put request as these are usually used for updating database entries.
router.put('/:id', Utils.authenticateToken, async (req, res) => {

    // Check if the request body is empty and if yes, return here (same as above).
    if (!req.body) {
        console.log('No data in request.');
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    let cocktailImageFileName = null;

    if (req.files && req.files.avatar) {
        let uploadPath = path.join(__dirname, '..', 'public', 'images');

        Utils.uploadFile(req.files.avatar, uploadPath, (uniqueFileName) => {
            cocktailImageFileName = uniqueFileName;

            updateCocktail({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                avatar: cocktailImageFileName,
                accessLevel: req.body.accessLevel,
                bio: req.body.bio
            });
        })
    } else {
        await updateCocktail(req.body);
        console.log('User updated');
    }

    // Update the cocktail model
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


// DELETE - Delete cocktail with id ----------------------------------------------------------------------------------------
// Endpoint: /cocktail/:id
// To delete a user, we use a delete request as these are often used for database entry deletion.
router.delete('/:id', async (req, res) => {

    // Check if ID is missing from the request, if yes, return.
    if (!req.params.id || !req.params || req.params.id === '') {
        console.log('No parameters in request');
        return res.status(400).json({
            message: 'User ID missing from request'
        });
    }

    // Delete the cocktail with given ID from the request.
    await Cocktail.findOneAndDelete({_id: req.params.id}, {runValidators: true})
        .then((result) => {
            if (result) {
                // A user with the specified ID was found and deleted
                console.log(`Cocktail: ${req.params.id} deleted.`);
                res.json({
                    message: `Cocktail: ${req.params.id} deleted.`,
                });
            } else {
                // No user with the specified ID was found
                console.log(`Cocktail: ${req.params.id} not found.`);
                res.status(404).json({
                    message: `Cocktail: ${req.params.id} not found.`,
                });
            }
        })
        .catch((err) => {

            // Here we handle any errors that occurred and send a response to the browser.
            console.log('Cocktail not deleted.', err.message);
            res.status(500).json({
                message: 'Cocktail not deleted.',
                error: err
            });
        });
});

// Because the checks in the delete('/:id') request don't work properly with Postman, although they're not
// programmatically wrong, to catch an input trying to delete a user without an id parameter, we've added the below
// route, which returns a response with an appropriate error message.
router.delete('/', (req, res) => {
    console.log('No parameters in request');
    return res.status(400).json({
        message: 'Cocktail ID missing from request'
    });
});

module.exports = router;
