import React, { Component } from 'react'

class Error extends Component {

	constructor(props) {
		super(props)
	}

	render() {
		const { err } = this.props
		return (
			<div className="ui active inverted dimmer">
				<div className="ui text loader">{ err }</div>
			</div>
		)
	}
}

export default Error
