import React, { Component, PropTypes } from 'react'
import Event from "../containers/Event"

class Events extends Component {

	constructor(props) {
		super(props)
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { numOnPage, isFrozen } = this.props
		return (nextProps.numOnPage !== numOnPage) ? isFrozen : !isFrozen
	}

	render() {
		const { eventIds, events, actors, repos, eventView, isFrozen } = this.props
		return (
			<div className="ui divided events-list selection list">
				{eventIds.map((id) => {
					const item = events[id]
					return (<Event 
						key={item.id} event={item} actor={actors[item.actor]} 
						repo={repos[item.repo] } eventView={ eventView }/>)					
				})}
			</div>
		)
	}
}

Events.propTypes = {
	eventIds: PropTypes.array.isRequired,
	events: PropTypes.object.isRequired,
	actors: PropTypes.object.isRequired,
	repos: PropTypes.object.isRequired,
	numOnPage: PropTypes.number.isRequired,
	isFrozen: PropTypes.bool.isRequired,
	eventView: PropTypes.func.isRequired
}

export default Events