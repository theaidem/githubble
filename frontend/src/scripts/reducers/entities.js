import merge from 'lodash/merge'
import { EVENT_RECEIVE } from "../constants/actions"

const initState = { 
	events: {},
	actors:{}, 
	repos: {},
	eventIds: [],
}

export default function entities(state = initState, action) {

	switch (action.type) {
		
		case EVENT_RECEIVE:
			if (action.event && action.event.entities) {
				const newState = merge({}, state, action.event.entities)
				newState.eventIds.unshift(action.event.result)
				return newState
			}

		default:
			return state
	}

}
