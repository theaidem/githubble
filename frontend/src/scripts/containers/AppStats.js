import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

class AppStats extends Component {
	
	constructor(props) {
		super(props)
	}

	render() {
		const { online } = this.props
		return (
			<div className="ui label">
				<i className="users icon"></i>{ online }
				<a className="detail">online now</a>
			</div>
		)
	}

}

AppStats.propTypes = {
	online: PropTypes.string,
}

function mapStateToProps(state) {
	return {
		online: state.app.online
	}
}

export default connect(mapStateToProps)(AppStats)
