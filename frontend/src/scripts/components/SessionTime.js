import React, { Component } from 'react'
import moment from "moment"

class SessionTime extends Component {
	
	constructor(props) {
		super(props)
		this.state = {started: moment.now(), sessionDuration: ""}
	}	

	shouldComponentUpdate(nextProps, nextState) {
		const { sessionDuration } = this.state
		return sessionDuration !== nextState.sessionDuration
	}

	componentDidMount(){
		setInterval(	 () => {
			const sess =  moment.duration(moment().diff(this.state.started)).humanize()
			this.setState({sessionDuration: sess})
		}, 1000)
	}

	render() {
		const { sessionDuration } = this.state
		return (
			<span>{ sessionDuration }</span>
		)
	}
}

export default SessionTime
