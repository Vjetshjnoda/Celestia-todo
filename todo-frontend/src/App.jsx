import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers'
import ReactMarkdown from 'react-markdown'
import Todo from '../Todo.json'
import { useAccount } from "wagmi";
import Moralis from 'moralis';

await Moralis.start({
  apiKey: process.env.REACT_APP_MORALIS_API
});

const contractAddress = process.env.REACT_APP_CONTRACT

function App() {
  useEffect(() => {
    fetchTasks()
  }, [])
  const [viewState, setViewState] = useState('view-tasks')
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  async function fetchTasks() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(contractAddress, Todo.abi, provider)
    let data = await contract.fetchTasks()

    data = data.map(d => ({
      description: d['description'],
      title: d['title'],
      completed: d['completed'],
      id: d['id'].toString(),
    }))

    data = await Promise.all(data.map(async d => {
      const endpoint = `${d.description}/`
      const options = {
        mode: 'cors',
      }
      const response = await fetch(endpoint, options)
      const value = await response.json()
      d.taskDescription = value?.description
      return d
    }))
    setTasks(data)

  }


  async function createTask() {
    setIsLoading(true);
    const now = new Date();
    const abi = [
      {
        path: `description-${now.getMilliseconds()}`,
        content: {
          description
        },
      },
    ];

    try {
      const response = await Moralis.EvmApi.ipfs.uploadFolder({ abi });

      const data = response.toJSON();
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(contractAddress, Todo.abi, signer)

      const tx = await contract.createTask(title, data[0].path)

      await tx.wait()


      setViewState('view-tasks')
    } catch {
      setIsLoading(false)
    }

  }

  function disableBtn() {
    document.getElementById('delete').disabled = true;
  }

  function enableBtn() {
    document.getElementById('delete').disabled = false;
  }

  async function deleteTask(taskId) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, Todo.abi, signer)

      await contract.deleteTask(taskId)

      setViewState('view-tasks')

    } catch {
      enableBtn();
    }

  }

  function toggleView(value) {
    setViewState(value)
    if (value === 'view-tasks') {
      fetchTasks()
    }
  }

  return (
      <div style={outerContainerStyle}>
        <div style={innerContainerStyle}>
          <h1>Rollup Todo App on Celestia</h1>
          <p>This allows users to securely create and manager tasks on the blockchain without the need for a centralized server or authority.</p>
          {!address ? (<div>
            <h3>Getting Started</h3>
            <p>First, you will need to connect your Ethereum wallet to Ethermint to display the tasks from the smart contract and make tasks.</p>
          </div>) : null}
          <br />
          <h3 style={{ justifyContent: 'right', textAlign: 'right' }}>Connect your Ethereum wallet to begin ✨</h3>
          <div style={buttonContainerStyle}>
            <ConnectButton />
          </div>
          {address ? (
            <div style={buttonContainerStyle}>
              <button onClick={() => toggleView('view-tasks')} style={buttonStyle}>View Tasks</button>
              <button onClick={() => toggleView('create-task')} style={buttonStyle}>Create Task</button>
            </div>
          ) : null}
          {
            viewState === 'view-tasks' && address && (
              <div>
                <div >
                  <h1>Tasks</h1>
                  {
                    tasks.map((task, index) => (
                      <div key={task.id} style={taskStyle}>
                        <div>
                          <h2 style={taskTitleStyle}>{task.title}</h2>
                          <ReactMarkdown style={taskContentStyle}>
                            {task.taskDescription}
                          </ReactMarkdown>
                          <p style={taskContentStyle}>TaskID: {task.id}</p>
                          <button className="buttonDelete" id='delete' onClick={(e) => {
                            e.preventDefault();
                            disableBtn();
                            deleteTask(task.id)
                          }
                          } disabled={task.isDisplay} style={deleteButtonStyle}>
                            {"Delete Task"}
                          </button>
                        </div>

                      </div>
                    ))
                  }
                </div>
              </div>
            )
          }
          {
            viewState === 'create-task' && (
              <div style={formContainerStyle}>
                <h2>Create Task</h2>
                <input
                  placeholder='Title'
                  onChange={e => setTitle(e.target.value)}
                  style={inputStyle}
                />
                <textarea
                  placeholder='Description'
                  onChange={e => setDescription(e.target.value)}
                  style={inputStyle}
                />
                <button class="buttonload" onClick={createTask} disabled={isLoading}>
                  {isLoading ? <><i class="fa fa-circle-o-notch fa-spin"></i>   Loading</> : "Create Task"}
                </button>
              </div>
            )
          }
        </div>
      </div>
  )
}


const deleteButtonStyle = {
  position: 'relative',
  top: '20%',
  left: '70%',
}
const taskStyle = {
  marginBottom: '20px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  padding: '15px',
};


const outerContainerStyle = {
  width: '90vw',
  height: '100vh',
  padding: '50px 0px',

}

const innerContainerStyle = {
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
}

const formContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  alignItems: 'center'
}

const inputStyle = {
  width: '400px',
  marginBottom: '10px',
  padding: '10px',
  height: '40px',
}


const buttonStyle = {
  marginTop: 15,
  marginRight: 5,
  border: '1px solid rgba(255, 255, 255, .2)'
}

const buttonContainerStyle = {
  marginTop: 15,
  marginRight: 5,
  display: 'flex',
  justifyContent: 'right',
}

const taskTitleStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '10px',
};

const taskContentStyle = {
  marginTop: '10px',
  fontSize: '18px',
  lineHeight: '1.5',
};


export default App