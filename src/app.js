

const App = {
    contracts: {},
    loading: false,

    load: async () => {
        // alert('loading')
        const loadSuccess = await App.loadWeb3();
        if (loadSuccess){
            // alert('loading account')
            await App.loadAccount();
            // alert('loading contract')
            await App.loadContract();
            // alert('rendering')
            await App.render();
        } else {
            alert('load failed');
        }
    },

    loadWeb3: async () => {
        // Adapted from https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

        // Verify the browser is running metamask - detect provider
        const provider = await detectEthereumProvider() // returns provider or null if not detected

        // If the provider returned by detectEthereumProvider is not the same as
        // window.ethereum, something is overwriting it, perhaps another wallet.
        if (provider) {
            if (provider !== window.ethereum) {
                alert('Provider error. Do you have multiple wallets installed?');
                return false;
            }
        } else {
            alert('Provider not found. Please install MetaMask!');
            return false;
        }

        // Handle chain (network) and chainChanged (per EIP-1193)
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        App.handleChainChanged(chainId);

        ethereum.on('chainChanged', App.handleChainChanged);

        // Handle user accounts and accountsChanged (per EIP-1193)
        App.account = null;
        ethereum
            .request({ method: 'eth_accounts' })
            .then(App.handleAccountsChanged)
            .catch((err) => { // Some unexpected error.
                // For backwards compatibility reasons, if no accounts are available, eth_accounts will return an empty array.
                console.error(err);
                return false;
            });

        // Note that this event is emitted on page load.
        // If the array of accounts is non-empty, you're already connected.
        ethereum.on('accountsChanged', App.handleAccountsChanged);

        return true;
    },

    handleChainChanged: (_chainId) => {
        // Reload page when chain is changed
        // window.location.reload();
    },

    handleAccountsChanged: (accounts)=>{
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            alert('No accounts. Please connect to MetaMask.');
        } else if (accounts[0] !== App.account) {
            App.account = accounts[0];
        }
    },
      
    loadAccount: async () => {
        ethereum
            .request({ method: 'eth_requestAccounts' })
            .then(App.handleAccountsChanged)
            .catch((err) => {
                if (err.code === 4001) {
                    // EIP-1193 userRejectedRequest error
                    // If this happens, the user rejected the connection request.
                    console.log('Connection request rejected. Please connect to MetaMask.');
                } else {
                    console.error(err);
                }
            });
    },
    
    loadContract: async() => {
        // try {
            // Method of loading local contract with truffle
            const todoList = await $.getJSON('TodoList.json')
            App.contracts.TodoList = TruffleContract(todoList);
            App.contracts.TodoList.setProvider(window.ethereum)
            //console.log(todoList);

            App.todoList = await App.contracts.TodoList.deployed();
        // }
        // catch(err){
        //     console.log(err)
        // }
    },
    render: async () => {
        // prevent double rendering:
        if(App.loading) return;

        App.setLoading(true);

        $('#account').html(App.account);
        await App.renderTasks();
    
        App.setLoading(false);
    },

    createTask: async (e) => {

        App.setLoading(true)

        // Get value entered in form
        const content = $('#newTask').val()

        // Create new task
        await App.todoList.createTask(content, {from: App.account});

        // Relist tasks
        App.renderTasks();

        App.setLoading(false);
    },

    toggleCompletion: async (e) => {
        App.setLoading(true);

        const taskId = e.target.name;
        alert(taskId);
        await App.todoList.toggleCompletion(taskId, {from: App.account});

        App.renderTasks();
        App.setLoading(false);
    },

    renderTasks: async () => {
        // Load tasks from the blockchain
        const taskCount = await App.todoList.taskCount();
        // console.log("Task count:", taskCount.toNumber());
        const $taskTemplate = $('.taskTemplate');

        // Clear current tasks
        document.querySelectorAll('.addedTask').forEach((node) => {
            node.parentNode.removeChild(node);
        })

        // Render out each task with a new task template
        for(var i = 1; i <= taskCount; i++){
            const task = await App.todoList.tasks(i)
            const taskId = task[0].toNumber(); // Task ID
            const taskContent = task[1];
            const taskCompleted = task[2];

            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find('.content').html(taskContent);
            $newTaskTemplate.find('input')
                            .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            .on('click', App.toggleCompletion);

            $newTaskTemplate.prop('class', "addedTask");
                            
        
            if(taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate);
            } else {
                $('#taskList').append($newTaskTemplate);
            }

            $newTaskTemplate.show();
        }                 
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if(boolean) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    }
}

$(() => {
    $(window).load(() => {
        App.load();
    })
})

// Attach load event to Connect Ethereum button
const $connectButton = $('#connectButton');
$connectButton.on('click', App.load);

// Control submit action for form:
$("#newTaskForm").submit(function(e) {
    
    App.createTask();
    e.preventDefault();
});

