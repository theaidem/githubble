import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import moment from 'moment'

class Event extends Component {
	
	constructor(props) {
		super(props)
	}
	
	viewEvent(id, e) {
		const { eventView } = this.props
		eventView(id)
	}

	renderEventIcon(type) {
		switch (type) {
			case "WatchEvent":   return  <span className="octicon octicon-star"></span>
			case "ForkEvent": return <span className="octicon octicon-git-branch"></span>
		}
	}

	renderEventContent(type, actor, repo) {
		let action
		switch (type) {
			case "WatchEvent":   action = "starred"; break;
			case "ForkEvent":  action = "forked"; break;
		}

		return (
			<div>
				<span className="description"><b>{ actor.login }</b> {action} <b>{ repo.name }</b></span>
			</div>
		)
	}

	render() {

		const { event, repo, actor, eventViewerCurrent } = this.props
		const isViewing = (eventViewerCurrent === event.id) ? "active" : ""

		return (
			<div className={`event item ${isViewing}`} onClick={this.viewEvent.bind(this, event.id)}>
				<div className="left floated event-icon content">
					{this.renderEventIcon(event.type)}
				</div>

				<div className="left floated actor-picture content">
					<img className="ui mini image" src={ actor.avatar_url } / >
				</div>
				
				<div className="event-datails content">
					{ this.renderEventContent(event.type, actor, repo) }
					at { moment(event.created_at, "YYYY-MM-DDTHH:mm:ssZ").format("h:mm:ss a") }
				</div>
			</div>
		)
	}
}

Event.propTypes = {
	event: PropTypes.object.isRequired,
	actor: PropTypes.object.isRequired,
	repo: PropTypes.object.isRequired,
	eventViewerCurrent: PropTypes.string,
	eventView: PropTypes.func.isRequired
}

function mapStateToProps(state) {
	return {
		eventViewerCurrent: state.app.viewingEvent,
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Event)