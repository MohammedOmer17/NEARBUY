const mongoose = require('mongoose');


async function connectToDb(uri = process.env.MONGODB_URI) {
    if (typeof uri !== 'string' || uri.trim() === '') {
        throw new Error('MONGODB_URI is not set. Set it to your MongoDB connection string.');
    }

    await mongoose.connect(uri);
    console.log('Connected to DB');
    return mongoose;
}


module.exports = connectToDb;