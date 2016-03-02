import React, { Component } from 'react'

class Load extends Component {

	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div className="ui active inverted dimmer">
				<div className="ui text loader">Please wait</div>
			</div>
		)
	}
}

export default Load
