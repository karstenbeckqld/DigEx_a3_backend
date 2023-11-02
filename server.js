/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------                Server                ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 6 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                                Dependencies                                                        */
/*--------------------------------------------------------------------------------------------------------------------*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose').default;
const cors = require('cors');
const port = process.env.PORT || 3000;
const fileUpload = require('express-fileupload');

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                             Express App Setup                                                      */
/*--------------------------------------------------------------------------------------------------------------------*/
const app = express();

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                                 App Uses                                                         */
/*--------------------------------------------------------------------------------------------------------------------*/
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('*', cors());
app.use(fileUpload({
    limits: {fileSize: 50 * 1024 * 1024}
}));

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                             Database Connection                                                    */
/*--------------------------------------------------------------------------------------------------------------------*/

// Because the app is dependent on the database, we've decided to start the server only when the database connection
// had been established successfully.
// Comment: useFindAndModify: false was not used as it crashed the application.
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        app.listen(port, () => {
            console.log(`Connected to database and server is running on ${port}.`);
        });
    })
    .catch((err) => {
        console.log('Database connection failed: ', err);
    });

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                                 Auth Route                                                         */
/*--------------------------------------------------------------------------------------------------------------------*/
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                                 User Route                                                         */
/*--------------------------------------------------------------------------------------------------------------------*/
const userRouter = require('./routes/user');
app.use('/user', userRouter);

/*--------------------------------------------------------------------------------------------------------------------*/
/*                                               Cocktail Route                                                       */
/*--------------------------------------------------------------------------------------------------------------------*/
const cocktailRouter = require('./routes/cocktail');
app.use('/cocktail', cocktailRouter);