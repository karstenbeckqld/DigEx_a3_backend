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
    title: {
        type: String,
        required: [true,'Title is required.']
    },
    description: {
      type: String,
      required: [true, 'description is required.']
    },
    images: {
        type: Array,
        required: [true, 'At least one image is required.']
    },
    layoutDirection: {
        type: String,
        default: 'left'
    },
    layoutSize: {
        type: String,
        default: 'one'
    }

}, {timestamps: true});


// Export the model
module.exports = mongoose.model("Content", cocktailSchema);