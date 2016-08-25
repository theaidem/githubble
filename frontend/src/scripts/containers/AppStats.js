import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

class AppStats extends Component {

	constructor(props) {
		super(props)
	}

	render() {
		const { online, ratelimits } = this.props
		return (
			<div className="ui mini labels">
				<div className="ui label">
					<i className="users icon"></i>{ online }
				</div>
				<div className="ui label">
					<i className="wait icon"></i>{ ratelimits }
				</div>
			</div>
		)
	}

}

AppStats.propTypes = {
	online: PropTypes.string,
}

function mapStateToProps(state) {
	return {
		online: state.app.online,
		ratelimits: state.app.ratelimits
	}
}

export default connect(mapStateToProps)(AppStats)
