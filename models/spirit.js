/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------            Cocktail Model            ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Bring in dependencies
const mongoose = require("mongoose");
require('mongoose-type-email');
const Utils = require('../Utils');

// Create user schema
// The schema defines the database fields and their properties.
const spiritSchema = new mongoose.Schema({
    spiritName: {
        type: String,
        required: [true,'Cocktail name is required.']
    }

}, {timestamps: true});


// Export the model
module.exports = mongoose.model("Spirit", spiritSchema);