import React, { Component } from 'react'
import filter from 'lodash/collection/filter'
import TopFilter from "../components/TopFilter"

class Menu extends Component {
	
	constructor(props) {
		super(props)
	}

	render() {
		const { numOnPage, eventsOnPage, eventsFreeze, isFrozen, events, actors, repos } = this.props
		return (
			<div className="ui fixed menu">
				<div className="ui container">
					<div className="ui grid">
						<div className="four wide column">
							<a href="#" className="header item">
								<img className="logo" src={ require("../../images/logo.png") }/>
								GitHubble
							</a>
						</div>
						<div className="eight wide column">
							<div className="item">
								<TopFilter numOnPage={ numOnPage } eventsOnPage={ eventsOnPage } eventsFreeze={ eventsFreeze } isFrozen={ isFrozen } />
							</div>
						</div>
						<div className="four wide column">
							<div className="item stat ">
								<div className="column">

									<div className="ui three mini statistics">
										<div className="ui mini statistic">
											<div className="value">
												{filter(events, (e => e.type == "WatchEvent")).length}
											</div>
											<div className="label">
												Stars
											</div>
										</div>
										<div className="ui statistic">
											<div className="value">
												{Object.keys(events).length}
											</div>
											<div className="label">
												Total
											</div>
										</div>
										<div className="ui mini statistic">
											<div className="value">
												{filter(events, (e => e.type == "ForkEvent")).length}
											</div>
											<div className="label">
												Forks
											</div>
										</div>
									</div>

								</div>
							</div>
						</div>
					</div>		
				</div>
			</div>
		)
	}
}

export default Menu