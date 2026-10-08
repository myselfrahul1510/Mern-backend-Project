const Task = require('../models/Task');

const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;
        const task = await Task.create({
            title,
            description,
            status,
            priority
        });
        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};