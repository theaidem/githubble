import moment from "moment"
import { APP_INIT_REQUEST, APP_INIT_SUCCESS, APP_INIT_FAILURE, APP_ONLINE_NOW, APP_RATE_LIMITS, APP_RESET } from "../constants/actions"
import { EVENT_VIEW, EVENTS_ON_PAGE, EVENTS_FREEZE } from "../constants/actions"
import { CONFIG } from "../constants/config"

const initState = {
	isLoading: true,
	err: null,
	online: null,
	ratelimits: null,
	started: moment.now(),
	viewingEvent: null,
	numOnPage: CONFIG.numEventsOnPageValues[0],
	isFrozen: false
}

export default function app(state = initState, action) {

	switch (action.type) {
		
		case APP_INIT_REQUEST:
			return Object.assign({}, state, {isLoading: true, err: null})

		case APP_INIT_SUCCESS:
			return Object.assign({}, state, {isLoading: false, err: null})

		case APP_INIT_FAILURE:
			return Object.assign({}, state, {isLoading: false, err: action.err})

		case APP_ONLINE_NOW:
			return Object.assign({}, state, {online: action.num})

		case APP_RATE_LIMITS:
			return Object.assign({}, state, {ratelimits: action.data})

		case EVENT_VIEW:
			return Object.assign({}, state, {viewingEvent: action.eventId})

		case EVENTS_ON_PAGE:
			return (Number.isInteger(action.numOnPage)) ? Object.assign({}, state, {numOnPage: action.numOnPage}) : state

		case EVENTS_FREEZE:
			return Object.assign({}, state, {isFrozen: action.isFrozen})
		
		case APP_RESET:
			return Object.assign({}, state, {isLoading: false, err: null, started: moment.now()})

		default:
			return state
	}

}
