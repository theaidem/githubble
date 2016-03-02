import { combineReducers } from 'redux'
import app from './app'
import entities from './entities'
import reports from './reports'

const rootReducer = combineReducers({
	app,
	entities,
	reports
})

export default rootReducer
