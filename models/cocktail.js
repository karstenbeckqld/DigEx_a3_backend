/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------            Cocktail Model            ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// This is the model for the cocktail collection in the database.

// Bring in dependencies
const mongoose = require("mongoose");
require('mongoose-type-email');
const {Schema} = require("mongoose");


// Create user schema
// The schema defines the database fields and their properties.
const cocktailSchema = new mongoose.Schema({
    cocktailName: {
        type: String,
        required: [true, 'Cocktail name is required.']
    },
    spiritName: {
        type: String,
        required: [true, 'Spirit name is required.']
    },
    spirit: {
        type: Schema.Types.ObjectId,
        required: [true, 'Spirit is required.'],
        ref: 'Spirit'
    },
    preparation: {
        type: String,
        required: [true, 'Cocktail preparation instructions are required.'],
    },
    ingredients: {
        type: Array,
        required: [true, 'Cocktail ingredients are required.']
    },
    story: {
        type: String,
    },
    cocktailImage: {
        type: String,
    },
    tips: {
        type: String,
    },
    cocktailHeaderImage: {
        type: String
    }

}, {timestamps: true});


// Export the model
module.exports = mongoose.model("Cocktail", cocktailSchema);