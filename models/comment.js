/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------            Comment Model             ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Bring in dependencies
const mongoose = require("mongoose");
const {isEmail} = require('validator');
require('mongoose-type-email');
const Utils = require('../Utils');

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
        minLength: [1, 'Comment must have a minimum of 1 character.']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide a user.']
    },
}, {timestamps: true});

module.exports = mongoose.model("Comment", commentSchema);