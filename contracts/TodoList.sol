// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract TodoList {
    // State variable keeping track of task count
    uint public taskCount = 0;

    // Create data structure for individual tasks
    struct Task {
        uint id;
        string content;
        bool completed;
    }

    // Create place for tasks to be stored
    mapping(uint => Task) public tasks;

    // Event for when a task is created!
    event TaskCreated(
        uint id,
        string content,
        bool completed
    );

    event TaskToggled(
        uint id,
        bool completed
    );

    // Function for adding a new task
    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);

        // Broadcast event that says the task is created!
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompletion(uint _id) public {
        Task memory _task = tasks[_id];

        _task.completed = !_task.completed;

        tasks[_id] = _task;

        emit TaskToggled(_id, _task.completed);
    }

    // Populate with some tasks upon deployment
    constructor() {
        createTask("Do this heinous act first!");
        createTask("Do this heinous act second!");
    }
}