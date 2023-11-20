/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------            Comment Model             ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// This is the model for the Comment collection in the database.

// Bring in dependencies
const mongoose = require("mongoose");
require('mongoose-type-email');
require('../Utils');
// Create user schema
// The schema defines the database fields and their properties.
const commentSchema = new mongoose.Schema({
    avatar: {
        type: String,
    },
    dateTime: {
        type: Date,
        default: Date.now
    },
    text: {
        type: String,
        required: [true, 'Please enter a comment.'],
        minLength: [1, 'Comment must have a minimum of 1 character.'],
        maxLength: [250, 'Comment cannot exceed 250 characters.']
    },
    cocktailId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cocktail',
        required: [true, 'Please provide a cocktail ID.']
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide a user ID.']
    },
    userName: {
        type: String
    }
}, {timestamps: true});

module.exports = mongoose.model("Comment", commentSchema);