const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    club: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    fundRequest: { type: Number, default: 0 },
    approvedFund: { type: Number, default: 0 }
    
});

module.exports = mongoose.model('Event', eventSchema);