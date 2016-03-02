import React, { Component, PropTypes } from 'react'
import { CONFIG } from "../constants/config"

class TopFilter extends Component {

	constructor(props) {
		super(props)
	}

	handleEventsOnPageClick(num, e) {
		const { eventsOnPage } = this.props
		eventsOnPage(num)
	}

	handleFreezeFeed(e) {
		const { eventsFreeze, isFrozen } = this.props
		eventsFreeze(!isFrozen)	
	}

	render() {
		const { numOnPage, isFrozen } = this.props

		return (

			<div className="ui grid">
				<div className="two column row">
					<div className="ten wide column">
						<div className="ui left floated blue tiny buttons">
							{CONFIG.numEventsOnPageValues.map((num) => {
								const classes = (numOnPage === num) ? "ui button active" : "ui button"
								const callback = this.handleEventsOnPageClick.bind(this, num)
								return (<button key={num} className={ classes } onClick={ callback }>{ num }</button>)
							})}
						</div>
					</div>
					<div className="six wide column">	
						<div className="ui right floated green tiny buttons">
							<button className={ (isFrozen) ? "ui button active" : "ui button" } onClick={this.handleFreezeFeed.bind(this)}>{(isFrozen) ? "Unfreeze" : "Freeze"}</button>
						</div>
					</div>
				</div>
			</div>


		)
	}
}

TopFilter.propTypes = {
	numOnPage: PropTypes.number.isRequired,
	eventsOnPage: PropTypes.func.isRequired,
	isFrozen: PropTypes.bool.isRequired,
	eventsFreeze: PropTypes.func.isRequired
}

export default TopFilter
