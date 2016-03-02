import {EVENT_RECEIVE, EVENT_VIEW, EVENTS_ON_PAGE, EVENTS_FREEZE } from "../constants/actions"

export function eventReceive(event) {
	return {
		type: EVENT_RECEIVE,
		event
	}
}

export function eventView(eventId) {
	return {
		type: EVENT_VIEW,
		eventId
	}
}

export function eventsOnPage(numOnPage) {
	return {
		type: EVENTS_ON_PAGE,
		numOnPage
	}
}

export function eventsFreeze(isFrozen) {
	return {
		type: EVENTS_FREEZE,
		isFrozen
	}
}