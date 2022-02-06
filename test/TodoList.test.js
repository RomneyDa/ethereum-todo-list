const { assert } = require("chai");

const TodoList = artifacts.require('./TodoList.sol');

contract('TodoList', (accounts) => {
    // Get deployed copy of contract with before hook
    before(async () => {
        this.todoList = await TodoList.deployed();
    })

    it('deploys successfully', async () => {
        const address = await this.todoList.address;
        assert.notEqual(address, 0x0);
        assert.notEqual(address, '');
        assert.notEqual(address, null);
        assert.notEqual(address, undefined);
    })

    it('lists tasks', async () => {
        const taskCount = await this.todoList.taskCount()
        const lastTask = await this.todoList.tasks(taskCount)
        // Make sure the ids are being assigned correctly
        assert.equal(lastTask.id.toNumber(), taskCount.toNumber());

        const firstTask = await this.todoList.tasks(1);
        // Check that the default task content is as expected
        assert.equal(firstTask.content, 'Do this heinous act first!')
        // Check that the default task is not completed
        assert.equal(firstTask.completed, false);

        // Check that the first assigned ID is the number
        assert.equal(taskCount.toNumber(), 2)
    })

    it('creates tasks', async () => {
        const content = 'A new task';
        const result = await this.todoList.createTask(content);
        const taskCount = await this.todoList.taskCount()
        assert.equal(taskCount, 3);

        // check that event was triggered and check logs to make sure properties are as expected
        // console.log(result);
        const event = result.logs[0].args;
        assert.equal(event.id.toNumber(), 3);
        assert.equal(event.content, content);
        assert.equal(event.completed, false);
    });

    it('toggles task status', async () => {
        const result = await this.todoList.toggleCompletion(1);
        const task = await this.todoList.tasks(1)
        assert.equal(task.completed, true);

        const event = result.logs[0].args;
        assert.equal(event.completed, true);
    });
})