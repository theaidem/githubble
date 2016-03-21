import { createStore, applyMiddleware, compose } from 'redux'
import createLogger from 'redux-logger'
import thunk from 'redux-thunk'
import reducers from '../reducers'

const applyResetReducer = reducer => (state, action) => {
	if (action.type === 'APP_RESET') {
		return reducer(undefined, action)
	} else {
		return reducer(state, action)
	}
}

export function configureStore(initialState = {}) {
	
	let middlewares = [ thunk ]
	
	if (process.env.NODE_ENV !== 'production') {
		const logger = createLogger({ collapsed: true })
		middlewares.push(logger)
	}
	
	const store = compose(

		applyMiddleware(...middlewares)

	)(createStore)(applyResetReducer(reducers), initialState)

	if (module.hot) {
		// Enable Webpack hot module replacement for reducers
		module.hot.accept('../reducers', () => {
			const nextReducer = require('../reducers')
			store.replaceReducer(nextReducer)
		})
	}

	return store
}
