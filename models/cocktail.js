/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------            Cocktail Model            ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Bring in dependencies
const mongoose = require("mongoose");
require('mongoose-type-email');
const Utils = require('../Utils');
const {Schema} = require("mongoose");


// Create user schema
// The schema defines the database fields and their properties.
const cocktailSchema = new mongoose.Schema({
    cocktailName: {
        type: String,
        required: [true,'Cocktail name is required.']
    },
    spirit: {
        type: Schema.Types.ObjectId,
        required: [true, 'Spirit is required.'],
        ref: 'Spirit'
    },
    cocktailPreparation: {
        type: String,
        required: [true, 'Cocktail preparation instructions are required.'],
    },
    cocktailIngredients: {
        type: Array,
        required: [true, 'Cocktail ingredients are required.']
    },
    cocktailStory: {
        type: String,
    },
    cocktailImage: {
        type: String,
        required: [true, 'Cocktail image is required.']
    },
    preparationTips: {
        type: String,
    }

}, {timestamps: true});


// Export the model
module.exports = mongoose.model("Cocktail", cocktailSchema);