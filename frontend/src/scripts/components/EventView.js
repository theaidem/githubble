import React, { Component, PropTypes } from 'react'
import moment from "moment"

class EventView extends Component {

	constructor(props) {
		super(props)
	}

	turnEvent(id) {
		const { eventView } = this.props
		eventView(id)		
	}

	renderViewNavigator(){
		const { prev, next } = this.props
		const prevBtnClasses = prev ? "ui left labeled icon button" : "ui left labeled icon disabled button"
		const nextBtnClasses = next ? "ui right labeled icon button" : "ui right labeled icon disabled button"

		return (
			<div className="ui two teal tiny buttons">
				<button className={prevBtnClasses} onClick={this.turnEvent.bind(this,prev)}>
					<i className="left chevron icon"></i>
					Prev
				</button>
				<button className={nextBtnClasses} onClick={this.turnEvent.bind(this,next)}>
					Next
					<i className="right chevron icon"></i>
				</button>
			</div>
		)
	}

	renderEventIcon(type) {
		switch (type) {
			case "WatchEvent": 	return	<b><span className="octicon octicon-star"></span>Starred</b>
			case "ForkEvent": 		return 	<b><span className="octicon octicon-git-branch"></span>Forked</b>
		}
	}

	render() {
		const { event, actor, repo } = this.props
		if (event) {
			return (
				<div className="ui fixed event-cart">
					{this.renderViewNavigator()}
					<div className="ui card">

						<div className="image">
							<img src={ actor.avatar_url }/>
						</div>
						<div className="content">
							<a className="header" target="_blank" href={`https:\/\/github.com/${actor.login}`}>{`@${actor.login}`}</a>
							<div className="meta">
								{ this.renderEventIcon(event.type) }
								<span className="date">
									{ moment(event.created_at, "YYYY-MM-DDTHH:mm:ssZ").fromNow() }
								</span>
							</div>
						</div>
						<div className="content">
							<a className="header" target="_blank" href={`https:\/\/github.com/${repo.name}`}><span className="octicon octicon-repo"></span> { repo.name }</a>
						</div>
					</div>
				</div>

			)
		} else {
			return (
				<div className="ui sticky event-cart empty">
					<div className="ui card">
						<div className="image">
							<img src={ require("../../images/octoempty.png") }/>
						</div>
						<div className="extra content">
							Click on an Event
						</div>
					</div>
				</div>
			)
		}
	}
}

EventView.propTypes = {
	event: PropTypes.object,
	actor: PropTypes.object,
	repo: PropTypes.object,
	prev: PropTypes.string,
	next: PropTypes.string,
	eventView: PropTypes.func.isRequired
}

export default EventView
