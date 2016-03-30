import React, { Component } from 'react'
import moment from "moment"

class SessionTime extends Component {
	
	constructor(props) {
		super(props)
		this.state = {sessionDuration: "", started: null}
	}	

	shouldComponentUpdate(nextProps, nextState) {
		const { started } = this.props
		const { sessionDuration } = this.state
		if (started != nextState.started) this.setState({started: started})
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
