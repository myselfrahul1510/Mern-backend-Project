const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

taskSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Task', taskSchema);