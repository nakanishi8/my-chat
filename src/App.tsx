import React, { useEffect, useState } from 'react'
import Amplify, { API, graphqlOperation, PubSub, Auth } from 'aws-amplify'
import { AWSIoTProvider } from '@aws-amplify/pubsub'
import { MqttOverWSProvider } from "@aws-amplify/pubsub/lib/Providers";
import { withAuthenticator } from '@aws-amplify/ui-react'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { createTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { ListTodosQuery, Todo } from './API'
import logo from './logo.svg'
import { Counter } from './features/counter/Counter'
import './App.css'

import awsExports from './aws-exports'
Amplify.configure(awsExports)

Auth.currentCredentials().then((info) => {
  const cognitoIdentityId = info.identityId
  console.info(cognitoIdentityId)
})

// Apply plugin with configuration
Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_region: 'ap-northeast-1',
    aws_pubsub_endpoint: 'wss://a26q3a976c9tuc-ats.iot.ap-northeast-1.amazonaws.com/mqtt',
  })
)

Amplify.addPluggable(new MqttOverWSProvider({
  aws_pubsub_endpoint: 'wss://iot.eclipse.org:443/mqtt',
}));

const initialState = { name: '', description: '' }

function App() {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState<Todo[] | null | undefined>([])

  useEffect(() => {
    fetchTodos()
  }, [])

  const setInput = (key: string, value: string) => {
    setFormState({ ...formState, [key]: value })
  }

  const fetchTodos = async () => {
    try {
      const todoData = (await API.graphql(
        graphqlOperation(listTodos)
      )) as GraphQLResult<ListTodosQuery>
      const todos = todoData.data?.listTodos?.items
      setTodos(todos)
    } catch (err) {
      console.log('error fetching todos')
    }
  }

  const addTodo = async () => {
    try {
      if (!formState.name || !formState.description) return
      const todo = { ...formState }
      if (todos) {
        setTodos([...todos, todo])
        setFormState(initialState)
      }
      await API.graphql(graphqlOperation(createTodo, { input: todo }))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  return (
    <div style={styles.container as React.CSSProperties}>
      <h2>Amplify Todos</h2>
      <input
        onChange={(event) => setInput('name', event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={(event) => setInput('description', event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <button style={styles.button} onClick={addTodo}>
        Create Todo
      </button>
      {todos &&
        todos.map((todo, index) => (
          <div key={todo?.id ? todo.id : index} style={styles.todo}>
            <p style={styles.todoName as React.CSSProperties}>{todo?.name}</p>
            <p style={styles.todoDescription}>{todo?.description}</p>
          </div>
        ))}
    </div>

    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <Counter />
    //     <p>
    //       Edit <code>src/App.tsx</code> and save to reload.
    //     </p>
    //     <span>
    //       <span>Learn </span>
    //       <a
    //         className="App-link"
    //         href="https://reactjs.org/"
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         React
    //       </a>
    //       <span>, </span>
    //       <a
    //         className="App-link"
    //         href="https://redux.js.org/"
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         Redux
    //       </a>
    //       <span>, </span>
    //       <a
    //         className="App-link"
    //         href="https://redux-toolkit.js.org/"
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         Redux Toolkit
    //       </a>
    //       ,<span> and </span>
    //       <a
    //         className="App-link"
    //         href="https://react-redux.js.org/"
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         React Redux
    //       </a>
    //     </span>
    //   </header>
    // </div>
  )
}

const styles = {
  container: {
    width: 400,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 20,
  },
  todo: { marginBottom: 15 },
  input: {
    border: 'none',
    backgroundColor: '#ddd',
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: {
    backgroundColor: 'black',
    color: 'white',
    outline: 'none',
    fontSize: 18,
    padding: '12px 0px',
  },
}

export default withAuthenticator(App)
