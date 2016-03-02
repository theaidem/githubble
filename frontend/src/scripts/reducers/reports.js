import merge from 'lodash/object/merge'
import keys from 'lodash/object/keys'
import { EVENT_RECEIVE } from "../constants/actions"

const initState = { 
	actors:{}, 
	repos: {}
}

export default function reports(state = initState, action) {

	switch (action.type) {
		
		case EVENT_RECEIVE:
			if (action.event && action.event.entities) {

				const newState = merge({}, state)
				const eventType = action.event.entities.events[action.event.result].type
				const actorId = keys(action.event.entities.actors)
				const repoId = keys(action.event.entities.repos)
				
				if (!newState.actors[actorId]) {
					newState.actors[actorId] = { id:actorId[0], stars: [], forks: [] }
				}

				if (!newState.repos[repoId]) {
					newState.repos[repoId] = { id: repoId[0], stars: [], forks: [] }
				}
						
				switch (eventType) {
					case "WatchEvent":
						newState.actors[actorId].stars.unshift(action.event.result)
						newState.repos[repoId].stars.unshift(action.event.result)
						break

					case "ForkEvent":
						newState.actors[actorId].forks.unshift(action.event.result)
						newState.repos[repoId].forks.unshift(action.event.result)
						break
				}

				return newState
			}

		default:
			return state
	}

}
