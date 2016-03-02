import { eventReceive } from "./event"
import { normalize } from 'normalizr'
import { eventSchema } from "../constants/schemas"
import { CONFIG } from "../constants/config"
import { APP_INIT_REQUEST, APP_INIT_SUCCESS, APP_INIT_FAILURE, APP_RESET } from "../constants/actions"

function appInitRequest() {
	return {
		type: APP_INIT_REQUEST
	}
}

function appInitSuccess(isAuth, user) {
	return {
		type: APP_INIT_SUCCESS
	}
}

function appInitFailure(err) {
	return {
		type: APP_INIT_FAILURE,
		err
	}
}

export function appReset() {
	return {
		type: APP_RESET
	}
}

export function doAppInit() {
	return function (dispatch) {

		dispatch(appInitRequest())

		const eventSource = new EventSource(CONFIG.eventServerAddr)

		eventSource.onopen = (e) =>  {
			dispatch(appInitSuccess())
		}

		eventSource.onerror = (e) => {
			const state = e.currentTarget.readyState
			if (state == EventSource.CONNECTING) {
				dispatch(appInitFailure(`Connection error, reconnecting...`))
			} else {
				dispatch(appInitFailure(`Connection error, ${state}`))
			}
		}

		eventSource.onmessage = (e) => {
			const evnt = normalize(JSON.parse(e.data), eventSchema)
			dispatch(eventReceive(evnt))
		}


	}
}