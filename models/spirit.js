/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------           Spirit Model            ------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// This model stores the spirit names for the cocktails.

// Bring in dependencies
const mongoose = require("mongoose");
require('mongoose-type-email');

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