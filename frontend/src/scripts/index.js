import '../styles/index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import Root from './root'
import {configureStore} from "./store/configureStore"

function start (store) {
	ReactDOM.render(<Root store={store} />, document.getElementById('app'))
}

start(configureStore())