import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Menu from "../components/Menu"
import Events from "../components/Events"
import Stats from "../components/Stats"
import EventView from "../components/EventView"
import take from 'lodash/take'
import indexOf from 'lodash/indexOf'
import sortBy from 'lodash/sortBy'
import { eventsOnPage, eventView, eventsFreeze } from "../actions/event"
import { appReset } from "../actions/app"

class Board extends Component {
	
	constructor(props) {
		super(props)
	}

	render() {
		const { events, actors, repos, numOnPage, eventsOnPage, eventView, 
		eventsFreeze, isFrozen, appReset, started, eventIds,
		eventViewerNext, eventViewerCurrent, eventViewerPrev,
		bestStargazers, bestForkers,
		mostStarred, mostForked } = this.props
		
		const viewingEvent = events[eventViewerCurrent]
		const viewingEventActor  = viewingEvent ? actors[viewingEvent.actor] : null
		const viewingEventRepo =  viewingEvent ? repos[viewingEvent.repo] : null

		return (
			<div className="board">

				<Menu 
					numOnPage={ numOnPage } eventsOnPage={ eventsOnPage } 
					eventsFreeze={ eventsFreeze } isFrozen={ isFrozen } appReset={ appReset }
					events={ events } actors={ actors } repos={ repos } />

				<div className="ui content container">
					<div className="ui grid">
						<div className="ui four wide column">

							<EventView 
								eventView={ eventView } event={ viewingEvent } 
								actor={ viewingEventActor } repo={ viewingEventRepo } 
								next={ eventViewerNext } prev={ eventViewerPrev } />						
						
						</div>
						<div className="ui  eight wide column">
							
							<Events 
								eventIds={ eventIds } events={ events } 
								actors={ actors } repos={ repos } 
								eventView={ eventView } 
								numOnPage={ numOnPage }
								isFrozen={ isFrozen } />

						</div>
						<div className="ui four wide column">

							<Stats 
								actors={ actors } repos={ repos } events={ events }  started={ started }
								bestStargazers={ bestStargazers } bestForkers={ bestForkers }
								mostStarred={ mostStarred } mostForked={ mostForked } />

						</div>
					</div>
				</div>
			</div>
		)
	}

}

Board.propTypes = {
	numOnPage: PropTypes.number.isRequired,
	eventIds: PropTypes.array.isRequired,
	isFrozen: PropTypes.bool.isRequired,

	events: PropTypes.object.isRequired,
	actors: PropTypes.object.isRequired,
	repos: PropTypes.object.isRequired,

	eventViewerNext: PropTypes.string,
	eventViewerCurrent: PropTypes.string,
	eventViewerPrev: PropTypes.string,

	eventsOnPage: PropTypes.func.isRequired,
	eventsFreeze: PropTypes.func.isRequired,
	eventView: PropTypes.func.isRequired,
}

function mapStateToProps(state) {

	let bestStargazers = sortBy(state.reports.actors, ((a)=>
		a.stars.length
	)).reverse()

	let bestForkers = sortBy(state.reports.actors, ((a)=>
		a.forks.length
	)).reverse()

	let mostStarred = sortBy(state.reports.repos, ((r)=>
		r.stars.length
	)).reverse()

	let mostForked = sortBy(state.reports.repos, ((r)=>
		r.forks.length
	)).reverse()

	let next = null
	let prev = null

	if (state.app.viewingEvent) {
		const index = indexOf(state.entities.eventIds, state.app.viewingEvent)
		next = state.entities.eventIds[index - 1]
		prev = state.entities.eventIds[index + 1]
	}

	return {
		started: state.app.started,
		numOnPage: state.app.numOnPage,
		eventIds: take(state.entities.eventIds, state.app.numOnPage), 
		isFrozen: state.app.isFrozen,
		
		events: state.entities.events,
		actors: state.entities.actors,
		repos: state.entities.repos,
		
		eventViewerNext: next,
		eventViewerCurrent: state.app.viewingEvent,
		eventViewerPrev: prev,

		bestStargazers: take(bestStargazers, 3),
		bestForkers: take(bestForkers, 3),

		mostStarred: take(mostStarred, 3),
		mostForked: take(mostForked, 3)
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({
		appReset: appReset,
		eventsOnPage: eventsOnPage,
		eventsFreeze: eventsFreeze,
		eventView: eventView
	}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Board)